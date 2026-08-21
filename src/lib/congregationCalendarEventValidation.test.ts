import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calendarEventDescriptionMaximumLength,
  calendarEventLocationMaximumLength,
  calendarEventTitleMaximumLength,
  isValidCongregationCalendarEventId,
  isValidGregorianCalendarDate,
  validateCalendarEventDraft,
} from './congregationCalendarEvents.ts';

test('calendar event validation accepts and normalizes supported schedule shapes', () => {
  const single = validateCalendarEventDraft({
    title: '  Community   picnic  ',
    description: 'Bring lunch.\r\nFamilies are welcome.',
    location: '  Main   courtyard ',
    schedule: {
      kind: 'single',
      date: '2026-09-13',
      allDay: true,
    },
  });
  assert.equal(single.success, true);
  if (single.success) {
    assert.deepEqual(single.data, {
      title: 'Community picnic',
      description: 'Bring lunch.\nFamilies are welcome.',
      location: 'Main courtyard',
      schedule: {
        kind: 'single',
        date: '2026-09-13',
        allDay: true,
      },
    });
  }

  const weekly = validateCalendarEventDraft({
    title: 'Study group',
    description: '',
    location: null,
    schedule: {
      kind: 'weekly',
      interval: 1,
      weekdays: ['saturday', 'monday'],
      startsOn: '2026-09-01',
      endsOn: '2026-12-31',
      startTime: '18:00',
      endTime: '19:30',
    },
  });
  assert.equal(weekly.success, true);
  if (weekly.success && weekly.data.schedule.kind === 'weekly') {
    assert.deepEqual(weekly.data.schedule.weekdays, ['monday', 'saturday']);
    assert.equal(weekly.data.description, undefined);
    assert.equal(weekly.data.location, undefined);
  }
});

test('calendar event validation rejects impossible dates, overnight times, and invalid recurrence', () => {
  const result = validateCalendarEventDraft({
    title: 'Invalid event',
    schedule: {
      kind: 'weekly',
      interval: 2,
      weekdays: ['saturday', 'saturday', 'notaday'],
      startsOn: '2026-02-30',
      endsOn: '2025-01-01',
      startTime: '23:00',
      endTime: '01:00',
    },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.issues.map((issue) => issue.path);
    assert.ok(paths.includes('schedule.interval'));
    assert.ok(paths.includes('schedule.weekdays'));
    assert.ok(paths.includes('schedule.startsOn'));
    assert.ok(paths.includes('schedule.endTime'));
  }
});

test('calendar event validation enforces bounded public text fields', () => {
  const result = validateCalendarEventDraft({
    title: 'x'.repeat(calendarEventTitleMaximumLength + 1),
    description: 'x'.repeat(calendarEventDescriptionMaximumLength + 1),
    location: 'x'.repeat(calendarEventLocationMaximumLength + 1),
    schedule: {
      kind: 'single',
      date: '2026-09-01',
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
    },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      result.issues.map((issue) => issue.path).sort(),
      ['description', 'location', 'title'],
    );
  }
});

test('calendar dates and stable event ids use strict public contracts', () => {
  assert.equal(isValidGregorianCalendarDate('2028-02-29'), true);
  assert.equal(isValidGregorianCalendarDate('2027-02-29'), false);
  assert.equal(isValidGregorianCalendarDate('09/01/2026'), false);
  assert.equal(isValidCongregationCalendarEventId('shabbat-weekly-readings-discussion'), true);
  assert.equal(isValidCongregationCalendarEventId('calendar-550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isValidCongregationCalendarEventId('../hebcal-event'), false);
});
