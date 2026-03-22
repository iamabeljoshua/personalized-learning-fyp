import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { KnowledgeTraceEntity } from '../entities/knowledge-trace.entity';

@Injectable()
export class KnowledgeTraceRepository {
  constructor(
    @InjectRepository(KnowledgeTraceEntity)
    private readonly ktRepo: Repository<KnowledgeTraceEntity>,
  ) {}

  async findByNodeAndStudent(nodeId: string, studentId: string) {
    return this.ktRepo.findOne({
      where: { node_id: nodeId, student_id: studentId },
    });
  }

  async findByNodeIdsAndStudent(nodeIds: string[], studentId: string) {
    if (nodeIds.length === 0) return [];
    return this.ktRepo.find({
      where: { node_id: In(nodeIds), student_id: studentId },
    });
  }

  async upsert(
    nodeId: string,
    studentId: string,
    state: { p_known: number; p_learn: number; p_guess: number; p_slip: number },
  ) {
    const existing = await this.findByNodeAndStudent(nodeId, studentId);
    if (existing) {
      await this.ktRepo.update(existing.id, state);
      return { ...existing, ...state };
    }
    const trace = this.ktRepo.create({
      node_id: nodeId,
      student_id: studentId,
      ...state,
    });
    return this.ktRepo.save(trace);
  }
}
