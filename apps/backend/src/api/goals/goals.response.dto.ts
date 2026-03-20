import { LearningGoalEntity } from '../../infrastructure/orm/entities/learning-goal.entity';
import { ListResponse } from '../../shared/list-response';

export class GoalResponseDto {
  /** @example "550e8400-e29b-41d4-a716-446655440000" */
  id: string;

  /** @example "Quantum Physics" */
  topic: string;

  /** @example "academic" */
  motivation: string;

  /** @example "conceptual" */
  preferredExplanationStyle: string;

  /** @example "I know basic algebra and Newton's laws" */
  priorKnowledge: string | null;

  /** @example "active" */
  status: string;

  /** @example "2026-03-20T12:00:00.000Z" */
  createdAt: Date;

  /** @example "2026-03-20T12:00:00.000Z" */
  updatedAt: Date;

  public static fromEntity(entity: LearningGoalEntity) {
    return {
      id: entity.id,
      topic: entity.topic,
      motivation: entity.motivation,
      preferredExplanationStyle: entity.preferred_explanation_style,
      priorKnowledge: entity.prior_knowledge,
      status: entity.status,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

export class GoalListResponseDto implements ListResponse<GoalResponseDto> {
  data: GoalResponseDto[];

  public static fromEntities(entities: LearningGoalEntity[]) {
    return {
      data: entities.map(GoalResponseDto.fromEntity),
    };
  }
}
