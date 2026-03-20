import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoalRepository } from '../../infrastructure/orm/repositories/goal.repository';
import { CreateGoalDto } from './goals.request.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly goalRepository: GoalRepository) {}

  async list(studentId: string) {
    return this.goalRepository.findByStudentId(studentId);
  }

  async create(studentId: string, dto: CreateGoalDto) {
    return this.goalRepository.create({
      student_id: studentId,
      topic: dto.topic,
      motivation: dto.motivation,
      preferred_explanation_style: dto.preferredExplanationStyle,
      prior_knowledge: dto.priorKnowledge ?? null,
    });
  }

  async findOne({ studentId, goalId }: { studentId: string; goalId: string }) {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new NotFoundException('Learning goal not found');
    }
    if (goal.student_id !== studentId) {
      throw new ForbiddenException('You do not have access to this goal');
    }
    return goal;
  }

  async remove({ studentId, goalId }: { studentId: string; goalId: string }) {
    const goal = await this.findOne({ studentId, goalId });
    await this.goalRepository.remove(goal.id);
  }
}
