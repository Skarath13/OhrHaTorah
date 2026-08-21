import assert from 'node:assert/strict';
import test from 'node:test';
import { GET as getPublicCalendarEvents } from '../pages/api/calendar/events.ts';

const publicUrl = (start: string, end: string): string => {
  const url = new URL('https://example.test/api/calendar/events');
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);
  url.searchParams.set('congregation', '1');
  url.searchParams.set('holidays', '0');
  url.searchParams.set('observances', '0');
  url.searchParams.set('candleLighting', '0');
  return url.toString();
};

const eventRow = {
  id: 'calendar-550e8400-e29b-41d4-a716-446655440000',
  title: 'Community picnic',
  description: 'Bring lunch.',
  location: 'Main courtyard',
  time_zone: 'America/Los_Angeles',
  schedule_kind: 'single',
  event_date: '2026-09-13',
  all_day: 1,
  weekdays_json: null,
  starts_on: null,
  ends_on: null,
  start_time: null,
  end_time: null,
  created_at: '2026-08-20 20:00:00',
  updated_at: '2026-08-20 20:00:00',
  created_by: 42,
  updated_by: 42,
};

const databaseWithRows = (rows: unknown[]) => ({
  prepare(sql: string) {
    assert.match(sql, /FROM congregation_calendar_events/);
    return {
      async all() {
        return { success: true, results: rows, meta: { changes: 0 } };
      },
    };
  },
});

test('public calendar expands D1-owned congregation events without exposing audit data', async () => {
  const response = await getPublicCalendarEvents({
    request: new Request(publicUrl('2026-09-13', '2026-09-14')),
    locals: { runtime: { env: { DB: databaseWithRows([eventRow]) } } },
  } as never);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');

  const payload = await response.json() as {
    events: Array<Record<string, unknown> & { extendedProps: Record<string, unknown> }>;
  };
  assert.equal(payload.events.length, 1);
  assert.equal(payload.events[0]?.id, eventRow.id);
  assert.equal(payload.events[0]?.title, eventRow.title);
  assert.equal(payload.events[0]?.extendedProps.source, 'congregation');
  assert.doesNotMatch(JSON.stringify(payload.events), /createdBy|updatedBy|created_at|updated_at/);
});

test('an intentionally empty calendar table does not restore deleted bundled events', async () => {
  const response = await getPublicCalendarEvents({
    request: new Request(publicUrl('2026-08-15', '2026-08-16')),
    locals: { runtime: { env: { DB: databaseWithRows([]) } } },
  } as never);
  const payload = await response.json() as { events: unknown[] };
  assert.deepEqual(payload.events, []);
});

test('a bound but unavailable D1 calendar fails closed instead of reviving stale bundled events', async () => {
  const unavailableDatabase = {
    prepare() {
      return {
        async all() {
          throw new Error('temporary database failure');
        },
      };
    },
  };
  const response = await getPublicCalendarEvents({
    request: new Request(publicUrl('2026-08-15', '2026-08-16')),
    locals: { runtime: { env: { DB: unavailableDatabase } } },
  } as never);
  const payload = await response.json() as { events: unknown[]; meta: { warning?: string } };
  assert.deepEqual(payload.events, []);
  assert.match(payload.meta.warning || '', /Congregation event data is temporarily unavailable/);
});
