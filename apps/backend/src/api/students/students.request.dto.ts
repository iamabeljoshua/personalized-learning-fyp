import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const LEARNING_STYLES = ['visual', 'auditory', 'reading', 'kinesthetic'] as const;
const PACES = ['slow', 'moderate', 'fast'] as const;
const EDUCATION_LEVELS = ['high_school', 'undergraduate', 'postgraduate', 'professional'] as const;
const LANGUAGE_PROFICIENCIES = ['native', 'fluent', 'intermediate', 'basic'] as const;

export class OnboardDto {
  /**
   * Preferred learning style
   * @example "visual"
   */
  @IsIn(LEARNING_STYLES)
  @IsNotEmpty()
  learningStyle: string;

  /**
   * Learning pace preference
   * @example "moderate"
   */
  @IsIn(PACES)
  @IsNotEmpty()
  pace: string;

  /**
   * Highest education level completed
   * @example "undergraduate"
   */
  @IsIn(EDUCATION_LEVELS)
  @IsNotEmpty()
  educationLevel: string;

  /**
   * Language proficiency level
   * @example "fluent"
   */
  @IsIn(LANGUAGE_PROFICIENCIES)
  @IsNotEmpty()
  languageProficiency: string;

  /**
   * List of interests for personalised analogies
   * @example ["football", "music", "cooking"]
   */
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  interests: string[];

  /**
   * Optional free text about the student
   * @example "I learn best with real-world examples"
   */
  @IsOptional()
  @IsString()
  personalContext?: string;
}

export class UpdateProfileDto {
  /**
   * Preferred learning style
   * @example "auditory"
   */
  @IsOptional()
  @IsIn(LEARNING_STYLES)
  learningStyle?: string;

  /**
   * Learning pace preference
   * @example "fast"
   */
  @IsOptional()
  @IsIn(PACES)
  pace?: string;

  /**
   * Highest education level completed
   * @example "postgraduate"
   */
  @IsOptional()
  @IsIn(EDUCATION_LEVELS)
  educationLevel?: string;

  /**
   * Language proficiency level
   * @example "native"
   */
  @IsOptional()
  @IsIn(LANGUAGE_PROFICIENCIES)
  languageProficiency?: string;

  /**
   * List of interests for personalised analogies
   * @example ["football", "cooking"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  interests?: string[];

  /**
   * Optional free text about the student
   * @example "I prefer step-by-step breakdowns"
   */
  @IsOptional()
  @IsString()
  personalContext?: string;
}
