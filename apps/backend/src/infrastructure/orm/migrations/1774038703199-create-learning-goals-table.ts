import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLearningGoalsTable1774038703199 implements MigrationInterface {
    name = 'CreateLearningGoalsTable1774038703199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "learning_goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "topic" character varying NOT NULL, "motivation" character varying NOT NULL, "preferred_explanation_style" character varying NOT NULL, "prior_knowledge" text, "status" character varying NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_121bd4bc8ea1927ce632831bca5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "learning_goals" ADD CONSTRAINT "FK_13d831e2e699a73a92e5d886dd6" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "learning_goals" DROP CONSTRAINT "FK_13d831e2e699a73a92e5d886dd6"`);
        await queryRunner.query(`DROP TABLE "learning_goals"`);
    }

}
