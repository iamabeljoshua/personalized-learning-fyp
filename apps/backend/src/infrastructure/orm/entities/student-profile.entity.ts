import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentEntity } from './student.entity';

@Entity('student_profiles')
export class StudentProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  student_id: string;

  @Column()
  learning_style: string;

  @Column()
  pace: string;

  @Column()
  education_level: string;

  @Column()
  language_proficiency: string;

  @Column('text', { array: true, default: [] })
  interests: string[];

  @Column({ type: 'text', nullable: true })
  personal_context: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => StudentEntity, (student) => student.profile)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;
}
