# Website update-request notifier

Queue-only Cloudflare Worker for staging. The public Pages function writes an
update request and an outbox row to `FORM_DB`, then publishes only the outbox ID
to `ohrhatorah-update-requests-staging`. This Worker claims that row, sends one
transactional administrator notification, and records the Cloudflare message
ID.

The Worker has no HTTP handler or public route. Its email binding is restricted
to:

- sender: `admin@ohrhatorahoc.org`
- destination: the verified staging inbox `drburton369@gmail.com`

Run locally from this directory:

```sh
npm run check
npm test
```

Deploy only with the Chuck account explicitly selected:

```sh
CLOUDFLARE_ACCOUNT_ID=6eddd121eb9f37eb2809d340c433c793 \
  npx wrangler@4.121.0 deploy --config wrangler.jsonc
```

Email notification delivery is at-least-once. A D1 lease prevents concurrent
duplicate sends. Like any database-plus-external-provider outbox, a Worker
termination after Cloudflare accepts the email but before D1 records its message
ID can cause a later retry to send a duplicate. The stable request reference in
the email makes that rare case recognizable.
