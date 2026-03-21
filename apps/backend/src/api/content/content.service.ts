import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from '../../infrastructure/orm/repositories/content.repository';

@Injectable()
export class ContentService {
  constructor(private readonly contentRepository: ContentRepository) {}

  async getByNodeId(nodeId: string) {
    const content = await this.contentRepository.findByNodeId(nodeId);
    if (!content) {
      throw new NotFoundException('Content not found for this node');
    }
    return content;
  }
}
