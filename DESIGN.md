---
name: Kehilat Ohr HaTorah public site
description: Warm parchment reading pages framed by deep navy, with antique-gold accents and a serif/sans pairing.
colors:
  navy: "#061d35"            # chrome, page heroes, footer (--site-chrome-navy, --interior-navy)
  navy-soft: "#102c49"       # --interior-navy-soft
  ink: "#0b2d57"             # headings, links, primary buttons (--interior-ink)
  ink-hover: "#164770"       # primary button hover
  gold: "#d1a12d"            # accents, rules, hover highlights (--interior-gold)
  gold-soft: "#ead39a"       # selection, hairline glows (--interior-gold-soft)
  gold-deep: "#866622"       # icons on light ground (--interior-gold-deep)
  gold-rule: "#b48a36"       # side rules, editorial borders
  cream: "#f4efe3"           # interior page ground (--interior-cream)
  paper: "#fbf8f1"           # cards, notices, mobile drawer (--interior-paper)
  editorial-line: "#d3c9b6"  # section dividers and card borders
  line: "rgba(11, 45, 87, 0.18)"  # hairlines on paper (--interior-line)
  muted: "#59677b"           # secondary body text (--interior-muted), 5.0:1 on cream
  focus: "#397ca6"           # focus ring
typography:
  display:
    fontFamily: "'Source Serif 4', Georgia, serif"   # var(--font-display)
    h2: "clamp(1.85rem, 3.2vw, 2.75rem) / 1.18, weight 500, -0.025em"
    h3: "clamp(1.45rem, 2vw, 1.85rem) / 1.25"
    letterSpacingFloor: "-0.03em"
  body:
    fontFamily: "'Source Sans 3', Arial, sans-serif"  # var(--font-body)
    fontSize: "clamp(1.125rem, 1.075rem + 0.2vw, 1.25rem)"  # var(--text-body)
    lineHeight: 1.7
    measure: "66ch"
  control:
    fontSize: "1.125rem"   # var(--text-control)
    weight: 650
  minimum: "1rem"          # nothing smaller, including secondary text
  hebrew:
    fontFamily: "'Times New Roman', serif"
    lineHeight: 1.7
spacing:
  section: "clamp(2rem, 4vw, 3.5rem) 0"
  content-width: "min(1180px, calc(100% - 48px))"
  touch-target: "44px minimum; buttons 48-50px"
radius:
  button: ".35rem"
  card: ".5rem"
  map: ".6rem"
motion:
  ease: "cubic-bezier(0.22, 1, 0.36, 1)"   # --motion-ease-lux
  fast: "180ms"
  medium: "620ms"
breakpoints:
  desktop-nav: "1360px (mobile drawer below)"
  single-column: "900px"
  phone: "680px / 767px"
---

# Design System: Kehilat Ohr HaTorah public site

Source of truth for adding pages or components so new work matches the live
site. Tokens above mirror the CSS; when they disagree, the CSS in
`public/styles/` wins and this file should be corrected. Copy and voice rules
live in `CONTENT_VOICE.md`, not here.

## Overview

**North star: "A printed siddur in a well-lit room."** Deep navy frames the
page (navigation, page hero, footer). Reading happens on warm cream and paper.
Antique gold marks emphasis sparingly: rules, icons, hover, selection. Type is
generous and calm, built for older readers on phones.

Key characteristics:
- Navy chrome, cream reading ground, gold accents. Never pure white pages.
- Serif display headings, sans body, both large. Body never below 1rem.
- Hairline borders and thin gold rules instead of shadows and heavy cards.
- Curved SVG section dividers between navy and cream bands.
- Quiet motion with a single ease-out curve; everything honors reduced motion.

## Stylesheets and load order

`BaseLayout.astro` loads, in order: `style.css` (legacy base), page-specific
sheets passed via `stylesheets`, then `chrome.css`, `motion.css`,
`typography.css`. `PageLayout.astro` adds `interior.css` and `editorial.css`.

- Put styles in `public/styles/`; never create `src/styles/`.
- Small page-only styles may use a scoped `<style>` block in the `.astro` page.
- After changing shared CSS markup contracts, bump `stylesheetVersion` in
  `BaseLayout.astro` and its contract test (`stylesheetVersioning.test.ts`).
- `style.css` still defines legacy `--primary-blue` (#3A6EA5) and bright
  `--gold` (#FFD700). Do not use them in new work; use the interior tokens.
- `home.css` has its own `--home-*` scale (e.g. `#061a32`), a few hex values off
  the interior palette. Known drift; new interior work uses `--interior-*`.

## Colors

| Role | Token | Hex |
|---|---|---|
| Frame (nav, hero, footer) | `--interior-navy` / `--site-chrome-navy` | #061d35 |
| Headings, links, primary button | `--interior-ink` | #0b2d57 |
| Page ground | `--interior-cream` | #f4efe3 |
| Cards, notices, drawer | `--interior-paper` | #fbf8f1 |
| Accent rule / hover | `--interior-gold` | #d1a12d |
| Icons on light ground | `--interior-gold-deep` | #866622 |
| Selection, glow | `--interior-gold-soft` | #ead39a |
| Secondary text | `--interior-muted` | #59677b |
| Dividers | `--editorial-line` | #d3c9b6 |

Rules:
- Text on cream or paper: `ink` for headings and links, default body color, or
  `muted` for secondary copy. Keep AA contrast (4.5:1 body, 3:1 large and UI).
- Gold is an accent, not a text color on light ground (fails contrast). Use
  `gold-deep` for icons and small gold elements on cream.
- Errors use a warm terracotta (`#7a2b19` text on `#fbeee9`, border `#b5533c`),
  not a cool red.
- Calendar category rails are the only multicolor element; do not spread those
  colors elsewhere.

## Typography

- Headings: `var(--font-display)` (Source Serif 4, self-hosted woff2). Weight
  500 for h2 on interior pages. Tracking no tighter than -0.03em.
- Body and controls: `var(--font-body)` (Source Sans 3). Body size
  `var(--text-body)`, line height 1.7, measure 66ch.
- Minimum text size is 1rem everywhere, including labels and captions.
- Uppercase tracked micro-labels (e.g. MAILBOX, SERVICE LOCATION, weekday names)
  are an established system; reuse them only for short labels.
- Divine-name substitutions use the `.divine-name` markup (see
  `CONTENT_VOICE.md`). Hebrew text gets `lang="he"`.
- Use en dashes for ranges, "a.m."/"p.m." for times, `text-wrap: balance` or
  `pretty` on headings and short lines that orphan.

## Layout

Interior pages use `PageLayout` with `pageTitle` (navy hero with breadcrumb and
gold hairline, then a `sweep-reverse` divider into cream). Register a new route
in `pageSections` inside `PageLayout.astro` so its breadcrumb section is right;
unregistered routes fall back to "Welcome".

Editorial building blocks (`editorial.css`), use these before inventing new ones:

| Class | Use |
|---|---|
| `.editorial-page` | Wrapper that enables the editorial type and link styles |
| `.editorial-lead` | Two-column intro: text plus `.editorial-side` aside (gold top rule) |
| `.editorial-section` | Vertical section with hairline top border |
| `.editorial-split` | Label column + content column |
| `.editorial-columns` | Two equal columns |
| `.icon-heading` + `.editorial-icon` | Heading with a gold-deep Font Awesome icon |
| `.editorial-link-list` | Ruled list of links with trailing arrows |
| `.editorial-note` | Callout on darker paper (`#ebe4d4`) |
| `.pending-notice` | Single paper card (used for "under construction" and the access gate) |

All grids collapse to one column at 900px. Content width is
`min(1180px, calc(100% - 48px))`.

## Components

**Buttons.** `.action-link`: ink fill, white text, 1px ink border, radius .35rem,
min-height 50px, 1.125rem weight 650, hover `#164770`. `.action-link.secondary`:
transparent with ink text. Homepage hero uses `.home-button-primary`
(gold-300 fill, navy text) and `.home-button-secondary` (translucent navy,
white border). Add `cursor: pointer` to every interactive element.

**Text links.** `.text-link`: ink, 650 weight, underline offset .25em, Font
Awesome `fa-arrow-right` after the label. External links use
`fa-arrow-up-right-from-square` plus visually hidden "(opens in a new tab)".

**Icons.** Font Awesome 6.4 (CDN). Decorative icons get `aria-hidden="true"`.
Never use cross or crucifix icons; use the Star of David or neutral symbols.

**Forms.** Labels always visible above fields. Inputs min-height 56px, white
fill, 1px warm border, radius .35rem, 1.125rem+ text. One primary action per
form. Errors appear above the field with `role="alert"` and plain-language
recovery steps.

**Dialogs and drawers.** Native `<dialog>` with navy backdrop
`rgba(6, 29, 53, 0.58)` and paper surface (see mobile nav in `chrome.css`).

**Section dividers.** `SectionDivider.astro` with `from`/`to` colors and a
`shape` of `rise`, `crest`, `sweep`, or `sweep-reverse`. Use between color bands
instead of hard edges.

**Shadows.** Rare. When needed: `0 8px 22px rgba(6, 29, 53, 0.08)`. Prefer a
hairline border. No side-stripe callouts thicker than 3px on new work; prefer a
full hairline border.

## Motion

- One curve: `var(--motion-ease-lux)`; durations `--motion-fast` (180ms) and
  `--motion-medium` (620ms).
- Hover lifts are at most 2px. No bounce or overshoot.
- Wrap non-essential motion in `prefers-reduced-motion: no-preference`; hover
  shimmer additionally requires `(hover: hover) and (pointer: fine)`.

## Accessibility baseline

- Focus ring: 3px solid `#397ca6`, offset 4px (global in `typography.css`).
- Touch targets 44px minimum on phones.
- Heading order without skips; footer headings are `h2`.
- Page renders and works without JavaScript where possible (forms post
  normally, notices are server-rendered).

## Checklist for a new page

1. `src/pages/<slug>.astro` using `PageLayout` with `title`, `pageTitle`,
   `description`.
2. Add the route to `pageSections` in `PageLayout.astro`.
3. Compose with the editorial classes above; scoped `<style>` only for what they
   lack, using `--interior-*` tokens.
4. Copy follows `CONTENT_VOICE.md`. Editable text uses `data-editable="key"`.
5. To make the page private, put it under a prefix listed in `exclusiveAreas`
   (`src/lib/exclusiveAccess.ts`); see `docs/exclusive-access.md`.
6. Check 390px and 1440px widths, contrast, 44px targets, reduced motion.
