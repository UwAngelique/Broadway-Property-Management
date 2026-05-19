/**
 * Seeds platform + demo landlord + tenant, property, unit, contract placeholder, tax row.
 * Requires TypeORM tables (run API once with synchronize or migrations).
 *
 *   cd backend && node scripts/seed-demo-staging.js
 */
require('dotenv').config();
const { Client } = require('pg');
const { hash } = require('bcrypt-ts');

const DEMO_PASSWORD = 'Demo2026!';

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'broadway_pm',
  });
  await client.connect();
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  await client.query(
    `INSERT INTO accounts (id, name, kind, "isActive", "activationStatus", currency, "createdAt", "updatedAt")
     VALUES (1, 'Broadway Platform', 'PLATFORM', true, 'ACTIVE', 'RWF', NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET name = 'Broadway Platform', kind = 'PLATFORM', "activationStatus" = 'ACTIVE'`,
  );

  const landlord = await client.query(
    `INSERT INTO accounts (name, kind, "parentAccountId", "isActive", "activationStatus", currency, "createdAt", "updatedAt")
     VALUES ('Kigali Demo Portfolio', 'LANDLORD', 1, true, 'ACTIVE', 'RWF', NOW(), NOW())
     ON CONFLICT DO NOTHING
     RETURNING id`,
  );
  let landlordId = landlord.rows[0]?.id;
  if (!landlordId) {
    const r = await client.query(`SELECT id FROM accounts WHERE name = 'Kigali Demo Portfolio' LIMIT 1`);
    landlordId = r.rows[0].id;
  }

  // Keep demo users on the same workspace account as owner (avoids orphan tenant profiles).
  const ownerRow = await client.query(`SELECT "accountId" FROM users WHERE email = 'owner@demo-landlord.rw' LIMIT 1`);
  if (ownerRow.rows[0]?.accountId) {
    landlordId = ownerRow.rows[0].accountId;
  }

  async function upsertUser(email, role, accountId) {
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length) return existing.rows[0].id;
    const ins = await client.query(
      `INSERT INTO users (email, "passwordHash", role, language, "isActive", "accountId", "authProvider", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'EN', true, $4, 'LOCAL', NOW(), NOW()) RETURNING id`,
      [email, passwordHash, role, accountId],
    );
    return ins.rows[0].id;
  }

  await upsertUser('platform@broadway.demo', 'PLATFORM_OWNER', 1);
  const ownerId = await upsertUser('owner@demo-landlord.rw', 'OWNER', landlordId);
  const tenantUserId = await upsertUser('tenant@demo-landlord.rw', 'TENANT', landlordId);

  const building = await client.query(
    `INSERT INTO buildings (name, address, upi, "propertyKind", "usageType", "accountId", "createdAt", "updatedAt")
     VALUES ('KN 4 Ave Commercial Block', 'Kigali', '12345/01/01/01/123', 'BUILDING', 'COMMERCIAL', $1, NOW(), NOW())
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [landlordId],
  );
  let buildingId = building.rows[0]?.id;
  if (!buildingId) {
    const r = await client.query(`SELECT id FROM buildings WHERE "accountId" = $1 LIMIT 1`, [landlordId]);
    buildingId = r.rows[0]?.id;
  }

  let unitId;
  if (buildingId) {
    const unit = await client.query(
      `INSERT INTO units ("unitName", floor, "buildingId", "accountId", "createdAt", "updatedAt")
       VALUES ('Shop 1A', 'G', $1, $2, NOW(), NOW())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [buildingId, landlordId],
    );
    unitId = unit.rows[0]?.id;
    if (!unitId) {
      const r = await client.query(`SELECT id FROM units WHERE "accountId" = $1 LIMIT 1`, [landlordId]);
      unitId = r.rows[0]?.id;
    }
  }

  if (!unitId) {
    console.warn('No unit created — skipping tenant profile and contract seed.');
    await client.end();
    console.log('Partial demo seed (users only).');
    console.log('  platform@broadway.demo /', DEMO_PASSWORD);
    console.log('  owner@demo-landlord.rw /', DEMO_PASSWORD);
    process.exit(0);
  }

  let profileId;
  const existingProfile = await client.query(
    `SELECT id FROM tenant_profiles WHERE "userId" = $1 AND "accountId" = $2 LIMIT 1`,
    [tenantUserId, landlordId],
  );
  profileId = existingProfile.rows[0]?.id;
  if (!profileId) {
    const profile = await client.query(
      `INSERT INTO tenant_profiles ("accountId", "userId", "unitId", "fullName", "companyName", "businessSector", "tinNumber", phone, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'Demo Tenant', 'Demo Tenant Ltd', 'Retail', '123456789', '+250788000001', NOW(), NOW())
       RETURNING id`,
      [landlordId, tenantUserId, unitId],
    );
    profileId = profile.rows[0]?.id;
  }

  if (profileId) {
    let contractId;
    const existingContract = await client.query(
      `SELECT id FROM contracts WHERE "accountId" = $1 AND "tenantId" = $2 LIMIT 1`,
      [landlordId, profileId],
    );
    contractId = existingContract.rows[0]?.id;
    if (!contractId) {
      const contractRes = await client.query(
        `INSERT INTO contracts ("accountId", "tenantId", status, "isApproved", "currentVersionNumber", "createdAt", "updatedAt")
         VALUES ($1, $2, 'ACTIVE', true, 1, NOW(), NOW())
         RETURNING id`,
        [landlordId, profileId],
      );
      contractId = contractRes.rows[0]?.id;
    }
    if (contractId) {
      const year = new Date().getFullYear();
      await client.query(
        `INSERT INTO contract_versions (
          "accountId", "contractId", "versionNumber", "filePath", "uploadedByRole",
          "startDate", "endDate", "rentAmountRwf", "paymentFrequency", "dueDayOfMonth",
          "reminderDaysBeforeEnd", "automationEnabled", "autoInvoice", "autoIncrement", "autoDisableOnEnd",
          "createdAt"
        )
        SELECT $1, $2, 1, './uploads/contracts/demo-lease.pdf', 'OWNER',
          ($3::text || '-01-01')::date, ($3::text || '-12-31')::date, 500000, 'MONTHLY', 5,
          60, false, false, false, true, NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM contract_versions WHERE "contractId" = $2 AND "versionNumber" = 1
        )`,
        [landlordId, contractId, String(year)],
      );
    }
  }

  await client.query(
    `INSERT INTO tax_obligations ("accountId", "taxType", title, "periodKey", status, "amountDueRwf", "createdAt", "updatedAt")
     VALUES ($1, 'VAT', 'VAT Q1 2026 (tracker)', '2026-Q1', 'PLANNED', 150000, NOW(), NOW())
     ON CONFLICT DO NOTHING`,
    [landlordId],
  );

  await client.end();
  // Align tenant profile to owner workspace (fixes accountId drift from older seeds).
  require('child_process').execSync('node scripts/fix-tenant-account.js', { stdio: 'inherit', cwd: __dirname + '/..' });
  require('child_process').execSync('node scripts/fix-demo-contract.js', { stdio: 'inherit', cwd: __dirname + '/..' });
  console.log('Demo seed complete.');
  console.log('  platform@broadway.demo /', DEMO_PASSWORD);
  console.log('  owner@demo-landlord.rw /', DEMO_PASSWORD);
  console.log('  tenant@demo-landlord.rw /', DEMO_PASSWORD);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
