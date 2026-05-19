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
  const users = await c.query(`SELECT id, email, "accountId", role FROM users WHERE email LIKE '%demo%' OR email LIKE '%tenant%' ORDER BY id`);
  const profiles = await c.query(`SELECT id, "userId", "accountId" FROM tenant_profiles ORDER BY id`);
  console.log('users', users.rows);
  console.log('profiles', profiles.rows);
  await c.end();
})();
