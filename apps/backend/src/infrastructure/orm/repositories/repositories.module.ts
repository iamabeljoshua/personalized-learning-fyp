import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from '../entities/student.entity';
import { StudentProfileEntity } from '../entities/student-profile.entity';
import { LearningGoalEntity } from '../entities/learning-goal.entity';
import { OutlineEntity } from '../entities/outline.entity';
import { OutlineNodeEntity } from '../entities/outline-node.entity';
import { ContentItemEntity } from '../entities/content-item.entity';
import { StudentRepository } from './student.repository';
import { GoalRepository } from './goal.repository';
import { OutlineRepository } from './outline.repository';
import { ContentRepository } from './content.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentEntity,
      StudentProfileEntity,
      LearningGoalEntity,
      OutlineEntity,
      OutlineNodeEntity,
      ContentItemEntity,
    ]),
  ],
  providers: [StudentRepository, GoalRepository, OutlineRepository, ContentRepository],
  exports: [StudentRepository, GoalRepository, OutlineRepository, ContentRepository],
})
export class RepositoriesModule {}
