/**
 * Seed script to create the initial admin user
 *
 * Usage:
 * 1. First create the D1 database:
 *    npx wrangler d1 create ohrhatorah-db
 *
 * 2. Update wrangler.jsonc with the database_id from step 1
 *
 * 3. Run the schema migration:
 *    npx wrangler d1 execute ohrhatorah-db --local --file=./schema.sql
 *
 * 4. Run this seed script with your PIN:
 *    ADMIN_PIN=<your-6-digit-pin> npx ts-node scripts/seed-admin.ts
 *
 * 5. Copy the output and run it:
 *    npx wrangler d1 execute ohrhatorah-db --local --command="<SQL>"
 */

import bcrypt from 'bcryptjs';

const ADMIN_NAME = 'Rabbi Chuck';
const ADMIN_PIN = process.env.ADMIN_PIN;
const ADMIN_ROLE = 'admin';

if (!ADMIN_PIN || !/^\d{6}$/.test(ADMIN_PIN)) {
  console.error('Error: ADMIN_PIN environment variable must be a 6-digit number');
  console.error('Usage: ADMIN_PIN=<your-6-digit-pin> npx ts-node scripts/seed-admin.ts');
  process.exit(1);
}

async function generateSeedSQL() {
  const salt = await bcrypt.genSalt(10);
  const pinHash = await bcrypt.hash(ADMIN_PIN, salt);

  const sql = `INSERT INTO users (name, pin_hash, role) VALUES ('${ADMIN_NAME}', '${pinHash}', '${ADMIN_ROLE}');`;

  console.log('\n=== Admin User Seed SQL ===\n');
  console.log('Run this command to create the admin user:\n');
  console.log(`npx wrangler d1 execute ohrhatorah-db --local --command="${sql}"\n`);
  console.log('Or for production:\n');
  console.log(`npx wrangler d1 execute ohrhatorah-db --command="${sql}"\n`);
  console.log('=== User Details ===');
  console.log(`Name: ${ADMIN_NAME}`);
  console.log(`PIN: ${ADMIN_PIN}`);
  console.log(`Role: ${ADMIN_ROLE}`);
  console.log('\n');
}

generateSeedSQL().catch(console.error);
