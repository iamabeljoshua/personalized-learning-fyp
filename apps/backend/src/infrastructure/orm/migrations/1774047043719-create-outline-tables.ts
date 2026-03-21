import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOutlineTables1774047043719 implements MigrationInterface {
    name = 'CreateOutlineTables1774047043719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outline_nodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "outline_id" uuid NOT NULL, "title" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'concept', "order" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ab14e358f6fb4164cded7f0821e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "outlines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "goal_id" uuid NOT NULL, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_046e85ab2aa7431633dfb154eb6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "outline_nodes" ADD CONSTRAINT "FK_097f40455ce77e3987b1e626858" FOREIGN KEY ("outline_id") REFERENCES "outlines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outlines" ADD CONSTRAINT "FK_3bad23d31dcf541d1edeb7a9479" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outlines" DROP CONSTRAINT "FK_3bad23d31dcf541d1edeb7a9479"`);
        await queryRunner.query(`ALTER TABLE "outline_nodes" DROP CONSTRAINT "FK_097f40455ce77e3987b1e626858"`);
        await queryRunner.query(`DROP TABLE "outlines"`);
        await queryRunner.query(`DROP TABLE "outline_nodes"`);
    }

}
