const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'broadway_pm',
  });

  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
      "billingContactName" VARCHAR(255),
      "billingContactEmail" VARCHAR(255),
      "billingContactPhone" VARCHAR(50),
      "bankName" VARCHAR(255),
      "bankAccountName" VARCHAR(100),
      "bankAccountNumber" VARCHAR(100),
      "bankSwiftCode" VARCHAR(100),
      "vatEnabled" BOOLEAN NOT NULL DEFAULT true,
      "vatRatePercent" NUMERIC(5,2) NOT NULL DEFAULT 18,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(
    `INSERT INTO accounts
      (id, name, "isActive", currency, "vatEnabled", "vatRatePercent", "createdAt", "updatedAt")
     VALUES (1, $1, true, $2, true, 18, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    ['Broadway Platform', 'RWF'],
  );
  await client.query(
    `UPDATE accounts SET name = 'Broadway Platform', kind = 'PLATFORM', "activationStatus" = 'ACTIVE'
     WHERE id = 1 AND (name = 'Default Account' OR kind IS NULL OR kind <> 'PLATFORM')`,
  );
  await client.end();
  // eslint-disable-next-line no-console
  console.log('default account seeded');
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
