import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatHebrewCalendarDate,
    stripRepeatedHebrewYear,
} from './calendarDisplay.ts';

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
