import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const repositoryUrl = new URL('../..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, repositoryUrl), 'utf8');

test('site and form D1 migrations are routed to separate binding directories', () => {
  const config = JSON.parse(read('deploy/chuck-staging/wrangler.json')) as {
    d1_databases: Array<{ binding: string; migrations_dir?: string }>;
  };
  const siteDatabase = config.d1_databases.find(({ binding }) => binding === 'DB');
  const formDatabase = config.d1_databases.find(({ binding }) => binding === 'FORM_DB');

  assert.equal(siteDatabase?.migrations_dir, 'migrations/site');
  assert.equal(formDatabase?.migrations_dir, 'migrations/form');
  assert.equal(
    existsSync(new URL('deploy/chuck-staging/migrations/0001_update_request_outbox.sql', repositoryUrl)),
    false,
  );

  const siteMigration = read('deploy/chuck-staging/migrations/site/0001_congregation_calendar_events.sql');
  const formMigration = read('deploy/chuck-staging/migrations/form/0001_update_request_outbox.sql');
  const donorMigration = read('deploy/chuck-staging/migrations/form/0002_donor_record_requests.sql');
  assert.match(siteMigration, /CREATE TABLE IF NOT EXISTS congregation_calendar_events/);
  assert.doesNotMatch(siteMigration, /update_requests|update_request_outbox/);
  assert.match(formMigration, /CREATE TABLE IF NOT EXISTS update_requests/);
  assert.doesNotMatch(formMigration, /congregation_calendar_events/);
  assert.match(donorMigration, /CREATE TABLE IF NOT EXISTS donor_record_requests/);
  assert.match(donorMigration, /CREATE TABLE IF NOT EXISTS donor_record_request_outbox/);
  assert.doesNotMatch(donorMigration, /congregation_calendar_events/);
});

test('baseline schema and deployment instructions include the calendar table and binding-specific commands', () => {
  const schema = read('schema.sql');
  const siteMigration = read('deploy/chuck-staging/migrations/site/0001_congregation_calendar_events.sql');
  const deploymentReadme = read('deploy/chuck-staging/README.md');

  assert.match(schema, /CREATE TABLE IF NOT EXISTS congregation_calendar_events/);
  assert.match(schema, /time_zone = 'America\/Los_Angeles'/);
  const tablePattern = /CREATE TABLE IF NOT EXISTS congregation_calendar_events \([\s\S]*?\n\);/;
  assert.equal(schema.match(tablePattern)?.[0], siteMigration.match(tablePattern)?.[0]);
  const seedTablePattern = /CREATE TABLE IF NOT EXISTS congregation_calendar_seed_versions \([\s\S]*?\n\);/;
  assert.equal(schema.match(seedTablePattern)?.[0], siteMigration.match(seedTablePattern)?.[0]);
  const seedBlockPattern = /INSERT OR IGNORE INTO congregation_calendar_events \([\s\S]*?INSERT OR IGNORE INTO congregation_calendar_seed_versions \(version\) VALUES \(1\);/;
  assert.equal(schema.match(seedBlockPattern)?.[0], siteMigration.match(seedBlockPattern)?.[0]);
  assert.match(deploymentReadme, /d1 migrations apply DB --remote --config wrangler\.json/);
  assert.match(deploymentReadme, /d1 migrations apply FORM_DB --remote --config wrangler\.json/);
});

test('the one-time site migration preserves exactly the three existing congregation series', () => {
  const siteMigration = read('deploy/chuck-staging/migrations/site/0001_congregation_calendar_events.sql');
  const schema = read('schema.sql');
  const seededIds = [...siteMigration.matchAll(/'(shabbat-[a-z0-9-]+)'/g)]
    .map((match) => match[1]);
  const schemaSeededIds = [...schema.matchAll(/'(shabbat-[a-z0-9-]+)'/g)]
    .map((match) => match[1]);

  assert.deepEqual(seededIds, [
    'shabbat-messianic-music-and-dance',
    'shabbat-traditional-prayers-and-torah-service',
    'shabbat-weekly-readings-discussion',
  ]);
  assert.deepEqual(schemaSeededIds, seededIds);
  assert.match(siteMigration, /WHERE NOT EXISTS \(\s*SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 1\s*\)/);
  assert.match(schema, /WHERE NOT EXISTS \(\s*SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 1\s*\)/);
  assert.match(siteMigration, /'Contemporary Messianic Jewish Music and Dance'/);
  assert.match(siteMigration, /'Traditional prayers and Torah Service'/);
  assert.match(siteMigration, /'Interactive Discussion on Weekly Readings \(Torah, Haftara, and Brit Chadashah\)'/);
});
