import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentItemEntity } from '../entities/content-item.entity';

@Injectable()
export class ContentRepository {
  constructor(
    @InjectRepository(ContentItemEntity)
    private readonly contentRepo: Repository<ContentItemEntity>,
  ) {}

  async findByNodeId(node_id: string) {
    return this.contentRepo.findOne({ where: { node_id } });
  }

  async findByNodeIds(nodeIds: string[]) {
    if (nodeIds.length === 0) return [];
    return this.contentRepo.find({ where: { node_id: In(nodeIds) } });
  }

  async createPending(node_id: string) {
    const item = this.contentRepo.create({ node_id });
    return this.contentRepo.save(item);
  }

  async createPendingBatch(node_ids: string[]) {
    const items = node_ids.map((node_id) => this.contentRepo.create({ node_id }));
    return this.contentRepo.save(items);
  }

  async updateText({ nodeId, text }: { nodeId: string; text: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { text, text_status: 'ready' });
  }

  async updateAudio({ nodeId, audioUrl }: { nodeId: string; audioUrl: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { audio_url: audioUrl, audio_status: 'ready' });
  }

  async updateVideo({ nodeId, videoUrl }: { nodeId: string; videoUrl: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { video_url: videoUrl, video_status: 'ready' });
  }

  async updateMediaStatus({ nodeId, field, status }: { nodeId: string; field: 'text_status' | 'audio_status' | 'video_status'; status: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { [field]: status });
  }
}
