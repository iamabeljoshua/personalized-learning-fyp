import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from '../entities/student.entity';
import { StudentProfileEntity } from '../entities/student-profile.entity';
import { LearningGoalEntity } from '../entities/learning-goal.entity';
import { StudentRepository } from './student.repository';
import { GoalRepository } from './goal.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentEntity,
      StudentProfileEntity,
      LearningGoalEntity,
    ]),
  ],
  providers: [StudentRepository, GoalRepository],
  exports: [StudentRepository, GoalRepository],
})
export class RepositoriesModule {}
