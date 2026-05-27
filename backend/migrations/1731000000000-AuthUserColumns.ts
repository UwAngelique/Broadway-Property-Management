import { MigrationInterface, QueryRunner } from 'typeorm';

/** Password reset, refresh token, and language columns for production DBs without synchronize. */
export class AuthUserColumns1731000000000 implements MigrationInterface {
  name = 'AuthUserColumns1731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenHash" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiresAt" timestamp;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" varchar(5) DEFAULT 'EN';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "language";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordResetTokenExpiresAt";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordResetTokenHash";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshTokenHash";
    `);
  }
}
