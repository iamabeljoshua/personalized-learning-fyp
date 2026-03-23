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
    // Delete the full dependency chain in reverse order
    // goal → outlines → nodes → (content_items, quizzes → questions/attempts, kt_traces)
    await this.dataSource.transaction(async (manager) => {
      // Get all outline IDs for this goal
      const outlines = await manager.find(OutlineEntity, { where: { goal_id: id }, relations: ['nodes'] });
      const nodeIds = outlines.flatMap((o) => o.nodes.map((n) => n.id));

      if (nodeIds.length > 0) {
        // Delete quiz-related data (attempts → questions → quizzes)
        await manager.query(
          `DELETE FROM quiz_attempts WHERE quiz_id IN (SELECT id FROM quizzes WHERE node_id = ANY($1))`,
          [nodeIds],
        );
        await manager.query(
          `DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE node_id = ANY($1))`,
          [nodeIds],
        );
        await manager.query(`DELETE FROM quizzes WHERE node_id = ANY($1)`, [nodeIds]);

        // Delete knowledge traces
        await manager.query(`DELETE FROM knowledge_traces WHERE node_id = ANY($1)`, [nodeIds]);

        // Delete content items
        await manager.query(`DELETE FROM content_items WHERE node_id = ANY($1)`, [nodeIds]);

        // Delete outline nodes
        await manager.query(`DELETE FROM outline_nodes WHERE id = ANY($1)`, [nodeIds]);
      }

      // Delete outlines
      await manager.query(`DELETE FROM outlines WHERE goal_id = $1`, [id]);

      // Delete documents + embeddings (already has CASCADE but be explicit)
      await manager.query(`DELETE FROM document_embeddings WHERE goal_id = $1`, [id]);
      await manager.query(`DELETE FROM documents WHERE goal_id = $1`, [id]);

      // Finally delete the goal
      await manager.query(`DELETE FROM learning_goals WHERE id = $1`, [id]);
    });
  }
}
