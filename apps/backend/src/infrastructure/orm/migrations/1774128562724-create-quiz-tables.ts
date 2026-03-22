import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuizTables1774128562724 implements MigrationInterface {
    name = 'CreateQuizTables1774128562724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quiz_id" uuid NOT NULL, "question_text" text NOT NULL, "options" jsonb NOT NULL, "correct_index" integer NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "node_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_29fbdac52ca9f52f2559a28d071" UNIQUE ("node_id"), CONSTRAINT "REL_29fbdac52ca9f52f2559a28d07" UNIQUE ("node_id"), CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quiz_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quiz_id" uuid NOT NULL, "student_id" uuid NOT NULL, "score" integer NOT NULL, "total" integer NOT NULL, "answers" jsonb NOT NULL, "submitted_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a84a93fb092359516dc5b325b90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "knowledge_traces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "node_id" character varying NOT NULL, "student_id" character varying NOT NULL, "p_known" double precision NOT NULL DEFAULT '0.3', "p_learn" double precision NOT NULL DEFAULT '0.2', "p_guess" double precision NOT NULL DEFAULT '0.25', "p_slip" double precision NOT NULL DEFAULT '0.1', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4122e79c36bed10297c1bb40522" UNIQUE ("node_id", "student_id"), CONSTRAINT "PK_e3dc49d8ecbdd38199191a4a447" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_46b3c125e02f7242662e4ccb307" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_29fbdac52ca9f52f2559a28d071" FOREIGN KEY ("node_id") REFERENCES "outline_nodes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_a720e260138b64fcff2fca19b2d" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_fcb54da39fa07acef996f75f32d" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_fcb54da39fa07acef996f75f32d"`);
        await queryRunner.query(`ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_a720e260138b64fcff2fca19b2d"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT "FK_29fbdac52ca9f52f2559a28d071"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_46b3c125e02f7242662e4ccb307"`);
        await queryRunner.query(`DROP TABLE "knowledge_traces"`);
        await queryRunner.query(`DROP TABLE "quiz_attempts"`);
        await queryRunner.query(`DROP TABLE "quizzes"`);
        await queryRunner.query(`DROP TABLE "questions"`);
    }

}
