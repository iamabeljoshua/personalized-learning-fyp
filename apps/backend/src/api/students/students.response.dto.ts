import { StudentProfileEntity } from '../../infrastructure/orm/entities/student-profile.entity';

export class ProfileResponseDto {
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

  /** @example "2026-03-20T12:00:00.000Z" */
  createdAt: Date;

  /** @example "2026-03-20T12:00:00.000Z" */
  updatedAt: Date;

  public static fromEntity(entity: StudentProfileEntity) {
    return {
      learningStyle: entity.learning_style,
      pace: entity.pace,
      educationLevel: entity.education_level,
      languageProficiency: entity.language_proficiency,
      interests: entity.interests,
      personalContext: entity.personal_context,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
