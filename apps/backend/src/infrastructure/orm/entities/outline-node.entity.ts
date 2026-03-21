import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OutlineEntity } from './outline.entity';

@Entity('outline_nodes')
export class OutlineNodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  outline_id: string;

  @Column()
  title: string;

  @Column({ default: 'concept' })
  type: string;

  @Column()
  order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => OutlineEntity, (outline) => outline.nodes)
  @JoinColumn({ name: 'outline_id' })
  outline: OutlineEntity;
}
