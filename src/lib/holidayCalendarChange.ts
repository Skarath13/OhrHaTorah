import { autumnHolidayServices, holidaySaturdayDates, holidayReplacedSeriesIds } from '../data/holidayServices.ts';

const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const pending = 'NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904)';

/** Produces a reviewable one-time operation; never runs it or connects to D1. */
export function buildAutumn2026CalendarChange(): string {
    const statements = [
        '-- REVIEWED DATA OPERATION ONLY. Never run as part of a normal code deployment.',
        '-- Requires schema migration 0003. Export a backup and review the exact existing rows first.',
        '-- Combines the music/prayer occurrences on three holiday Saturdays into one holiday service.',
        '-- Preserves the weekly series, all other dates, and Kiddush/food/discussion.',
        '-- Existing admin-edited holiday IDs are retained; the one-time marker prevents resurrection on reruns.',
    ];
    for (const event of autumnHolidayServices) {
        if (event.schedule.kind !== 'single' || event.schedule.allDay) throw new Error('Expected timed single holiday services');
        const schedule = event.schedule;
        statements.push(
            'INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)',
            'SELECT ' + [quote(event.id), quote(event.title), quote(event.description ?? ''), quote(event.location ?? ''), quote(event.timeZone), "'single'", quote(schedule.date), '0', quote(schedule.startTime), schedule.endTime ? quote(schedule.endTime) : 'NULL'].join(', '),
            'WHERE ' + pending + ' ON CONFLICT(id) DO NOTHING;',
        );
    }
    for (const date of holidaySaturdayDates) {
        statements.push(
            'UPDATE congregation_calendar_events',
            "SET excluded_dates_json = json_insert(excluded_dates_json, '$[#]', " + quote(date) + '), updated_at = CURRENT_TIMESTAMP, updated_by = NULL',
            'WHERE id IN (' + holidayReplacedSeriesIds.map(quote).join(', ') + ')',
            "AND schedule_kind = 'weekly' AND starts_on <= " + quote(date) + ' AND (ends_on IS NULL OR ends_on >= ' + quote(date) + ')',
            "AND EXISTS (SELECT 1 FROM json_each(weekdays_json) WHERE value = 'saturday')",
            'AND NOT EXISTS (SELECT 1 FROM json_each(excluded_dates_json) WHERE value = ' + quote(date) + ')',
            'AND ' + pending + ';',
        );
    }
    statements.push('INSERT OR IGNORE INTO congregation_calendar_seed_versions(version) VALUES (20260904);', '');
    return statements.join('\n');
}
