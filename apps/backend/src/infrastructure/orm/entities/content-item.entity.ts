import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OutlineNodeEntity } from './outline-node.entity';

@Entity('content_items')
export class ContentItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  node_id: string;

  @Column({ type: 'text', nullable: true })
  text: string | null;

  @Column({ type: 'varchar', nullable: true })
  audio_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  video_url: string | null;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => OutlineNodeEntity)
  @JoinColumn({ name: 'node_id' })
  node: OutlineNodeEntity;
}
