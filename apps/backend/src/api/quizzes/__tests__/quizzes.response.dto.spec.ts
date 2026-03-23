import { QuestionDto, QuizResponseDto, AttemptResultDto } from '../quizzes.response.dto';

describe('QuestionDto', () => {
  it('should map entity to DTO', () => {
    const entity = {
      id: 'q1',
      question_text: 'What is force?',
      options: ['A', 'B', 'C', 'D'],
      correct_index: 2,
      order: 0,
    } as any;

    const dto = QuestionDto.fromEntity(entity);
    expect(dto.id).toBe('q1');
    expect(dto.questionText).toBe('What is force?');
    expect(dto.options).toEqual(['A', 'B', 'C', 'D']);
    expect(dto.order).toBe(0);
    // Should NOT expose correct_index
    expect(dto).not.toHaveProperty('correct_index');
    expect(dto).not.toHaveProperty('correctIndex');
  });
});

describe('QuizResponseDto', () => {
  it('should map quiz entity with questions', () => {
    const entity = {
      id: 'quiz1',
      node_id: 'node1',
      created_at: new Date('2026-03-22'),
      questions: [
        { id: 'q1', question_text: 'Q1?', options: ['A', 'B'], correct_index: 0, order: 0 },
        { id: 'q2', question_text: 'Q2?', options: ['C', 'D'], correct_index: 1, order: 1 },
      ],
    } as any;

    const dto = QuizResponseDto.fromEntity(entity);
    expect(dto.id).toBe('quiz1');
    expect(dto.nodeId).toBe('node1');
    expect(dto.questions).toHaveLength(2);
    expect(dto.questions[0].questionText).toBe('Q1?');
    expect(dto.questions[1].questionText).toBe('Q2?');
  });
});

describe('AttemptResultDto', () => {
  it('should map attempt data correctly', () => {
    const data = {
      score: 3,
      total: 4,
      results: [
        { questionId: 'q1', selectedIndex: 0, correctIndex: 0, isCorrect: true },
        { questionId: 'q2', selectedIndex: 1, correctIndex: 0, isCorrect: false },
        { questionId: 'q3', selectedIndex: 2, correctIndex: 2, isCorrect: true },
        { questionId: 'q4', selectedIndex: 0, correctIndex: 0, isCorrect: true },
      ],
      knowledgeState: { pKnown: 0.65, pLearn: 0.2, pGuess: 0.25, pSlip: 0.1 },
      needsAdaptation: false,
      nextNodeId: 'node2',
    };

    const dto = AttemptResultDto.from(data);
    expect(dto.score).toBe(3);
    expect(dto.total).toBe(4);
    expect(dto.results).toHaveLength(4);
    expect(dto.knowledgeState.pKnown).toBe(0.65);
    expect(dto.needsAdaptation).toBe(false);
    expect(dto.nextNodeId).toBe('node2');
  });

  it('should handle null nextNodeId', () => {
    const data = {
      score: 0,
      total: 4,
      results: [],
      knowledgeState: { pKnown: 0.1, pLearn: 0.2, pGuess: 0.25, pSlip: 0.1 },
      needsAdaptation: true,
      nextNodeId: null,
    };

    const dto = AttemptResultDto.from(data);
    expect(dto.nextNodeId).toBeNull();
    expect(dto.needsAdaptation).toBe(true);
  });
});
