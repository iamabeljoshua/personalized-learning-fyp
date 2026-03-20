import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  /** List all learning goals for the current student */
  @Get()
  list() {
    return { message: 'not implemented' };
  }

  /** Create a new learning goal */
  @Post()
  create() {
    return { message: 'not implemented' };
  }

  /** Get a specific learning goal with its active outline */
  @Get(':goalId')
  findOne(@Param('goalId') goalId: string) {
    return { message: 'not implemented' };
  }

  /** Delete a learning goal */
  @Delete(':goalId')
  remove(@Param('goalId') goalId: string) {
    return { message: 'not implemented' };
  }
}
