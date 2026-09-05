# Autumn 2026 calendar change review

Prepared for review, not executed against any remote database. Follow [production data safety](../production-data-safety.md). A normal code deployment must not run this operation.

## Exact changes

1. `deploy/chuck-staging/migrations/site/0003_start_only_and_date_exceptions.sql` recreates the calendar table to allow a missing end time on a single timed service and adds `excluded_dates_json` for weekly exceptions. It copies every existing ID, field, audit value, and foreign-key relationship; the new field defaults to `[]`. It contains no event seeds or content edits.
2. `autumn-2026-calendar.sql` adds seven confirmed service records from the congregation email. Existing records with those IDs are not overwritten. It adds September 12, September 26, and October 3 to the skipped dates of the existing music and prayer series only when each is a valid Saturday occurrence. It changes no other recurring schedule, title, location, or description, and leaves Kiddush/food/discussion intact.
3. A one-time marker `20260904` prevents reruns from restoring a service that an administrator subsequently deletes. Existing exclusions are retained and not duplicated. The two touched weekly records receive a new update timestamp and a null updater for the reviewed offline operation; no user identity is impersonated.

Regenerate the review SQL with `node scripts/prepare-autumn-calendar.ts`. The script only writes this file. It never opens a database or runs SQL.

## Required release sequence

1. Resolve the exact Chuck-owned target account, project, DB binding, and schema version. Capture a recoverable backup and inspect the three current weekly rows, any existing `holiday-2026-*` rows, existing exclusions, row counts, and representative `site_content`/Brit Chadashah overrides. If records differ from the reviewed assumptions, adjust this operation before execution.
2. Obtain specific approval for the structural migration and exact data changes. Test the existing-schema migration against the intended staging schema/data. Never run `schema.sql` on an established database.
3. Apply only the pending structural migration as a separate operation. Compare all old fields and audit values before/after, plus foreign-key checks. New reads support the old schema, but the new editor writes require migration 0003.
4. Deploy and verify the tested application revision separately. Then apply the reviewed holiday data operation, also separately. This order prevents older code from trying to interpret start-only records or recurrence exceptions.
5. Verify seven holiday IDs (or preserved existing equivalents), the three exceptions on each eligible music/prayer series, unaffected Saturdays, preserved Kiddush rows, the single September 26 holiday programme, and matching Holidays/calendar times. Confirm no existing admin content or Brit Chadashah override changed.

Once start-only records or exceptions exist, a code rollback must retain the compatible calendar reader/editor. Reverting to older calendar code could reject start-only records or show omitted recurring occurrences. Prefer a forward fix or revert only the unrelated presentation change; code rollback never authorizes a database restore.

## Local evidence

Real SQLite tests cover existing-schema migration with foreign keys enabled, exact preservation of old fields/audits, start-only create/read, exception edit round trips, invalid dates, idempotence, non-resurrection, and database ownership. The local Pages preview uses isolated state under `.wrangler/polish-preview`; no staging or production rows were modified.
