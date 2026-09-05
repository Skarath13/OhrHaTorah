import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { validateCalendarEventDraft, createManagedCongregationCalendarEvent, updateManagedCongregationCalendarEvent, getManagedCongregationCalendarEvents } from './congregationCalendarEvents.ts';
import { getCongregationCalendarEvents, parseCalendarRange } from './calendar.ts';
import { getHolidayServiceProgramme } from './holidayServices.ts';
import { buildAutumn2026CalendarChange } from './holidayCalendarChange.ts';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const schema = read('schema.sql');
const originalTable = read('deploy/chuck-staging/migrations/site/0001_congregation_calendar_events.sql').match(/CREATE TABLE IF NOT EXISTS congregation_calendar_events \([\s\S]*?\n\);/)![0];
const migration = read('deploy/chuck-staging/migrations/site/0003_start_only_and_date_exceptions.sql');

function database(legacy = false) {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec(legacy ? schema.replace(/CREATE TABLE IF NOT EXISTS congregation_calendar_events \([\s\S]*?\n\);/, originalTable) : schema);
    sqlite.exec("INSERT INTO users (id, name, pin_hash, role) VALUES (7, 'Local fixture', 'fixture-only', 'admin')");
    const db = { prepare(sql: string) {
        const prepared = sqlite.prepare(sql);
        let bound: any[] = [];
        const statement = {
            bind(...values: any[]) { bound = values; return statement; },
            async all() { return { results: prepared.all(...bound) }; },
            async first() { return prepared.get(...bound) ?? null; },
            async run() { return { meta: { changes: Number(prepared.run(...bound).changes) } }; },
        };
        return statement;
    }};
    return { sqlite, db: db as unknown as D1Database };
}

test('start-only services survive real SQLite storage and render without invented durations', async () => {
    const { sqlite, db } = database();
    try {
        const validated = validateCalendarEventDraft({ title: 'Neilah', schedule: { kind: 'single', date: '2026-09-21', allDay: false, startTime: '18:45' } });
        assert.equal(validated.success, true);
        if (!validated.success) return;
        const stored = await createManagedCongregationCalendarEvent(db, 'neilah-test', validated.data, 7);
        const [event] = getCongregationCalendarEvents(parseCalendarRange('2026-09-21', '2026-09-22'), [stored]);
        assert.equal(event.start, '2026-09-21T18:45:00');
        assert.equal(event.end, undefined);
        assert.equal(event.allDay, false);
        assert.equal(sqlite.prepare("SELECT end_time FROM congregation_calendar_events WHERE id = 'neilah-test'").get()?.end_time, null);
        assert.equal(validateCalendarEventDraft({ title: 'Bad end', schedule: { ...validated.data.schedule, endTime: '18:00' } }).success, false);
        assert.equal(validateCalendarEventDraft({ title: 'Bad end', schedule: { ...validated.data.schedule, endTime: 'not-a-time' } }).success, false);
    } finally { sqlite.close(); }
});

test('weekly exceptions validate actual occurrences and preserve every other date after an edit', async () => {
    const { sqlite, db } = database();
    try {
        const draft = { title: 'Weekly prayers', schedule: { kind: 'weekly', interval: 1, weekdays: ['saturday'], startsOn: '2026-09-01', startTime: '15:00', endTime: '16:30', excludedDates: ['2026-09-26', '2026-09-12'] } };
        const valid = validateCalendarEventDraft(draft);
        assert.equal(valid.success, true);
        if (!valid.success) return;
        const created = await createManagedCongregationCalendarEvent(db, 'exceptions-test', valid.data, 7);
        const updated = await updateManagedCongregationCalendarEvent(db, created.id, { ...valid.data, title: 'Updated prayers' }, 7);
        assert.ok(updated);
        const events = getCongregationCalendarEvents(parseCalendarRange('2026-09-01', '2026-10-01'), [updated]);
        assert.deepEqual(events.map(e => e.start?.slice(0, 10)), ['2026-09-05', '2026-09-19']);
        assert.ok(events.every(e => e.title === 'Updated prayers'));
        for (const excludedDates of [['2026-09-13'], ['2026-02-30'], ['2026-09-12','2026-09-12'], ['2026-08-29'], Array(121).fill('2026-09-12')]) {
            assert.equal(validateCalendarEventDraft({ ...draft, schedule: { ...draft.schedule, excludedDates } }).success, false);
        }
    } finally { sqlite.close(); }
});

test('structural migration preserves existing records, editor overrides, audit values, and foreign keys', async () => {
    const { sqlite, db } = database(true);
    try {
        sqlite.exec("UPDATE congregation_calendar_events SET title = 'Editor owned title', updated_by = 7 WHERE id = 'shabbat-weekly-readings-discussion'");
        sqlite.exec("INSERT INTO site_content (key, value) VALUES ('brit-chadashah:2026-09-05', 'Editor owned reading')");
        const before = sqlite.prepare('SELECT * FROM congregation_calendar_events ORDER BY id').all();
        assert.equal((await getManagedCongregationCalendarEvents(db)).length, 3, 'new reader supports the existing schema');
        sqlite.exec(migration);
        const after = sqlite.prepare('SELECT * FROM congregation_calendar_events ORDER BY id').all().map(row => {
            const copy = { ...row }; assert.equal(copy.excluded_dates_json, '[]'); delete copy.excluded_dates_json; return copy;
        });
        assert.equal(JSON.stringify(after), JSON.stringify(before));
        assert.equal(sqlite.prepare("SELECT value FROM site_content WHERE key = 'brit-chadashah:2026-09-05'").get()?.value, 'Editor owned reading');
        assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
        assert.equal((await getManagedCongregationCalendarEvents(db)).length, 3);
    } finally { sqlite.close(); }
});

test('reviewed holiday data operation is idempotent and never restores deleted congregation records', async () => {
    const { sqlite, db } = database();
    try {
        sqlite.exec("UPDATE congregation_calendar_events SET title = 'Custom music title' WHERE id = 'shabbat-messianic-music-and-dance'");
        sqlite.exec("DELETE FROM congregation_calendar_events WHERE id = 'shabbat-weekly-readings-discussion'");
        const change = buildAutumn2026CalendarChange();
        assert.equal(change, read('docs/data-changes/autumn-2026-calendar.sql'));
        sqlite.exec(change);
        const events = await getManagedCongregationCalendarEvents(db);
        assert.equal(events.find(e => e.id === 'shabbat-messianic-music-and-dance')?.title, 'Custom music title');
        assert.equal(events.some(e => e.id === 'shabbat-weekly-readings-discussion'), false);
        assert.equal((await getHolidayServiceProgramme(db)).length, 7);
        const holidaySaturday = getCongregationCalendarEvents(parseCalendarRange('2026-09-26', '2026-09-27'), events);
        assert.equal(holidaySaturday.length, 1);
        assert.equal(holidaySaturday[0].title, 'Sukkot · First Day');
        assert.match(holidaySaturday[0].extendedProps.description ?? '', /waving of the lulav/);
        sqlite.exec("UPDATE congregation_calendar_events SET title = 'Admin edited Kol Nidre' WHERE id = 'holiday-2026-kol-nidre'");
        sqlite.exec("DELETE FROM congregation_calendar_events WHERE id = 'holiday-2026-sukkot'");
        sqlite.exec(change);
        assert.equal((await getHolidayServiceProgramme(db)).length, 6);
        assert.equal((await getHolidayServiceProgramme(db)).find(e => e.id === 'holiday-2026-kol-nidre')?.title, 'Admin edited Kol Nidre');
    } finally { sqlite.close(); }
});

test('a bound empty or unavailable database never publishes bundled holiday defaults', async () => {
    const { sqlite, db } = database();
    try {
        assert.deepEqual(await getHolidayServiceProgramme(db), []);
        sqlite.exec('DROP TABLE congregation_calendar_events');
        await assert.rejects(() => getHolidayServiceProgramme(db));
        assert.equal((await getHolidayServiceProgramme()).length, 7);
    } finally { sqlite.close(); }
});

test('the stored autumn programme matches the email and preserves unrelated Shabbat gatherings', async () => {
    const { sqlite, db } = database();
    try {
        sqlite.exec(buildAutumn2026CalendarChange());
        const services = await getHolidayServiceProgramme(db);
        const entries = getCongregationCalendarEvents(parseCalendarRange('2026-09-01', '2026-10-06'), services);
        assert.deepEqual(entries.map(({ id, start, end }) => [id, start, end ?? null]), [
            ['holiday-2026-rosh-hashanah', '2026-09-12T14:30:00', null],
            ['holiday-2026-kol-nidre', '2026-09-20T18:30:00', '2026-09-20T20:00:00'],
            ['holiday-2026-yom-kippur-mincha', '2026-09-21T15:00:00', null],
            ['holiday-2026-neilah', '2026-09-21T18:45:00', null],
            ['holiday-2026-break-fast', '2026-09-21T19:26:00', null],
            ['holiday-2026-sukkot', '2026-09-26T14:30:00', null],
            ['holiday-2026-shemini-atzeret', '2026-10-03T14:30:00', null],
        ]);
        assert.ok(entries.every(event => event.allDay === false));
        const descriptionFor = (id: string) => entries.find(event => event.id === id)?.extendedProps.description ?? '';
        assert.match(descriptionFor('holiday-2026-sukkot'), /traditional prayers/i);
        assert.match(descriptionFor('holiday-2026-sukkot'), /Torah Service/);
        assert.match(descriptionFor('holiday-2026-sukkot'), /waving of the lulav/);
        assert.match(descriptionFor('holiday-2026-yom-kippur-mincha'), /after 1:30 p\.m\./);
        assert.match(descriptionFor('holiday-2026-neilah'), /approximate/);
        assert.match(descriptionFor('holiday-2026-break-fast'), /approximate/);

        const managed = await getManagedCongregationCalendarEvents(db);
        const all = getCongregationCalendarEvents(parseCalendarRange('2026-09-01', '2026-10-06'), managed);
        for (const date of ['2026-09-12', '2026-09-26', '2026-10-03']) {
            const day = all.filter(event => event.extendedProps.calendarDate === date);
            assert.equal(day.filter(event => event.id.startsWith('holiday-2026-')).length, 1);
            assert.ok(day.some(event => event.id === `shabbat-weekly-readings-discussion-${date}`));
            assert.ok(day.every(event => !/^shabbat-(messianic-music-and-dance|traditional-prayers-and-torah-service)-/.test(event.id)));
        }
        assert.equal(all.filter(event => event.extendedProps.calendarDate === '2026-09-19').length, 3);
        assert.equal(all.filter(event => event.extendedProps.calendarDate === '2026-10-04').length, 0);
    } finally { sqlite.close(); }
});
