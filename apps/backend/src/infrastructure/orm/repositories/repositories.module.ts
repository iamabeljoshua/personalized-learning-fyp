import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from '../entities/student.entity';
import { StudentProfileEntity } from '../entities/student-profile.entity';
import { StudentRepository } from './student.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentEntity,
      StudentProfileEntity,
    ]),
  ],
  providers: [StudentRepository],
  exports: [StudentRepository],
})
export class RepositoriesModule {}
