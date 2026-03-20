import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/orm/repositories/repositories.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
