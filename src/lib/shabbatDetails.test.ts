import assert from 'node:assert/strict';
import test from 'node:test';
import {
    addCalendarDays,
    formatCongregationDate,
    formatCongregationTime,
    getNextFridayDate
} from './shabbatDetails.ts';

test('next Friday follows the congregation calendar across Pacific midnight', () => {
    const lateFridayPacific = new Date('2026-08-15T06:59:59.000Z');
    const startOfSaturdayPacific = new Date('2026-08-15T07:00:00.000Z');

    assert.equal(getNextFridayDate(lateFridayPacific), '2026-08-14');
    assert.equal(getNextFridayDate(startOfSaturdayPacific), '2026-08-21');
});

test('calendar offsets stay date-only and do not inherit the device timezone', () => {
    assert.equal(addCalendarDays('2026-08-14', 7), '2026-08-21');
    assert.equal(addCalendarDays('2026-12-25', 7), '2027-01-01');
});

test('candle lighting values render in the congregation timezone', () => {
    const candleLighting = '2026-08-14T19:21:00-07:00';

    assert.equal(formatCongregationDate(candleLighting), 'Aug 14, 2026');
    assert.equal(formatCongregationTime(candleLighting), '7:21 pm');
});
