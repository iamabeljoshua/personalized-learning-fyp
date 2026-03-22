import { IsArray, IsInt } from 'class-validator';

export class SubmitAttemptDto {
  @IsArray()
  @IsInt({ each: true })
  answers: number[];
}
