import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './goals.request.dto';
import { GoalResponseDto, GoalListResponseDto } from './goals.response.dto';
import { OutlineResponseDto } from './outline.response.dto';
import { ProgressResponseDto } from './progress.response.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SessionUser } from '../../common/decorators/current-user.decorator';

@ApiTags('goals')
@Controller('goals')
@UseGuards(AuthenticationGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  /** List all learning goals for the current student */
  @Get()
  @ApiOkResponse({
    type: GoalListResponseDto,
    description: 'List of learning goals',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async list(@CurrentUser() user: SessionUser) {
    const goals = await this.goalsService.list(user.sub);
    return GoalListResponseDto.fromEntities(goals);
  }

  /** Create a new learning goal */
  @Post()
  @ApiCreatedResponse({
    type: GoalResponseDto,
    description: 'Learning goal created',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async create(@CurrentUser() user: SessionUser, @Body() dto: CreateGoalDto) {
    const goal = await this.goalsService.create({ studentId: user.sub, dto });
    return GoalResponseDto.fromEntity(goal);
  }

  /** Get a specific learning goal */
  @Get(':goalId')
  @ApiOkResponse({
    type: GoalResponseDto,
    description: 'Learning goal details',
  })
  @ApiNotFoundResponse({ description: 'Learning goal not found' })
  @ApiForbiddenResponse({ description: 'Goal belongs to another student' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async findOne(
    @CurrentUser() user: SessionUser,
    @Param('goalId') goalId: string,
  ) {
    const goal = await this.goalsService.findOne({studentId: user.sub, goalId});
    return GoalResponseDto.fromEntity(goal);
  }

  /** Get the active outline for a learning goal */
  @Get(':goalId/outline')
  @ApiOkResponse({
    type: OutlineResponseDto,
    description: 'Active outline with nodes',
  })
  @ApiNotFoundResponse({ description: 'Goal or outline not found' })
  @ApiForbiddenResponse({ description: 'Goal belongs to another student' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async getOutline(
    @CurrentUser() user: SessionUser,
    @Param('goalId') goalId: string,
  ) {
    const outline = await this.goalsService.getOutline({ studentId: user.sub, goalId });
    return OutlineResponseDto.fromEntity(outline);
  }

  /** Get progress for a learning goal */
  @Get(':goalId/progress')
  @ApiOkResponse({
    type: ProgressResponseDto,
    description: 'Progress for this goal',
  })
  @ApiNotFoundResponse({ description: 'Goal or outline not found' })
  @ApiForbiddenResponse({ description: 'Goal belongs to another student' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async getProgress(
    @CurrentUser() user: SessionUser,
    @Param('goalId') goalId: string,
  ) {
    const progress = await this.goalsService.getProgress({ studentId: user.sub, goalId });
    return ProgressResponseDto.from(progress);
  }

  /** Delete a learning goal */
  @Delete(':goalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Learning goal deleted' })
  @ApiNotFoundResponse({ description: 'Learning goal not found' })
  @ApiForbiddenResponse({ description: 'Goal belongs to another student' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('goalId') goalId: string,
  ) {
    await this.goalsService.remove({studentId: user.sub, goalId});
  }

  /** Upload a source document for RAG grounding */
  @Post(':goalId/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiCreatedResponse({ description: 'Document uploaded and embedded' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiForbiddenResponse({ description: 'Goal belongs to another student' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async uploadDocument(
    @CurrentUser() user: SessionUser,
    @Param('goalId') goalId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.goalsService.uploadDocument({ studentId: user.sub, goalId, file });
  }
}
