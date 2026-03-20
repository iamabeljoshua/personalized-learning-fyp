import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/orm/repositories/repositories.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
