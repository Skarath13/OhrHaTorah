import type { PublicCalendarEvent } from './calendar.ts';

const hebrewDatePattern = /^(\d{1,2})\s+(.+?)\s+(\d{4})$/u;

const normalizeDisplayText = (value: string | undefined): string =>
    typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';

const getHebrewDateParts = (value: string | undefined): RegExpMatchArray | null =>
    normalizeDisplayText(value).match(hebrewDatePattern);

const formatClockTime = (value: string | undefined): string => {
    const match = value?.match(/T(\d{2}):(\d{2})/);
    if (!match) return '';
    const hours = Number(match[1]);
    const minutes = match[2];
    const period = hours >= 12 ? 'p.m.' : 'a.m.';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
};

export const formatCalendarEventTime = (
    event: Pick<PublicCalendarEvent, 'title' | 'allDay' | 'start' | 'end' | 'extendedProps'>,
): string => {
    if (event.allDay) {
        // A date-only Hebcal record identifies an observance date, not its
        // duration. Erev supplies evening context without a precise time.
        if (event.extendedProps.source === 'hebcal') {
            return /^Erev\b/i.test(normalizeDisplayText(event.title)) ? 'Evening' : '';
        }
        return 'All day';
    }
    const startTime = formatClockTime(event.start);
    const endTime = formatClockTime(event.end);
    if (!startTime) return 'Time to be announced';
    return endTime ? `${startTime}–${endTime}` : startTime;
};

export const formatHebrewCalendarDate = (value: string | undefined): string => {
    const normalized = normalizeDisplayText(value);
    const match = getHebrewDateParts(normalized);
    if (!match) return normalized;

    const [, day, month, year] = match;
    return `${month} ${day}, ${year}`;
};

export const stripRepeatedHebrewYear = (
    value: string | undefined,
    hebrewDate: string | undefined,
): string => {
    const normalized = normalizeDisplayText(value);
    const year = getHebrewDateParts(hebrewDate)?.[3];
    if (!year) return normalized;

    const repeatedYearSuffix = ` ${year}`;
    return normalized.endsWith(repeatedYearSuffix)
        ? normalized.slice(0, -repeatedYearSuffix.length).trimEnd()
        : normalized;
};
