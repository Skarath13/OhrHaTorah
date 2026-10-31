# CMS options for the admin portal

Researched October 31, 2026. Star counts and versions are from the projects'
GitHub pages on that date. Items marked "unverified" were not confirmed from a
primary source.

## Constraints that decide the choice

- Editors are older, non-technical people. Today they sign in with a 6-digit
  PIN, click text or images on the live page, and save. No email accounts, no
  GitHub accounts.
- Content is runtime data in D1 (`site_content`, calendar tables) with revision
  history, and images in R2. Production data must never be overwritten by a
  deploy (`docs/production-data-safety.md`).
- The Chuck Pages project is Direct Upload, not Git-connected. A CMS that saves
  edits as Git commits would not publish anything until a new Git-connected
  project exists.
- The site runs on Cloudflare Pages Functions; anything needing a separate Node
  server adds a new thing to host and maintain.

## Recommendation

**Keep the existing PIN inline editor as the admin portal, and embed small
open-source editing components into it.** It is already the most
boomer-friendly pattern available (edit on the real page, no accounts), and it
already satisfies the data-safety rules. A full CMS would add accounts, a
second content model, and a second admin to learn.

Embed, in this order:

1. **Tiptap** (MIT, ~39k stars). Word-like toolbar for longer text blocks
   (bold, lists, links, headings). Store its HTML or JSON in the existing
   `site_content` table as `content_type = 'html'` or `'json'`, so revisions and
   PIN auth stay as they are. Restrict the toolbar to 5-6 buttons. Free core;
   collaboration, comments and AI extensions are paid and not needed.
   Effort: low to medium.
2. **Image picker on the existing R2 upload.** A grid of uploaded images with a
   big "Use this photo" button and required alt text. No new library.
   Effort: low.
3. **Puck** (MIT, ~14k stars), only if editors later need to build whole pages
   from blocks (event announcement, photo + text, call-to-action). It is a React
   component, so it needs a React island in Astro; save its `data` JSON to D1.
   Effort: medium. Defer until there is a real need.

Boomer-friendly rules for anything added: one big Save button, autosave of
drafts, plain-language labels ("Change photo", not "Upload asset"), undo, a
visible "Saved" confirmation, 18px+ text, and no hidden right-click or
keyboard-only features.

## If a full CMS is wanted later

| Option | License / popularity | Fits Cloudflare + D1/R2? | Editor sign-in | Ease (1-5) | Verdict |
|---|---|---|---|---|---|
| **EmDash** | MIT, ~14k stars, v1.4.0 (Oct 29, 2026) | Yes. Astro integration on Workers + D1 + R2 | Passkeys by default, OAuth/magic-link fallback; each editor needs an account | 4 | Best full-CMS fit. Young (described as beta in April 2026, docs incomplete). Documents Workers, not Pages (Pages support unverified). Plugin sandbox needs a paid Cloudflare plan. Pilot on a branch before adopting. |
| **Payload** | MIT, ~46k stars | Yes, official `with-cloudflare-d1` template, but as a separate Next.js Worker; paid Workers plan recommended (3 MB bundle limit) | Email + password accounts | 3 | Mature and popular, heavy for this site. Astro would fetch from its API. |
| **Keystatic** | MIT | Git-backed; would not publish on Direct Upload | GitHub, or Keystatic Cloud (paid beyond 3 users) | 4 | Poor fit: duplicates D1 content in Git. |
| **Decap / Sveltia** | MIT | Git-backed | GitHub identity via OAuth | 3 | Poor fit for the same reason. |
| **TinaCMS** | Apache-2.0, ~14k stars | Git-backed; self-hosted backend needs DB + auth adapter (unverified) | Tina Cloud or self-hosted auth | 4 | Poor fit. |
| **Strapi / Directus** | Strapi community MIT (unverified); Directus is source-available (MSCL), not OSI open source | No; need a Node server + database | Email accounts | 3-4 | Not recommended: new server to run. |

Sources: github.com/emdash-cms/emdash, payloadcms.com/posts/blog/deploy-payload-onto-cloudflare-in-a-single-click,
blog.cloudflare.com/payload-cms-workers, keystatic.com/docs/cloud,
docs.astro.build/en/guides/cms/keystatic/, github.com/sveltia/sveltia-cms-auth,
github.com/tinacms/tinacms, github.com/directus/directus, github.com/strapi/strapi,
github.com/ueberdosis/tiptap, github.com/puckeditor/puck.

## Open questions before adopting a full CMS

- Would editors accept per-person accounts (passkey or email) instead of a PIN?
- EmDash on Pages vs Workers: confirm, or plan the move to a Git-connected
  Workers project (already required for the production cutover).
- How existing `site_content` keys and calendar rows would migrate without
  violating the production data rules.
