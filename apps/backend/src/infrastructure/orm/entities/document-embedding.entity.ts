import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LearningGoalEntity } from './learning-goal.entity';

@Entity('document_embeddings')
export class DocumentEmbeddingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  goal_id: string;

  @Column()
  chunk_index: number;

  @Column('text')
  chunk_text: string;

  // pgvector column — stored as string in TypeORM, queried via raw SQL
  @Column({ type: 'text', nullable: true })
  embedding_raw: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => LearningGoalEntity)
  @JoinColumn({ name: 'goal_id' })
  goal: LearningGoalEntity;
}
