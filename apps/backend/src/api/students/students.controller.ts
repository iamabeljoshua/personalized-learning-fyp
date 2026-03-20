import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /** Complete onboarding and create student profile */
  @Post('onboard')
  onboard() {
    return { message: 'not implemented' };
  }

  /** Get current student's profile */
  @Get('profile')
  getProfile() {
    return { message: 'not implemented' };
  }

  /** Update current student's profile */
  @Patch('profile')
  updateProfile() {
    return { message: 'not implemented' };
  }
}
