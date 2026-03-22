import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RepositoriesModule } from '../../infrastructure/orm/repositories/repositories.module';
import { AiClientModule } from '../../services/ai-client/ai-client.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentGenerationProcessor } from './content-generation.processor';
import { AdaptationProcessor } from './adaptation.processor';
import { CONTENT_GENERATION_QUEUE } from './content.constants';
import { ADAPTATION_QUEUE } from './adaptation.constants';

@Module({
  imports: [
    RepositoriesModule,
    AiClientModule,
    BullModule.registerQueue({ name: CONTENT_GENERATION_QUEUE }),
    BullModule.registerQueue({ name: ADAPTATION_QUEUE }),
  ],
  controllers: [ContentController],
  providers: [ContentService, ContentGenerationProcessor, AdaptationProcessor],
  exports: [BullModule],
})
export class ContentModule {}
