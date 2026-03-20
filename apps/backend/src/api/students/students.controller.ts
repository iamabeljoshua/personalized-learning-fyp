import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { OnboardDto, UpdateProfileDto } from './students.request.dto';
import { ProfileResponseDto } from './students.response.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SessionUser } from '../../common/decorators/current-user.decorator';

@ApiTags('students')
@Controller('students')
@UseGuards(AuthenticationGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /** Complete onboarding and create student profile */
  @Post('onboard')
  @ApiCreatedResponse({
    type: ProfileResponseDto,
    description: 'Profile created successfully',
  })
  @ApiConflictResponse({ description: 'Student is already onboarded' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async onboard(@CurrentUser() user: SessionUser, @Body() dto: OnboardDto) {
    const profile = await this.studentsService.onboard(user.sub, dto);
    return ProfileResponseDto.fromEntity(profile);
  }

  /** Get current student's profile */
  @Get('profile')
  @ApiOkResponse({
    type: ProfileResponseDto,
    description: 'Student profile',
  })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async getProfile(@CurrentUser() user: SessionUser) {
    const profile = await this.studentsService.getProfile(user.sub);
    return ProfileResponseDto.fromEntity(profile);
  }

  /** Update current student's profile */
  @Patch('profile')
  @ApiOkResponse({
    type: ProfileResponseDto,
    description: 'Profile updated successfully',
  })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async updateProfile(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.studentsService.updateProfile(user.sub, dto);
    return ProfileResponseDto.fromEntity(profile);
  }
}
