# Congregation calendar events

When D1 is bound, the `congregation_calendar_events` table is authoritative for congregation events. Manage those records through the authenticated calendar editor. `src/data/congregationEvents.ts` supplies bundled defaults only when D1 is not bound; an empty or unavailable bound database must never restore those defaults. Congregation records do not synchronize with a third-party calendar.

## Adding an event

Use the authenticated calendar editor for an established site. The event contract supports a public `title`, the congregation time zone, and one of these schedules:

- `single` with `date` and `allDay: true` for an all-day event.
- `single` with `date`, `allDay: false`, `startTime`, and optional `endTime` for a one-time timed event.
- `weekly` with `interval: 1`, `weekdays`, `startsOn`, `startTime`, and `endTime` for a weekly series. Add `endsOn` only when the series has a known final date, and `excludedDates` for individual occurrences to skip.

Dates use Gregorian `YYYY-MM-DD` form. Times use 24-hour `HH:MM` form in `America/Los_Angeles`. Include `description` and `location` only when they are approved for the public website. If an end time is supplied, it must be later than the start on that day. Do not invent durations. Weekly exceptions must be real occurrences within the series. These writes require structural migration 0003; see [the autumn change review](data-changes/README.md). Run `npm test` after code changes. Runtime data changes remain separate from code deployment; follow `docs/production-data-safety.md`.

## Generated Shabbat candle-lighting times

The calendar API requests candle-lighting data from Hebcal in the same server-side request used for Jewish holidays. It uses the congregation ZIP code `92708`, preserves Hebcal's time-zone-aware timestamp, and publishes Friday entries as `Shabbat Candle Lighting`. These generated times are not stored in congregation event records; changing those records does not change the location used for candle-lighting calculations.

## 2026-08-11 migration record

The former publicly embedded production calendar was captured from its public ICS export at `2026-08-12T04:36:19Z` (`2026-08-11 21:36:19 PDT`) before the integration was removed. The snapshot contained exactly three confirmed events, each recurring every Saturday without an end date:

| Public event | Local schedule | Recurrence begins |
| --- | --- | --- |
| Contemporary Messianic Jewish Music and Dance | 2:30–3:00 pm | June 14, 2025 |
| Traditional prayers and Torah Service | 3:00–4:30 pm | June 28, 2025 |
| Interactive Discussion on Weekly Readings (Torah, Haftara, and Brit Chadashah) | 4:30–5:30 pm | June 28, 2025 |

The public export supplied no descriptions, locations, organizers, attendees, event URLs, or attachments. Google event identifiers, creation and modification timestamps, sequence values, and synchronization metadata were intentionally discarded. The raw export is not stored in the repository. Its audit-only SHA-256 digest is `b6b20f1bfde4aad8d2184c99251c3b69b413e11c136ec84df037a86b8eb1cd1a`.
