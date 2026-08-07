export interface ParashahData {
    name: string;
    torah: string;
    haftarah: string;
    date?: string;
    source?: string;
    year?: number;
}

export interface ParashahBundle {
    annual: ParashahData;
    triennial: ParashahData | null;
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null => {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as UnknownRecord
        : null;
};

const asString = (value: unknown): string | null => {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const parseStringReading = (value: unknown) => {
    const reading = asString(value);
    if (!reading) return null;

    const match = reading.match(/^(.+?)\s+(\d+:\d+)-(\d+:\d+)$/);
    if (!match) return null;

    return { book: match[1], begin: match[2], end: match[3] };
};

export const formatStringReadingRange = (value: unknown): string | null => {
    const readings = asRecord(value);
    const first = parseStringReading(readings?.['1']);
    const last = parseStringReading(readings?.['7']);
    if (!first || !last) return null;

    return first.book === last.book
        ? `${first.book} ${first.begin}-${last.end}`
        : `${first.book} ${first.begin}-${last.book} ${last.end}`;
};

export const formatStructuredReadingRange = (value: unknown): string | null => {
    const readings = asRecord(value);
    const first = asRecord(readings?.['1']);
    const last = asRecord(readings?.['7']);
    const firstBook = asString(first?.k);
    const firstVerse = asString(first?.b);
    const lastBook = asString(last?.k);
    const lastVerse = asString(last?.e);

    if (!firstBook || !firstVerse || !lastBook || !lastVerse) return null;

    return firstBook === lastBook
        ? `${firstBook} ${firstVerse}-${lastVerse}`
        : `${firstBook} ${firstVerse}-${lastBook} ${lastVerse}`;
};

const getParashahName = (item: UnknownRecord): string | null => {
    const name = asRecord(item.name);
    return asString(name?.en)
        || asString(item.title_orig)?.replace(/^Parashat\s+/, '')
        || asString(item.title)?.replace(/^Parashat\s+/, '')
        || null;
};

export const parseShabbatPayload = (payload: unknown): ParashahBundle | null => {
    const root = asRecord(payload);
    const items = Array.isArray(root?.items) ? root.items : [];
    const item = items
        .map(asRecord)
        .find((candidate) => candidate?.category === 'parashat');
    if (!item) return null;

    const name = getParashahName(item);
    const date = asString(item.date);
    const leyning = asRecord(item.leyning);
    if (!name || !date || !leyning) return null;

    const embeddedTriennial = formatStringReadingRange(leyning.triennial);
    const annual: ParashahData = {
        name,
        torah: asString(leyning.torah) || 'See weekly bulletin',
        haftarah: asString(leyning.haftarah) || 'See weekly bulletin',
        date,
        source: 'Hebcal Shabbat'
    };

    return {
        annual,
        triennial: embeddedTriennial
            ? {
                name,
                torah: embeddedTriennial,
                haftarah: 'See weekly bulletin',
                date,
                source: 'Hebcal Shabbat'
            }
            : null
    };
};

export const parseLeyningPayload = (
    payload: unknown,
    expectedDate: string
): ParashahBundle | null => {
    const root = asRecord(payload);
    const items = Array.isArray(root?.items) ? root.items : [];
    const item = items
        .map(asRecord)
        .find((candidate) => candidate?.date === expectedDate && candidate?.type === 'shabbat');
    if (!item) return null;

    const name = getParashahName(item);
    const date = asString(item.date);
    if (!name || !date) return null;

    const fullKriyah = formatStructuredReadingRange(item.fullkriyah);
    const triennialTorah = formatStructuredReadingRange(item.triennial);
    const triYearValue = typeof item.triYear === 'number' ? item.triYear : Number.NaN;
    const triYear = Number.isInteger(triYearValue) && triYearValue >= 1 && triYearValue <= 3
        ? triYearValue
        : undefined;

    return {
        annual: {
            name,
            torah: asString(item.summary) || fullKriyah || 'See weekly bulletin',
            haftarah: asString(item.haftara) || 'See weekly bulletin',
            date,
            source: 'Hebcal Leyning'
        },
        triennial: triennialTorah
            ? {
                name,
                torah: triennialTorah,
                haftarah: asString(item.triHaftara) || 'See weekly bulletin',
                date,
                source: 'Hebcal Leyning',
                year: triYear
            }
            : null
    };
};

export const getUpcomingShabbatDate = (
    now = new Date(),
    timeZone = 'America/Los_Angeles'
): string => {
    const dateParts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
    }).formatToParts(now);
    const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const weekdayIndex: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6
    };
    const weekday = weekdayIndex[parts.weekday];
    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);
    if (!Number.isInteger(weekday) || !year || !month || !day) {
        throw new Error('Could not determine the upcoming Shabbat date');
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + ((6 - weekday + 7) % 7));
    return date.toISOString().slice(0, 10);
};

export const formatParashahDate = (date: string): string => {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return date;
    const safeDate = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
    return safeDate.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric'
    });
};
