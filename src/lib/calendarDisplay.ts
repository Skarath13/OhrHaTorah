const hebrewDatePattern = /^(\d{1,2})\s+(.+?)\s+(\d{4})$/u;

const normalizeDisplayText = (value: string | undefined): string =>
    typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';

const getHebrewDateParts = (value: string | undefined): RegExpMatchArray | null =>
    normalizeDisplayText(value).match(hebrewDatePattern);

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
