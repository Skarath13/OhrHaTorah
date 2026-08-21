# Chuck Cloudflare staging

Follow [`production-data-safety.md`](production-data-safety.md) for every
release. A normal Pages deployment replaces only the application artifact; it
must not run database migrations, seeds, imports, or R2 synchronization.

The staging site is isolated in the **Chuck Ott** Cloudflare account. It does not use or attach any custom domain.

- Account ID: `6eddd121eb9f37eb2809d340c433c793`
- Pages project: `kehilat-ohr-hatorah-chuck-staging`
- Production branch for this staging-only project: `staging`
- D1 database: `ohrhatorah-staging-db`
- Wrangler config: `deploy/chuck-staging/wrangler.json`

Build and deploy with the account and configuration named explicitly:

```sh
npm test
npm run build
cd deploy/chuck-staging
CLOUDFLARE_ACCOUNT_ID=6eddd121eb9f37eb2809d340c433c793 \
  npx wrangler@4.121.0 pages deploy ../../dist \
  --project-name kehilat-ohr-hatorah-chuck-staging \
  --branch staging \
  --commit-hash <verified-commit-sha>
```

The `IMAGES` binding is intentionally absent until R2 is enabled in the Chuck Ott account. Public image assets are part of the Pages deployment; the missing R2 binding affects only admin uploads and the uploaded-image library. Do not accept R2 billing or service terms on another person's behalf.

Pages does not accept a custom Wrangler config path. Run the command from `deploy/chuck-staging` so Wrangler discovers only the Chuck staging configuration and cannot fall back to the legacy root `wrangler.json`.

Keep the original Dylan account project and resources intact as rollback until a separately approved custom-domain cutover is complete.

## Legacy preview redirect

The former preview alias `fresh-design-staging.ohrhatorah.pages.dev` is a redirect-only compatibility endpoint. Its source is `deploy/legacy-preview-redirect/_worker.js`. It preserves browser paths and query strings with a temporary, non-cached redirect to the Chuck staging site, while refusing mutation methods instead of forwarding them across accounts.

The Dylan production hostname `ohrhatorah.pages.dev`, its `master` deployment, and immutable preview deployment URLs remain unchanged for rollback. Deploy the redirect artifact only from an isolated temporary directory so Wrangler cannot discover the legacy root configuration:

```sh
redirect_dir="$(mktemp -d)"
cp deploy/legacy-preview-redirect/_worker.js "$redirect_dir/_worker.js"
cd "$redirect_dir"
CLOUDFLARE_ACCOUNT_ID=b95be8604c4d3512b9fe28abe92affad \
  npx wrangler@4.121.0 pages deploy . \
  --project-name ohrhatorah \
  --branch fresh-design-staging \
  --commit-hash <verified-commit-sha>
```

Rollback by redeploying the prior verified site artifact to the same preview branch. Do not deploy this redirect to `master` or attach a custom domain.
