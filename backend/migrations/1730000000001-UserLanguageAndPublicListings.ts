import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds users.language (required by User entity) and public vacancy listings for marketing.
 */
export class UserLanguageAndPublicListings1730000000001 implements MigrationInterface {
  name = 'UserLanguageAndPublicListings1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" varchar(5) NOT NULL DEFAULT 'EN';

      CREATE TABLE IF NOT EXISTS "public_vacancy_listings" (
        "id" SERIAL PRIMARY KEY,
        "accountId" int NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "locationLabel" varchar(200),
        "rentRwf" numeric(14,2),
        "contactPhone" varchar(30),
        "contactEmail" varchar(255),
        "isPublished" boolean NOT NULL DEFAULT true,
        "publishedAt" timestamp NOT NULL DEFAULT now(),
        "expiresAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_public_vacancy_published"
        ON "public_vacancy_listings" ("isPublished", "publishedAt" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public_vacancy_listings";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "language";
    `);
  }
}
