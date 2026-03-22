import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { OutlineNodeEntity } from './outline-node.entity';
import { QuestionEntity } from './question.entity';

@Entity('quizzes')
export class QuizEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  node_id: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => OutlineNodeEntity)
  @JoinColumn({ name: 'node_id' })
  node: OutlineNodeEntity;

  @OneToMany(() => QuestionEntity, (q) => q.quiz, { cascade: true })
  questions: QuestionEntity[];
}
