-- Separate reviewed data operation. Back up D1 and verify row/audit counts first.
-- No seed or content changes. All existing IDs, fields, and audit values are copied.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE congregation_calendar_events_v2 (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  description TEXT CHECK (description IS NULL OR length(description) <= 2000),
  location TEXT CHECK (location IS NULL OR length(location) <= 300),
  time_zone TEXT NOT NULL CHECK (time_zone = 'America/Los_Angeles'),
  schedule_kind TEXT NOT NULL CHECK (schedule_kind IN ('single', 'weekly')),
  event_date TEXT,
  all_day INTEGER CHECK (all_day IS NULL OR all_day IN (0, 1)),
  weekdays_json TEXT CHECK (
    weekdays_json IS NULL OR (
      json_valid(weekdays_json) = 1
      AND json_type(weekdays_json) = 'array'
      AND json_array_length(weekdays_json) BETWEEN 1 AND 7
    )
  ),
  starts_on TEXT,
  ends_on TEXT,
  start_time TEXT,
  end_time TEXT,
  excluded_dates_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(excluded_dates_json) AND json_type(excluded_dates_json) = 'array' AND json_array_length(excluded_dates_json) <= 120),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  CHECK (
    (
      schedule_kind = 'single'
      AND event_date IS NOT NULL
      AND weekdays_json IS NULL
      AND starts_on IS NULL
      AND ends_on IS NULL
      AND (
        (all_day = 1 AND start_time IS NULL AND end_time IS NULL)
        OR
        (all_day = 0 AND start_time IS NOT NULL AND (end_time IS NULL OR end_time > start_time))
      )
    )
    OR
    (
      schedule_kind = 'weekly'
      AND event_date IS NULL
      AND all_day IS NULL
      AND weekdays_json IS NOT NULL
      AND starts_on IS NOT NULL
      AND (ends_on IS NULL OR ends_on >= starts_on)
      AND start_time IS NOT NULL
      AND end_time IS NOT NULL
      AND end_time > start_time
    )
  )
);

INSERT INTO congregation_calendar_events_v2 (id, title, description, location, time_zone, schedule_kind, event_date, all_day, weekdays_json, starts_on, ends_on, start_time, end_time, created_at, updated_at, created_by, updated_by)
SELECT id, title, description, location, time_zone, schedule_kind, event_date, all_day, weekdays_json, starts_on, ends_on, start_time, end_time, created_at, updated_at, created_by, updated_by FROM congregation_calendar_events;
DROP TABLE congregation_calendar_events;
ALTER TABLE congregation_calendar_events_v2 RENAME TO congregation_calendar_events;
CREATE INDEX idx_congregation_calendar_events_updated_at ON congregation_calendar_events(updated_at);
PRAGMA defer_foreign_keys = OFF;
