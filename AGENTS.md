# AGENTS.md - Chuck Project Configuration

This file provides project-specific guidance for the Chuck directory containing the OhrHaTorah website project.

## Project Overview

### OhrHaTorah - Messianic Congregation Website
- **Type**: Astro SSR site with Cloudflare Pages
- **Tech Stack**: Astro 5.x, TypeScript, Cloudflare Workers/Pages, D1, R2
- **Development Server**: `npm run dev` (port 3002)
- **Production URL**: https://ohrhatorah.pages.dev
- **Repository**: https://github.com/Skarath13/OhrHaTorah.git
- **Production Branch**: `master` (auto-deploys to Cloudflare Pages on push)
- **Fresh Design Branch**: `codex/fresh-design-exploration` in `/Users/dylan/Desktop/chuck-fresh-design`

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
├── wrangler.json        # Cloudflare Workers/Pages config
├── schema.sql           # D1 database schema
├── astro.config.mjs     # Astro configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Cloudflare Infrastructure

### Services Used
- **Cloudflare Pages**: Hosting with auto-deploy from GitHub
- **Cloudflare D1**: SQLite database (`ohrhatorah-db`)
- **Cloudflare R2**: Image storage bucket (`ohrhatorah-images`)

### Bindings (configured in wrangler.json and Pages dashboard)
- `DB` → D1 database `ohrhatorah-db`
- `IMAGES` → R2 bucket `ohrhatorah-images`

### Database Tables (schema.sql)
- `users` - Admin users with PIN hashes
- `sessions` - Server-side sessions
- `site_content` - Editable content key-value pairs
- `pages` - Full page content blocks
- `images` - Uploaded image metadata

### Deployment
- **Auto-deploy**: Push to `master` triggers Cloudflare Pages build
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Manual deploy**: `npx wrangler pages deploy dist --project-name ohrhatorah`

### Database Commands
```bash
# Run schema on remote
npx wrangler d1 execute ohrhatorah-db --remote --file=schema.sql

# Query remote database
npx wrangler d1 execute ohrhatorah-db --remote --command="SELECT * FROM users;"

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
- **Primary Branch**: `master`
- **Protected Design Worktree**: Make fresh-design changes only in `/Users/dylan/Desktop/chuck-fresh-design` on `codex/fresh-design-exploration` when that branch is in scope. Do not merge or deploy `master` without explicit approval.
- **Commits**: Descriptive messages for content and code changes
- **Push**: `git push origin master` (triggers auto-deploy)

---

**Project Type**: Religious organization website with CMS
**Last Updated**: August 2026
**Maintainer**: Dylan (dylan@elk.com)

*This configuration overrides global AGENTS.md settings for the OhrHaTorah project.*
