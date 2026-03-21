import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RepositoriesModule } from '../../infrastructure/orm/repositories/repositories.module';
import { AiClientModule } from '../../services/ai-client/ai-client.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { CONTENT_GENERATION_QUEUE } from '../content/content.constants';

@Module({
  imports: [
    RepositoriesModule,
    AiClientModule,
    BullModule.registerQueue({ name: CONTENT_GENERATION_QUEUE }),
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
