-- Approved copy alignment for the unchanged baseline calendar row.
-- The exact prior-title guard preserves any administrator-edited value.
UPDATE congregation_calendar_events
SET
  title = 'Kiddush, food, and discussion',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'shabbat-weekly-readings-discussion'
  AND title = 'Interactive Discussion on Weekly Readings (Torah, Haftara, and Brit Chadashah)';
