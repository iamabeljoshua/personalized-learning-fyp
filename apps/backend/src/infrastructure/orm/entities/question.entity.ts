import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizEntity } from './quiz.entity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quiz_id: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ type: 'jsonb' })
  options: string[];

  @Column()
  correct_index: number;

  @Column()
  order: number;

  @ManyToOne(() => QuizEntity, (quiz) => quiz.questions)
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizEntity;
}
