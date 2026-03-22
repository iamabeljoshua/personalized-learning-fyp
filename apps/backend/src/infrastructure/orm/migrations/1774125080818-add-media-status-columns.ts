import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaStatusColumns1774125080818 implements MigrationInterface {
    name = 'AddMediaStatusColumns1774125080818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_items" ADD "text_status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "content_items" ADD "audio_status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "content_items" ADD "video_status" character varying NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_items" DROP COLUMN "video_status"`);
        await queryRunner.query(`ALTER TABLE "content_items" DROP COLUMN "audio_status"`);
        await queryRunner.query(`ALTER TABLE "content_items" DROP COLUMN "text_status"`);
    }

}
