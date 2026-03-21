import { OutlineEntity } from '../../infrastructure/orm/entities/outline.entity';
import { OutlineNodeEntity } from '../../infrastructure/orm/entities/outline-node.entity';

export class OutlineNodeResponseDto {
  /** @example "550e8400-e29b-41d4-a716-446655440000" */
  id: string;

  /** @example "Wave-Particle Duality" */
  title: string;

  /** @example "concept" */
  type: string;

  /** @example 1 */
  order: number;

  public static fromEntity(entity: OutlineNodeEntity) {
    return {
      id: entity.id,
      title: entity.title,
      type: entity.type,
      order: entity.order,
    };
  }
}

export class OutlineResponseDto {
  /** @example "550e8400-e29b-41d4-a716-446655440000" */
  id: string;

  /** @example 1 */
  version: number;

  /** @example true */
  isActive: boolean;

  /** @example "2026-03-21T12:00:00.000Z" */
  createdAt: Date;

  nodes: OutlineNodeResponseDto[];

  public static fromEntity(entity: OutlineEntity) {
    return {
      id: entity.id,
      version: entity.version,
      isActive: entity.is_active,
      createdAt: entity.created_at,
      nodes: (entity.nodes ?? []).map(OutlineNodeResponseDto.fromEntity),
    };
  }
}
