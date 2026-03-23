import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GoalRepository } from '../../infrastructure/orm/repositories/goal.repository';
import { StudentRepository } from '../../infrastructure/orm/repositories/student.repository';
import { OutlineRepository } from '../../infrastructure/orm/repositories/outline.repository';
import { ContentRepository } from '../../infrastructure/orm/repositories/content.repository';
import { KnowledgeTraceRepository } from '../../infrastructure/orm/repositories/knowledge-trace.repository';
import { QuizRepository } from '../../infrastructure/orm/repositories/quiz.repository';
import { DocumentRepository } from '../../infrastructure/orm/repositories/document.repository';
import { AiClientService } from '../../services/ai-client/ai-client.service';
import { CreateGoalDto } from './goals.request.dto';
import { buildStudentContext } from './goals.util';
import { ProgressResponseDto } from './progress.response.dto';
import { CONTENT_GENERATION_QUEUE } from '../content/content.constants';
import { ContentGenerationJobData } from '../content/content-generation.processor';

@Injectable()
export class GoalsService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly studentRepository: StudentRepository,
    private readonly outlineRepository: OutlineRepository,
    private readonly contentRepository: ContentRepository,
    private readonly ktRepository: KnowledgeTraceRepository,
    private readonly quizRepository: QuizRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly aiClient: AiClientService,
    @InjectQueue(CONTENT_GENERATION_QUEUE)
    private readonly contentQueue: Queue<ContentGenerationJobData>,
  ) {}

  async list(studentId: string) {
    return this.goalRepository.findByStudentId(studentId);
  }

  /**
   * Creates a learning goal (to learn some topic).
   * This calls the ai service to generate a personalized outline for the student,
   * persists everything atomically, then queues content generation jobs.
   */
  async create({ studentId, dto }: { studentId: string; dto: CreateGoalDto }) {
    const profile = await this.studentRepository.findProfile(studentId);
    if (!profile) {
      throw new BadRequestException(
        'Complete onboarding before creating a learning goal',
      );
    }

    // Build a context for the student that personalizes the outline generation
    const studentContext = buildStudentContext({
      profile,
      goal: {
        motivation: dto.motivation,
        preferred_explanation_style: dto.preferredExplanationStyle,
        prior_knowledge: dto.priorKnowledge ?? null,
      },
    });

    // Call the ai service to generate the outline
    const outlineResponse = await this.aiClient.generateOutline({
      topic: dto.topic,
      studentContext,
    });

    // Persist goal + outline + nodes + pending content items atomically
    const { goal, nodeIds } = await this.goalRepository.createWithOutline({
      goalData: {
        student_id: studentId,
        topic: dto.topic,
        motivation: dto.motivation,
        preferred_explanation_style: dto.preferredExplanationStyle,
        prior_knowledge: dto.priorKnowledge ?? null,
      },
      outlineNodes: outlineResponse.nodes.map((node) => ({
        title: node.title,
        type: node.type,
        order: node.order,
      })),
    });

    // Queue content generation jobs for each node
    await Promise.all(
      nodeIds.map((nodeId) =>
        this.contentQueue.add('generate', {
          nodeId,
          goalId: goal.id,
          studentId,
        }),
      ),
    );

    return goal;
  }

  async findOne({ studentId, goalId }: { studentId: string; goalId: string }) {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new NotFoundException('Learning goal not found');
    }
    if (goal.student_id !== studentId) {
      throw new ForbiddenException('You do not have access to this goal');
    }
    return goal;
  }

  async getOutline({
    studentId,
    goalId,
  }: {
    studentId: string;
    goalId: string;
  }) {
    await this.findOne({ studentId, goalId }); // ownership check
    const outline = await this.outlineRepository.findOne({
      goal_id: goalId,
      is_active: true,
    });
    if (!outline) {
      throw new NotFoundException('No outline found for this goal');
    }
    return outline;
  }

  async remove({ studentId, goalId }: { studentId: string; goalId: string }) {
    const goal = await this.findOne({ studentId, goalId });

    // Remove any pending/waiting jobs for this goal from the content queue
    const waitingJobs = await this.contentQueue.getJobs(['waiting', 'delayed', 'active']);
    for (const job of waitingJobs) {
      if (job.data?.goalId === goalId) {
        try {
          await job.remove();
        } catch {
          // Job may have already been processed
        }
      }
    }

    // Clean up documents and embeddings
    await this.documentRepository.deleteByGoalId(goalId);

    await this.goalRepository.remove(goal.id);
  }

  async getProgress({
    studentId,
    goalId,
  }: {
    studentId: string;
    goalId: string;
  }){
    const goal = await this.findOne({ studentId, goalId });
    const outline = await this.outlineRepository.findOne({
      goal_id: goalId,
      is_active: true,
    });

    if (!outline) {
      throw new NotFoundException('No outline found for this goal');
    }

    const nodeIds = outline.nodes.map((n) => n.id);

    const [contentItems, ktStates, attempts] = await Promise.all([
      this.contentRepository.findByNodeIds(nodeIds),
      this.ktRepository.findByNodeIdsAndStudent(nodeIds, studentId),
      this.quizRepository.findLatestAttemptsByNodeIdsAndStudent(nodeIds, studentId),
    ]);

    // Index by node_id for fast lookup
    const contentByNode = new Map(contentItems.map((c) => [c.node_id, c]));
    const ktByNode = new Map(ktStates.map((k) => [k.node_id, k]));
    const attemptByNode = new Map(attempts.map((a) => [a.node_id, a]));

    const nodes = outline.nodes.map((node) => {
      const content = contentByNode.get(node.id);
      const kt = ktByNode.get(node.id);
      const attempt = attemptByNode.get(node.id);

      return {
        nodeId: node.id,
        title: node.title,
        type: node.type,
        order: node.order,
        textStatus: content?.text_status ?? 'pending',
        audioStatus: content?.audio_status ?? 'pending',
        videoStatus: content?.video_status ?? 'pending',
        quizAttempted: !!attempt,
        lastScore: attempt?.score ?? null,
        lastTotal: attempt?.total ?? null,
        pKnown: kt?.p_known ?? null,
      };
    });

    const nodesWithContent = nodes.filter((n) => n.textStatus === 'ready').length;
    const nodesQuizzed = nodes.filter((n) => n.quizAttempted).length;
    const ktValues = nodes.filter((n) => n.pKnown !== null).map((n) => n.pKnown!);
    const averagePKnown =
      ktValues.length > 0
        ? ktValues.reduce((sum, v) => sum + v, 0) / ktValues.length
        : null;

    return {
      goalId: goal.id,
      topic: goal.topic,
      nodes,
      summary: {
        totalNodes: nodes.length,
        nodesWithContent,
        nodesQuizzed,
        averagePKnown,
      },
    };
  }

  async uploadDocument({
    studentId,
    goalId,
    file,
  }: {
    studentId: string;
    goalId: string;
    file: Express.Multer.File;
  }) {
    const goal = await this.findOne({ studentId, goalId });

    // Save file to media/documents/{goalId}/
    const fs = await import('fs/promises');
    const path = await import('path');
    const mediaPath = process.env.MEDIA_STORAGE_PATH || './media';
    const docDir = path.join(mediaPath, 'documents', goalId);
    await fs.mkdir(docDir, { recursive: true });

    const filePath = path.join(docDir, file.originalname);
    await fs.writeFile(filePath, file.buffer);

    // Save document metadata
    await this.documentRepository.saveDocument(goalId, file.originalname, filePath);

    // Call AI service to chunk + embed
    const embedResult = await this.aiClient.embedDocument({ filePath });

    // Store chunks + embeddings in pgvector
    if (embedResult.chunks.length > 0) {
      await this.documentRepository.storeEmbeddings(
        goalId,
        embedResult.chunks,
        embedResult.embeddings,
      );
    }

    return {
      filename: file.originalname,
      chunks: embedResult.chunks.length,
    };
  }
}
