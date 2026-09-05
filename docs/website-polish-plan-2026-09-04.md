# Website polish: implementation and review

Updated September 4, 2026. Dylan approved implementation after supplying the congregation email and clarifying that Admin needed visual polish, newsletter notifications needed a stronger incoming subject, and the Donate page should keep its headline while using “Giving” for its methods.

The work is implemented locally. No commit, push, Cloudflare deployment, remote database operation, domain change, or outgoing message has been performed.

## Implemented locally

- Source Serif 4 headings and Source Sans 3 body/control text, self-hosted with licenses. Body text targets 18–20px; secondary text is at least 16px. Hebrew has a separate fallback and existing divine-name markup is preserved.
- Shared interior spacing, reading widths, headings, accessible focus styling, and standalone icons. No cross symbols were added.
- UMJC, Holidays, Contact, About, and Stand With Israel have revised layouts and clearer content hierarchy. Services, Donate, Our Identity, policies, forms, and admin received typography and usability polish. Location information is consolidated into the homepage.
- `/mission` remains the complete identity destination, using the existing approved text. The homepage has a broad introduction and three full-row links to Vision and Purpose, Core Commitments and Affirmations, and Core Values. It no longer lists or summarizes individual commitments and values. About now keeps distinct welcome/community content.
- Both navigation placements and the footer use **Congregational Calendar** and `/#congregation-calendar`. The existing `#upcoming-dates` heading remains. Location links reach `/#map`, and `/location` returns a permanent 301 redirect there. Learn and Resources menus link directly to specific destinations, with no overview entries; the questions link is labeled **FAQs**.
- What to Expect, FAQs, Events, Resources, and Youth stay selectable. Ordinary clicks open a native construction dialog without leaving the current page. It dismisses after eight seconds, pauses after deliberate interaction, supports Escape, and restores focus. Direct/new-tab/no-JavaScript requests retain safe pages. Drafts require a server-validated admin role and private, uncached responses.
- The admin login modal has the same cream/navy design, readable labels, six responsive PIN fields, native focus isolation, and focus restoration. Authentication endpoints and credentials are unchanged. Successful login/logout refresh the server-rendered preview permissions.
- The Donate heading remains **Donate**; method labels now say **Giving with Zelle**, **Giving with PayPal**, and **Giving by check**. Payment identifiers, links, QR files, and provider marks remain intact.
- The existing newsletter worker subject is now **[STAGING] NEW NEWSLETTER SIGNUP | Kehilat Ohr HaTorah**. Recipients, sender, delivery logic, and donor-record notifications remain unchanged. No notification was sent.
- Five active stock subjects were replaced with coordinated ChatGPT-generated illustrations: olive branches, mezuzah, Torah study, Shabbat table, and Torah scroll. Responsive WebP copies and provenance are in `public/images/generated/`. They do not depict an actual congregation gathering. Rabbi photography and all hero-video files, source URLs, native loop, playback logic, and desktop framing remain unchanged. The responsive follow-up changes image framing and the mobile hero crop as described below.

## Responsive and content follow-up

- The olive artwork alone is mirrored horizontally. The skyline stays upright, the rabbi's photo is not mirrored, and his profile card stays on the right at every breakpoint. An explicit image-container width prevents the mobile minimum height from expanding it beyond a 320px screen.
- The mezuzah crop shows the full case and its mounting screws. Its decorative caption overlay is removed. The Shabbat table uses a full portrait frame on desktop and a 4:5 frame on smaller screens, keeping candle flames, the cup, and challah visible; its caption now sits outside the image. Torah study has a stable reading frame and a taller mobile image header. The faint Torah-scroll background remains readable behind the schedule.
- The hero video was an inline element in a container with visible overflow, producing nine extra pixels of scroll height. It is now an absolutely positioned block within clipped media and hero containers. The desktop-only video poster attribute is removed so the existing responsive CSS poster can show the correct mobile artwork. Dylan then clarified that the mobile framing should exclude the silver object above the Torah during playback. The mobile media plane is now 140% of the hero's height and anchored to its bottom, with both poster and video positioned at `55% 100%`. This focuses the visible frame on the lower Torah portion; the desktop `62% 52%` crop is unchanged.
- The homepage has one rabbi biography disclosure. The repeated leadership/membership expansion was removed, and UMJC has its own direct link. Retired homepage editable keys `about-us-text-3` and `about-us-text-4` are no longer rendered; stored database values were not deleted or modified.
- Interior icons sit beside their headings. Decorative eyebrow labels and repeated calendar category labels are removed from the visual presentation; calendar categories remain available to assistive technology. Actual form labels, dates, and Scripture citations remain. The approach was informed by [contextual design failure patterns](https://github.com/ConardLi/garden-skills/blob/main/skills/web-design-engineer/references/failure-patterns.md), without installing the repository or adopting its instructions.
- The seven email-based holiday service entries now lead with their service titles, dates, times, and fuller explanations. Kol Nidre remains featured; arrival instructions and approximate times remain visible. Organization descriptions each have two paragraphs about the organization itself, without personal-connection claims.
- Local reloads previously could combine fresh Astro HTML with cached public CSS. Development requests now refresh stylesheet versions, while built releases keep one stable explicit version.
- An earlier text-wrapping pass removed automatic mobile heading hyphenation and unnecessary character-count width caps on homepage, interior, and identity titles. At 390px, the homepage heading now uses its available 362px instead of 283px and keeps “welcome” intact. At 768px, “Our UMJC Membership” uses the available title width and fits one line. Editorial columns stack by 900px, and desktop dropdowns size to their labels. That pass missed paragraph-level intro constraints, corrected in the follow-up below.

## Follow-up audit: wrapping, navigation, and calendar visibility

The earlier statement that the global visual pass was finished was premature. Overflow checks did not catch short introductions wrapping inside unnecessarily narrow boxes. The follow-up addresses these confirmed cases:

- Homepage About: removed both the 760px heading-container cap and the 62ch paragraph cap. The sentence now uses the 1180px section at desktop size and fits on one line with 20px text, increased from 16px. The Our Identity teaser fills its existing column; This Shabbat's heading rule uses the section width.
- About, UMJC, Contact, Stand With Israel, and Holidays: introductory paragraphs use their actual grid columns, without the extra 66ch limit. Services and all three policy introductions similarly use their available containers. Long article paragraphs retain their reading measures.
- Desktop navigation: preserved the seven tabs, colors, 64px height, and destinations. Labels are 18–20px with a lighter 650 weight, centered icon-and-label groups, 44px disclosure targets, clear focus states, and 18px dropdown text in rows at least 48px high. Mobile navigation rules are unchanged.
- Removed the calendar's Gathering Details link and its unused second heading column and link styles.
- Calendar service descriptions now appear directly in the event cards. This exposes September 26's traditional prayers, waving of the lulav, and Torah Service, as well as September 21's arrival guidance and approximate-time notes. The text comes from the stored congregation records; third-party descriptions remain in the details panel. Kol Nidre receives a restrained gold highlight in the calendar as well as its existing Holidays feature. No service record or date was changed during this follow-up.

Calendar verification used the pasted notes, the supplied September 2 email, and the actual local API/UI. The original September 3 Word attachment was no longer present at its supplied Desktop path, so it was not independently reread in this follow-up.

## Holiday programme and calendar

The supplied email provides the seven autumn services below. Kol Nidre is featured prominently. The Holidays page reads the same managed D1 records as the calendar, including subsequent admin edits. It does not restore defaults over an empty or unavailable bound database.

| Date | Programme | Pacific time |
| --- | --- | --- |
| September 12 | Rosh HaShanah / Yom Teruah; traditional prayers, Torah, shofar | 2:30 p.m. |
| September 20 | Kol Nidre | 6:30–8:00 p.m. |
| September 21 | Mincha; arrivals after 1:30 p.m. | 3:00 p.m. |
| September 21 | Neilah | Approximately 6:45 p.m. |
| September 21 | Havdalah and break-the-fast | Approximately 7:26 p.m. |
| September 26 | Sukkot first day; traditional prayers, lulav, Torah | 2:30 p.m. |
| October 3 | Shemini Atzeret and Simchat Torah | 2:30 p.m. |

Start-only support avoids invented end times. The reviewed data operation replaces only the music/prayer occurrences on September 12, September 26, and October 3 with the corresponding single holiday programme. It preserves those weekly series on other dates, preserves Kiddush/food/discussion, and does not restore previously deleted recurring records.

The requested Hebcal exclusions are exact 2026 date/title matches. October 2 Shabbat candle lighting is retained; October 3 has the combined festival label; October 4 has no separate Simchat Torah marker. Date-only Hebcal entries no longer display “All day”; Erev markers say “Evening.” Explicitly all-day congregation events retain that label.

**Live calendar publication remains a separate reviewed data operation.** Structural migration 0003 is needed before the new calendar editor writes. The SQL and release sequence are described in [the calendar change review](data-changes/README.md). Neither was applied remotely.

## Research and content boundaries

The UMJC page centers the congregation’s existing approved explanation of membership, then adds concise context about shared Jewish covenantal life, education, mutual support, and accountability. It does not invent participation in particular programmes. Sources: [UMJC vision](https://www.umjc.org/vision), [Statement of Faith](https://www.umjc.org/statement-of-faith), [Defining Messianic Judaism](https://www.umjc.org/defining-messianic-judaism), [Why Join the Union](https://www.umjc.org/why-join-the-union).

Organization descriptions are public summaries without personal-connection or partnership claims: [Hope for Israel](https://hope4israel.org/what-we-do/), [Israel Relief Aid](https://israelrelief.org.il/about-us-2/), [Chevra USA](https://mychevra.org/), [Shiloh Israel Children’s Fund](https://www.israelchildren.org/our-therapies/). The supplied email was treated as reference content; private anecdotes, dated medical/news items, and inconsistent dated reading references were not republished. The unfinished resources reading list stays protected.

Source Serif was designed to accompany Source Sans; this is a coordinated design choice, not a religious typography requirement. See [Adobe’s design rationale](https://blog.adobe.com/en/publish/2021/03/04/source-serif-gets-optical-sizes). Exact font revisions and licenses are recorded in `public/fonts/README.md`.

## Verification

- `npm test`: 186 passing site unit and contract tests, including real SQLite tests for the migration, start-only CRUD, recurrence exceptions, idempotent holiday data, editor overrides, and unavailable/empty database behavior. The added programme regression verifies all seven stored dates/times, September 26 service details, arrival/approximation notes, retained Kiddush events, and unaffected Saturdays.
- `npm run build`: Astro server/client build passes.
- From `deploy/update-request-notifier`: 16 passing tests and `npm run check` (TypeScript) passes.
- Local Pages preview with an isolated local database: the autumn programme renders from stored rows; October 2 candle lighting is 6:16 p.m.; the combined October 3 marker is present; no October 4 Simchat Torah duplicate.
- Responsive browser checks cover 320px, 390px, 430px, 768px, 1024px, and 1440px layouts. All twelve public content pages were checked at 320px for page overflow and clipped headings, paragraphs, figures, or articles, with none found after the image-width fix. Generated image crops were visually reviewed at phone, tablet, and desktop widths. These are browser viewport checks, not physical iPhone/Safari certification or a 200% zoom audit.
- Ten final mobile hero reloads at 320px, 390px, and 430px wide, with heights from 744px to 932px, retained the 1.4 media/hero height ratio, matching video/media rectangles, bottom alignment, clipped hero bounds, matching poster/video position, the mobile source, and active playback at `readyState: 4`. The silver object is outside the reviewed mobile crop. Built desktop/mobile media routes each returned HTTP 206 for byte-range requests. Hero files, delivery routes, and payment artifacts are unchanged from HEAD.
- Desktop Learn/Resources menus, mobile Learn/FAQ navigation, automatic construction-dialog dismissal and focus restoration, the homepage map link, and the Core Values deep link were checked. The map and identity targets land below the fixed header. `/location` returns HTTP 301 with `Location: /#map`.
- Following the wrapping changes, heading and paragraph text rectangles on thirteen routes were checked at both 320px and 900px, with no text extending beyond the viewport. The homepage and UMJC title changes, identity headings, and desktop menu labels were also reviewed visually at 390px, 768px, and 1440px.
- The latest follow-up checked headings, paragraphs, links, and buttons on twelve public content routes at 320px, 768px, 900px, and 1440px: 48 route/viewport combinations with no page overflow or text extending beyond the viewport. Desktop navigation was checked at 1360px, 1440px, and 1920px: all seven groups centered within one pixel, with no label/arrow collision. All five dropdowns fit their labels at 18px. These checks address the observed defects, not a guarantee that no further visual refinements remain.
- Five direct pending routes were checked with an invalid session cookie: safe fallback only, no admin bypass, `private, no-store`, `Vary: Cookie`, and `noindex, nofollow`.

The local preview deliberately does not connect the email queue or submit real forms/payments. These checks do not establish live delivery or deployment. No formal WCAG conformance audit or manual assistive-technology certification is claimed. Release, live data updates, custom-domain cutover, and a launch announcement require their own authorized steps.

## Local review

- Full built preview, including the isolated local autumn calendar: `http://192.168.0.19:3003/`.
- Astro development server: `http://192.168.0.19:3002/`. This separate development database has no congregation calendar table, so use port 3003 to review the complete programme. Both are reachable over the local network; neither publishes the site.
