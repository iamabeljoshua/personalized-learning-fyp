import { ContentItemEntity } from '../../infrastructure/orm/entities/content-item.entity';

export class ContentResponseDto {
  /** @example "550e8400-e29b-41d4-a716-446655440000" */
  id: string;

  /** @example "550e8400-e29b-41d4-a716-446655440000" */
  nodeId: string;

  /** @example "## Wave-Particle Duality\n\nImagine you're watching a football match..." */
  text: string | null;

  /** @example "/media/audio/node-id.mp3" */
  audioUrl: string | null;

  /** @example "/media/video/node-id.mp4" */
  videoUrl: string | null;

  /** @example "ready" */
  textStatus: string;

  /** @example "generating" */
  audioStatus: string;

  /** @example "pending" */
  videoStatus: string;

  /** @example "2026-03-21T12:00:00.000Z" */
  createdAt: Date;

  /** @example "2026-03-21T12:00:00.000Z" */
  updatedAt: Date;

  public static fromEntity(entity: ContentItemEntity) {
    return {
      id: entity.id,
      nodeId: entity.node_id,
      text: entity.text,
      audioUrl: entity.audio_url,
      videoUrl: entity.video_url,
      textStatus: entity.text_status,
      audioStatus: entity.audio_status,
      videoStatus: entity.video_status,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

export class ContentStatusResponseDto {
  /** @example "ready" */
  textStatus: string;

  /** @example "generating" */
  audioStatus: string;

  /** @example "pending" */
  videoStatus: string;

  public static fromEntity(entity: ContentItemEntity) {
    return {
      textStatus: entity.text_status,
      audioStatus: entity.audio_status,
      videoStatus: entity.video_status,
    };
  }
}
