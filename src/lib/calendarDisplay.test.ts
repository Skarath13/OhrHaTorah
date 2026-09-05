import assert from 'node:assert/strict';
import test from 'node:test';
import type { PublicCalendarEvent } from './calendar.ts';
import {
    formatCalendarEventTime,
    formatHebrewCalendarDate,
    stripRepeatedHebrewYear,
} from './calendarDisplay.ts';

const calendarEvent = (overrides: Partial<PublicCalendarEvent> = {}): PublicCalendarEvent => ({
    id: 'display-test',
    title: 'Yom Kippur',
    allDay: true,
    start: '2026-09-21',
    extendedProps: { source: 'hebcal', group: 'holiday' },
    ...overrides,
});

test('date-only Hebcal observances do not claim an all-day duration', () => {
    assert.equal(formatCalendarEventTime(calendarEvent()), '');
    assert.equal(formatCalendarEventTime(calendarEvent({ title: 'Sukkot I' })), '');
    assert.equal(formatCalendarEventTime(calendarEvent({
        title: 'Rosh Chodesh Elul',
        extendedProps: { source: 'hebcal', group: 'observance' },
    })), '');
});

test('date-only Erev entries show evening context without inventing a time', () => {
    assert.equal(formatCalendarEventTime(calendarEvent({ title: 'Erev Yom Kippur' })), 'Evening');
    assert.equal(formatCalendarEventTime(calendarEvent({ title: '  Erev Rosh Hashana  ' })), 'Evening');
    assert.equal(formatCalendarEventTime(calendarEvent({ title: 'Erev Sukkot' })), 'Evening');
    assert.equal(formatCalendarEventTime(calendarEvent({ title: 'A study of Erev Yom Kippur' })), '');
});

test('explicit congregation all-day events retain their administrator-selected duration', () => {
    assert.equal(formatCalendarEventTime(calendarEvent({
        title: 'Erev Yom Kippur preparation',
        extendedProps: { source: 'congregation', group: 'congregation' },
    })), 'All day');
});

test('supplied candle-lighting and service times retain local clock times and known durations', () => {
    assert.equal(formatCalendarEventTime(calendarEvent({
        title: 'Shabbat Candle Lighting',
        allDay: false,
        start: '2026-10-02T18:16:00-07:00',
        extendedProps: { source: 'hebcal', group: 'candle-lighting' },
    })), '6:16 p.m.');
    assert.equal(formatCalendarEventTime(calendarEvent({
        title: 'Traditional prayers and Torah Service',
        allDay: false,
        start: '2026-09-12T15:00:00',
        end: '2026-09-12T16:30:00',
        extendedProps: { source: 'congregation', group: 'congregation' },
    })), '3:00 p.m.–4:30 p.m.');
    assert.equal(formatCalendarEventTime(calendarEvent({
        title: 'Erev Yom Kippur',
        allDay: false,
        start: '2026-09-20T18:30:00',
    })), '6:30 p.m.');
    assert.equal(formatCalendarEventTime(calendarEvent({ allDay: false, start: undefined })), 'Time to be announced');
});

test('Hebrew calendar dates display in month-day-year order', () => {
    assert.equal(formatHebrewCalendarDate('23 Elul 5786'), 'Elul 23, 5786');
    assert.equal(formatHebrewCalendarDate('1 Adar II 5787'), 'Adar II 1, 5787');
    assert.equal(formatHebrewCalendarDate("  15   Sh'vat   5787  "), "Sh'vat 15, 5787");
    assert.equal(formatHebrewCalendarDate(undefined), '');
});

test('a Hebrew year repeated by event metadata is removed only when it matches the date', () => {
    assert.equal(stripRepeatedHebrewYear('Rosh Hashana 5787', '1 Tishrei 5787'), 'Rosh Hashana');
    assert.equal(stripRepeatedHebrewYear('ראש השנה 5787', '1 Tishrei 5787'), 'ראש השנה');
    assert.equal(stripRepeatedHebrewYear('Historic gathering 5786', '1 Tishrei 5787'), 'Historic gathering 5786');
    assert.equal(stripRepeatedHebrewYear('5787', '1 Tishrei 5787'), '5787');
});
