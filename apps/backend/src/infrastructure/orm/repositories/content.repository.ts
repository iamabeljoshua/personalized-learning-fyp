import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async createPending(node_id: string) {
    const item = this.contentRepo.create({ node_id, status: 'pending' });
    return this.contentRepo.save(item);
  }

  async createPendingBatch(node_ids: string[]) {
    const items = node_ids.map((node_id) =>
      this.contentRepo.create({ node_id, status: 'pending' }),
    );
    return this.contentRepo.save(items);
  }

  async updateStatus({ nodeId, status }: { nodeId: string; status: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { status });
  }

  async updateText({ nodeId, text }: { nodeId: string; text: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { text, status: 'text_ready' });
  }

  async updateAudio({ nodeId, audioUrl }: { nodeId: string; audioUrl: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { audio_url: audioUrl, status: 'audio_ready' });
  }

  async updateVideo({ nodeId, videoUrl }: { nodeId: string; videoUrl: string }) {
    await this.contentRepo.update({ node_id: nodeId }, { video_url: videoUrl, status: 'ready' });
  }
}
