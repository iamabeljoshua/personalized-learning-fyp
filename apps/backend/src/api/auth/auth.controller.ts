import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Register a new student account */
  @Post('register')
  register() {
    return { message: 'not implemented' };
  }

  /** Login and receive a JWT token */
  @Post('login')
  login() {
    return { message: 'not implemented' };
  }

  /** Get the current authenticated user */
  @Get('me')
  me() {
    return { message: 'not implemented' };
  }
}
