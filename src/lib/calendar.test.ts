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
const packageManifest = readFileSync(`${repositoryRoot}/package.json`, 'utf8');
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

test('migrated Saturday series expand into concrete, congregation-local dated events', () => {
    const range = parseCalendarRange('2026-08-01', '2026-09-01');
    const events = getCongregationCalendarEvents(range);

    assert.equal(events.length, 15);
    events.forEach((event) => {
        assert.match(event.id, /-2026-08-(?:01|08|15|22|29)$/);
        assert.match(event.start || '', /^2026-08-(?:01|08|15|22|29)T(?:14:30|15:00|16:30):00$/);
        assert.match(event.end || '', /^2026-08-(?:01|08|15|22|29)T(?:15:00|16:30|17:30):00$/);
        assert.equal(event.extendedProps.calendarDate, event.start?.slice(0, 10));
        assert.equal(event.extendedProps.source, 'congregation');
        assert.equal(event.extendedProps.group, 'congregation');
    });
    assert.deepEqual(
        events.filter((event) => event.extendedProps.calendarDate === '2026-08-15').map((event) => event.title),
        [
            'Contemporary Messianic Jewish Music and Dance',
            'Traditional prayers and Torah Service',
            'Interactive Discussion on Weekly Readings (Torah, Haftara, and Brit Chadashah)',
        ],
    );
    assert.doesNotMatch(JSON.stringify(events), /daysOfWeek|startRecur|endRecur/);
});

test('weekly series respect an exclusive query end and never shift business dates', () => {
    const events = getCongregationCalendarEvents(parseCalendarRange('2026-08-15', '2026-08-16'));
    assert.equal(events.length, 3);
    assert.ok(events.every((event) => event.extendedProps.calendarDate === '2026-08-15'));
    assert.ok(events.every((event) => event.start?.startsWith('2026-08-15T')));
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
});

test('homepage uses an event-first upcoming-date feed with no calendar grid or Google integration', () => {
    assert.match(homepage, /<CongregationCalendar\s*\/>/);
    assert.match(homepage, /<h2 id="upcoming-dates">Upcoming Dates<\/h2>/);
    assert.doesNotMatch(homepage, /calendar\.google|googleapis\.com\/calendar|home-calendar-iframe/i);
    assert.doesNotMatch(calendarComponent, /fullcalendar|dayGrid|listMonth|Agenda|role="grid"/i);
    assert.doesNotMatch(packageManifest, /fullcalendar|temporal-polyfill/i);
    assert.match(calendarComponent, /role="feed"/);
    assert.match(calendarComponent, /className = 'kehilat-calendar-date-card'/);
    assert.match(calendarComponent, /className = 'kehilat-calendar-event-list'/);
    assert.match(calendarComponent, /class="kehilat-calendar-show-more"/);
    assert.match(calendarComponent, /mobileDateLimit = 3/);
    assert.match(calendarComponent, /wideDateLimit = 8/);
    assert.match(calendarComponent, /matchMedia\('\(max-width: 599px\)'\)/);
    assert.doesNotMatch(homepage, /without the empty calendar days/i);
    assert.doesNotMatch(calendarComponent, /checkbox|kehilat-calendar-controls|readFilters/i);
    assert.match(calendarComponent, /congregation: '1',[\s\S]*holidays: '1',[\s\S]*candleLighting: '1',[\s\S]*observances: '1'/);
    assert.match(calendarComponent, /Shabbat candle lighting/);
    assert.match(calendarComponent, /class="kehilat-calendar-details"/);
    assert.match(calendarComponent, /textContent = event\.title/);
    assert.match(calendarComponent, /businessTimeZone = 'America\/Los_Angeles'/);
    assert.match(calendarComponent, /extendedProps\.calendarDate/);
    assert.match(calendarComponent, /Hebcal\.com/);
    assert.match(calendarComponent, /CC BY 4\.0/);
    assert.match(calendarEndpoint, /stale-while-revalidate=604800/);
    assert.match(calendarEndpoint, /includeCandleLighting/);
    assert.doesNotMatch(`${calendarComponent}\n${calendarEndpoint}`, /calendar\.google/i);
    assert.match(homeStyles, /\.kehilat-calendar \{[^}]*grid-template-columns: 1fr/s);
    assert.match(homeStyles, /@media \(min-width: 600px\) \{[\s\S]*?\.kehilat-calendar \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(homeStyles, /\.kehilat-calendar-event-title[^}]*overflow-wrap: normal[^}]*word-break: normal/s);
    assert.match(homeStyles, /@media \(max-width: 360px\) \{[\s\S]*?\.kehilat-calendar-event-button \{ grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(homeStyles, /\.kehilat-calendar-show-more\[hidden\],[\s\S]*?\.kehilat-calendar-show-fewer\[hidden\] \{ display: none; \}/);
    assert.doesNotMatch(homeStyles, /--fc-|\[role="gridcell"\]|\[role="list"\]\[aria-label="Events"\]/);
});
