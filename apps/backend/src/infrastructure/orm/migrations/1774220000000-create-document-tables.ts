import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentTables1774220000000 implements MigrationInterface {
    name = 'CreateDocumentTables1774220000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "goal_id" uuid NOT NULL, "original_filename" character varying NOT NULL, "file_path" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "document_embeddings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "goal_id" uuid NOT NULL, "chunk_index" integer NOT NULL, "chunk_text" text NOT NULL, "embedding" vector(384) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d3c0f17b3e3c3e3f5a3a3a3a3a3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_embeddings_goal" ON "document_embeddings" ("goal_id")`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_goal_id" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_embeddings" ADD CONSTRAINT "FK_embeddings_goal_id" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document_embeddings" DROP CONSTRAINT "FK_embeddings_goal_id"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_goal_id"`);
        await queryRunner.query(`DROP INDEX "idx_embeddings_goal"`);
        await queryRunner.query(`DROP TABLE "document_embeddings"`);
        await queryRunner.query(`DROP TABLE "documents"`);
    }

}
