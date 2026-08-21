# AGENTS.md - Chuck Project Configuration

This file provides project-specific guidance for the Chuck directory containing the OhrHaTorah website project.

## Project Overview

### OhrHaTorah - Messianic Congregation Website
- **Type**: Astro SSR site with Cloudflare Pages
- **Tech Stack**: Astro 5.x, TypeScript, Cloudflare Workers/Pages, D1, R2
- **Development Server**: `npm run dev` (port 3002)
- **Legacy Production URL**: https://ohrhatorah.pages.dev (Dylan account; retained only as rollback until a separately approved domain cutover)
- **Legacy Preview Redirect**: https://fresh-design-staging.ohrhatorah.pages.dev redirects browser navigation to Chuck staging; deploy only the isolated artifact documented in `docs/cloudflare-staging.md`.
- **Chuck Staging URL**: https://kehilat-ohr-hatorah-chuck-staging.pages.dev
- **Repository**: https://github.com/Skarath13/OhrHaTorah.git
- **Primary Branch**: `main`
- **Primary Worktree**: `/Users/dylan/Desktop/chuck`
- **Legacy Branch**: `master` remains attached to the old Dylan Pages project; do not push or deploy it as the current site.

### Project Structure
```
OhrHaTorah/
├── src/
│   ├── pages/           # Astro page components (.astro files)
│   │   ├── admin/       # Admin pages (login, index redirect)
│   │   └── api/         # API endpoints (auth, content, images)
│   ├── layouts/         # Layout templates (BaseLayout, PageLayout)
│   ├── components/      # Reusable components
│   │   └── admin/       # Admin components (InlineEditor.astro)
│   ├── lib/             # Utilities (auth.ts, db.ts)
│   └── middleware.ts    # Auth middleware
├── public/
│   ├── images/          # Website assets (logos, community photos)
│   ├── styles/          # CSS stylesheets
│   └── favicon.svg      # Site icon
├── wrangler.json        # Legacy Dylan Cloudflare config; do not use for Chuck staging
├── deploy/chuck-staging/wrangler.json # Chuck staging Pages/D1 config
├── schema.sql           # D1 database schema
├── astro.config.mjs     # Astro configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Cloudflare Infrastructure

### Services Used
- **Cloudflare Pages**: Chuck-account staging project `kehilat-ohr-hatorah-chuck-staging`
- **Cloudflare D1**: Isolated staging database `ohrhatorah-staging-db`
- **Cloudflare R2**: Not enabled in the Chuck account yet; admin uploads remain unavailable there until the account owner enables R2 and a staging bucket is bound.

### Staging Bindings
- `DB` → D1 database `ohrhatorah-staging-db`
- `IMAGES` → intentionally absent until Chuck-account R2 is enabled

### Database Tables (schema.sql)
- `users` - Admin users with PIN hashes
- `sessions` - Server-side sessions
- `site_content` - Editable content key-value pairs
- `pages` - Full page content blocks
- `images` - Uploaded image metadata

### Deployment
- **Current release path**: verified direct upload to the Chuck staging-only Pages project
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Manual deploy**: follow `docs/cloudflare-staging.md` and name the account, config, project, branch, and verified commit explicitly
- **Production data invariant**: follow `docs/production-data-safety.md`; a normal code deployment must never execute migrations, seeds, imports, or other D1/R2 mutations
- **Domains**: do not attach a custom domain, route, or DNS record without separate approval
- **Legacy preview**: keep the redirect scoped to the `fresh-design-staging` preview branch; never deploy it to legacy `master`

### Production Data Preservation

- Chuck-owned production D1 and R2 data are persistent runtime state, not build artifacts. Deploying a new Git revision must preserve them.
- Admin-managed calendar rows and `site_content` values are authoritative over defaults in Git.
- This explicitly includes date-scoped Brit Chadashah overrides named `brit-chadashah:YYYY-MM-DD`.
- Do not change a production resource binding, rerun `schema.sql`, execute a seed, import staging data, or run destructive SQL during a normal deployment.
- Database migrations require a separate reviewed operation, a recoverable backup, staging verification, and before/after record checks.
- Code rollback does not authorize or require database rollback.

### Database Commands
```bash
# Run these from the isolated Chuck deployment directory
cd deploy/chuck-staging

# Bootstrap a brand-new empty Chuck staging database only.
# Never run schema.sql against an established staging or production database.
CLOUDFLARE_ACCOUNT_ID=6eddd121eb9f37eb2809d340c433c793 npx wrangler@4.121.0 d1 execute ohrhatorah-staging-db --remote --file=../../schema.sql

# Apply pending numbered site migrations to established Chuck staging
CLOUDFLARE_ACCOUNT_ID=6eddd121eb9f37eb2809d340c433c793 npx wrangler@4.121.0 d1 migrations apply DB --remote --config wrangler.json

# Query Chuck staging
CLOUDFLARE_ACCOUNT_ID=6eddd121eb9f37eb2809d340c433c793 npx wrangler@4.121.0 d1 execute ohrhatorah-staging-db --remote --command="SELECT * FROM users;"

# Local development uses .wrangler/state/v3/d1/ SQLite files
```

## Admin System

### Inline Visual Editor
- **Login**: `/admin` or `/admin/login` (6-digit PIN)
- **Admin PIN**: Stored in D1 database (bcrypt hashed)
- **Edit Mode**: Floating "Edit" button on all pages when logged in
- **Features**:
  - Click any `[data-editable]` element to edit inline
  - Click any `[data-editable-image]` element to change images
  - "Click to edit" tooltips on hover
  - Save/Discard/Done toolbar
  - Keyboard shortcuts: Ctrl+S (save), Escape (cancel), Enter (confirm)

### Auth Flow
1. User visits `/admin` → redirects to `/admin/login`
2. Enters 6-digit PIN → POST `/api/auth/login`
3. On success: session cookie set, redirect to `/`
4. InlineEditor.astro checks for `oht_session` cookie
5. If valid session: floating Edit button appears

## Development Guidelines

### Technology Approach
- **Astro Framework**: SSR with Cloudflare adapter
- **Multi-Page Application**: Separate .astro files for each page
- **Mobile-First Design**: Responsive layout with mobile menu implementation
- **Image Optimization**: Mix of PNG, WEBP, AVIF formats for performance

### Code Conventions
- **Astro**: Component-based pages with frontmatter and scoped styles
- **CSS**: Component-based classes, mobile-first responsive design
- **JavaScript**: Modern ES6+ features, minimal client-side JS
- **Files**: Kebab-case for assets, camelCase for JavaScript variables

### Development Workflow
```bash
npm run dev      # Start dev server (port 3002)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Content and Features

### Website Pages
- `/` - Home page with community info, calendar, leadership
- `/about` - Who We Are
- `/expect` - What to Expect in Services
- `/mission` - Vision, Commitments, Affirmations & Core Values
- `/location` - Our Location with map
- `/faq` - Frequently Asked Questions
- `/umjc` - UMJC Affiliation
- `/services` - Shabbat Services
- `/holidays` - Jewish Holidays
- `/events` - Special Events
- `/youth` - Shabbat School for Youth
- `/israel` - Stand With Israel
- `/resources` - Messianic Jewish Resources
- `/contact` - Contact Us
- `/donate` - Donation page
- `/privacy` - Privacy Notice
- `/website-use` - Website Use
- `/accessibility` - Website Accessibility

### Special Features
- **Hostage Counter**: Real-time timer (Israeli hostage awareness)
- **Upcoming Shabbat Date**: Live Hebrew and Gregorian dates for the following Shabbat
- **Mobile Menu**: Hamburger menu with smooth animations
- **Religious Calendar**: Site-owned responsive calendar with local congregation events and Hebcal Jewish holiday data
- **Inline Admin Editor**: Wix-style visual editing for content

## Development Standards

### File Management
- **Images**: Store in `/public/images/` directory with descriptive names
- **CSS**: All stylesheets in `/public/styles/` - DO NOT create `/src/styles/`
- **Static Files**: All static assets go in `/public/` folder, NOT in `/src/`
- **Pages**: All pages in `/src/pages/` as .astro files

### Security and Sensitivity
- **Content Nature**: Religious/political content requires cultural sensitivity
- **Community Photos**: Respect privacy in community imagery
- **Contact Information**: Ensure congregation contact details are current
- **No Cross Icons**: Do not use cross/crucifix icons - use Star of David or other appropriate symbols
- **Admin PIN**: Set via environment variable when seeding (see scripts/seed-admin.ts)

### Public Content Voice

- Read and follow `CONTENT_VOICE.md` before changing audience-facing copy.
- Treat `src/data/congregationIdentity.ts` as the canonical implementation source for the congregation's identity, Vision and Purpose, Core Commitments and Affirmations, and Core Values.
- Preserve the rabbi-approved wording and theological vocabulary. Do not replace it with generic promotional language or silently soften covenant, Israel, resurrection, restoration, or Jewish/non-Jewish identity claims.
- Use `Kehilat Ohr HaTorah` consistently. When `Hashem` or `Adonai` substitutes for YHVH, keep that conventional spelling in the readable text and use the established `.divine-name` initial/rest markup: a full-height first letter followed by small caps. Do not use `HaShem`, full-size all caps, Unicode small-cap lookalikes, or `all-small-caps` on the whole word. See `CONTENT_VOICE.md` for scope and rationale.
- Keep bylaws governance content private unless publication is explicitly requested.

## Git Workflow

### Repository Management
- **Origin**: https://github.com/Skarath13/OhrHaTorah.git
- **Primary Branch**: `main`
- **Primary Worktree**: Make current-site changes in `/Users/dylan/Desktop/chuck`. Treat `master` as an archived legacy branch; it no longer has a separate worktree.
- **Commits**: Descriptive messages for content and code changes
- **Push**: `git push origin main`; deployment remains a separate verified Chuck-staging action until Git integration and custom-domain cutover are explicitly approved.

---

**Project Type**: Religious organization website with CMS
**Last Updated**: August 2026
**Maintainer**: Dylan (dylan@elk.com)

*This configuration overrides global AGENTS.md settings for the OhrHaTorah project.*
