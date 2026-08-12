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

Apply pending form-database migrations from this directory:

```sh
npx wrangler@4.121.0 d1 migrations apply FORM_DB --remote --config wrangler.json
```

After the repository build and tests pass, deploy the verified Git revision:

```sh
npx wrangler@4.121.0 pages deploy ../../dist \
  --project-name kehilat-ohr-hatorah-chuck-staging \
  --branch staging \
  --commit-hash "$(git -C ../.. rev-parse HEAD)" \
  --commit-dirty=false
```

This staging project does not attach a custom domain or change DNS.
