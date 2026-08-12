# Archived Website Features

## Computed prayer-times panel

- **Archived:** August 2026
- **Last source revision:** `06a750cf192ef3126b7f430e2af5fc58a45b5e95`
- **Former location:** `src/pages/index.astro`, with homepage-specific presentation in `public/styles/home.css`
- **Reason:** The panel labeled Hebcal astronomical zmanim as `Shacharit`, `Mincha`, and `Ma'ariv`. Visitors could reasonably confuse those computed markers with Kehilat Ohr HaTorah's actual service schedule.
- **Replacement:** The homepage now presents Shabbat candle lighting and the following Shabbat's Hebrew and Gregorian dates.

Git history is the archive; no disabled markup, dormant interval, or unused runtime is shipped. If a future requirement restores prayer information, begin from the archived revision but use an approved congregational schedule or label zmanim accurately. Do not present astronomical markers as service times.
