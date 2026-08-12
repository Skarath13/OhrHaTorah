import assert from 'node:assert/strict';
import test from 'node:test';
import {
    congregationCalendarLocationLabel,
    congregationCalendarTimeZone,
    congregationCalendarZipCode,
    congregationEvents,
    type CongregationEvent,
    type WeeklyEventSchedule,
} from '../data/congregationEvents.ts';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const expectedMigratedSeries = [
    {
        id: 'shabbat-messianic-music-and-dance',
        title: 'Contemporary Messianic Jewish Music and Dance',
        startsOn: '2025-06-14',
        startTime: '14:30',
        endTime: '15:00',
    },
    {
        id: 'shabbat-traditional-prayers-and-torah-service',
        title: 'Traditional prayers and Torah Service',
        startsOn: '2025-06-28',
        startTime: '15:00',
        endTime: '16:30',
    },
    {
        id: 'shabbat-weekly-readings-discussion',
        title: 'Interactive Discussion on Weekly Readings (Torah, Haftara, and Brit Chadashah)',
        startsOn: '2025-06-28',
        startTime: '16:30',
        endTime: '17:30',
    },
] as const;

const getWeeklySchedule = (event: CongregationEvent): WeeklyEventSchedule => {
    assert.equal(event.schedule.kind, 'weekly');
    return event.schedule as WeeklyEventSchedule;
};

test('the former public calendar series are preserved as local weekly events', () => {
    assert.equal(congregationCalendarTimeZone, 'America/Los_Angeles');
    assert.equal(congregationCalendarZipCode, '92708');
    assert.equal(congregationCalendarLocationLabel, 'Fountain Valley, CA 92708');
    const eventsById = new Map(congregationEvents.map((event) => [event.id, event]));

    expectedMigratedSeries.forEach((expected) => {
        const event = eventsById.get(expected.id);
        assert.ok(event, `Missing migrated congregation event: ${expected.id}`);
        const schedule = getWeeklySchedule(event);

        assert.equal(event.title, expected.title);
        assert.equal(event.timeZone, congregationCalendarTimeZone);
        assert.equal(schedule.interval, 1);
        assert.deepEqual(schedule.weekdays, ['saturday']);
        assert.equal(schedule.startsOn, expected.startsOn);
        assert.equal(schedule.startTime, expected.startTime);
        assert.equal(schedule.endTime, expected.endTime);
        assert.equal(schedule.endsOn, undefined);
    });
});

test('local event contracts use valid dates, times, and unique stable ids', () => {
    const ids = new Set<string>();

    for (const event of congregationEvents) {
        assert.ok(event.id.length > 0);
        assert.ok(!ids.has(event.id), `Duplicate congregation event id: ${event.id}`);
        ids.add(event.id);

        const { schedule } = event;
        if (schedule.kind === 'weekly') {
            assert.match(schedule.startsOn, datePattern);
            if (schedule.endsOn) assert.match(schedule.endsOn, datePattern);
            assert.ok(schedule.weekdays.length > 0, `${event.id} must recur on at least one weekday`);
            assert.match(schedule.startTime, timePattern);
            assert.match(schedule.endTime, timePattern);
            assert.ok(schedule.endTime > schedule.startTime, `${event.id} must end after it starts`);
            continue;
        }

        assert.match(schedule.date, datePattern);
        if (!schedule.allDay) {
            assert.match(schedule.startTime, timePattern);
            assert.match(schedule.endTime, timePattern);
            assert.ok(schedule.endTime > schedule.startTime, `${event.id} must end after it starts`);
        }
    }
});

test('public event data contains no Google identifiers or private calendar fields', () => {
    const serializedEvents = JSON.stringify(congregationEvents);

    assert.doesNotMatch(serializedEvents, /google(?:apis)?\.com|gmail\.com|@google|ohrhatorahoc/i);
    assert.doesNotMatch(
        serializedEvents,
        /(?:organizer|attendee|creator|created|last-modified|sequence|transparency|uid)/i,
    );
});
