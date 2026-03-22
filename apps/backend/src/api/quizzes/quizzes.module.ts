import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RepositoriesModule } from '../../infrastructure/orm/repositories/repositories.module';
import { AiClientModule } from '../../services/ai-client/ai-client.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { ADAPTATION_QUEUE } from '../content/adaptation.constants';

@Module({
  imports: [
    RepositoriesModule,
    AiClientModule,
    BullModule.registerQueue({ name: ADAPTATION_QUEUE }),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
