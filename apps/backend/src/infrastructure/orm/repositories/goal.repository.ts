import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningGoalEntity } from '../entities/learning-goal.entity';

@Injectable()
export class GoalRepository {
  constructor(
    @InjectRepository(LearningGoalEntity)
    private readonly goalRepo: Repository<LearningGoalEntity>,
  ) {}

  async findByStudentId(student_id: string) {
    return this.goalRepo.find({
      where: { student_id },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string) {
    return this.goalRepo.findOne({ where: { id } });
  }

  async create(data: {
    student_id: string;
    topic: string;
    motivation: string;
    preferred_explanation_style: string;
    prior_knowledge: string | null;
  }) {
    const goal = this.goalRepo.create(data);
    return this.goalRepo.save(goal);
  }

  async remove(id: string) {
    await this.goalRepo.delete(id);
  }
}
