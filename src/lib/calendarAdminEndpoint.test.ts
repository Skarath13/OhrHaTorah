import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GET as listCalendarEvents,
  POST as createCalendarEvent,
} from '../pages/api/admin/calendar/events/index.ts';
import {
  DELETE as deleteCalendarEvent,
  GET as getCalendarEvent,
  PUT as updateCalendarEvent,
} from '../pages/api/admin/calendar/events/[id].ts';

const validDraft = {
  title: 'Community picnic',
  description: 'Bring lunch.',
  location: 'Main courtyard',
  schedule: {
    kind: 'single',
    date: '2026-09-13',
    allDay: true,
  },
};

const createRequest = (payload: unknown, csrf = true): Request => new Request(
  'https://example.test/api/admin/calendar/events',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: 'oht_session=session-id',
      ...(csrf ? { 'X-CSRF-Token': 'csrf-token' } : {}),
    },
    body: JSON.stringify(payload),
  },
);

const createEndpointDatabase = () => {
  let storedRow: Record<string, unknown> | null = null;
  const sqlCalls: string[] = [];

  return {
    sqlCalls,
    db: {
      prepare(sql: string) {
        sqlCalls.push(sql);
        let values: unknown[] = [];
        const statement = {
          bind(...bound: unknown[]) {
            values = bound;
            return statement;
          },
          async first() {
            if (/FROM sessions s/.test(sql)) {
              return {
                id: 42,
                name: 'Editor',
                pin_hash: 'not-exposed',
                role: 'editor',
                created_at: '2026-08-20 20:00:00',
                last_login: null,
              };
            }
            if (/FROM csrf_tokens/.test(sql)) return { token: 'csrf-token' };
            if (/FROM congregation_calendar_events/.test(sql)) {
              return storedRow?.id === values[0] ? storedRow : null;
            }
            throw new Error(`Unexpected first() SQL: ${sql}`);
          },
          async all() {
            if (/FROM congregation_calendar_events/.test(sql)) {
              return {
                success: true,
                results: storedRow ? [storedRow] : [],
                meta: { changes: 0 },
              };
            }
            throw new Error(`Unexpected all() SQL: ${sql}`);
          },
          async run() {
            if (/INSERT INTO congregation_calendar_events/.test(sql)) {
              const [
                id,
                title,
                description,
                location,
                timeZone,
                scheduleKind,
                eventDate,
                allDay,
                weekdaysJson,
                startsOn,
                endsOn,
                startTime,
                endTime,
                createdBy,
                updatedBy,
              ] = values;
              storedRow = {
                id,
                title,
                description,
                location,
                time_zone: timeZone,
                schedule_kind: scheduleKind,
                event_date: eventDate,
                all_day: allDay,
                weekdays_json: weekdaysJson,
                starts_on: startsOn,
                ends_on: endsOn,
                start_time: startTime,
                end_time: endTime,
                created_at: '2026-08-20 20:00:00',
                updated_at: '2026-08-20 20:00:00',
                created_by: createdBy,
                updated_by: updatedBy,
              };
              return { success: true, meta: { changes: 1 } };
            }
            if (/UPDATE congregation_calendar_events SET/.test(sql)) {
              if (!storedRow || storedRow.id !== values[13]) {
                return { success: true, meta: { changes: 0 } };
              }
              const [
                title,
                description,
                location,
                timeZone,
                scheduleKind,
                eventDate,
                allDay,
                weekdaysJson,
                startsOn,
                endsOn,
                startTime,
                endTime,
                updatedBy,
              ] = values;
              storedRow = {
                ...storedRow,
                title,
                description,
                location,
                time_zone: timeZone,
                schedule_kind: scheduleKind,
                event_date: eventDate,
                all_day: allDay,
                weekdays_json: weekdaysJson,
                starts_on: startsOn,
                ends_on: endsOn,
                start_time: startTime,
                end_time: endTime,
                updated_at: '2026-08-20 20:01:00',
                updated_by: updatedBy,
              };
              return { success: true, meta: { changes: 1 } };
            }
            if (/DELETE FROM congregation_calendar_events/.test(sql)) {
              const found = storedRow?.id === values[0];
              if (found) storedRow = null;
              return { success: true, meta: { changes: found ? 1 : 0 } };
            }
            throw new Error(`Unexpected run() SQL: ${sql}`);
          },
        };
        return statement;
      },
    },
  };
};

test('calendar create endpoint requires an authenticated session and session-bound CSRF token', async () => {
  const database = createEndpointDatabase();
  const unauthorized = await createCalendarEvent({
    request: new Request('https://example.test/api/admin/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDraft),
    }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(unauthorized.status, 401);

  const missingCsrf = await createCalendarEvent({
    request: createRequest(validDraft, false),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(missingCsrf.status, 403);
  assert.equal(database.sqlCalls.some((sql) => /INSERT INTO congregation_calendar_events/.test(sql)), false);
});

test('calendar create endpoint validates input and returns the server-owned event record', async () => {
  const database = createEndpointDatabase();
  const invalid = await createCalendarEvent({
    request: createRequest({
      ...validDraft,
      schedule: { kind: 'single', date: '2026-02-30', allDay: true },
    }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(invalid.status, 400);
  const invalidPayload = await invalid.json() as { issues?: Array<{ path: string }> };
  assert.ok(invalidPayload.issues?.some((issue) => issue.path === 'schedule.date'));

  const response = await createCalendarEvent({
    request: createRequest(validDraft),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const payload = await response.json() as {
    success: boolean;
    data: {
      id: string;
      title: string;
      timeZone: string;
      createdBy: number;
      schedule: { kind: string; allDay: boolean };
    };
  };
  assert.equal(payload.success, true);
  assert.match(payload.data.id, /^calendar-[0-9a-f-]{36}$/);
  assert.equal(payload.data.title, 'Community picnic');
  assert.equal(payload.data.timeZone, 'America/Los_Angeles');
  assert.equal(payload.data.createdBy, 42);
  assert.deepEqual(payload.data.schedule, validDraft.schedule);

  const deleteWithoutCsrf = await deleteCalendarEvent({
    params: { id: payload.data.id },
    request: new Request(`https://example.test/api/admin/calendar/events/${payload.data.id}`, {
      method: 'DELETE',
      headers: { Cookie: 'oht_session=session-id' },
    }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(deleteWithoutCsrf.status, 403);
});

test('authenticated collection and item routes complete the CRUD lifecycle', async () => {
  const database = createEndpointDatabase();
  const createResponse = await createCalendarEvent({
    request: createRequest(validDraft),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  const created = await createResponse.json() as { data: { id: string } };
  const itemUrl = `https://example.test/api/admin/calendar/events/${created.data.id}`;

  const listResponse = await listCalendarEvents({
    request: new Request('https://example.test/api/admin/calendar/events', {
      headers: { Cookie: 'oht_session=session-id' },
    }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(listResponse.status, 200);
  assert.equal((await listResponse.json() as { data: unknown[] }).data.length, 1);

  const getResponse = await getCalendarEvent({
    params: { id: created.data.id },
    request: new Request(itemUrl, { headers: { Cookie: 'oht_session=session-id' } }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(getResponse.status, 200);

  const replacementDraft = {
    title: 'Updated weekly gathering',
    schedule: {
      kind: 'weekly',
      interval: 1,
      weekdays: ['saturday'],
      startsOn: '2026-09-19',
      startTime: '15:00',
      endTime: '16:30',
    },
  };
  const updateResponse = await updateCalendarEvent({
    params: { id: created.data.id },
    request: new Request(itemUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'oht_session=session-id',
        'X-CSRF-Token': 'csrf-token',
      },
      body: JSON.stringify(replacementDraft),
    }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(updateResponse.status, 200);
  const updated = await updateResponse.json() as {
    data: { title: string; schedule: { kind: string; startsOn: string } };
  };
  assert.equal(updated.data.title, replacementDraft.title);
  assert.deepEqual(updated.data.schedule, replacementDraft.schedule);

  const deleteResponse = await deleteCalendarEvent({
    params: { id: created.data.id },
    request: new Request(itemUrl, {
      method: 'DELETE',
      headers: {
        Cookie: 'oht_session=session-id',
        'X-CSRF-Token': 'csrf-token',
      },
    }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await deleteResponse.json(), {
    success: true,
    data: { id: created.data.id },
  });

  const missingResponse = await getCalendarEvent({
    params: { id: created.data.id },
    request: new Request(itemUrl, { headers: { Cookie: 'oht_session=session-id' } }),
    locals: { runtime: { env: { DB: database.db } } },
  } as never);
  assert.equal(missingResponse.status, 404);
});
