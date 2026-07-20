# Ohr HaTorah — Seven Lamps / Living Almanac

This file is the visual authority for the Ohr HaTorah website. It is derived from complete, pinned source prompts in VoltAgent's `awesome-design-md` collection:

- Primary structure: [WIRED DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/664b3e78fd1a298ba11973822da988483256d4b4/design-md/wired/DESIGN.md)
- Homepage image choreography: [Ferrari DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/664b3e78fd1a298ba11973822da988483256d4b4/design-md/ferrari/DESIGN.md)
- Upstream revision: `664b3e78fd1a298ba11973822da988483256d4b4`

WIRED supplies the editorial typography, open magazine grids, sharp controls, hairline hierarchy, and interior-page structure. Ferrari supplies only the full-bleed image and alternating chapter-band rhythm. Neither source palette, trademark, or product language is copied.

## Subject, audience, and job

- Subject: a Messianic Jewish congregation rooted in Torah, Jewish practice, Yeshua, learning, prayer, and community.
- Audience: Jewish and non-Jewish visitors, interfaith families, current congregants, and people exploring a first Shabbat visit.
- Primary job: establish trust and identity, explain what happens at Ohr HaTorah, and make visiting easy.
- Signature: seven desaturated watercolor pigments behave as a single navigation spectrum, then resolve into a continuous antique-gold "line of light" through a living congregational almanac.

## Non-negotiable project identity

- Preserve the existing Ohr HaTorah logo without altering its artwork.
- Preserve Chuck/Rabbi Charles Ott's existing portrait without generating or retouching it.
- Decorative and editorial imagery other than the logo and Chuck portrait must be project-generated.
- Preserve the original full-width, sticky, seven-color navigation grammar from `master`: blue, pink, mint, yellow, lilac, peach, and gold segments with matching dropdown families.
- The multicolor navigation is a functional brand asset, not a hover-only effect and not a translucent capsule.
- Use Tabler icons. Never use cross or crucifix imagery.

## Visual theme

The site is a sacred-community almanac, not a SaaS landing page or institutional brochure. It should feel like a beautifully typeset congregational journal that is alive with the current Jewish week: substantial, specific, legible, warm, and culturally grounded.

The page uses open compositions, editorial offsets, and functional almanac data. Watercolor appears as authored art and pigment fields, not blurry CSS circles. Paper texture is quiet and global. Navy/parchment polarity, the gold light-line, and 1px rules create depth; cards and shadows do not. Every large chapter must have a different compositional reason to exist.

## Color roles

- `navy-950` `#071B2E`: footer and deepest chapter surface.
- `navy-900` `#0B2742`: primary dark chapter surface.
- `navy-700` `#174C72`: secondary blue and focus support.
- `parchment-50` `#FCF8EE`: lifted reading surface.
- `parchment-100` `#F2E8D6`: page canvas.
- `parchment-200` `#E5D5BC`: ruled and alternate surface.
- `ink` `#10273A`: primary text on light.
- `muted` `#55616A`: secondary text on light.
- `gold-500` `#B9862D`: primary action and ceremonial accent.
- `gold-300` `#DDBE7A`: hairlines and text on navy.
- Navigation lapis `#8FB4CF` / `#B7D0DE`.
- Navigation pomegranate `#C88782` / `#DDB5B0`.
- Navigation olive `#9EAF8D` / `#C1CBB6`.
- Navigation saffron `#D8B65F` / `#E7D18E`.
- Navigation lavender `#AFA7C8` / `#CEC8DD`.
- Navigation terracotta `#C99C7B` / `#DFC0A8`.
- Navigation gold `#C59A3D` / `#D9BB72`.

Color is structural. Large sections alternate parchment, navy, or generated watercolor imagery. Do not scatter small pastel surfaces throughout the page.

## Typography

Follow WIRED's role separation without using its look as a template:

- Display and reading: `Newsreader Variable`, Georgia, serif. Use optical size, weight, and italic deliberately so headings and prose do not feel like the same font treatment.
- Structure: `Manrope`, system-ui, sans-serif. Use for navigation, buttons, utility labels, tables, dates, and form controls.
- Authentic Hebrew/date content only: `Noto Serif Hebrew`, serif. Do not invent Hebrew decoration.

Scale:

- Hero display: `clamp(3.4rem, 7vw, 5.6rem)`, weight 500, line-height `0.92`.
- Section display: `clamp(2.5rem, 4.5vw, 3.75rem)`, weight 500, line-height `0.98`.
- Interior H1: `clamp(2.75rem, 5vw, 4.5rem)`.
- H3: `1.4–1.7rem`, Manrope 650 or Playfair 500 according to context.
- Reading lead: `1.25rem`, Source Serif 4, line-height `1.55`.
- Body: `1rem–1.08rem`, Source Serif 4 for narrative and Manrope for utility, line-height `1.6`.
- Metadata: `0.78–0.85rem`, Manrope 700, moderate tracking only when the content is genuinely metadata.

No repeated section eyebrows. Small uppercase labels are allowed only for real dates, times, table columns, route taxonomy, or form/utility metadata. They must not introduce every section.

## Layout

- Editorial body cap: `1360px`.
- Use a 12-column grid on desktop.
- Major spacing ladder: `8 / 16 / 24 / 32 / 48 / 64 / 96 / 128`.
- Full-bleed hero and chapter bands extend to viewport edges.
- Major chapters use 104–128px vertical spacing; functional almanac sections use 64–80px. Do not apply one uniform section height.
- Use asymmetric 5/7, 7/5, or 4/8 column splits when imagery and narrative share a chapter.
- Use 1px navy or gold hairlines to divide rows and columns.
- Keep meaningful two-column layouts at iPad widths. Collapse below `768px`, not at `1023px`.
- Interior pages are open editorial grids. They never sit inside one giant rounded container.

## Geometry and depth

- Default radius: `0`.
- Small utility radius: `2–4px` for form inputs and rare compact controls.
- Circular geometry is reserved for intrinsically circular icon buttons.
- Chuck's portrait is rectangular with its native visual integrity preserved.
- Editorial images are full-bleed rectangles at natural aspect ratios; no circles, pills, orbit masks, or satellite buttons.
- Buttons are sharp 48px controls with 0–2px radius.
- No floating-card shadows, atmospheric halos, glass capsules, or inset highlight stacks.
- Depth comes from photography/watercolor, navy–parchment contrast, and hairlines.

## Navigation

- There is no separate masthead above navigation. The logo and congregation name occupy a compact navy identity block inside the sticky navigation.
- The seven intent-based destinations are Visit, About, Shabbat, Calendar, Learn, Contact, and Give. Every top-level link has a real destination; no `href="#"` placeholders exist.
- Each destination owns one desaturated pigment field. Pigment fields read as watercolor paper, not candy tabs or application chrome. Top-level icons are removed; Tabler icons remain semantic inside dropdowns and content.
- Desktop dropdowns open on hover and keyboard focus; mobile submenus use explicit buttons.
- Mobile uses a visible logo bar plus a 48px menu button. Closed navigation is inert; Escape closes and restores focus.
- Do not turn the header into a floating pill or reduce the multicolor system to tiny hover stains.

## Homepage narrative

1. Hero: one concise identity statement, one primary Visit action, one secondary expectation link.
2. `#visit`: immediate decision block with Saturday time, verified address, service flow, directions, and contact.
3. Belonging: generated watercolor explicitly captioned as illustration; two concise paragraphs and three newcomer assurances.
4. Leadership and trust: Chuck's real portrait, short biography, and UMJC affiliation before doctrinal detail.
5. Weekly almanac: current Hebrew date, parashah, candles/Havdalah, and optional daily zmanim; legacy controls never resemble an admin surface.
6. `#congregation-calendar`: compact recurring-gathering treatment and permanent full-calendar link. No raw homepage calendar iframe.
7. Beliefs snapshot: Mission and Vision plus three primary pillars. The remaining values are available through an intentional disclosure and `/mission`.
8. Final Visit chapter and reduced footer. No separate generic community CTA.

## Components

### Actions

- Primary: gold background, navy text, 1px gold border, sharp corners, 48px minimum height.
- Secondary light: transparent/parchment background, navy border and text.
- Secondary dark: transparent, parchment border and text.
- Editorial text links are underlined or use a simple arrow. No pill links.

### Information rows

- Service times, dates, readings, and contact facts use ruled rows or columns.
- Tabler icons may identify a row, but icons do not sit in colored circular badges.
- Tables and live widgets use aligned columns and 1px rules, not independent cards.

### Imagery

- Hero art occupies a full-height or full-width rectangular field.
- Watercolor chapter art may bleed to an edge and use a controlled navy overlay for contrast.
- Never reuse the same generated scene twice on one page.
- Decorative texture uses empty alt text. Informative generated art uses a concise description.
- Generated people are always visibly identified as watercolor illustration and never presented as documentary community photography.

### Footer

- Deep navy rectangular band, no rounded surfaces.
- Compact editorial hierarchy with 1px gold/navy rules.
- Newsletter inputs are sharp, labeled, and 48px tall.
- Do not add another oversized marketing hero inside the footer.
- Newsletter capture is email-first unless names are operationally required.

### Motion

- No scroll-jacking and no continuous parallax.
- Major content may reveal once with a 12px maximum rise over 450ms.
- The gold light-line may draw once over 600ms as a chapter enters.
- Image pigment masks may settle from `scale(1.02)` to `1` once; no hover zoom.
- Arrows may translate 4px over 150ms. Navigation pigment changes use 160–220ms.
- `prefers-reduced-motion` receives the complete static composition immediately.

## Responsive behavior

- Mobile `<768px`: single-column narrative, 16–20px gutters, 48–64px chapter spacing, 40–48px display type, sticky mobile brand/navigation control.
- Tablet `768–1099px`: use the explicit menu control; retain selected 2-column editorial compositions, 24–32px gutters, and never depend on hover.
- Desktop `>=1100px`: integrated navy brand block plus seven equal pigment destinations, 12-column editorial layouts.
- Wide `>=1440px`: editorial content remains capped; full-bleed art and color bands continue to viewport edges.
- Required visual checks: `390x844`, `820x1180`, `1180x820`, `1440x900`, plus 320px reflow.

## Explicit anti-patterns

- No repeated eyebrows, dot labels, section chips, or taxonomy invented for decoration.
- No pill header, pill buttons, pill cards, or pill-cropped media.
- No circles/orbits/ghost words/empty decorative masks.
- No nested cards or blanket cardification selectors.
- No generic cream SaaS grid, dashboard strip, or isolated feature-card parade.
- No CSS radial-gradient watercolor blobs.
- No oversized empty embed frames presented as design features.
- No raw Google calendar or map iframe on the homepage; the functional embeds belong on their canonical interior routes with permanent fallbacks.
- No repeated abstract two-clause slogans, repeated italic decks, or mechanical 5/7 split sequence.
- No generated illustration masquerading as a real congregation photograph.
- No one-column iPad page caused by a desktop breakpoint.
- No typography monoculture; serif narrative and sans structure must remain distinct.

## Accessibility and web quality

Supporting prompt sources discovered through the pinned `awesome-agent-skills` catalog:

- Catalog: https://github.com/VoltAgent/awesome-agent-skills/blob/c97eda5e3406670f3285c6bf9eb7639a7ecc03cc/README.md
- Accessibility: https://github.com/addyosmani/web-quality-skills/blob/95d6e255afe1596b557d7a8498517884438f5b3a/skills/accessibility/SKILL.md
- Browser QA: https://github.com/anthropics/skills/blob/fa0fa64bdc967915dc8399e803be67759e1e62b8/skills/webapp-testing/SKILL.md

- Target WCAG 2.2 AA contrast and semantics.
- Preserve visible focus, sticky-header focus offsets, skip link, reduced motion, and 44px preferred touch targets.
- Dialogs require names, focus containment, Escape close, and focus restoration.
- Use explicit media dimensions, eager/preloaded LCP imagery, and lazy loading below the fold.
- Verify no horizontal overflow, one H1, labeled controls, menu focus isolation, and no uncaught first-party console errors.

## Build and visual gate

The build passing is necessary but not sufficient.

1. Run the production Astro/Cloudflare build.
2. Confirm no Font Awesome or old-media runtime references remain.
3. Confirm all editable keys and live integrations remain intact.
4. Capture full-page screenshots at every required viewport.
5. Inspect typography, image loading, header fidelity, content density, whitespace, alignment, and section rhythm in the screenshots.
6. Reject the pass if it merely avoids overflow while remaining visually generic, excessively long, or dependent on empty shapes.
