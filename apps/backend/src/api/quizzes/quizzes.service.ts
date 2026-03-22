import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QuizRepository } from '../../infrastructure/orm/repositories/quiz.repository';
import { KnowledgeTraceRepository } from '../../infrastructure/orm/repositories/knowledge-trace.repository';
import { OutlineRepository } from '../../infrastructure/orm/repositories/outline.repository';
import { StudentRepository } from '../../infrastructure/orm/repositories/student.repository';
import { AiClientService } from '../../services/ai-client/ai-client.service';
import { buildStudentContext } from '../goals/goals.util';
import { GoalRepository } from '../../infrastructure/orm/repositories/goal.repository';
import { ADAPTATION_QUEUE } from '../content/adaptation.constants';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly ktRepository: KnowledgeTraceRepository,
    private readonly outlineRepository: OutlineRepository,
    private readonly studentRepository: StudentRepository,
    private readonly goalRepository: GoalRepository,
    private readonly aiClient: AiClientService,
    @InjectQueue(ADAPTATION_QUEUE) private readonly adaptationQueue: Queue,
  ) {}

  async getOrGenerate(nodeId: string, studentId: string) {
    const existing = await this.quizRepository.findByNodeId(nodeId);
    if (existing) {
      return existing;
    }

    // Find the node and its goal context
    const node = await this.outlineRepository.findNodeById(nodeId);
    if (!node) {
      throw new NotFoundException('Outline node not found');
    }

    const outline = await this.outlineRepository.findById(node.outline_id);
    if (!outline) {
      throw new NotFoundException('Outline not found');
    }

    const [profile, goal] = await Promise.all([
      this.studentRepository.findProfile(studentId),
      this.goalRepository.findById(outline.goal_id),
    ]);

    if (!profile || !goal) {
      throw new NotFoundException('Student profile or goal not found');
    }

    const studentContext = buildStudentContext({
      profile,
      goal: {
        motivation: goal.motivation,
        preferred_explanation_style: goal.preferred_explanation_style,
        prior_knowledge: goal.prior_knowledge,
      },
    });

    const assessment = await this.aiClient.generateAssessment({
      node: { id: nodeId, title: node.title },
      studentContext,
    });

    const quiz = await this.quizRepository.createWithQuestions(
      nodeId,
      assessment.questions.map((q, i) => ({
        question_text: q.question,
        options: q.options,
        correct_index: q.correct_index,
        order: i,
      })),
    );

    return quiz;
  }

  async submitAttempt(
    nodeId: string,
    studentId: string,
    answers: number[],
  ) {
    const quiz = await this.quizRepository.findByNodeId(nodeId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found for this node');
    }

    const questions = quiz.questions;
    if (answers.length !== questions.length) {
      throw new BadRequestException(
        `Expected ${questions.length} answers, got ${answers.length}`,
      );
    }

    const results = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: answers[i],
      correctIndex: q.correct_index,
      isCorrect: answers[i] === q.correct_index,
    }));

    const score = results.filter((r) => r.isCorrect).length;
    const total = questions.length;

    // Save attempt
    await this.quizRepository.saveAttempt({
      quizId: quiz.id,
      studentId,
      score,
      total,
      answers,
    });

    const ktState = await this.ktRepository.findByNodeAndStudent(nodeId, studentId);
    const currentState = ktState
      ? { p_known: ktState.p_known, p_learn: ktState.p_learn, p_guess: ktState.p_guess, p_slip: ktState.p_slip }
      : { p_known: 0.3, p_learn: 0.2, p_guess: 0.25, p_slip: 0.1 };

    // Single batch call instead of one per answer
    const ktUpdate = await this.aiClient.updateKnowledgeTraceBatch({
      currentState,
      answers: results.map((r) => r.isCorrect),
    });

    await this.ktRepository.upsert(nodeId, studentId, ktUpdate.updated_state);
    const needsAdaptation = ktUpdate.needs_adaptation;

    const node = await this.outlineRepository.findNodeById(nodeId);
    let nextNodeId: string | null = null;
    let goalId: string | null = null;
    if (node) {
      const outline = await this.outlineRepository.findOne({
        id: node.outline_id,
      });
      if (outline) {
        goalId = outline.goal_id;
        const nextNode = outline.nodes.find((n) => n.order === node.order + 1);
        if (nextNode) {
          nextNodeId = nextNode.id;
        }
      }
    }

    // Trigger adaptation asynchronously if KT score dropped below threshold
    if (needsAdaptation && goalId) {
      this.logger.log(`Queuing adaptation for goal ${goalId}, failing node ${nodeId}`);
      await this.adaptationQueue.add('adapt', {
        goalId,
        studentId,
        failingNodeId: nodeId,
      });
    }

    return {
      score,
      total,
      results,
      knowledgeState: {
        pKnown: ktUpdate.updated_state.p_known,
        pLearn: ktUpdate.updated_state.p_learn,
        pGuess: ktUpdate.updated_state.p_guess,
        pSlip: ktUpdate.updated_state.p_slip,
      },
      needsAdaptation,
      nextNodeId,
    };
  }
}
