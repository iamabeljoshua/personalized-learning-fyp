import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ContentRepository } from '../../infrastructure/orm/repositories/content.repository';
import { OutlineRepository } from '../../infrastructure/orm/repositories/outline.repository';
import { GoalRepository } from '../../infrastructure/orm/repositories/goal.repository';
import { StudentRepository } from '../../infrastructure/orm/repositories/student.repository';
import { AiClientService } from '../../services/ai-client/ai-client.service';
import { buildStudentContext } from '../goals/goals.util';
import { CONTENT_GENERATION_QUEUE } from './content.constants';

export interface ContentGenerationJobData {
  nodeId: string;
  goalId: string;
  studentId: string;
}

@Processor(CONTENT_GENERATION_QUEUE)
export class ContentGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ContentGenerationProcessor.name);

  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly outlineRepository: OutlineRepository,
    private readonly goalRepository: GoalRepository,
    private readonly studentRepository: StudentRepository,
    private readonly aiClient: AiClientService,
  ) {
    super();
  }

  async process(job: Job<ContentGenerationJobData>) {
    const { nodeId, goalId, studentId } = job.data;
    this.logger.log(`Processing content for node ${nodeId}`);

    try {
      await this.contentRepository.updateStatus({ nodeId, status: 'generating' });

      const [goal, profile, outline] = await Promise.all([
        this.goalRepository.findById(goalId),
        this.studentRepository.findProfile(studentId),
        this.outlineRepository.findOne({ goal_id: goalId, is_active: true }),
      ]);

      if (!goal || !profile || !outline) {
        throw new Error(`Missing data for node ${nodeId}`);
      }

      const studentContext = buildStudentContext({
        profile,
        goal: {
          motivation: goal.motivation,
          preferred_explanation_style: goal.preferred_explanation_style,
          prior_knowledge: goal.prior_knowledge,
        },
      });

      // Build outline context — titles of nodes before this one
      const currentNode = outline.nodes.find((n) => n.id === nodeId);

      //find all the previous nodes (i.e concepts user must have learned before this one)
      const outlineContext = outline.nodes
        .filter((n) => n.order < (currentNode?.order ?? 0))
        .map((n) => n.title);

      // Step 1: Generate text
      let text: string | null = null;
      try {
        const textResult = await this.aiClient.generateContentText({
          node: {
            id: nodeId,
            title: currentNode?.title ?? '',
            type: currentNode?.type ?? 'concept',
          },
          studentContext,
          outlineContext,
        });
        text = textResult.text;
        await this.contentRepository.updateText({ nodeId, text });
        this.logger.log(`Text generated for node ${nodeId}`);
      } catch (error) {
        this.logger.error(`Text generation failed for node ${nodeId}: ${error?.message}`);
      }

      // Step 2: Generate audio
      try {
        if (text) {
          const audioResult = await this.aiClient.generateContentAudio({
            text,
            nodeId,
          });
          if (audioResult.audio_url) {
            await this.contentRepository.updateAudio({ nodeId, audioUrl: audioResult.audio_url });
            this.logger.log(`Audio generated for node ${nodeId}`);
          }
        }
      } catch (error) {
        this.logger.error(`Audio generation failed for node ${nodeId}: ${error?.message}`);
      }

      // Step 3: Generate video (the fun part)
      try {
        if (text && currentNode) {
          const videoResult = await this.aiClient.generateContentVideo({
            nodeTitle: currentNode.title,
            fullText: text,
            nodeId,
          });
          if (videoResult.video_url) {
            await this.contentRepository.updateVideo({ nodeId, videoUrl: videoResult.video_url });
            this.logger.log(`Video generated for node ${nodeId}`);
          }
        }
      } catch (error) {
        this.logger.error(`Video generation failed for node ${nodeId}: ${error?.message}`);
      }

      // Set final status based on what succeeded
      const contentItem = await this.contentRepository.findByNodeId(nodeId);
      if (!contentItem?.text) {
        await this.contentRepository.updateStatus({ nodeId, status: 'failed' });
      } else if (contentItem.video_url) {
        await this.contentRepository.updateStatus({ nodeId, status: 'ready' });
      } else if (contentItem.audio_url) {
        await this.contentRepository.updateStatus({ nodeId, status: 'audio_ready' });
      }
      // text_ready status is already set by updateText

    } catch (error) {
      this.logger.error(`Content generation failed for node ${nodeId}: ${error?.message}`);
      await this.contentRepository.updateStatus({ nodeId, status: 'failed' });
    }
  }
}
