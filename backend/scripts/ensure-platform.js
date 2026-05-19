/**
 * Marks account id=1 as the SaaS PLATFORM workspace and optionally promotes a user
 * to PLATFORM_OWNER on that account (for testing your operator / “Broadway” login).
 *
 * Usage:
 *   node scripts/ensure-platform.js
 *   node scripts/ensure-platform.js you@company.com
 *
 * Note: Moving your personal landlord data off account 2+ is separate — use a dedicated
 * email for the platform operator if you want to keep an existing landlord workspace.
 */
const { Client } = require('pg');

async function run() {
  const email = process.argv[2];
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'broadway_pm',
  });

  await client.connect();
  await client.query(
    `UPDATE accounts SET kind = 'PLATFORM', "activationStatus" = 'ACTIVE', "isActive" = true, "parentAccountId" = NULL WHERE id = 1`,
  );
  if (email) {
    await client.query(`UPDATE users SET role = 'PLATFORM_OWNER', "accountId" = 1, "isActive" = true WHERE email = $1`, [
      email,
    ]);
  }
  const acc = await client.query(`SELECT id, name, kind, "activationStatus" FROM accounts WHERE id = 1`);
  const users = email
    ? await client.query(`SELECT id, email, role, "accountId" FROM users WHERE email = $1`, [email])
    : { rows: [] };
  await client.end();
  // eslint-disable-next-line no-console
  console.log('Platform account:', acc.rows);
  if (email) {
    // eslint-disable-next-line no-console
    console.log('Updated user:', users.rows);
  }
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
