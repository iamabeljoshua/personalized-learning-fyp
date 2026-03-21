import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { OutlineEntity } from '../entities/outline.entity';
import { OutlineNodeEntity } from '../entities/outline-node.entity';

@Injectable()
export class OutlineRepository {
  constructor(
    @InjectRepository(OutlineEntity)
    private readonly outlineRepo: Repository<OutlineEntity>,
    @InjectRepository(OutlineNodeEntity)
    private readonly nodeRepo: Repository<OutlineNodeEntity>,
  ) {}

  async findOne(where: FindOptionsWhere<OutlineEntity>) {
    return this.outlineRepo.findOne({
      where,
      relations: ['nodes'],
      order: { nodes: { order: 'ASC' } },
    });
  }
}
