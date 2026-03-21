import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentItemsTable1774051326969 implements MigrationInterface {
  name = 'CreateContentItemsTable1774051326969';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "content_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "node_id" uuid NOT NULL, "text" text, "audio_url" character varying, "video_url" character varying, "status" character varying NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f2c53fbbab21c1184edfb1e0043" UNIQUE ("node_id"), CONSTRAINT "REL_f2c53fbbab21c1184edfb1e004" UNIQUE ("node_id"), CONSTRAINT "PK_9c6bf4f28851752cee186915e39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_items" ADD CONSTRAINT "FK_f2c53fbbab21c1184edfb1e0043" FOREIGN KEY ("node_id") REFERENCES "outline_nodes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "content_items" DROP CONSTRAINT "FK_f2c53fbbab21c1184edfb1e0043"`,
    );
    await queryRunner.query(`DROP TABLE "content_items"`);
  }
}
