# Congregation calendar events

The website owns its congregation-event data in `src/data/congregationEvents.ts`. This file is the source for congregation events shown alongside the Jewish holiday calendar; it does not synchronize with a third-party calendar.

## Adding an event

Add one object to `congregationEvents` with a unique, descriptive local `id`, a public `title`, the congregation time zone, and one of these schedules:

- `single` with `date` and `allDay: true` for an all-day event.
- `single` with `date`, `allDay: false`, `startTime`, and `endTime` for a one-time timed event.
- `weekly` with `interval: 1`, `weekdays`, `startsOn`, `startTime`, and `endTime` for a weekly series. Add `endsOn` only when the series has a known final date.

Dates use Gregorian `YYYY-MM-DD` form. Times use 24-hour `HH:MM` form in `America/Los_Angeles`. Include `description` and `location` only when they are approved for the public website. Run `npm test` after editing; the calendar contract checks stable IDs and valid schedule values.

## Generated Shabbat candle-lighting times

The calendar API requests candle-lighting data from Hebcal in the same cached, server-side request used for Jewish holidays. It uses the congregation ZIP code `92708`, preserves Hebcal's time-zone-aware timestamp, and publishes Friday entries as `Shabbat Candle Lighting`. These generated times are not stored in `congregationEvents`; changing congregation events does not change the location used for candle-lighting calculations.

## 2026-08-11 migration record

The former publicly embedded production calendar was captured from its public ICS export at `2026-08-12T04:36:19Z` (`2026-08-11 21:36:19 PDT`) before the integration was removed. The snapshot contained exactly three confirmed events, each recurring every Saturday without an end date:

| Public event | Local schedule | Recurrence begins |
| --- | --- | --- |
| Contemporary Messianic Jewish Music and Dance | 2:30–3:00 pm | June 14, 2025 |
| Traditional prayers and Torah Service | 3:00–4:30 pm | June 28, 2025 |
| Interactive Discussion on Weekly Readings (Torah, Haftara, and Brit Chadashah) | 4:30–5:30 pm | June 28, 2025 |

The public export supplied no descriptions, locations, organizers, attendees, event URLs, or attachments. Google event identifiers, creation and modification timestamps, sequence values, and synchronization metadata were intentionally discarded. The raw export is not stored in the repository. Its audit-only SHA-256 digest is `b6b20f1bfde4aad8d2184c99251c3b69b413e11c136ec84df037a86b8eb1cd1a`.
