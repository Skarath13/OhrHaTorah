import {
    congregationCalendarLocationLabel,
    congregationCalendarZipCode,
    congregationEvents,
    type CongregationEvent,
    type CongregationWeekday,
} from '../data/congregationEvents.ts';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const millisecondsPerDay = 86_400_000;

export const calendarMaximumRangeDays = 400;

export type CalendarDateRange = {
    readonly start: string;
    /** Exclusive Gregorian end date. */
    readonly end: string;
};

export type CalendarEventGroup = 'congregation' | 'candle-lighting' | 'holiday' | 'observance';

export type PublicCalendarEvent = {
    readonly id: string;
    readonly title: string;
    readonly allDay?: boolean;
    readonly start?: string;
    readonly end?: string;
    readonly extendedProps: {
        readonly source: 'congregation' | 'hebcal';
        readonly group: CalendarEventGroup;
        readonly calendarDate?: string;
        readonly description?: string;
        readonly location?: string;
        readonly hebrew?: string;
        readonly hebrewDate?: string;
    };
};

export type HebcalHolidayItem = {
    readonly title: string;
    readonly date: string;
    readonly category: 'holiday' | 'roshchodesh' | 'candles';
    readonly titleOrig?: string;
    readonly subcat?: string;
    readonly hebrew?: string;
    readonly hdate?: string;
    readonly memo?: string;
};

const parseIsoDate = (value: string): number | null => {
    if (!isoDatePattern.test(value)) return null;
    const timestamp = Date.parse(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(timestamp)) return null;
    return new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
};

export const parseCalendarRange = (start: string, end: string): CalendarDateRange => {
    const startTimestamp = parseIsoDate(start);
    const endTimestamp = parseIsoDate(end);
    if (startTimestamp === null || endTimestamp === null) {
        throw new Error('Calendar dates must use valid YYYY-MM-DD values');
    }

    const rangeDays = (endTimestamp - startTimestamp) / millisecondsPerDay;
    if (!Number.isInteger(rangeDays) || rangeDays < 1 || rangeDays > calendarMaximumRangeDays) {
        throw new Error(`Calendar ranges must span 1 to ${calendarMaximumRangeDays} days`);
    }

    return { start, end };
};

const addCalendarDays = (date: string, days: number): string => {
    const timestamp = parseIsoDate(date);
    if (timestamp === null || !Number.isInteger(days)) throw new Error('Invalid calendar date offset');
    return new Date(timestamp + (days * millisecondsPerDay)).toISOString().slice(0, 10);
};

const maxDate = (first: string, second: string): string => first > second ? first : second;
const minDate = (first: string, second: string): string => first < second ? first : second;

const weekdayNumbers: Record<CongregationWeekday, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

const isSingleEventInRange = (date: string, range: CalendarDateRange): boolean =>
    date >= range.start && date < range.end;

const mapCongregationEvent = (
    event: CongregationEvent,
    range: CalendarDateRange,
): PublicCalendarEvent[] => {
    const extendedProps = {
        source: 'congregation' as const,
        group: 'congregation' as const,
        description: event.description,
        location: event.location,
    };

    if (event.schedule.kind === 'single') {
        if (!isSingleEventInRange(event.schedule.date, range)) return [];
        if (event.schedule.allDay) {
            return [{
                id: event.id,
                title: event.title,
                allDay: true,
                start: event.schedule.date,
                extendedProps: {
                    ...extendedProps,
                    calendarDate: event.schedule.date,
                },
            }];
        }

        return [{
            id: event.id,
            title: event.title,
            allDay: false,
            start: `${event.schedule.date}T${event.schedule.startTime}:00`,
            end: `${event.schedule.date}T${event.schedule.endTime}:00`,
            extendedProps: {
                ...extendedProps,
                calendarDate: event.schedule.date,
            },
        }];
    }

    const seriesEndExclusive = event.schedule.endsOn
        ? addCalendarDays(event.schedule.endsOn, 1)
        : range.end;
    const startRecur = maxDate(event.schedule.startsOn, range.start);
    const endRecur = minDate(seriesEndExclusive, range.end);
    if (startRecur >= endRecur) return [];

    const includedWeekdays = new Set(
        event.schedule.weekdays.map((weekday) => weekdayNumbers[weekday]),
    );
    const occurrences: PublicCalendarEvent[] = [];
    for (let calendarDate = startRecur; calendarDate < endRecur; calendarDate = addCalendarDays(calendarDate, 1)) {
        const timestamp = parseIsoDate(calendarDate);
        if (timestamp === null || !includedWeekdays.has(new Date(timestamp).getUTCDay())) continue;
        occurrences.push({
            id: `${event.id}-${calendarDate}`,
            title: event.title,
            allDay: false,
            start: `${calendarDate}T${event.schedule.startTime}:00`,
            end: `${calendarDate}T${event.schedule.endTime}:00`,
            extendedProps: {
                ...extendedProps,
                calendarDate,
            },
        });
    }
    return occurrences;
};

export const getCongregationCalendarEvents = (
    range: CalendarDateRange,
): PublicCalendarEvent[] => congregationEvents
    .flatMap((event) => mapCongregationEvent(event, range));

export const buildHebcalHolidayUrl = (range: CalendarDateRange): string => {
    const url = new URL('https://www.hebcal.com/hebcal');
    const parameters: Record<string, string> = {
        v: '1',
        cfg: 'json',
        start: range.start,
        end: addCalendarDays(range.end, -1),
        i: 'off',
        maj: 'on',
        min: 'on',
        mod: 'on',
        nx: 'on',
        mf: 'on',
        ss: 'on',
        c: 'on',
        zip: congregationCalendarZipCode,
        M: 'on',
        leyning: 'off',
        lg: 'en',
    };
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
};

const toPublicText = (value: unknown, maximumLength: number): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return undefined;
    return normalized.slice(0, maximumLength);
};

export const isHebcalHolidayPayload = (payload: unknown): payload is { items: unknown[] } => {
    if (!payload || typeof payload !== 'object') return false;
    return Array.isArray((payload as { items?: unknown }).items);
};

const parseHebcalHolidayItem = (value: unknown): HebcalHolidayItem | null => {
    if (!value || typeof value !== 'object') return null;
    const item = value as Record<string, unknown>;
    const title = toPublicText(item.title, 160);
    const dateValue = toPublicText(item.date, 48);
    const calendarDate = dateValue?.slice(0, 10);
    const category = item.category;
    if (!title || !dateValue || !calendarDate || parseIsoDate(calendarDate) === null) return null;
    if (category !== 'holiday' && category !== 'roshchodesh' && category !== 'candles') return null;

    const date = category === 'candles' ? dateValue : calendarDate;
    if (category === 'candles') {
        const zonedTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;
        if (!zonedTimestampPattern.test(date) || !Number.isFinite(Date.parse(date))) return null;
    }

    return {
        title,
        date,
        category,
        titleOrig: toPublicText(item.title_orig, 120),
        subcat: toPublicText(item.subcat, 40),
        hebrew: toPublicText(item.hebrew, 160),
        hdate: toPublicText(item.hdate, 80),
        memo: toPublicText(item.memo, 600),
    };
};

export const getHebcalEventGroup = (item: HebcalHolidayItem): Exclude<CalendarEventGroup, 'congregation'> => {
    if (item.category === 'candles') return 'candle-lighting';
    if (item.category === 'roshchodesh') return 'observance';
    if (item.subcat === 'fast' || item.subcat === 'shabbat') return 'observance';
    return 'holiday';
};

const eventIdPart = (value: string): string => value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'event';

export const getHebcalCalendarEvents = (
    payload: unknown,
    range: CalendarDateRange,
    options: {
        readonly includeHolidays: boolean;
        readonly includeObservances: boolean;
        readonly includeCandleLighting: boolean;
    },
): PublicCalendarEvent[] => {
    if (!isHebcalHolidayPayload(payload)) throw new Error('Hebcal returned an invalid calendar payload');

    return payload.items
        .map(parseHebcalHolidayItem)
        .filter((item): item is HebcalHolidayItem => item !== null)
        .filter((item) => isSingleEventInRange(item.date.slice(0, 10), range))
        .filter((item) => {
            const group = getHebcalEventGroup(item);
            if (group === 'candle-lighting') {
                if (!options.includeCandleLighting) return false;
                const calendarDate = item.date.slice(0, 10);
                return new Date(`${calendarDate}T12:00:00.000Z`).getUTCDay() === 5;
            }
            return group === 'holiday' ? options.includeHolidays : options.includeObservances;
        })
        .map((item, index) => {
            const group = getHebcalEventGroup(item);
            const calendarDate = item.date.slice(0, 10);
            return {
                id: `hebcal-${calendarDate}-${eventIdPart(item.titleOrig || item.title)}-${index}`,
                title: group === 'candle-lighting' ? 'Shabbat Candle Lighting' : item.title,
                allDay: group !== 'candle-lighting',
                start: item.date,
                extendedProps: {
                    source: 'hebcal',
                    group,
                    calendarDate,
                    description: item.memo,
                    location: group === 'candle-lighting'
                        ? congregationCalendarLocationLabel
                        : undefined,
                    hebrew: item.hebrew,
                    hebrewDate: item.hdate,
                },
            } satisfies PublicCalendarEvent;
        });
};
