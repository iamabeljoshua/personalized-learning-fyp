import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { SubmitAttemptDto } from './quizzes.request.dto';
import { QuizResponseDto, AttemptResultDto } from './quizzes.response.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SessionUser } from '../../common/decorators/current-user.decorator';

@ApiTags('quizzes')
@Controller('quizzes')
@UseGuards(AuthenticationGuard)
@ApiBearerAuth()
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get(':nodeId')
  @ApiOkResponse({ type: QuizResponseDto, description: 'Quiz for the node' })
  @ApiNotFoundResponse({ description: 'Node not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async getQuiz(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: SessionUser,
  ) {
    const quiz = await this.quizzesService.getOrGenerate(nodeId, user.sub);
    return QuizResponseDto.fromEntity(quiz);
  }

  @Post(':nodeId/attempt')
  @ApiCreatedResponse({ type: AttemptResultDto, description: 'Quiz attempt result' })
  @ApiNotFoundResponse({ description: 'Quiz not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async submitAttempt(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: SubmitAttemptDto,
  ) {
    const result = await this.quizzesService.submitAttempt(nodeId, user.sub, dto.answers);
    return AttemptResultDto.from(result);
  }
}
