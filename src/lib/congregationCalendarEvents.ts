import {
  congregationCalendarTimeZone,
  type CongregationEvent,
  type CongregationWeekday,
  type SingleEventSchedule,
  type WeeklyEventSchedule,
} from '../data/congregationEvents.ts';

export const calendarEventTitleMaximumLength = 160;
export const calendarEventDescriptionMaximumLength = 2000;
export const calendarEventLocationMaximumLength = 300;
export const calendarEventJsonMaximumBytes = 16 * 1024;

export const congregationWeekdays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const satisfies readonly CongregationWeekday[];

export type CalendarEventDraft = Omit<CongregationEvent, 'id' | 'timeZone'>;

export type ManagedCongregationEvent = CongregationEvent & {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: number | null;
  readonly updatedBy: number | null;
};

export type CalendarEventValidationIssue = {
  readonly path: string;
  readonly message: string;
};

export type CalendarEventValidationResult =
  | { readonly success: true; readonly data: CalendarEventDraft }
  | { readonly success: false; readonly issues: readonly CalendarEventValidationIssue[] };

type CalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  time_zone: string;
  schedule_kind: 'single' | 'weekly';
  event_date: string | null;
  all_day: number | null;
  weekdays_json: string | null;
  starts_on: string | null;
  ends_on: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
};

type StoredCalendarEventValues = {
  eventDate: string | null;
  allDay: number | null;
  weekdaysJson: string | null;
  startsOn: string | null;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const localTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const calendarEventIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const forbiddenControlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const weekdaySet = new Set<CongregationWeekday>(congregationWeekdays);

const selectedColumns = `
  id,
  title,
  description,
  location,
  time_zone,
  schedule_kind,
  event_date,
  all_day,
  weekdays_json,
  starts_on,
  ends_on,
  start_time,
  end_time,
  created_at,
  updated_at,
  created_by,
  updated_by
`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isValidGregorianCalendarDate = (value: string): boolean => {
  if (!isoDatePattern.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp)
    && new Date(timestamp).toISOString().slice(0, 10) === value;
};

export const isValidCongregationCalendarEventId = (value: string): boolean =>
  value.length >= 1
  && value.length <= 128
  && calendarEventIdPattern.test(value);

const normalizeText = (value: string, multiline: boolean): string => {
  const normalized = value.normalize('NFC').replace(/\r\n?/g, '\n').trim();
  return multiline ? normalized : normalized.replace(/\s+/g, ' ');
};

const readRequiredText = (
  record: Record<string, unknown>,
  field: string,
  maximumLength: number,
  issues: CalendarEventValidationIssue[],
): string | undefined => {
  const value = record[field];
  if (typeof value !== 'string') {
    issues.push({ path: field, message: 'Must be a string' });
    return undefined;
  }

  const normalized = normalizeText(value, false);
  if (!normalized) {
    issues.push({ path: field, message: 'Cannot be empty' });
    return undefined;
  }
  if (normalized.length > maximumLength) {
    issues.push({ path: field, message: `Must be ${maximumLength} characters or fewer` });
  }
  if (forbiddenControlCharacterPattern.test(normalized)) {
    issues.push({ path: field, message: 'Contains unsupported control characters' });
  }
  return normalized;
};

const readOptionalText = (
  record: Record<string, unknown>,
  field: string,
  maximumLength: number,
  multiline: boolean,
  issues: CalendarEventValidationIssue[],
): string | undefined => {
  const value = record[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    issues.push({ path: field, message: 'Must be a string when provided' });
    return undefined;
  }

  const normalized = normalizeText(value, multiline);
  if (!normalized) return undefined;
  if (normalized.length > maximumLength) {
    issues.push({ path: field, message: `Must be ${maximumLength} characters or fewer` });
  }
  if (forbiddenControlCharacterPattern.test(normalized)) {
    issues.push({ path: field, message: 'Contains unsupported control characters' });
  }
  return normalized;
};

const readDate = (
  schedule: Record<string, unknown>,
  field: string,
  issues: CalendarEventValidationIssue[],
  optional = false,
): string | undefined => {
  const value = schedule[field];
  if (optional && (value === undefined || value === null || value === '')) return undefined;
  if (typeof value !== 'string' || !isValidGregorianCalendarDate(value)) {
    issues.push({ path: `schedule.${field}`, message: 'Must be a real Gregorian date in YYYY-MM-DD form' });
    return undefined;
  }
  return value;
};

const readTime = (
  schedule: Record<string, unknown>,
  field: string,
  issues: CalendarEventValidationIssue[],
): string | undefined => {
  const value = schedule[field];
  if (typeof value !== 'string' || !localTimePattern.test(value)) {
    issues.push({ path: `schedule.${field}`, message: 'Must be a 24-hour time in HH:MM form' });
    return undefined;
  }
  return value;
};

const validateTimeOrder = (
  startTime: string | undefined,
  endTime: string | undefined,
  issues: CalendarEventValidationIssue[],
): void => {
  if (startTime && endTime && endTime <= startTime) {
    issues.push({ path: 'schedule.endTime', message: 'Must be later than startTime on the same day' });
  }
};

const readSingleSchedule = (
  schedule: Record<string, unknown>,
  issues: CalendarEventValidationIssue[],
): SingleEventSchedule | undefined => {
  const date = readDate(schedule, 'date', issues);
  if (schedule.allDay === true) {
    return date ? { kind: 'single', date, allDay: true } : undefined;
  }
  if (schedule.allDay !== false) {
    issues.push({ path: 'schedule.allDay', message: 'Must be true or false for a single event' });
    return undefined;
  }

  const startTime = readTime(schedule, 'startTime', issues);
  const endTime = readTime(schedule, 'endTime', issues);
  validateTimeOrder(startTime, endTime, issues);
  return date && startTime && endTime
    ? { kind: 'single', date, allDay: false, startTime, endTime }
    : undefined;
};

const readWeeklySchedule = (
  schedule: Record<string, unknown>,
  issues: CalendarEventValidationIssue[],
): WeeklyEventSchedule | undefined => {
  if (schedule.interval !== 1) {
    issues.push({ path: 'schedule.interval', message: 'Weekly events must use an interval of 1' });
  }

  const weekdayValues = schedule.weekdays;
  let weekdays: CongregationWeekday[] | undefined;
  if (!Array.isArray(weekdayValues) || weekdayValues.length < 1 || weekdayValues.length > 7) {
    issues.push({ path: 'schedule.weekdays', message: 'Must contain 1 to 7 unique weekdays' });
  } else {
    const requestedWeekdays = new Set<CongregationWeekday>();
    for (const value of weekdayValues) {
      if (typeof value !== 'string' || !weekdaySet.has(value as CongregationWeekday)) {
        issues.push({ path: 'schedule.weekdays', message: 'Contains an unsupported weekday' });
        continue;
      }
      const weekday = value as CongregationWeekday;
      if (requestedWeekdays.has(weekday)) {
        issues.push({ path: 'schedule.weekdays', message: 'Cannot contain duplicate weekdays' });
      }
      requestedWeekdays.add(weekday);
    }
    weekdays = congregationWeekdays.filter((weekday) => requestedWeekdays.has(weekday));
  }

  const startsOn = readDate(schedule, 'startsOn', issues);
  const endsOn = readDate(schedule, 'endsOn', issues, true);
  if (startsOn && endsOn && endsOn < startsOn) {
    issues.push({ path: 'schedule.endsOn', message: 'Must be on or after startsOn' });
  }
  const startTime = readTime(schedule, 'startTime', issues);
  const endTime = readTime(schedule, 'endTime', issues);
  validateTimeOrder(startTime, endTime, issues);

  if (!weekdays || !startsOn || !startTime || !endTime || schedule.interval !== 1) return undefined;
  return {
    kind: 'weekly',
    interval: 1,
    weekdays,
    startsOn,
    ...(endsOn ? { endsOn } : {}),
    startTime,
    endTime,
  };
};

export const validateCalendarEventDraft = (value: unknown): CalendarEventValidationResult => {
  if (!isRecord(value)) {
    return {
      success: false,
      issues: [{ path: '$', message: 'Calendar event must be a JSON object' }],
    };
  }

  const issues: CalendarEventValidationIssue[] = [];
  const title = readRequiredText(value, 'title', calendarEventTitleMaximumLength, issues);
  const description = readOptionalText(
    value,
    'description',
    calendarEventDescriptionMaximumLength,
    true,
    issues,
  );
  const location = readOptionalText(
    value,
    'location',
    calendarEventLocationMaximumLength,
    false,
    issues,
  );

  const rawSchedule = value.schedule;
  let schedule: SingleEventSchedule | WeeklyEventSchedule | undefined;
  if (!isRecord(rawSchedule)) {
    issues.push({ path: 'schedule', message: 'Must be an event schedule object' });
  } else if (rawSchedule.kind === 'single') {
    schedule = readSingleSchedule(rawSchedule, issues);
  } else if (rawSchedule.kind === 'weekly') {
    schedule = readWeeklySchedule(rawSchedule, issues);
  } else {
    issues.push({ path: 'schedule.kind', message: 'Must be single or weekly' });
  }

  if (issues.length > 0 || !title || !schedule) return { success: false, issues };
  return {
    success: true,
    data: {
      title,
      ...(description ? { description } : {}),
      ...(location ? { location } : {}),
      schedule,
    },
  };
};

export class CalendarEventRequestBodyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'CalendarEventRequestBodyError';
    this.status = status;
  }
}

export const readCalendarEventJsonBody = async (request: Request): Promise<unknown> => {
  const mediaType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new CalendarEventRequestBodyError(415, 'Content-Type must be application/json');
  }

  const declaredLength = Number.parseInt(request.headers.get('Content-Length') || '', 10);
  if (Number.isFinite(declaredLength) && declaredLength > calendarEventJsonMaximumBytes) {
    throw new CalendarEventRequestBodyError(413, 'Calendar event request is too large');
  }
  if (!request.body) {
    throw new CalendarEventRequestBodyError(400, 'A JSON request body is required');
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let body = '';
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > calendarEventJsonMaximumBytes) {
        await reader.cancel();
        throw new CalendarEventRequestBodyError(413, 'Calendar event request is too large');
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch (error) {
    if (error instanceof CalendarEventRequestBodyError) throw error;
    throw new CalendarEventRequestBodyError(400, 'Calendar event request must be valid UTF-8 JSON');
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new CalendarEventRequestBodyError(400, 'Calendar event request must contain valid JSON');
  }
};

export const createCongregationCalendarEventId = (): string =>
  `calendar-${crypto.randomUUID()}`;

const toStoredValues = (draft: CalendarEventDraft): StoredCalendarEventValues => {
  if (draft.schedule.kind === 'single') {
    return {
      eventDate: draft.schedule.date,
      allDay: draft.schedule.allDay ? 1 : 0,
      weekdaysJson: null,
      startsOn: null,
      endsOn: null,
      startTime: draft.schedule.allDay ? null : draft.schedule.startTime,
      endTime: draft.schedule.allDay ? null : draft.schedule.endTime,
    };
  }

  return {
    eventDate: null,
    allDay: null,
    weekdaysJson: JSON.stringify(draft.schedule.weekdays),
    startsOn: draft.schedule.startsOn,
    endsOn: draft.schedule.endsOn || null,
    startTime: draft.schedule.startTime,
    endTime: draft.schedule.endTime,
  };
};

const assertAuditUserId = (value: unknown, field: string): number | null => {
  if (value === null) return null;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  throw new Error(`Invalid ${field} in congregation calendar storage`);
};

const mapCalendarEventRow = (row: CalendarEventRow): ManagedCongregationEvent => {
  if (!isValidCongregationCalendarEventId(row.id)) {
    throw new Error('Invalid event id in congregation calendar storage');
  }
  if (row.time_zone !== congregationCalendarTimeZone) {
    throw new Error('Invalid time zone in congregation calendar storage');
  }

  let schedule: Record<string, unknown>;
  if (row.schedule_kind === 'single') {
    if (row.all_day !== 0 && row.all_day !== 1) {
      throw new Error('Invalid all-day value in congregation calendar storage');
    }
    schedule = row.all_day === 1
      ? { kind: 'single', date: row.event_date, allDay: true }
      : {
          kind: 'single',
          date: row.event_date,
          allDay: false,
          startTime: row.start_time,
          endTime: row.end_time,
        };
  } else if (row.schedule_kind === 'weekly') {
    let weekdays: unknown;
    try {
      weekdays = JSON.parse(row.weekdays_json || '');
    } catch {
      throw new Error('Invalid weekdays JSON in congregation calendar storage');
    }
    schedule = {
      kind: 'weekly',
      interval: 1,
      weekdays,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      startTime: row.start_time,
      endTime: row.end_time,
    };
  } else {
    throw new Error('Invalid schedule kind in congregation calendar storage');
  }

  const validated = validateCalendarEventDraft({
    title: row.title,
    description: row.description,
    location: row.location,
    schedule,
  });
  if (!validated.success) {
    throw new Error('Invalid congregation calendar event stored in database');
  }
  if (!row.created_at || !row.updated_at) {
    throw new Error('Missing audit timestamp in congregation calendar storage');
  }

  return {
    id: row.id,
    ...validated.data,
    timeZone: congregationCalendarTimeZone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: assertAuditUserId(row.created_by, 'created_by'),
    updatedBy: assertAuditUserId(row.updated_by, 'updated_by'),
  };
};

export const getManagedCongregationCalendarEvents = async (
  db: D1Database,
): Promise<ManagedCongregationEvent[]> => {
  const result = await db.prepare(`
    SELECT ${selectedColumns}
    FROM congregation_calendar_events
    ORDER BY COALESCE(event_date, starts_on), COALESCE(start_time, ''), title, id
  `).all<CalendarEventRow>();

  return (result.results || []).map(mapCalendarEventRow);
};

export const getManagedCongregationCalendarEvent = async (
  db: D1Database,
  id: string,
): Promise<ManagedCongregationEvent | null> => {
  const row = await db.prepare(`
    SELECT ${selectedColumns}
    FROM congregation_calendar_events
    WHERE id = ?
  `).bind(id).first<CalendarEventRow>();

  return row ? mapCalendarEventRow(row) : null;
};

export const createManagedCongregationCalendarEvent = async (
  db: D1Database,
  id: string,
  draft: CalendarEventDraft,
  userId: number,
): Promise<ManagedCongregationEvent> => {
  const stored = toStoredValues(draft);
  await db.prepare(`
    INSERT INTO congregation_calendar_events (
      id,
      title,
      description,
      location,
      time_zone,
      schedule_kind,
      event_date,
      all_day,
      weekdays_json,
      starts_on,
      ends_on,
      start_time,
      end_time,
      created_by,
      updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    draft.title,
    draft.description || null,
    draft.location || null,
    congregationCalendarTimeZone,
    draft.schedule.kind,
    stored.eventDate,
    stored.allDay,
    stored.weekdaysJson,
    stored.startsOn,
    stored.endsOn,
    stored.startTime,
    stored.endTime,
    userId,
    userId,
  ).run();

  const created = await getManagedCongregationCalendarEvent(db, id);
  if (!created) throw new Error('Calendar event insert did not return a stored event');
  return created;
};

export const updateManagedCongregationCalendarEvent = async (
  db: D1Database,
  id: string,
  draft: CalendarEventDraft,
  userId: number,
): Promise<ManagedCongregationEvent | null> => {
  const stored = toStoredValues(draft);
  const result = await db.prepare(`
    UPDATE congregation_calendar_events SET
      title = ?,
      description = ?,
      location = ?,
      time_zone = ?,
      schedule_kind = ?,
      event_date = ?,
      all_day = ?,
      weekdays_json = ?,
      starts_on = ?,
      ends_on = ?,
      start_time = ?,
      end_time = ?,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = ?
    WHERE id = ?
  `).bind(
    draft.title,
    draft.description || null,
    draft.location || null,
    congregationCalendarTimeZone,
    draft.schedule.kind,
    stored.eventDate,
    stored.allDay,
    stored.weekdaysJson,
    stored.startsOn,
    stored.endsOn,
    stored.startTime,
    stored.endTime,
    userId,
    id,
  ).run();

  if ((result.meta.changes || 0) < 1) return null;
  return getManagedCongregationCalendarEvent(db, id);
};

export const deleteManagedCongregationCalendarEvent = async (
  db: D1Database,
  id: string,
): Promise<boolean> => {
  const result = await db.prepare(
    'DELETE FROM congregation_calendar_events WHERE id = ?',
  ).bind(id).run();
  return (result.meta.changes || 0) > 0;
};
