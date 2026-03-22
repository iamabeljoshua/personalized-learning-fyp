import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropStatusColumn1774125673824 implements MigrationInterface {
  name = 'DropStatusColumn1774125673824';

  public async up(queryRunner: QueryRunner): Promise<void> {
    //had to move to a per media status setup to be able to conventially check individual media status, so this sets that up without losing data
    await queryRunner.query(
      `UPDATE "content_items" SET "text_status" = 'failed', "audio_status" = 'skipped', "video_status" = 'skipped' WHERE "status" = 'failed'`,
    );
    await queryRunner.query(
      `UPDATE "content_items" SET "text_status" = 'ready', "audio_status" = 'failed', "video_status" = 'failed' WHERE "status" = 'text_ready'`,
    );
    await queryRunner.query(
      `UPDATE "content_items" SET "text_status" = 'ready', "audio_status" = 'ready', "video_status" = 'failed' WHERE "status" = 'audio_ready'`,
    );
    await queryRunner.query(
      `UPDATE "content_items" SET "text_status" = 'ready', "audio_status" = 'ready', "video_status" = 'ready' WHERE "status" = 'ready'`,
    );
    await queryRunner.query(
      `UPDATE "content_items" SET "text_status" = 'generating' WHERE "status" = 'generating'`,
    );
    await queryRunner.query(`ALTER TABLE "content_items" DROP COLUMN "status"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //this should never be reversed, but if we do, then let's not complicate it and just set status to pending for all items
    await queryRunner.query(
      `ALTER TABLE "content_items" ADD "status" character varying NOT NULL DEFAULT 'pending'`,
    );
  }
}
