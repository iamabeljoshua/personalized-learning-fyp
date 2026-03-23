import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LearningGoalEntity } from './learning-goal.entity';

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  goal_id: string;

  @Column()
  original_filename: string;

  @Column()
  file_path: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => LearningGoalEntity)
  @JoinColumn({ name: 'goal_id' })
  goal: LearningGoalEntity;
}
