import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentEmbeddingEntity } from '../entities/document-embedding.entity';

@Injectable()
export class DocumentRepository implements OnModuleInit {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,
    @InjectRepository(DocumentEmbeddingEntity)
    private readonly embeddingRepo: Repository<DocumentEmbeddingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Ensure pgvector extension and proper column type exist
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
      // Add vector column if it doesn't exist (embedding_raw is text fallback)
      await this.dataSource.query(`
        DO $$ BEGIN
          ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS embedding vector(384);
        EXCEPTION WHEN undefined_object THEN
          NULL;
        END $$;
      `);
    } catch (e) {
      // pgvector may not be available in all environments
    }
  }

  async saveDocument(goalId: string, filename: string, filePath: string) {
    const doc = this.docRepo.create({
      goal_id: goalId,
      original_filename: filename,
      file_path: filePath,
    });
    return this.docRepo.save(doc);
  }

  async findDocumentsByGoalId(goalId: string) {
    return this.docRepo.find({ where: { goal_id: goalId } });
  }

  async hasDocuments(goalId: string): Promise<boolean> {
    const count = await this.docRepo.count({ where: { goal_id: goalId } });
    return count > 0;
  }

  async storeEmbeddings(
    goalId: string,
    chunks: string[],
    embeddings: number[][],
  ) {
    // Use raw SQL to insert with pgvector type
    for (let i = 0; i < chunks.length; i++) {
      const vectorStr = `[${embeddings[i].join(',')}]`;
      await this.dataSource.query(
        `INSERT INTO document_embeddings (goal_id, chunk_index, chunk_text, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [goalId, i, chunks[i], vectorStr],
      );
    }
  }

  async findSimilarChunks(
    goalId: string,
    queryEmbedding: number[],
    limit: number = 5,
  ): Promise<string[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    const rows = await this.dataSource.query(
      `SELECT chunk_text
       FROM document_embeddings
       WHERE goal_id = $1
       ORDER BY embedding <-> $2::vector
       LIMIT $3`,
      [goalId, vectorStr, limit],
    );
    return rows.map((r: { chunk_text: string }) => r.chunk_text);
  }

  async deleteByGoalId(goalId: string) {
    await this.embeddingRepo.delete({ goal_id: goalId });
    await this.docRepo.delete({ goal_id: goalId });
  }
}
