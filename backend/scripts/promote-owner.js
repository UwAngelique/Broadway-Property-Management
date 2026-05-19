const { Client } = require('pg');

async function run() {
  const email = process.argv[2];
  if (!email) {
    throw new Error('Usage: node scripts/promote-owner.js <email>');
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'broadway_pm',
  });

  await client.connect();
  await client.query(`UPDATE users SET role = 'OWNER', "isActive" = true WHERE email = $1`, [email]);
  const result = await client.query(`SELECT id, email, role, "accountId" FROM users WHERE email = $1`, [email]);
  await client.end();
  // eslint-disable-next-line no-console
  console.log(result.rows);
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
