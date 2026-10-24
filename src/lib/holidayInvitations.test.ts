import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { autumnHolidayServices } from '../data/holidayServices.ts';
import { congregationClock, isUpcomingService } from './holidayServices.ts';

const holidaysSource = readFileSync(new URL('../pages/holidays.astro', import.meta.url), 'utf8');
const upcomingIds = (date: string, time: string) =>
    autumnHolidayServices.filter(event => isUpcomingService(event, { date, time })).map(event => event.id);

test('the congregation clock reads Pacific date and 24-hour time', () => {
    assert.deepEqual(congregationClock(new Date('2026-09-21T02:30:00Z')), { date: '2026-09-20', time: '19:30' });
    assert.deepEqual(congregationClock(new Date('2026-10-04T07:00:00Z')), { date: '2026-10-04', time: '00:00' });
    assert.deepEqual(congregationClock(new Date('2026-12-01T20:05:00Z')), { date: '2026-12-01', time: '12:05' });
});

test('holiday invitations drop each service once it has ended', () => {
    assert.equal(upcomingIds('2026-09-01', '08:00').length, autumnHolidayServices.length);
    assert.deepEqual(upcomingIds('2026-09-20', '19:30').slice(0, 1), ['holiday-2026-kol-nidre']);
    assert.ok(!upcomingIds('2026-09-20', '20:00').includes('holiday-2026-kol-nidre'));
    assert.deepEqual(upcomingIds('2026-10-03', '23:59'), ['holiday-2026-shemini-atzeret']);
    assert.deepEqual(upcomingIds('2026-10-24', '01:00'), []);
});

test('the holidays page invites only to services that have not ended', () => {
    assert.match(holidaysSource, /const upcoming = services\.filter\(event => isUpcomingService\(event, clock\)\)/);
    assert.match(holidaysSource, /const kolNidre = upcoming\.find\(/);
    assert.match(holidaysSource, /\{!seasonStarted && <p>Join us for Rosh HaShanah/);
    assert.match(holidaysSource, /upcoming\.map\(event =>/);
    assert.match(holidaysSource, /Holiday service details will be posted here as they are confirmed\./);
});
