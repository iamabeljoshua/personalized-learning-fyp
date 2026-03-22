import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from '../entities/student.entity';
import { StudentProfileEntity } from '../entities/student-profile.entity';
import { LearningGoalEntity } from '../entities/learning-goal.entity';
import { OutlineEntity } from '../entities/outline.entity';
import { OutlineNodeEntity } from '../entities/outline-node.entity';
import { ContentItemEntity } from '../entities/content-item.entity';
import { QuizEntity } from '../entities/quiz.entity';
import { QuestionEntity } from '../entities/question.entity';
import { QuizAttemptEntity } from '../entities/quiz-attempt.entity';
import { KnowledgeTraceEntity } from '../entities/knowledge-trace.entity';
import { StudentRepository } from './student.repository';
import { GoalRepository } from './goal.repository';
import { OutlineRepository } from './outline.repository';
import { ContentRepository } from './content.repository';
import { QuizRepository } from './quiz.repository';
import { KnowledgeTraceRepository } from './knowledge-trace.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentEntity,
      StudentProfileEntity,
      LearningGoalEntity,
      OutlineEntity,
      OutlineNodeEntity,
      ContentItemEntity,
      QuizEntity,
      QuestionEntity,
      QuizAttemptEntity,
      KnowledgeTraceEntity,
    ]),
  ],
  providers: [
    StudentRepository,
    GoalRepository,
    OutlineRepository,
    ContentRepository,
    QuizRepository,
    KnowledgeTraceRepository,
  ],
  exports: [
    StudentRepository,
    GoalRepository,
    OutlineRepository,
    ContentRepository,
    QuizRepository,
    KnowledgeTraceRepository,
  ],
})
export class RepositoriesModule {}
