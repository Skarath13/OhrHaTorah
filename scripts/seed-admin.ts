import { webcrypto } from 'node:crypto';

const ADMIN_NAME = process.env.ADMIN_NAME || 'Rabbi Chuck';
const ADMIN_PIN = process.env.ADMIN_PIN;
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'admin';
const ITERATIONS = 150000;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function escapeSql(value: string): string {
  return value.replaceAll("'", "''");
}

async function hashPin(pin: string): Promise<string> {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await webcrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: ITERATIONS,
    },
    key,
    256
  );
  return `pbkdf2-sha256$${ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

if (!ADMIN_PIN || !/^\d{6}$/.test(ADMIN_PIN)) {
  console.error('Error: ADMIN_PIN must be a 6-digit number.');
  console.error('Usage: ADMIN_PIN=<your-6-digit-pin> npm run admin:seed');
  process.exit(1);
}

if (ADMIN_ROLE !== 'admin' && ADMIN_ROLE !== 'editor') {
  console.error('Error: ADMIN_ROLE must be admin or editor.');
  process.exit(1);
}

const pinHash = await hashPin(ADMIN_PIN);
const sql = [
  'INSERT INTO admin_users (name, pin_hash, role)',
  `VALUES ('${escapeSql(ADMIN_NAME)}', '${escapeSql(pinHash)}', '${escapeSql(ADMIN_ROLE)}');`,
].join(' ');
const shellSql = sql.replaceAll('\\', '\\\\').replaceAll('$', '\\$').replaceAll('"', '\\"');

console.log('\n=== Ohr HaTorah Admin Seed SQL ===\n');
console.log('Local:');
console.log(`npx wrangler d1 execute ohrhatorah-db --local --command="${shellSql}"\n`);
console.log('Remote:');
console.log(`npx wrangler d1 execute ohrhatorah-db --remote --command="${shellSql}"\n`);
console.log(`Name: ${ADMIN_NAME}`);
console.log(`Role: ${ADMIN_ROLE}`);
console.log('\nKeep the PIN private. It is not printed here.\n');
