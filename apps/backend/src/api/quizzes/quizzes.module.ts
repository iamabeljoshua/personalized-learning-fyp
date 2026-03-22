import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/orm/repositories/repositories.module';
import { AiClientModule } from '../../services/ai-client/ai-client.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [RepositoriesModule, AiClientModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
