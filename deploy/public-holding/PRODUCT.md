# Public construction surface

This document applies only to `deploy/public-holding/`, independently of the full
Astro site and its staging environment.

Visitors see a vague construction status: “Under construction.” and “Something
new is taking shape.” The approved experience is simple, spacious, and quiet,
with a subtle looping SVG animation and letter-by-letter light wave across the headline. A small checkbox control pauses both animations. There is no form submission.

The canonical hostname is `ohrhatorahoc.org`. The three protective domains and
all four `www` variants redirect to it. The approved homepage metadata names
Kehilat Ohr HaTorah and describes the construction status, including title,
description, canonical URL, Open Graph and Twitter tags, and
Organization/WebSite/WebPage JSON-LD. Existing congregation favicons and the
Open Graph image are reused unchanged; the visible body stays vague. The Source
Sans and Source Serif font files are unchanged project assets.

The public Worker serves its own static assets through `ASSETS` only. It has no
D1, R2, congregation-content, or staging-site connection. Publishing the full
site remains a separate release. The homepage is indexable; unknown paths return
404 with noindex. No launch date, progress percentage, signup, service times,
contact information, admin interface, or unfinished congregation content is
part of this surface.

Source: `README.md`, `public/index.html`, and `public/styles/holding.css`.
