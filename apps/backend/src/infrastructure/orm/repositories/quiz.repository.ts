import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QuizEntity } from '../entities/quiz.entity';
import { QuizAttemptEntity } from '../entities/quiz-attempt.entity';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(QuizEntity)
    private readonly quizRepo: Repository<QuizEntity>,
    @InjectRepository(QuizAttemptEntity)
    private readonly attemptRepo: Repository<QuizAttemptEntity>,
  ) {}

  async findByNodeId(nodeId: string) {
    return this.quizRepo.findOne({
      where: { node_id: nodeId },
      relations: ['questions'],
      order: { questions: { order: 'ASC' } },
    });
  }

  async createWithQuestions(
    nodeId: string,
    questions: { question_text: string; options: string[]; correct_index: number; order: number }[],
  ) {
    const quiz = this.quizRepo.create({
      node_id: nodeId,
      questions: questions.map((q) => ({
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
        order: q.order,
      })),
    });
    return this.quizRepo.save(quiz);
  }

  async findLatestAttemptsByNodeIdsAndStudent(nodeIds: string[], studentId: string) {
    if (nodeIds.length === 0) return [];
    // Get quizzes for these nodes, then latest attempt per quiz
    const quizzes = await this.quizRepo.find({
      where: { node_id: In(nodeIds) },
      select: ['id', 'node_id'],
    });
    if (quizzes.length === 0) return [];

    const quizIds = quizzes.map((q) => q.id);
    const attempts = await this.attemptRepo.find({
      where: { quiz_id: In(quizIds), student_id: studentId },
      order: { submitted_at: 'DESC' },
    });

    // Keep only the latest attempt per quiz, map to node_id
    const quizToNode = new Map(quizzes.map((q) => [q.id, q.node_id]));
    const seen = new Set<string>();
    return attempts
      .map((a) => ({ ...a, node_id: quizToNode.get(a.quiz_id)! }))
      .filter((a) => {
        if (seen.has(a.node_id)) return false;
        seen.add(a.node_id);
        return true;
      });
  }

  async saveAttempt(data: {
    quizId: string;
    studentId: string;
    score: number;
    total: number;
    answers: number[];
  }) {
    const attempt = this.attemptRepo.create({
      quiz_id: data.quizId,
      student_id: data.studentId,
      score: data.score,
      total: data.total,
      answers: data.answers,
    });
    return this.attemptRepo.save(attempt);
  }
}
