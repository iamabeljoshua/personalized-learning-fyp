export class NodeProgressDto {
  nodeId: string;
  title: string;
  type: string;
  order: number;
  textStatus: string;
  audioStatus: string;
  videoStatus: string;
  quizAttempted: boolean;
  lastScore: number | null;
  lastTotal: number | null;
  pKnown: number | null;
}

export class ProgressSummaryDto {
  totalNodes: number;
  nodesWithContent: number;
  nodesQuizzed: number;
  averagePKnown: number | null;
}

export class ProgressResponseDto {
  goalId: string;
  topic: string;
  nodes: NodeProgressDto[];
  summary: ProgressSummaryDto;

  static from(data: {
    goalId: string;
    topic: string;
    nodes: NodeProgressDto[];
    summary: ProgressSummaryDto;
  }) {
    return {
      goalId: data.goalId,
      topic: data.topic,
      nodes: data.nodes,
      summary: data.summary,
    };
  }
}
