# Chuck staging deployment

This is a Cloudflare Pages configuration. Pages rejects `account_id` inside its
Wrangler file, so every account-scoped command must explicitly select Chuck's
account in the environment:

```sh
export CLOUDFLARE_ACCOUNT_ID=6eddd121eb9f37eb2809d340c433c793
```

Do not run the migration or deployment commands without that value. The form
pipeline also requires the encrypted Pages secret `TURNSTILE_SECRET_KEY`; its
value must never be committed.

Site and form migrations use separate per-binding directories. Apply pending
site-database migrations from this directory:

```sh
npx wrangler@4.121.0 d1 migrations apply DB --remote --config wrangler.json
```

The site migration references the existing `users` table for editor audit
fields. For a brand-new empty site database only, bootstrap the baseline schema
before applying the site migration:

```sh
npx wrangler@4.121.0 d1 execute DB --remote --config wrangler.json --file=../../schema.sql
```

Do not rerun that bootstrap command as a substitute for normal migrations.

Apply pending form-database migrations separately:

```sh
npx wrangler@4.121.0 d1 migrations apply FORM_DB --remote --config wrangler.json
```

Do not point either command at the other binding. The `migrations_dir` values in
`wrangler.json` keep site CMS tables out of `FORM_DB` and form submissions out
of `DB`.

After the repository build and tests pass, deploy the verified Git revision:

```sh
npx wrangler@4.121.0 pages deploy ../../dist \
  --project-name kehilat-ohr-hatorah-chuck-staging \
  --branch staging \
  --commit-hash "$(git -C ../.. rev-parse HEAD)" \
  --commit-dirty=false
```

This staging project does not attach a custom domain or change DNS.
