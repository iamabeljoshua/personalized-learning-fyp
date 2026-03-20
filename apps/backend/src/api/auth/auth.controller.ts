import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.request.dto';
import { AuthResponseDto, StudentResponseDto } from './auth.response.dto';
import { AuthenticationGuard } from './authentication.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SessionUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Register a new student account */
  @Post('register')
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'Student registered successfully',
  })
  @ApiConflictResponse({ description: 'Email already registered' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async register(@Body() dto: RegisterDto) {
    const { token, student } = await this.authService.register(dto);
    return AuthResponseDto.from(token, student);
  }

  /** Login and receive a JWT token */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Successful authentication',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async login(@Body() dto: LoginDto) {
    const { token, student } = await this.authService.login(dto);
    return AuthResponseDto.from(token, student);
  }

  /** Get the current authenticated user with profile */
  @Get('me')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: StudentResponseDto,
    description: 'Current authenticated student with profile',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async me(@CurrentUser() user: SessionUser) {
    const student = await this.authService.getProfile(user.sub);
    return StudentResponseDto.fromEntity(student);
  }
}
