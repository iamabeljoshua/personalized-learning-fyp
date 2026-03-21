import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AppConfiguration } from '../../infrastructure/configuration';
import {
  StudentContext,
  ContentNode,
  GenerateOutlineResponse,
  GenerateTextResponse,
  GenerateAudioResponse,
  GenerateVideoResponse,
  GenerateAssessmentResponse,
  KnowledgeState,
  KnowledgeTraceUpdateResponse,
} from './ai-client.types';

@Injectable()
export class AiClientService {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger(AiClientService.name);

  constructor(configService: ConfigService) {
    const config = AppConfiguration.fromService(configService);
    this.client = axios.create({
      baseURL: config.aiService.url,
      headers: { 'X-API-Key': config.aiService.apiKey },
      timeout: 120_000,
    });
  }

  async generateOutline({ topic, studentContext, ragChunks }: {
    topic: string;
    studentContext: StudentContext;
    ragChunks?: string[];
  }) {
    return this.post<GenerateOutlineResponse>({
      path: '/pipeline/outline',
      body: {
        topic,
        student_context: studentContext,
        rag_chunks: ragChunks ?? [],
      },
    });
  }

  async generateContentText({ node, studentContext, outlineContext, ragChunks }: {
    node: ContentNode;
    studentContext: StudentContext;
    outlineContext?: string[];
    ragChunks?: string[];
  }) {
    return this.post<GenerateTextResponse>({
      path: '/pipeline/content/text',
      body: {
        node,
        student_context: studentContext,
        outline_context: outlineContext ?? [],
        rag_chunks: ragChunks ?? [],
      },
    });
  }

  async generateContentAudio({ text, nodeId }: {
    text: string;
    nodeId: string;
  }) {
    return this.post<GenerateAudioResponse>({
      path: '/pipeline/content/audio',
      body: { text, node_id: nodeId },
    });
  }

  async generateContentVideo({ nodeTitle, fullText, nodeId }: {
    nodeTitle: string;
    fullText: string;
    nodeId: string;
  }) {
    return this.post<GenerateVideoResponse>({
      path: '/pipeline/content/video',
      body: {
        node_title: nodeTitle,
        full_text: fullText,
        node_id: nodeId,
      },
    });
  }

  async generateAssessment({ node, studentContext }: {
    node: { id: string; title: string };
    studentContext: StudentContext;
  }) {
    return this.post<GenerateAssessmentResponse>({
      path: '/pipeline/assessment',
      body: {
        node,
        student_context: studentContext,
      },
    });
  }

  async updateKnowledgeTrace({ currentState, isCorrect }: {
    currentState: KnowledgeState;
    isCorrect: boolean;
  }) {
    return this.post<KnowledgeTraceUpdateResponse>({
      path: '/pipeline/knowledge-trace-update',
      body: {
        current_state: currentState,
        is_correct: isCorrect,
      },
    });
  }

  private async post<T>({ path, body }: { path: string; body: unknown }): Promise<T> {
    try {
      const response = await this.client.post<T>(path, body);
      return response.data;
    } catch (error) {
      this.logger.error(`AI service call failed: ${path}`, error?.message);
      throw error;
    }
  }
}
