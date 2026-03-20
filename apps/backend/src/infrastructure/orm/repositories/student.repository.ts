import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { StudentProfileEntity } from '../entities/student-profile.entity';
import { UpdateOf } from '../../../shared/types';

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepo: Repository<StudentEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly profileRepo: Repository<StudentProfileEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string) {
    return this.studentRepo.findOne({ where: { id } });
  }

  async findByIdWithProfile(id: string) {
    return this.studentRepo.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async findByEmail(email: string) {
    return this.studentRepo.findOne({ where: { email } });
  }

  async createStudent(data: { email: string; password: string }) {
    const student = this.studentRepo.create(data);
    return this.studentRepo.save(student);
  }

  async findProfile(student_id: string) {
    return this.profileRepo.findOne({ where: { student_id } });
  }

  async onboardStudent(
    studentId: string,
    profileData: {
      student_id: string;
      learning_style: string;
      pace: string;
      education_level: string;
      language_proficiency: string;
      interests: string[];
      personal_context: string | null;
    },
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const profile = queryRunner.manager.create(StudentProfileEntity, profileData);
      const saved = await queryRunner.manager.save(profile);
      await queryRunner.manager.update(StudentEntity, studentId, { is_onboarded: true });
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProfile(
    student_id: string,
    data: UpdateOf<StudentProfileEntity>,
  ) {
    await this.profileRepo.update({ student_id }, data);
    return this.profileRepo.findOne({ where: { student_id } });
  }
}
