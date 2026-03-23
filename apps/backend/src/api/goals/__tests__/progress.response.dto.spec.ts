import { ProgressResponseDto } from '../progress.response.dto';

describe('ProgressResponseDto', () => {
  it('should map progress data correctly', () => {
    const data = {
      goalId: 'goal1',
      topic: 'Physics',
      nodes: [
        {
          nodeId: 'n1',
          title: 'Introduction',
          type: 'introduction',
          order: 1,
          textStatus: 'ready',
          audioStatus: 'ready',
          videoStatus: 'ready',
          quizAttempted: true,
          lastScore: 3,
          lastTotal: 4,
          pKnown: 0.75,
        },
        {
          nodeId: 'n2',
          title: 'Force',
          type: 'concept',
          order: 2,
          textStatus: 'generating',
          audioStatus: 'pending',
          videoStatus: 'pending',
          quizAttempted: false,
          lastScore: null,
          lastTotal: null,
          pKnown: null,
        },
      ],
      summary: {
        totalNodes: 2,
        nodesWithContent: 1,
        nodesQuizzed: 1,
        averagePKnown: 0.75,
      },
    };

    const dto = ProgressResponseDto.from(data);
    expect(dto.goalId).toBe('goal1');
    expect(dto.topic).toBe('Physics');
    expect(dto.nodes).toHaveLength(2);
    expect(dto.nodes[0].pKnown).toBe(0.75);
    expect(dto.nodes[1].pKnown).toBeNull();
    expect(dto.summary.totalNodes).toBe(2);
    expect(dto.summary.nodesWithContent).toBe(1);
    expect(dto.summary.averagePKnown).toBe(0.75);
  });

  it('should handle empty nodes', () => {
    const data = {
      goalId: 'goal2',
      topic: 'Math',
      nodes: [],
      summary: {
        totalNodes: 0,
        nodesWithContent: 0,
        nodesQuizzed: 0,
        averagePKnown: null,
      },
    };

    const dto = ProgressResponseDto.from(data);
    expect(dto.nodes).toHaveLength(0);
    expect(dto.summary.averagePKnown).toBeNull();
  });
});
