# Chuck Cloudflare staging

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
