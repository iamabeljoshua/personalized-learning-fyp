import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizEntity } from './quiz.entity';
import { StudentEntity } from './student.entity';

@Entity('quiz_attempts')
export class QuizAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quiz_id: string;

  @Column()
  student_id: string;

  @Column()
  score: number;

  @Column()
  total: number;

  @Column({ type: 'jsonb' })
  answers: number[];

  @CreateDateColumn()
  submitted_at: Date;

  @ManyToOne(() => QuizEntity)
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizEntity;

  @ManyToOne(() => StudentEntity)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;
}
