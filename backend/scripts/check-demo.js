require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await c.connect();
  const u = await c.query(`SELECT id, email FROM users WHERE email = 'tenant@demo-landlord.rw'`);
  const p = await c.query(`SELECT id, "userId", "unitId" FROM tenant_profiles WHERE "userId" = $1`, [u.rows[0]?.id]);
  const contracts = await c.query(`SELECT id, "tenantId", status, "isApproved", "currentVersionNumber" FROM contracts WHERE "tenantId" = $1`, [p.rows[0]?.id]);
  const versions = await c.query(`SELECT id, "contractId", "versionNumber", "rentAmountRwf" FROM contract_versions WHERE "contractId" = ANY($1::int[])`, [contracts.rows.map((r) => r.id)]);
  console.log({ user: u.rows[0], profile: p.rows[0], contracts: contracts.rows, versions: versions.rows });
  await c.end();
})();
