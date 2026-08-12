import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    buildHebcalHolidayUrl,
    calendarMaximumRangeDays,
    getCongregationCalendarEvents,
    getHebcalCalendarEvents,
    parseCalendarRange,
} from './calendar.ts';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const homepage = readFileSync(`${repositoryRoot}/src/pages/index.astro`, 'utf8');
const calendarComponent = readFileSync(
    `${repositoryRoot}/src/components/islands/CongregationCalendar.astro`,
    'utf8',
);
const calendarEndpoint = readFileSync(
    `${repositoryRoot}/src/pages/api/calendar/events.ts`,
    'utf8',
);
const homeStyles = readFileSync(`${repositoryRoot}/public/styles/home.css`, 'utf8');

test('calendar range validation is strict and bounded', () => {
    assert.deepEqual(parseCalendarRange('2026-08-01', '2026-09-01'), {
        start: '2026-08-01',
        end: '2026-09-01',
    });
    assert.throws(() => parseCalendarRange('2026-02-30', '2026-03-02'));
    assert.throws(() => parseCalendarRange('2026-09-01', '2026-08-01'));
    assert.throws(() => parseCalendarRange('2026-01-01', '2028-01-01'));
    assert.equal(calendarMaximumRangeDays, 400);
});

test('migrated Saturday series become bounded FullCalendar recurrence inputs', () => {
    const range = parseCalendarRange('2026-08-01', '2026-09-01');
    const events = getCongregationCalendarEvents(range);

    assert.equal(events.length, 3);
    events.forEach((event) => {
        assert.deepEqual(event.daysOfWeek, [6]);
        assert.equal(event.startRecur, range.start);
        assert.equal(event.endRecur, range.end);
        assert.equal(event.extendedProps.source, 'congregation');
        assert.equal(event.extendedProps.group, 'congregation');
    });
});

test('Hebcal requests include Shabbat candle-lighting for the congregation location', () => {
    const range = parseCalendarRange('2026-08-01', '2026-09-01');
    const url = new URL(buildHebcalHolidayUrl(range));

    assert.equal(url.origin, 'https://www.hebcal.com');
    assert.equal(url.searchParams.get('start'), range.start);
    assert.equal(url.searchParams.get('end'), '2026-08-31');
    assert.equal(url.searchParams.get('i'), 'off');
    assert.equal(url.searchParams.get('c'), 'on');
    assert.equal(url.searchParams.get('zip'), '92708');
    assert.equal(url.searchParams.get('M'), 'on');
    ['maj', 'min', 'mod', 'nx', 'mf', 'ss'].forEach((option) => {
        assert.equal(url.searchParams.get(option), 'on');
    });
    assert.equal(url.searchParams.get('leyning'), 'off');
    assert.doesNotMatch(url.toString(), /key=|calendar\.google/i);
});

test('Hebcal payloads are allowlisted, classified, and rendered as plain event data', () => {
    const range = parseCalendarRange('2026-08-01', '2026-09-01');
    const payload = {
        items: [
            {
                title: 'Rosh Chodesh Elul',
                date: '2026-08-13',
                category: 'roshchodesh',
                hebrew: 'ראש חודש אלול',
                hdate: '30 Av 5786',
                memo: 'Start of the Hebrew month.',
                organizer: 'must not pass through',
            },
            {
                title: 'Tu B’Av',
                date: '2026-08-01',
                category: 'holiday',
                subcat: 'minor',
            },
            {
                title: 'Not a holiday',
                date: '2026-08-02',
                category: 'parashat',
            },
            {
                title: 'Candle lighting: 7:21pm',
                title_orig: 'Candle lighting',
                date: '2026-08-14T19:21:00-07:00',
                category: 'candles',
                hebrew: 'הדלקת נרות',
            },
            {
                title: 'Candle lighting: 7:26pm',
                title_orig: 'Candle lighting',
                date: '2026-08-13T19:26:00-07:00',
                category: 'candles',
                memo: 'Erev Rosh Chodesh',
            },
        ],
    };

    const holidaysOnly = getHebcalCalendarEvents(payload, range, {
        includeHolidays: true,
        includeObservances: false,
        includeCandleLighting: false,
    });
    const observancesOnly = getHebcalCalendarEvents(payload, range, {
        includeHolidays: false,
        includeObservances: true,
        includeCandleLighting: false,
    });

    assert.equal(holidaysOnly.length, 1);
    assert.equal(holidaysOnly[0]?.extendedProps.group, 'holiday');
    assert.equal(observancesOnly.length, 1);
    assert.equal(observancesOnly[0]?.extendedProps.group, 'observance');
    assert.doesNotMatch(JSON.stringify(observancesOnly), /organizer|must not pass through/);

    const candleLightingOnly = getHebcalCalendarEvents(payload, range, {
        includeHolidays: false,
        includeObservances: false,
        includeCandleLighting: true,
    });
    assert.equal(candleLightingOnly.length, 1, 'only Friday Shabbat candle lighting is included');
    assert.equal(candleLightingOnly[0]?.title, 'Shabbat Candle Lighting');
    assert.equal(candleLightingOnly[0]?.allDay, false);
    assert.equal(candleLightingOnly[0]?.start, '2026-08-14T19:21:00-07:00');
    assert.equal(candleLightingOnly[0]?.extendedProps.group, 'candle-lighting');
    assert.equal(candleLightingOnly[0]?.extendedProps.calendarDate, '2026-08-14');
    assert.equal(candleLightingOnly[0]?.extendedProps.location, 'Fountain Valley, CA 92708');
    assert.deepEqual(candleLightingOnly[0]?.classNames, [
        'kehilat-calendar-event',
        'kehilat-calendar-event--candle-lighting',
    ]);
});

test('homepage owns its calendar UI and has no Google Calendar integration', () => {
    assert.match(homepage, /<CongregationCalendar\s*\/>/);
    assert.doesNotMatch(homepage, /calendar\.google|googleapis\.com\/calendar|home-calendar-iframe/i);
    assert.match(calendarComponent, /fullcalendar\/daygrid/);
    assert.match(calendarComponent, /fullcalendar\/list/);
    assert.match(calendarComponent, /listMonth/);
    assert.match(calendarComponent, /dayGridMonth/);
    assert.match(calendarComponent, /name="candleLighting" checked/);
    assert.match(calendarComponent, /Shabbat candle lighting/);
    assert.match(calendarComponent, /eventInteractive: true/);
    assert.match(calendarComponent, /class="kehilat-calendar-details"/);
    assert.match(calendarComponent, /Open event details/);
    assert.match(homeStyles, /\[role="gridcell"\] \[role="button"\][^\n]*flex-direction:\s*column/);
    assert.match(calendarComponent, /Hebcal\.com/);
    assert.match(calendarComponent, /CC BY 4\.0/);
    assert.match(calendarEndpoint, /stale-while-revalidate=604800/);
    assert.match(calendarEndpoint, /includeCandleLighting/);
    assert.doesNotMatch(`${calendarComponent}\n${calendarEndpoint}`, /calendar\.google/i);
});
