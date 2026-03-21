import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LearningGoalEntity } from './learning-goal.entity';
import { OutlineNodeEntity } from './outline-node.entity';

@Entity('outlines')
export class OutlineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  goal_id: string;

  @Column({ default: 1 })
  version: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => LearningGoalEntity)
  @JoinColumn({ name: 'goal_id' })
  goal: LearningGoalEntity;

  @OneToMany(() => OutlineNodeEntity, (node) => node.outline)
  nodes: OutlineNodeEntity[];
}
