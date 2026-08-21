import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const calendarManager = readFileSync(
    new URL('../components/admin/CalendarManager.astro', import.meta.url),
    'utf8',
);
const homepage = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');
const publicCalendar = readFileSync(
    new URL('../components/islands/CongregationCalendar.astro', import.meta.url),
    'utf8',
);

test('homepage integrates the manager and refreshes the public feed after writes', () => {
    assert.match(homepage, /import CalendarManager from '..\/components\/admin\/CalendarManager\.astro'/);
    assert.match(homepage, /<CongregationCalendar \/>[\s\S]*<CalendarManager \/>/);
    assert.match(publicCalendar, /cache: 'no-store'/);
    assert.match(publicCalendar, /window\.addEventListener\('oht:calendar-events-changed', loadEvents\)/);
});

test('calendar manager is confined to authenticated inline edit mode', () => {
    assert.match(calendarManager, /:global\(body\.admin-edit-mode\) \.calendar-manager/);
    assert.match(calendarManager, /new MutationObserver\(applyEditMode\)/);
    assert.match(calendarManager, /document\.body\.classList\.contains\('admin-edit-mode'\)/);
    assert.match(calendarManager, /aria-hidden="true"/);
    assert.match(calendarManager, /\binert\b/);
});

test('calendar manager uses only the authenticated congregation CRUD API', () => {
    assert.match(calendarManager, /const endpoint = '\/api\/admin\/calendar\/events'/);
    assert.doesNotMatch(calendarManager, /fetch\(['"`]\/api\/calendar\/events/);
    assert.match(calendarManager, /method = eventId \? 'PUT' : 'POST'/);
    assert.match(calendarManager, /\{ method: 'DELETE' \}/);
    assert.match(calendarManager, /credentials: 'same-origin'/);
});

test('calendar writes reuse the existing CSRF cookie and request header', () => {
    assert.match(calendarManager, /startsWith\('oht_csrf='\)/);
    assert.match(calendarManager, /headers\['X-CSRF-Token'\] = csrfToken/);
    assert.match(calendarManager, /Security token unavailable\. Please log in again\./);
});

test('calendar manager covers single, all-day, timed, and weekly schedules', () => {
    assert.match(calendarManager, /name="scheduleKind" value="single"/);
    assert.match(calendarManager, /name="scheduleKind" value="weekly"/);
    assert.match(calendarManager, /name="allDay" type="checkbox"/);
    assert.match(calendarManager, /name="weekdays" value="saturday"/);
    assert.match(calendarManager, /name="startsOn"/);
    assert.match(calendarManager, /name="endsOn"/);
    assert.match(calendarManager, /name="startTime"/);
    assert.match(calendarManager, /name="endTime"/);
    assert.match(calendarManager, /interval: 1/);
});

test('calendar manager mirrors server validation limits and reports field issues', () => {
    assert.match(calendarManager, /maxlength="160"/);
    assert.match(calendarManager, /maxlength="2000"/);
    assert.match(calendarManager, /maxlength="300"/);
    assert.match(calendarManager, /End time must be later than start time on the same day\./);
    assert.match(calendarManager, /Recurrence end date cannot be before its start date\./);
    assert.match(calendarManager, /\[data-field-path=/);
    assert.match(calendarManager, /payload\.issues \|\| \[\]/);
});

test('calendar manager labels Hebcal as read-only and notifies the public calendar after writes', () => {
    assert.match(calendarManager, /come from Hebcal and are not editable here/);
    assert.match(calendarManager, /new CustomEvent\('oht:calendar-events-changed'/);
    assert.match(calendarManager, /dispatchCalendarChange\('delete', eventId\)/);
});
