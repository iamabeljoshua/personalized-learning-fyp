import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStudentTables1774032354024 implements MigrationInterface {
    name = 'CreateStudentTables1774032354024'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "student_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "learning_style" character varying NOT NULL, "pace" character varying NOT NULL, "education_level" character varying NOT NULL, "language_proficiency" character varying NOT NULL, "interests" text array NOT NULL DEFAULT '{}', "personal_context" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4cedc08d3dc1f2c2da8a12f7a88" UNIQUE ("student_id"), CONSTRAINT "REL_4cedc08d3dc1f2c2da8a12f7a8" UNIQUE ("student_id"), CONSTRAINT "PK_5ed0a32eeaddfe812fb326177d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "is_onboarded" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_25985d58c714a4a427ced57507b" UNIQUE ("email"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_4cedc08d3dc1f2c2da8a12f7a88" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_4cedc08d3dc1f2c2da8a12f7a88"`);
        await queryRunner.query(`DROP TABLE "students"`);
        await queryRunner.query(`DROP TABLE "student_profiles"`);
    }

}
