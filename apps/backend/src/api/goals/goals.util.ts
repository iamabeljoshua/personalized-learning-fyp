import { StudentProfileEntity } from '../../infrastructure/orm/entities/student-profile.entity';
import { StudentContext } from '../../services/ai-client/ai-client.types';

export function buildStudentContext({ profile, goal }: {
  profile: StudentProfileEntity;
  goal: {
    motivation: string;
    preferred_explanation_style: string;
    prior_knowledge: string | null;
  };
}): StudentContext {
  return {
    learning_style: profile.learning_style ?? 'visual',
    pace: profile.pace ?? 'moderate',
    education_level: profile.education_level ?? 'undergraduate',
    language_proficiency: profile.language_proficiency ?? 'fluent',
    interests: profile.interests ?? [],
    personal_context: profile.personal_context ?? null,
    motivation: goal.motivation,
    preferred_explanation_style: goal.preferred_explanation_style,
    prior_knowledge: goal.prior_knowledge,
  };
}
