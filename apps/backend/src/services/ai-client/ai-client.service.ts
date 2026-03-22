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
  KnowledgeTraceBatchResponse,
  AdaptOutlineNode,
  AdaptKTState,
  AdaptResponse,
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
      timeout: 600_000,  // 10 min — TTS can be slow on CPU
    });
  }

  async generateContentVideo({ nodeTitle, fullText, nodeId, studentContext }: {
    nodeTitle: string;
    fullText: string;
    nodeId: string;
    studentContext: StudentContext;
  }) {
    return this.post<GenerateVideoResponse>({
      path: '/pipeline/content/video',
      body: {
        node_title: nodeTitle,
        full_text: fullText,
        node_id: nodeId,
        student_context: studentContext,
      },
      timeout: 1_800_000,  // 30 min — TTS + Manim render + subtitles can take very long
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

  async triggerAdaptation({ failingNodeId, failingNodeTitle, failingPKnown, outlineNodes, studentContext, ktStates }: {
    failingNodeId: string;
    failingNodeTitle: string;
    failingPKnown: number;
    outlineNodes: AdaptOutlineNode[];
    studentContext: StudentContext;
    ktStates: AdaptKTState[];
  }) {
    return this.post<AdaptResponse>({
      path: '/pipeline/adapt',
      body: {
        failing_node_id: failingNodeId,
        failing_node_title: failingNodeTitle,
        failing_p_known: failingPKnown,
        outline_nodes: outlineNodes,
        student_context: studentContext,
        kt_states: ktStates,
      },
      timeout: 600_000,  // 10 min — adaptation involves multiple LLM calls
    });
  }

  async updateKnowledgeTraceBatch({ currentState, answers }: {
    currentState: KnowledgeState;
    answers: boolean[];
  }) {
    return this.post<KnowledgeTraceBatchResponse>({
      path: '/pipeline/knowledge-trace-batch',
      body: {
        current_state: currentState,
        answers,
      },
    });
  }

  private async post<T>({ path, body, timeout }: { path: string; body: unknown; timeout?: number }): Promise<T> {
    try {
      const response = await this.client.post<T>(path, body, timeout ? { timeout } : undefined);
      return response.data;
    } catch (error) {
      this.logger.error(`AI service call failed: ${path}`, error?.message);
      throw error;
    }
  }
}
