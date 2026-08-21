# Production admin data safety

This document is the release invariant for every Cloudflare environment. Chuck
Ott's Cloudflare account owns production. Application deployments may replace
the Pages code and static assets, but they must not replace, reseed, import over,
or otherwise mutate production D1 or R2 data.

## Data covered by this invariant

- Congregation calendar definitions in `congregation_calendar_events`.
- Brit Chadashah overrides in `site_content`, keyed as
  `brit-chadashah:YYYY-MM-DD`.
- All other admin-managed `site_content`, `pages`, images and image metadata,
  content revisions, users, sessions, form records, and notification outboxes.
- Objects stored in the production R2 bucket.

A normal Git/Cloudflare build deploys only the verified application artifact.
It must keep the same reviewed production bindings, so the new code reads the
existing Chuck-owned production data.

## Normal code release

1. Confirm the Cloudflare account, Pages project, branch, and every D1/R2/Queue
   binding before deployment. Production bindings must name Chuck-owned
   production resources; staging bindings must name staging resources.
2. Run tests and build the exact Git revision.
3. Deploy the application artifact only. Do not combine the build/deploy job
   with `wrangler d1 execute`, a migration, a seed script, a database import, or
   an R2 synchronization.
4. Verify a known calendar record and a known Brit Chadashah override before and
   after deployment. Their values and audit timestamps must be unchanged.

Code rollback is not a database rollback. Never restore a database merely
because application code was rolled back.

## Database migration release

Database migrations are a separate, explicitly reviewed operation:

1. Export or otherwise capture a recoverable production database backup.
2. Test the migration against staging data with the same schema version.
3. Review the SQL for `DROP`, `DELETE`, `UPDATE`, `REPLACE`, conflict upserts,
   table recreation, and key renames. Any statement capable of changing live
   rows requires a specific data-migration plan and approval.
4. Apply only pending numbered migrations to the intended production database.
5. Verify row counts, representative records, admin writes, and public reads.

Use backward-compatible expand/migrate/contract changes when a schema change
spans multiple application releases.

## Prohibited operations

- Never run `schema.sql` against an established staging or production database.
  It is a bootstrap for a brand-new empty database only.
- Never run a seed script as part of a normal deployment.
- Never copy or import a staging database over production.
- Never change a production `database_id`, bucket, queue, or account implicitly.
- Never add a migration that rewrites or deletes admin-managed rows merely to
  make the database match defaults stored in Git.
- Never make bundled defaults win over a bound production database.

## Calendar-specific rule

Calendar rows edited in production D1 are authoritative. Migrations may create
new tables or indexes, but must not rewrite existing event IDs, restore deleted
events, or replace edited values. The existing baseline calendar seed is
one-time, uses `INSERT OR IGNORE`, and is protected by
`congregation_calendar_seed_versions`; preserve that behavior.

## Brit Chadashah-specific rule

The production D1 value for each `brit-chadashah:YYYY-MM-DD` key is the
authoritative override for that Shabbat. A code deployment may change the
automatic schedule-backed fallback, but it must not overwrite or delete an
existing override. Do not rename the key format without an explicit,
backward-compatible data migration and verification. Resetting an override must
happen through the authenticated admin action so the deletion is recorded in
content revision history.
