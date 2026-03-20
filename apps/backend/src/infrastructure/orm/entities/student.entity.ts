import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentProfileEntity } from './student-profile.entity';
import { LearningGoalEntity } from './learning-goal.entity';

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  is_onboarded: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => StudentProfileEntity, (profile) => profile.student)
  profile: StudentProfileEntity;

  @OneToMany(() => LearningGoalEntity, (goal) => goal.student)
  goals: LearningGoalEntity[];
}
