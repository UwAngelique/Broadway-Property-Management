/**
 * Aligns demo tenant profile + contracts with the owner's workspace accountId.
 * Run after seed if tenant login shows "profile not found".
 */
require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();

  const owner = await client.query(`SELECT "accountId" FROM users WHERE email = 'owner@demo-landlord.rw' LIMIT 1`);
  const tenant = await client.query(`SELECT id, "accountId" FROM users WHERE email = 'tenant@demo-landlord.rw' LIMIT 1`);
  if (!owner.rows[0] || !tenant.rows[0]) {
    console.error('Run seed-demo-staging.js first');
    process.exit(1);
  }
  const accountId = owner.rows[0].accountId;
  const userId = tenant.rows[0].id;

  if (tenant.rows[0].accountId !== accountId) {
    await client.query(`UPDATE users SET "accountId" = $1 WHERE id = $2`, [accountId, userId]);
  }

  const profiles = await client.query(`SELECT id FROM tenant_profiles WHERE "userId" = $1 ORDER BY id ASC`, [userId]);
  let profileId = profiles.rows[0]?.id;
  if (!profileId) {
    const unit = await client.query(`SELECT id FROM units WHERE "accountId" = $1 LIMIT 1`, [accountId]);
    const unitId = unit.rows[0]?.id;
    if (!unitId) {
      console.error('No unit in workspace — run full seed');
      process.exit(1);
    }
    const ins = await client.query(
      `INSERT INTO tenant_profiles ("accountId", "userId", "unitId", "fullName", "companyName", "businessSector", "tinNumber", phone, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'Demo Tenant', 'Demo Tenant Ltd', 'Retail', '123456789', '+250788000001', NOW(), NOW()) RETURNING id`,
      [accountId, userId, unitId],
    );
    profileId = ins.rows[0].id;
  } else {
    await client.query(`UPDATE tenant_profiles SET "accountId" = $1 WHERE "userId" = $2`, [accountId, userId]);
    await client.query(`DELETE FROM tenant_profiles WHERE "userId" = $1 AND id <> $2`, [userId, profileId]);
  }

  await client.query(`UPDATE contracts SET "accountId" = $1, "tenantId" = $2 WHERE "tenantId" IN (SELECT id FROM tenant_profiles WHERE "userId" = $3)`, [
    accountId,
    profileId,
    userId,
  ]);
  await client.query(`UPDATE contract_versions SET "accountId" = $1 WHERE "contractId" IN (SELECT id FROM contracts WHERE "tenantId" = $2)`, [
    accountId,
    profileId,
  ]);

  await client.end();
  console.log(`Aligned tenant user ${userId} to account ${accountId}, profile ${profileId}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
