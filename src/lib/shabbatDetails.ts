export const CONGREGATION_TIME_ZONE = 'America/Los_Angeles';

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const getZonedCalendarParts = (
    now: Date,
    timeZone: string
): { year: number; month: number; day: number; weekday: number } => {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        }).formatToParts(now).map(({ type, value }) => [type, value])
    );
    const weekdays: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6
    };
    const weekday = weekdays[parts.weekday];
    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);

    if (!Number.isInteger(weekday) || !year || !month || !day) {
        throw new Error('Could not determine the congregation calendar date');
    }

    return { year, month, day, weekday };
};

const toCalendarDate = (date: Date): string => date.toISOString().slice(0, 10);

export const addCalendarDays = (calendarDate: string, days: number): string => {
    const match = calendarDate.match(calendarDatePattern);
    if (!match || !Number.isInteger(days)) {
        throw new Error('Invalid calendar date or offset');
    }

    const date = new Date(Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        12
    ));
    date.setUTCDate(date.getUTCDate() + days);
    return toCalendarDate(date);
};

export const getNextFridayDate = (
    now = new Date(),
    timeZone = CONGREGATION_TIME_ZONE
): string => {
    const { year, month, day, weekday } = getZonedCalendarParts(now, timeZone);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    date.setUTCDate(date.getUTCDate() + ((5 - weekday + 7) % 7));
    return toCalendarDate(date);
};

export const getCalendarDateParts = (
    calendarDate: string
): { year: string; month: string; day: string } => {
    const match = calendarDate.match(calendarDatePattern);
    if (!match) throw new Error('Invalid calendar date');
    return { year: match[1], month: match[2], day: match[3] };
};

export const formatCongregationDate = (
    isoDate: string,
    timeZone = CONGREGATION_TIME_ZONE
): string => new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
}).format(new Date(isoDate));

export const formatCongregationTime = (
    isoDate: string,
    timeZone = CONGREGATION_TIME_ZONE
): string => new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
}).format(new Date(isoDate)).toLowerCase();
