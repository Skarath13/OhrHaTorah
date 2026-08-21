-- Apply only to the Chuck staging site database:
-- ohrhatorah-staging-db (3452876a-7ea9-499c-8efe-e1205e83d9a5)

CREATE TABLE IF NOT EXISTS congregation_calendar_events (
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
        (all_day = 0 AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
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

CREATE TABLE IF NOT EXISTS congregation_calendar_seed_versions (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_congregation_calendar_events_updated_at
  ON congregation_calendar_events(updated_at);

-- One-time seed preserving the three congregation-owned weekly series captured
-- before the former third-party calendar was removed. The marker prevents a
-- later baseline schema run from restoring an event an editor deleted.
INSERT OR IGNORE INTO congregation_calendar_events (
  id,
  title,
  time_zone,
  schedule_kind,
  weekdays_json,
  starts_on,
  start_time,
  end_time
)
SELECT
  'shabbat-messianic-music-and-dance',
  'Contemporary Messianic Jewish Music and Dance',
  'America/Los_Angeles',
  'weekly',
  '["saturday"]',
  '2025-06-14',
  '14:30',
  '15:00'
WHERE NOT EXISTS (
  SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 1
);

INSERT OR IGNORE INTO congregation_calendar_events (
  id,
  title,
  time_zone,
  schedule_kind,
  weekdays_json,
  starts_on,
  start_time,
  end_time
)
SELECT
  'shabbat-traditional-prayers-and-torah-service',
  'Traditional prayers and Torah Service',
  'America/Los_Angeles',
  'weekly',
  '["saturday"]',
  '2025-06-28',
  '15:00',
  '16:30'
WHERE NOT EXISTS (
  SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 1
);

INSERT OR IGNORE INTO congregation_calendar_events (
  id,
  title,
  time_zone,
  schedule_kind,
  weekdays_json,
  starts_on,
  start_time,
  end_time
)
SELECT
  'shabbat-weekly-readings-discussion',
  'Interactive Discussion on Weekly Readings (Torah, Haftara, and Brit Chadashah)',
  'America/Los_Angeles',
  'weekly',
  '["saturday"]',
  '2025-06-28',
  '16:30',
  '17:30'
WHERE NOT EXISTS (
  SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 1
);

INSERT OR IGNORE INTO congregation_calendar_seed_versions (version) VALUES (1);
