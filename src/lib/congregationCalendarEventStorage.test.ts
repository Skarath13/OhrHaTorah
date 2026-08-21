import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createManagedCongregationCalendarEvent,
  deleteManagedCongregationCalendarEvent,
  getManagedCongregationCalendarEvents,
  updateManagedCongregationCalendarEvent,
  validateCalendarEventDraft,
} from './congregationCalendarEvents.ts';

type StoredRow = Record<string, unknown>;

const createFakeCalendarDatabase = (seed: StoredRow[] = []) => {
  const rows = new Map(seed.map((row) => [String(row.id), { ...row }]));
  const calls: Array<{ sql: string; values: unknown[] }> = [];

  return {
    rows,
    calls,
    db: {
      prepare(sql: string) {
        let values: unknown[] = [];
        const statement = {
          bind(...bound: unknown[]) {
            values = bound;
            return statement;
          },
          async all() {
            calls.push({ sql, values });
            return { success: true, results: [...rows.values()], meta: { changes: 0 } };
          },
          async first() {
            calls.push({ sql, values });
            return rows.get(String(values[0])) || null;
          },
          async run() {
            calls.push({ sql, values });
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
              rows.set(String(id), {
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
              });
              return { success: true, meta: { changes: 1 } };
            }
            if (/UPDATE congregation_calendar_events SET/.test(sql)) {
              const id = String(values[13]);
              const existing = rows.get(id);
              if (!existing) return { success: true, meta: { changes: 0 } };
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
              rows.set(id, {
                ...existing,
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
              });
              return { success: true, meta: { changes: 1 } };
            }
            if (/DELETE FROM congregation_calendar_events/.test(sql)) {
              const changed = rows.delete(String(values[0])) ? 1 : 0;
              return { success: true, meta: { changes: changed } };
            }
            throw new Error(`Unexpected SQL in fake D1: ${sql}`);
          },
        };
        return statement;
      },
    },
  };
};

test('prepared storage creates, reads, replaces, and deletes congregation events', async () => {
  const fake = createFakeCalendarDatabase();
  const weeklyValidation = validateCalendarEventDraft({
    title: 'Weekly gathering',
    description: 'A congregation-owned event.',
    location: 'Sanctuary',
    schedule: {
      kind: 'weekly',
      interval: 1,
      weekdays: ['saturday'],
      startsOn: '2026-09-05',
      startTime: '15:00',
      endTime: '16:30',
    },
  });
  assert.equal(weeklyValidation.success, true);
  if (!weeklyValidation.success) return;

  const id = 'calendar-550e8400-e29b-41d4-a716-446655440000';
  const created = await createManagedCongregationCalendarEvent(
    fake.db as never,
    id,
    weeklyValidation.data,
    7,
  );
  assert.equal(created.id, id);
  assert.equal(created.timeZone, 'America/Los_Angeles');
  assert.equal(created.createdBy, 7);
  assert.deepEqual(created.schedule, weeklyValidation.data.schedule);

  const insertCall = fake.calls.find((call) => /INSERT INTO congregation_calendar_events/.test(call.sql));
  assert.ok(insertCall);
  assert.match(insertCall.sql, /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/);
  assert.doesNotMatch(insertCall.sql, /Weekly gathering|Sanctuary/);
  assert.equal(insertCall.values[8], '["saturday"]');

  const allDayValidation = validateCalendarEventDraft({
    title: 'Community picnic',
    schedule: { kind: 'single', date: '2026-10-04', allDay: true },
  });
  assert.equal(allDayValidation.success, true);
  if (!allDayValidation.success) return;
  const updated = await updateManagedCongregationCalendarEvent(
    fake.db as never,
    id,
    allDayValidation.data,
    9,
  );
  assert.ok(updated);
  assert.deepEqual(updated.schedule, allDayValidation.data.schedule);
  assert.equal(updated.updatedBy, 9);
  assert.equal(fake.rows.get(id)?.weekdays_json, null);
  assert.equal(fake.rows.get(id)?.start_time, null);

  const listed = await getManagedCongregationCalendarEvents(fake.db as never);
  assert.equal(listed.length, 1);
  assert.equal(await deleteManagedCongregationCalendarEvent(fake.db as never, id), true);
  assert.equal(await deleteManagedCongregationCalendarEvent(fake.db as never, id), false);
});
