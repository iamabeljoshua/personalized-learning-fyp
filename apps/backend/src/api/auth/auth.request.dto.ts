import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /**
   * Student email address
   * @example "student@example.com"
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Password (minimum 6 characters)
   * @example "password123"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  /**
   * Student email address
   * @example "student@example.com"
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Password
   * @example "password123"
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
