import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StudentRepository } from '../../infrastructure/orm/repositories/student.repository';
import { OnboardDto, UpdateProfileDto } from './students.request.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly studentRepository: StudentRepository) {}

  async onboard(studentId: string, dto: OnboardDto) {
    const existing = await this.studentRepository.findProfile(studentId);
    if (existing) {
      throw new ConflictException('Student is already onboarded');
    }

    return this.studentRepository.onboardStudent(studentId, {
      student_id: studentId,
      learning_style: dto.learningStyle,
      pace: dto.pace,
      education_level: dto.educationLevel,
      language_proficiency: dto.languageProficiency,
      interests: dto.interests,
      personal_context: dto.personalContext ?? null,
    });
  }

  async getProfile(studentId: string) {
    const profile = await this.studentRepository.findProfile(studentId);
    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Complete onboarding first.',
      );
    }
    return profile;
  }

  async updateProfile(studentId: string, dto: UpdateProfileDto) {
    const existing = await this.studentRepository.findProfile(studentId);
    if (!existing) {
      throw new NotFoundException(
        'Profile not found. Complete onboarding first.',
      );
    }

    const updated = await this.studentRepository.updateProfile(studentId, {
      learning_style: dto.learningStyle,
      pace: dto.pace,
      education_level: dto.educationLevel,
      language_proficiency: dto.languageProficiency,
      interests: dto.interests,
      personal_context: dto.personalContext,
    });
    return updated!;
  }
}
