/** Ensures demo tenant has contract v1 with rent for payment quote tests. */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DEMO_PDF = path.join(__dirname, '..', 'uploads', 'contracts', 'demo-lease.pdf');
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF\n',
);

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();
  fs.mkdirSync(path.dirname(DEMO_PDF), { recursive: true });
  if (!fs.existsSync(DEMO_PDF)) {
    fs.writeFileSync(DEMO_PDF, MINIMAL_PDF);
    console.log('Created placeholder demo-lease.pdf');
  }
  const profile = await client.query(
    `SELECT tp.id AS "profileId", tp."accountId"
     FROM tenant_profiles tp
     JOIN users u ON u.id = tp."userId"
     WHERE u.email = 'tenant@demo-landlord.rw' LIMIT 1`,
  );
  if (!profile.rows[0]) {
    console.error('Run seed-demo-staging.js first');
    process.exit(1);
  }
  const { profileId, accountId } = profile.rows[0];
  let contract = await client.query(
    `SELECT id FROM contracts WHERE "accountId" = $1 AND "tenantId" = $2 LIMIT 1`,
    [accountId, profileId],
  );
  let contractId = contract.rows[0]?.id;
  if (!contractId) {
    const ins = await client.query(
      `INSERT INTO contracts ("accountId", "tenantId", status, "isApproved", "currentVersionNumber", "createdAt", "updatedAt")
       VALUES ($1, $2, 'ACTIVE', true, 1, NOW(), NOW()) RETURNING id`,
      [accountId, profileId],
    );
    contractId = ins.rows[0].id;
  }
  const year = new Date().getFullYear();
  await client.query(
    `INSERT INTO contract_versions (
      "accountId", "contractId", "versionNumber", "filePath", "uploadedByRole",
      "startDate", "endDate", "rentAmountRwf", "paymentFrequency", "dueDayOfMonth",
      "reminderDaysBeforeEnd", "automationEnabled", "autoInvoice", "autoIncrement", "autoDisableOnEnd", "createdAt"
    )
    SELECT $1, $2, 1, './uploads/contracts/demo-lease.pdf', 'OWNER',
      ($3::text || '-01-01')::date, ($3::text || '-12-31')::date, 500000, 'MONTHLY', 5,
      60, false, false, false, true, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM contract_versions WHERE "contractId" = $2 AND "versionNumber" = 1)`,
    [accountId, contractId, String(year)],
  );
  await client.end();
  console.log('Demo contract ready for contract', contractId);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
