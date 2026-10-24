# Full-site launch checklist

The public construction page must be replaced when the approved full website
launches at `https://ohrhatorahoc.org/`. Archive it for reuse rather than delete
its source. This checklist records future work; it does not authorize a cutover
or remove the currently live page.

## Archive and replace the construction page

- [ ] Confirm the approved full-site release, Chuck-owned production destination,
  and resource bindings. Follow [production data safety](production-data-safety.md).
- [ ] Before changing domain routing, save a recoverable copy of the entire
  `deploy/public-holding/` directory, including the Worker, configuration, HTML,
  CSS, fonts and licenses, favicons, Open Graph image, robots file, and sitemap.
  Preserve it in Git history or a durable archive, not only temporary artifacts.
- [ ] Record the archived source revision or archive location, Cloudflare account,
  Worker name, active version, custom-domain assignments, and restoration steps
  in [Archived Website Features](ARCHIVED_FEATURES.md). Recheck live settings at
  launch; the last verified construction version on October 4, 2026 was
  `80b191e0-b427-47d0-9e3d-d47fb4914877`.
- [ ] Remove the construction Worker from the canonical hostname's serving path
  and connect `ohrhatorahoc.org` to the approved full-site deployment. Preserve
  the archived source for future use.
- [ ] Keep permanent redirects from `ohrhatorah-oc.com`, `ohrhatorahoc.com`,
  `ohrhatorah-oc.org`, and all four `www` variants to the canonical HTTPS domain,
  preserving paths and queries. The current Worker also serves these redirects;
  do not delete it unless equivalent redirects have been installed and verified.
- [ ] Replace construction-specific titles, descriptions, social metadata,
  structured data, robots configuration, and the homepage-only sitemap with the
  approved full-site equivalents. Verify public pages are crawlable and private
  routes remain protected.
- [ ] Verify the actual full homepage and representative public routes on the
  canonical domain, desktop/mobile presentation, favicon and Open Graph image,
  HTTP-to-HTTPS behavior, all protective redirects, and unchanged mail DNS.
  Confirm visitors no longer receive the construction page.
- [ ] Mark the construction page archived in its README and archive record,
  including the launch date and verified replacement release. Keep these recovery
  instructions with the archived source.

## Bring the construction page back later

1. Retrieve the archived `deploy/public-holding/` source and recorded settings.
   The holding Worker is `kehilat-ohr-hatorah-public-holding` in Chuck Ott's
   account, `6eddd121eb9f37eb2809d340c433c793`, with only an `ASSETS` binding.
2. Review the current canonical deployment and domain assignments before an
   approved restoration. The archived configuration includes all eight domains;
   reconcile it with current routing rather than blindly replacing assignments.
   Save the full-site routing so it can be restored afterward.
3. Deploy the archived holding assets and route the canonical hostname to them.
   Preserve protective redirects and mail DNS. Do not alter D1/R2 data or restore
   a database as part of displaying the construction page.
4. Verify the construction page, motion/pause behavior, reduced-motion styling,
   favicon, social image, and redirects live. Record the restoration version and
   the plan to return to the full site.
