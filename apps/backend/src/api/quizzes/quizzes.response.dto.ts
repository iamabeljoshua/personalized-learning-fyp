import { QuizEntity } from '../../infrastructure/orm/entities/quiz.entity';
import { QuestionEntity } from '../../infrastructure/orm/entities/question.entity';

export class QuestionDto {
  id: string;
  questionText: string;
  options: string[];
  order: number;

  static fromEntity(entity: QuestionEntity) {
    return {
      id: entity.id,
      questionText: entity.question_text,
      options: entity.options,
      order: entity.order,
    };
  }
}

export class QuizResponseDto {
  id: string;
  nodeId: string;
  questions: QuestionDto[];
  createdAt: Date;

  static fromEntity(entity: QuizEntity) {
    return {
      id: entity.id,
      nodeId: entity.node_id,
      questions: entity.questions.map(QuestionDto.fromEntity),
      createdAt: entity.created_at,
    };
  }
}

export class AttemptResultDto {
  score: number;
  total: number;
  results: {
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
  }[];
  knowledgeState: {
    pKnown: number;
    pLearn: number;
    pGuess: number;
    pSlip: number;
  };
  needsAdaptation: boolean;
  nextNodeId: string | null;

  static from(data: {
    score: number;
    total: number;
    results: { questionId: string; selectedIndex: number; correctIndex: number; isCorrect: boolean }[];
    knowledgeState: { pKnown: number; pLearn: number; pGuess: number; pSlip: number };
    needsAdaptation: boolean;
    nextNodeId: string | null;
  }) {
    return {
      score: data.score,
      total: data.total,
      results: data.results,
      knowledgeState: data.knowledgeState,
      needsAdaptation: data.needsAdaptation,
      nextNodeId: data.nextNodeId,
    };
  }
}
