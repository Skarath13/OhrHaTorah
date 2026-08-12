export const congregationCalendarTimeZone = 'America/Los_Angeles' as const;
export const congregationCalendarZipCode = '92708' as const;
export const congregationCalendarLocationLabel = 'Fountain Valley, CA 92708' as const;

export type CongregationWeekday =
    | 'sunday'
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday';

export type SingleEventSchedule = {
    readonly kind: 'single';
    /** Gregorian calendar date in YYYY-MM-DD form. */
    readonly date: string;
    readonly allDay: true;
} | {
    readonly kind: 'single';
    /** Gregorian calendar date in YYYY-MM-DD form. */
    readonly date: string;
    readonly allDay: false;
    /** Congregation-local 24-hour time in HH:MM form. */
    readonly startTime: string;
    /** Congregation-local 24-hour time in HH:MM form. */
    readonly endTime: string;
};

export type WeeklyEventSchedule = {
    readonly kind: 'weekly';
    readonly interval: 1;
    readonly weekdays: readonly CongregationWeekday[];
    /** Inclusive Gregorian recurrence start in YYYY-MM-DD form. */
    readonly startsOn: string;
    /** Optional inclusive Gregorian recurrence end in YYYY-MM-DD form. */
    readonly endsOn?: string;
    /** Congregation-local 24-hour time in HH:MM form. */
    readonly startTime: string;
    /** Congregation-local 24-hour time in HH:MM form. */
    readonly endTime: string;
};

export type CongregationEvent = {
    /** Stable local identifier; never use a third-party event identifier here. */
    readonly id: string;
    readonly title: string;
    readonly description?: string;
    readonly location?: string;
    readonly timeZone: typeof congregationCalendarTimeZone;
    readonly schedule: SingleEventSchedule | WeeklyEventSchedule;
};

/**
 * Public congregation events owned by this site.
 *
 * These three weekly series were migrated from the former public calendar on
 * 2026-08-11. Third-party identifiers and sync metadata were intentionally
 * discarded; see docs/calendar-events.md for the migration record.
 */
export const congregationEvents: readonly CongregationEvent[] = [
    {
        id: 'shabbat-messianic-music-and-dance',
        title: 'Contemporary Messianic Jewish Music and Dance',
        timeZone: congregationCalendarTimeZone,
        schedule: {
            kind: 'weekly',
            interval: 1,
            weekdays: ['saturday'],
            startsOn: '2025-06-14',
            startTime: '14:30',
            endTime: '15:00',
        },
    },
    {
        id: 'shabbat-traditional-prayers-and-torah-service',
        title: 'Traditional prayers and Torah Service',
        timeZone: congregationCalendarTimeZone,
        schedule: {
            kind: 'weekly',
            interval: 1,
            weekdays: ['saturday'],
            startsOn: '2025-06-28',
            startTime: '15:00',
            endTime: '16:30',
        },
    },
    {
        id: 'shabbat-weekly-readings-discussion',
        title: 'Interactive Discussion on Weekly Readings (Torah, Haftara, and Brit Chadashah)',
        timeZone: congregationCalendarTimeZone,
        schedule: {
            kind: 'weekly',
            interval: 1,
            weekdays: ['saturday'],
            startsOn: '2025-06-28',
            startTime: '16:30',
            endTime: '17:30',
        },
    },
] as const;
