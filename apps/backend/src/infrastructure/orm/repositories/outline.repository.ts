import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, DataSource } from 'typeorm';
import { OutlineEntity } from '../entities/outline.entity';
import { OutlineNodeEntity } from '../entities/outline-node.entity';
import { ContentItemEntity } from '../entities/content-item.entity';

@Injectable()
export class OutlineRepository {
  constructor(
    @InjectRepository(OutlineEntity)
    private readonly outlineRepo: Repository<OutlineEntity>,
    @InjectRepository(OutlineNodeEntity)
    private readonly nodeRepo: Repository<OutlineNodeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(where: FindOptionsWhere<OutlineEntity>) {
    return this.outlineRepo.findOne({
      where,
      relations: ['nodes'],
      order: { nodes: { order: 'ASC' } },
    });
  }

  async findById(id: string) {
    return this.outlineRepo.findOne({ where: { id } });
  }

  async findNodeById(nodeId: string) {
    return this.nodeRepo.findOne({ where: { id: nodeId } });
  }

  /**
   * Insert supplementary nodes into the existing outline after the failing node.
   */
  async insertAdaptationNodes({
    outline,
    failingNodeOrder,
    newNodes,
  }: {
    outline: OutlineEntity;
    failingNodeOrder: number;
    newNodes: { title: string; type: string }[];
  }): Promise<{ newNodeIds: string[] }> {
    return this.dataSource.transaction(async (manager) => {
      const newNodeIds: string[] = [];

      // Shift existing nodes that come after the failing node
      const nodesAfter = outline.nodes.filter((n) => n.order > failingNodeOrder);
      const shiftAmount = newNodes.length;

      for (const node of nodesAfter) {
        await manager.update(OutlineNodeEntity, node.id, {
          order: node.order + shiftAmount,
        });
      }

      // Insert new nodes right after the failing node
      for (let i = 0; i < newNodes.length; i++) {
        const inserted = manager.create(OutlineNodeEntity, {
          outline_id: outline.id,
          title: newNodes[i].title,
          type: newNodes[i].type,
          order: failingNodeOrder + 1 + i,
        });
        const saved = await manager.save(inserted);
        newNodeIds.push(saved.id);

        // Create pending content item
        const contentItem = manager.create(ContentItemEntity, {
          node_id: saved.id,
        });
        await manager.save(contentItem);
      }

      return { newNodeIds };
    });
  }
}
