import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LearningGoalEntity } from '../entities/learning-goal.entity';
import { OutlineEntity } from '../entities/outline.entity';
import { OutlineNodeEntity } from '../entities/outline-node.entity';
import { ContentItemEntity } from '../entities/content-item.entity';

@Injectable()
export class GoalRepository {
  constructor(
    @InjectRepository(LearningGoalEntity)
    private readonly goalRepo: Repository<LearningGoalEntity>,
    private readonly dataSource: DataSource,
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

  async createWithOutline({ goalData, outlineNodes }: {
    goalData: {
      student_id: string;
      topic: string;
      motivation: string;
      preferred_explanation_style: string;
      prior_knowledge: string | null;
    };
    outlineNodes: { title: string; type: string; order: number }[];
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const goal = queryRunner.manager.create(LearningGoalEntity, goalData);
      const savedGoal = await queryRunner.manager.save(goal);

      const outline = queryRunner.manager.create(OutlineEntity, {
        goal_id: savedGoal.id,
        version: 1,
        is_active: true,
      });
      const savedOutline = await queryRunner.manager.save(outline);

      const nodes = outlineNodes.map((node) =>
        queryRunner.manager.create(OutlineNodeEntity, {
          outline_id: savedOutline.id,
          title: node.title,
          type: node.type,
          order: node.order,
        }),
      );
      const savedNodes = await queryRunner.manager.save(nodes);

      // Create pending content items for each node
      const contentItems = savedNodes.map((node) =>
        queryRunner.manager.create(ContentItemEntity, {
          node_id: node.id,
          status: 'pending',
        }),
      );
      await queryRunner.manager.save(contentItems);

      await queryRunner.commitTransaction();
      return {
        goal: savedGoal,
        nodeIds: savedNodes.map((n) => n.id),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
