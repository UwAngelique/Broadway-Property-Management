import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline migration for production (DB_SYNCHRONIZE=false).
 * Run: npm run migration:run
 */
export class ProductionBaseline1730000000000 implements MigrationInterface {
  name = 'ProductionBaseline1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(20);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerified" boolean DEFAULT false;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mobileNetwork" varchar(20);
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL;

      ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(255);
      ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" varchar(255);
      ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "subscriptionStatus" varchar(30) DEFAULT 'inactive';
      ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "subscriptionCurrentPeriodEnd" timestamp;

      CREATE TABLE IF NOT EXISTS "otp_verifications" (
        "id" SERIAL PRIMARY KEY,
        "phone" varchar(20) NOT NULL,
        "codeHash" text NOT NULL,
        "purpose" varchar(30) NOT NULL DEFAULT 'LOGIN',
        "expiresAt" timestamp NOT NULL,
        "attempts" int NOT NULL DEFAULT 0,
        "verified" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_otp_phone" ON "otp_verifications" ("phone", "purpose");

      CREATE TABLE IF NOT EXISTS "notification_deliveries" (
        "id" SERIAL PRIMARY KEY,
        "accountId" int NOT NULL,
        "channel" varchar(20) NOT NULL,
        "recipient" varchar(255) NOT NULL,
        "subject" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "scheduledAt" timestamp NOT NULL,
        "sentAt" timestamp,
        "errorMessage" text,
        "metadata" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_notification_scheduled" ON "notification_deliveries" ("status", "scheduledAt");

      CREATE TABLE IF NOT EXISTS "bank_statements" (
        "id" SERIAL PRIMARY KEY,
        "accountId" int NOT NULL,
        "filePath" text NOT NULL,
        "originalName" varchar(255),
        "periodStart" date,
        "periodEnd" date,
        "parsedText" text,
        "uploadedByUserId" int,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "bank_statement_lines" (
        "id" SERIAL PRIMARY KEY,
        "statementId" int NOT NULL REFERENCES "bank_statements"("id") ON DELETE CASCADE,
        "accountId" int NOT NULL,
        "txnDate" date,
        "amountRwf" numeric(14,2),
        "reference" varchar(255),
        "description" text,
        "matchedPaymentId" int,
        "matchScore" numeric(5,2),
        "matchStatus" varchar(20) DEFAULT 'UNMATCHED',
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "bank_statement_lines";
      DROP TABLE IF EXISTS "bank_statements";
      DROP TABLE IF EXISTS "notification_deliveries";
      DROP TABLE IF EXISTS "otp_verifications";
    `);
  }
}
