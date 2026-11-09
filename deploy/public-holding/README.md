# Public construction page

**Status:** Active construction page. At full-site launch, follow the
[launch checklist](../../docs/launch-checklist.md) to replace it and archive the
complete source and deployment details for future restoration. Do not delete
the redirect Worker while protective domains still depend on it.

Approved scope, October 4, 2026: publish only a vague, high-quality construction
page with white space, clean typography, and a subtle animated SVG. No congregation
content, service times, contact information, links to drafts, or admin interface.
The follow-up approval includes the existing congregation favicon set and Open
Graph image, accurate title and description, social metadata, canonical URL, and
Organization/WebSite/WebPage structured metadata. These identify the website and
its construction status without publishing unfinished congregation content.

`ohrhatorahoc.org` is the canonical hostname. The three protective domains and all
four `www` variants permanently redirect to it, preserving paths and query strings.
The Worker has only its own static asset binding. It does not connect to Pages,
D1, R2, forms, notification services, or the staging site.

Deploy only this isolated configuration in Chuck Ott's account:

```sh
npx wrangler@4.147.0 deploy --config deploy/public-holding/wrangler.jsonc
```

The public homepage is indexable; hidden website content cannot rank until it is
published. The sitemap contains only the construction homepage. Unknown paths
return 404 and are marked noindex. This is a separate holding surface; moving the
full site to the domain requires a subsequent reviewed release.

Visual brief: bright white background, centered thin animated Star of David,
Source Serif headline, restrained Source Sans supporting text, small domain at
the bottom. A continuous 12-second animation traces, holds, and retraces the triangles, with
a restrained letter-by-letter light wave across the headline. A small pause control stops both animations.
Reduced-motion preferences display a static mark and headline. No progress
percentage, launch date, signup, or promotional claims.
The fonts are unchanged copies of this project's licensed Adobe font assets.
