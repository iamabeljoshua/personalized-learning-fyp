import { StudentEntity } from '../../infrastructure/orm/entities/student.entity';
import { StudentProfileEntity } from '../../infrastructure/orm/entities/student-profile.entity';

export class StudentProfileResponseDto {
  /** @example "visual" */
  learningStyle: string;

  /** @example "moderate" */
  pace: string;

  /** @example "undergraduate" */
  educationLevel: string;

  /** @example "fluent" */
  languageProficiency: string;

  /** @example ["football", "music"] */
  interests: string[];

  /** @example "I learn best with real-world examples" */
  personalContext: string | null;

  public static fromEntity(entity: StudentProfileEntity) {
    return {
      learningStyle: entity.learning_style,
      pace: entity.pace,
      educationLevel: entity.education_level,
      languageProficiency: entity.language_proficiency,
      interests: entity.interests,
      personalContext: entity.personal_context,
    };
  }
}

export class StudentResponseDto {
  /** @example "550e8400-e29b-41d4-a716-446655440000" */
  id: string;

  /** @example "student@example.com" */
  email: string;

  /** @example false */
  isOnboarded: boolean;

  /** @example "2026-03-20T12:00:00.000Z" */
  createdAt: Date;

  /** @example "2026-03-20T12:00:00.000Z" */
  updatedAt: Date;

  profile: StudentProfileResponseDto | null;

  public static fromEntity(entity: StudentEntity) {
    return {
      id: entity.id,
      email: entity.email,
      isOnboarded: entity.is_onboarded,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      profile: entity.profile
        ? StudentProfileResponseDto.fromEntity(entity.profile)
        : null,
    };
  }
}

export class AuthResponseDto {
  /** @example "eyJhbGciOiJSUzI1NiIs..." */
  accessToken: string;

  user: StudentResponseDto;

  public static from(accessToken: string, student: StudentEntity) {
    return {
      accessToken,
      user: StudentResponseDto.fromEntity(student),
    };
  }
}
