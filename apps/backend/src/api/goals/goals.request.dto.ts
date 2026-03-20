import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const MOTIVATIONS = ['career', 'academic', 'curiosity', 'exam_prep'] as const;
const EXPLANATION_STYLES = ['eli5', 'conceptual', 'technical', 'example_heavy'] as const;

export class CreateGoalDto {
  /**
   * The topic the student wants to learn
   * @example "Quantum Physics"
   */
  @IsString()
  @IsNotEmpty()
  topic: string;

  /**
   * Why the student wants to learn this topic
   * @example "academic"
   */
  @IsIn(MOTIVATIONS)
  @IsNotEmpty()
  motivation: string;

  /**
   * How the student prefers explanations for this topic
   * @example "conceptual"
   */
  @IsIn(EXPLANATION_STYLES)
  @IsNotEmpty()
  preferredExplanationStyle: string;

  /**
   * What the student already knows about this topic
   * @example "I know basic algebra and Newton's laws"
   */
  @IsOptional()
  @IsString()
  priorKnowledge?: string;
}
