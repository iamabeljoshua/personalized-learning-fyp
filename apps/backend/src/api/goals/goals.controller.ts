import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
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
    const goal = await this.goalsService.create(user.sub, dto);
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
}
