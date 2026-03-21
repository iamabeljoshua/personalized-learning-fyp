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
import { AiClientService } from '../../services/ai-client/ai-client.service';
import { CreateGoalDto } from './goals.request.dto';
import { buildStudentContext } from './goals.util';
import { CONTENT_GENERATION_QUEUE } from '../content/content.constants';
import { ContentGenerationJobData } from '../content/content-generation.processor';

@Injectable()
export class GoalsService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly studentRepository: StudentRepository,
    private readonly outlineRepository: OutlineRepository,
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
    await this.goalRepository.remove(goal.id);
  }
}
