import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { OutlineRepository } from '../../infrastructure/orm/repositories/outline.repository';
import { GoalRepository } from '../../infrastructure/orm/repositories/goal.repository';
import { StudentRepository } from '../../infrastructure/orm/repositories/student.repository';
import { KnowledgeTraceRepository } from '../../infrastructure/orm/repositories/knowledge-trace.repository';
import { AiClientService } from '../../services/ai-client/ai-client.service';
import { buildStudentContext } from '../goals/goals.util';
import { ADAPTATION_QUEUE } from './adaptation.constants';
import { CONTENT_GENERATION_QUEUE } from './content.constants';

export interface AdaptationJobData {
  goalId: string;
  studentId: string;
  failingNodeId: string;
}

@Processor(ADAPTATION_QUEUE)
export class AdaptationProcessor extends WorkerHost {
  private readonly logger = new Logger(AdaptationProcessor.name);

  constructor(
    private readonly outlineRepository: OutlineRepository,
    private readonly goalRepository: GoalRepository,
    private readonly studentRepository: StudentRepository,
    private readonly ktRepository: KnowledgeTraceRepository,
    private readonly aiClient: AiClientService,
    @InjectQueue(CONTENT_GENERATION_QUEUE) private readonly contentQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<AdaptationJobData>) {
    const { goalId, studentId, failingNodeId } = job.data;
    this.logger.log(`Processing adaptation for goal ${goalId}, failing node ${failingNodeId}`);

    try {
      const [goal, profile, outline] = await Promise.all([
        this.goalRepository.findById(goalId),
        this.studentRepository.findProfile(studentId),
        this.outlineRepository.findOne({ goal_id: goalId, is_active: true }),
      ]);

      if (!goal || !profile || !outline) {
        this.logger.error('Missing data for adaptation');
        return;
      }

      const failingNode = outline.nodes.find((n) => n.id === failingNodeId);
      if (!failingNode) {
        this.logger.error(`Failing node ${failingNodeId} not found in outline`);
        return;
      }

      const studentContext = buildStudentContext({
        profile,
        goal: {
          motivation: goal.motivation,
          preferred_explanation_style: goal.preferred_explanation_style,
          prior_knowledge: goal.prior_knowledge,
        },
      });

      // Get KT states for all nodes
      const nodeIds = outline.nodes.map((n) => n.id);
      const ktStates = await this.ktRepository.findByNodeIdsAndStudent(nodeIds, studentId);
      const failingKt = ktStates.find((kt) => kt.node_id === failingNodeId);

      // Call the ai service
      const result = await this.aiClient.triggerAdaptation({
        failingNodeId,
        failingNodeTitle: failingNode.title,
        failingPKnown: failingKt?.p_known ?? 0.3,
        outlineNodes: outline.nodes.map((n) => ({
          id: n.id,
          title: n.title,
          type: n.type,
          order: n.order,
        })),
        studentContext,
        ktStates: ktStates.map((kt) => ({
          node_id: kt.node_id,
          p_known: kt.p_known,
        })),
      });

      if (result.action === 'none' || !result.new_nodes?.length) {
        this.logger.log('Adaptation assessment: existing outline is sufficient');
        return;
      }

      // Insert new nodes into the existing outline
      const { newNodeIds } = await this.outlineRepository.insertAdaptationNodes({
        outline,
        failingNodeOrder: failingNode.order,
        newNodes: result.new_nodes.map((n) => ({
          title: n.title,
          type: n.type,
        })),
      });

      this.logger.log(`Adapted outline: inserted ${newNodeIds.length} new nodes after node ${failingNodeId}`);

      // Queue content generation for new nodes only
      await Promise.all(
        newNodeIds.map((nodeId) =>
          this.contentQueue.add('generate', {
            nodeId,
            goalId,
            studentId,
          }),
        ),
      );

      this.logger.log(`Queued content generation for ${newNodeIds.length} new nodes`);
    } catch (error) {
      this.logger.error(`Adaptation failed: ${error?.message}`, error?.stack);
    }
  }
}
