-- REVIEWED DATA OPERATION ONLY. Never run as part of a normal code deployment.
-- Requires schema migration 0003. Export a backup and review the exact existing rows first.
-- Combines the music/prayer occurrences on three holiday Saturdays into one holiday service.
-- Preserves the weekly series, all other dates, and Kiddush/food/discussion.
-- Existing admin-edited holiday IDs are retained; the one-time marker prevents resurrection on reruns.
INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)
SELECT 'holiday-2026-rosh-hashanah', 'Rosh HaShanah · Yom Teruah', 'Traditional Prayers, Torah Service, and shofar sounding.', '10460 Slater Ave, Fountain Valley, CA 92708', 'America/Los_Angeles', 'single', '2026-09-12', 0, '14:30', NULL
WHERE NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904) ON CONFLICT(id) DO NOTHING;
INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)
SELECT 'holiday-2026-kol-nidre', 'Erev Yom Kippur · Kol Nidre', 'Kol Nidre evening service.', '10460 Slater Ave, Fountain Valley, CA 92708', 'America/Los_Angeles', 'single', '2026-09-20', 0, '18:30', '20:00'
WHERE NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904) ON CONFLICT(id) DO NOTHING;
INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)
SELECT 'holiday-2026-yom-kippur-mincha', 'Yom Kippur · Mincha', 'Afternoon service. Come any time after 1:30 p.m.; the service begins at 3:00 p.m.', '10460 Slater Ave, Fountain Valley, CA 92708', 'America/Los_Angeles', 'single', '2026-09-21', 0, '15:00', NULL
WHERE NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904) ON CONFLICT(id) DO NOTHING;
INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)
SELECT 'holiday-2026-neilah', 'Yom Kippur · Neilah', 'Concluding prayers. The start time is approximate.', '10460 Slater Ave, Fountain Valley, CA 92708', 'America/Los_Angeles', 'single', '2026-09-21', 0, '18:45', NULL
WHERE NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904) ON CONFLICT(id) DO NOTHING;
INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)
SELECT 'holiday-2026-break-fast', 'Yom Kippur · Havdalah and break-the-fast', 'The start time is approximate.', '10460 Slater Ave, Fountain Valley, CA 92708', 'America/Los_Angeles', 'single', '2026-09-21', 0, '19:26', NULL
WHERE NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904) ON CONFLICT(id) DO NOTHING;
INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)
SELECT 'holiday-2026-sukkot', 'Sukkot · First Day', 'Traditional prayers, waving of the lulav, and Torah Service.', '10460 Slater Ave, Fountain Valley, CA 92708', 'America/Los_Angeles', 'single', '2026-09-26', 0, '14:30', NULL
WHERE NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904) ON CONFLICT(id) DO NOTHING;
INSERT INTO congregation_calendar_events (id, title, description, location, time_zone, schedule_kind, event_date, all_day, start_time, end_time)
SELECT 'holiday-2026-shemini-atzeret', 'Shemini Atzeret & Simchat Torah', 'Our combined holiday gathering on October 3.', '10460 Slater Ave, Fountain Valley, CA 92708', 'America/Los_Angeles', 'single', '2026-10-03', 0, '14:30', NULL
WHERE NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904) ON CONFLICT(id) DO NOTHING;
UPDATE congregation_calendar_events
SET excluded_dates_json = json_insert(excluded_dates_json, '$[#]', '2026-09-12'), updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE id IN ('shabbat-messianic-music-and-dance', 'shabbat-traditional-prayers-and-torah-service')
AND schedule_kind = 'weekly' AND starts_on <= '2026-09-12' AND (ends_on IS NULL OR ends_on >= '2026-09-12')
AND EXISTS (SELECT 1 FROM json_each(weekdays_json) WHERE value = 'saturday')
AND NOT EXISTS (SELECT 1 FROM json_each(excluded_dates_json) WHERE value = '2026-09-12')
AND NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904);
UPDATE congregation_calendar_events
SET excluded_dates_json = json_insert(excluded_dates_json, '$[#]', '2026-09-26'), updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE id IN ('shabbat-messianic-music-and-dance', 'shabbat-traditional-prayers-and-torah-service')
AND schedule_kind = 'weekly' AND starts_on <= '2026-09-26' AND (ends_on IS NULL OR ends_on >= '2026-09-26')
AND EXISTS (SELECT 1 FROM json_each(weekdays_json) WHERE value = 'saturday')
AND NOT EXISTS (SELECT 1 FROM json_each(excluded_dates_json) WHERE value = '2026-09-26')
AND NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904);
UPDATE congregation_calendar_events
SET excluded_dates_json = json_insert(excluded_dates_json, '$[#]', '2026-10-03'), updated_at = CURRENT_TIMESTAMP, updated_by = NULL
WHERE id IN ('shabbat-messianic-music-and-dance', 'shabbat-traditional-prayers-and-torah-service')
AND schedule_kind = 'weekly' AND starts_on <= '2026-10-03' AND (ends_on IS NULL OR ends_on >= '2026-10-03')
AND EXISTS (SELECT 1 FROM json_each(weekdays_json) WHERE value = 'saturday')
AND NOT EXISTS (SELECT 1 FROM json_each(excluded_dates_json) WHERE value = '2026-10-03')
AND NOT EXISTS (SELECT 1 FROM congregation_calendar_seed_versions WHERE version = 20260904);
INSERT OR IGNORE INTO congregation_calendar_seed_versions(version) VALUES (20260904);
