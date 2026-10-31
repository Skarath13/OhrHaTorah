import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  createAccessCode,
  findExclusiveArea,
  formatAccessCode,
  generateAccessCode,
  getAccessTokenFromCookies,
  hasValidAccessSession,
  normalizeAccessCode,
  redeemAccessCode,
  revokeAccessCode,
  safeNextPath,
  validateAccessCodeDraft,
  type ExclusiveArea,
} from './exclusiveAccess.ts';

const members: ExclusiveArea = { area: 'members', pathPrefix: '/members', title: 'Members' };
const schema = readFileSync(new URL('../../schema.sql', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../deploy/chuck-staging/migrations/site/0004_exclusive_access_codes.sql', import.meta.url), 'utf8');

const database = (sql = schema) => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(sql);
  sqlite.exec("INSERT INTO users (id, name, pin_hash, role) VALUES (7, 'Local fixture', 'fixture-only', 'admin')");
  const db = { prepare(statementSql: string) {
    const prepared = sqlite.prepare(statementSql);
    let bound: unknown[] = [];
    const statement = {
      bind(...values: unknown[]) { bound = values; return statement; },
      async all() { return { results: prepared.all(...(bound as never[])) }; },
      async first() { return prepared.get(...(bound as never[])) ?? null; },
      async run() {
        const result = prepared.run(...(bound as never[]));
        return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
      },
    };
    return statement;
  } };
  return { sqlite, db: db as unknown as D1Database };
};

test('area matching covers the prefix and its children only', () => {
  assert.equal(findExclusiveArea('/members', [members]), members);
  assert.equal(findExclusiveArea('/members/notes', [members]), members);
  assert.equal(findExclusiveArea('/membership', [members]), null);
  assert.equal(findExclusiveArea('/', [members]), null);
});

test('codes are forgiving about case, spaces, and dashes', () => {
  assert.equal(normalizeAccessCode(' abcde-fghjk '), 'ABCDEFGHJK');
  assert.equal(formatAccessCode('abcdefghjk'), 'ABCDE-FGHJK');
  const code = generateAccessCode();
  assert.match(code, /^[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}$/);
});

test('post-unlock redirects stay inside the area', () => {
  assert.equal(safeNextPath('/members/notes?x=1', members), '/members/notes?x=1');
  assert.equal(safeNextPath('https://evil.example/members', members), '/members');
  assert.equal(safeNextPath('//evil.example/members', members), '/members');
  assert.equal(safeNextPath('/\\evil.example', members), '/members');
  assert.equal(safeNextPath('/admin', members), '/members');
  assert.equal(safeNextPath(null, members), '/members');
});

test('cookie parsing accepts only a well-formed token for the area', () => {
  const token = 'a'.repeat(64);
  assert.equal(getAccessTokenFromCookies(`x=1; oht_access_members=${token}`, 'members'), token);
  assert.equal(getAccessTokenFromCookies(`oht_access_members=not-a-token`, 'members'), null);
  assert.equal(getAccessTokenFromCookies(`oht_access_other=${token}`, 'members'), null);
});

test('draft validation rejects unknown areas, empty labels, and past expiry', () => {
  const now = new Date('2026-10-31T12:00:00Z');
  assert.equal(validateAccessCodeDraft({ area: 'nope', label: 'x' }, now).success, false);
  assert.equal(validateAccessCodeDraft({ area: 'members', label: '  ' }, now).success, false);
  assert.equal(validateAccessCodeDraft({ area: 'members', label: 'x', expiresAt: '2026-01-01' }, now).success, false);
  const ok = validateAccessCodeDraft({ area: 'members', label: 'Board', expiresAt: '2027-01-01T00:00:00Z' }, now);
  assert.ok(ok.success && ok.data.expiresAt === '2027-01-01T00:00:00.000Z');
});

test('a code opens a session, stores only a hash, and revocation closes it', async () => {
  const { sqlite, db } = database();
  try {
    const { id, code } = await createAccessCode(db, { area: members, label: 'Board', expiresAt: null }, 7);
    const stored = sqlite.prepare('SELECT code_hash FROM access_codes WHERE id = ?').get(id) as { code_hash: string };
    assert.notEqual(stored.code_hash, code);
    assert.equal(stored.code_hash.includes(normalizeAccessCode(code)), false);

    assert.equal(await redeemAccessCode(db, members, 'WRONG-CODE1'), null);
    const session = await redeemAccessCode(db, members, code.toLowerCase().replace('-', ' '));
    assert.ok(session);
    assert.equal(await hasValidAccessSession(db, members, session.token), true);
    assert.equal(await hasValidAccessSession(db, { ...members, area: 'other' }, session.token), false);

    assert.equal(await revokeAccessCode(db, id), true);
    assert.equal(await hasValidAccessSession(db, members, session.token), false);
    assert.equal(await redeemAccessCode(db, members, code), null);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM access_codes').get()?.n, 1);
  } finally { sqlite.close(); }
});

test('expired codes do not open and sessions end with their code', async () => {
  const { sqlite, db } = database();
  try {
    const now = new Date('2026-10-31T12:00:00Z');
    const { code } = await createAccessCode(db, { area: members, label: 'Short', expiresAt: '2026-11-02T00:00:00.000Z' }, 7);
    const session = await redeemAccessCode(db, members, code, now);
    assert.ok(session);
    assert.equal(session.expiresAt.toISOString(), '2026-11-02T00:00:00.000Z');
    assert.equal(await hasValidAccessSession(db, members, session.token, new Date('2026-11-03T00:00:00Z')), false);
    assert.equal(await redeemAccessCode(db, members, code, new Date('2026-11-03T00:00:00Z')), null);
  } finally { sqlite.close(); }
});

test('migration 0004 is additive on an existing database', () => {
  const legacy = schema.replace(/CREATE TABLE IF NOT EXISTS access_codes[\s\S]*?\n\);\n\n-- Browser sessions[\s\S]*?\n\);\n/, '')
    .replace(/CREATE INDEX IF NOT EXISTS idx_access_[\s\S]*$/, '');
  assert.equal(legacy.includes('access_codes'), false);
  const { sqlite } = database(legacy);
  try {
    sqlite.exec("INSERT INTO site_content (key, value) VALUES ('brit-chadashah:2026-11-07', 'Editor owned reading')");
    sqlite.exec(migration);
    sqlite.exec(migration);
    assert.equal(sqlite.prepare("SELECT value FROM site_content WHERE key = 'brit-chadashah:2026-11-07'").get()?.value, 'Editor owned reading');
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name IN ('access_codes', 'access_sessions')").get()?.n, 2);
    const statements = migration.replace(/--.*$/gm, '').split(';').map((part) => part.trim()).filter(Boolean);
    assert.ok(statements.every((statement) => /^CREATE (TABLE|INDEX) IF NOT EXISTS /.test(statement)));
  } finally { sqlite.close(); }
});
