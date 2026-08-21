import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const homepage = readFileSync(`${repositoryRoot}/src/pages/index.astro`, 'utf8');
const calendarComponent = readFileSync(
    `${repositoryRoot}/src/components/islands/CongregationCalendar.astro`,
    'utf8',
);
const homeStyles = readFileSync(`${repositoryRoot}/public/styles/home.css`, 'utf8');

test('homepage contact label and Scripture proportions reflect the requested balance', () => {
    assert.match(
        homepage,
        /<strong>Mailbox<\/strong><p>360 E\. 1st Street, #856<br>Tustin, CA 92780<\/p>/,
    );
    assert.doesNotMatch(homepage, /<strong>Mail<\/strong><p>360 E\. 1st Street/);
    assert.match(
        homeStyles,
        /\.home-torah-quote \.home-shell \{[^}]*minmax\(0, 1\.18fr\) minmax\(280px, 0\.82fr\)/,
    );
    assert.match(
        homeStyles,
        /\.home-torah-quote-primary p \{[^}]*font-size: clamp\(1\.42rem, 2\.45vw, 2\.1rem\)/,
    );
    assert.match(
        homeStyles,
        /\.home-torah-quote-secondary p \{[^}]*font-size: clamp\(1\.3rem, 2\.2vw, 1\.9rem\)/,
    );
    assert.match(homeStyles, /\.home-torah-quote blockquote p \{[^}]*text-wrap: balance/);
    assert.match(homeStyles, /\.home-torah-quote \.home-verse-keep \{ white-space: nowrap; \}/);
    assert.match(homeStyles, /@media \(min-width: 768px\) and \(max-width: 899px\) \{[\s\S]*?\.home-torah-quote \.home-shell \{ grid-template-columns: 64px minmax\(0, 1fr\);/);
    assert.equal([...homepage.matchAll(/class="home-verse-keep"/g)].length, 12);
    assert.match(homepage, /home-verse-keep">is a Tree of Life</);
    assert.match(homepage, /home-verse-keep">are ways of pleasantness</);
    assert.match(homepage, /home-verse-keep">to You, <span class="divine-name">/);
    assert.match(
        homeStyles,
        /@media \(max-width: 767px\) \{[\s\S]*?\.home-torah-quote-primary p \{ font-size: 1\.28rem;[\s\S]*?\.home-torah-quote-secondary p \{ font-size: 1\.21rem; \}/,
    );
});

test('calendar fills complete viewport-sized rows and keeps its source license in an accessible disclosure', () => {
    assert.match(calendarComponent, /mobileDateLimit = 3/);
    assert.match(calendarComponent, /tabletDateLimit = 6/);
    assert.match(calendarComponent, /desktopDateLimit = 9/);
    assert.match(calendarComponent, /matchMedia\('\(max-width: 599px\)'\)/);
    assert.match(calendarComponent, /matchMedia\('\(min-width: 1180px\)'\)/);
    assert.match(calendarComponent, /mobileLayoutQuery\.addEventListener\('change', handleCalendarLayoutChange\)/);
    assert.match(calendarComponent, /desktopLayoutQuery\.addEventListener\('change', handleCalendarLayoutChange\)/);
    assert.match(calendarComponent, /<details class="kehilat-calendar-attribution">/);
    assert.match(calendarComponent, /<span>Calendar sources &amp; license<\/span>/);
    assert.match(
        calendarComponent,
        /Jewish holiday and candle-lighting data provided by[\s\S]*?Hebcal\.com[\s\S]*?licensed under[\s\S]*?CC BY 4\.0[\s\S]*?reformatted for this list\./,
    );
    assert.doesNotMatch(calendarComponent, /<p class="kehilat-calendar-attribution">/);
    assert.match(homeStyles, /\.kehilat-calendar-attribution > summary \{[^}]*min-height: 44px;[^}]*cursor: pointer;/);
    assert.match(homeStyles, /\.kehilat-calendar-attribution > summary:focus-visible \{/);
    assert.match(homeStyles, /\.kehilat-calendar-attribution > p \{[^}]*max-width: 44rem;/);
});

test('calendar cards omit item counts and keep fluid Gregorian and Hebrew dates together', () => {
    assert.doesNotMatch(calendarComponent, /kehilat-calendar-date-count/);
    assert.doesNotMatch(calendarComponent, /group\.events\.length.*(?:item|items)/);
    assert.match(calendarComponent, /formatHebrewCalendarDate\(event\.extendedProps\.hebrewDate\)/);
    assert.match(calendarComponent, /stripRepeatedHebrewYear\([\s\S]*?event\.extendedProps\.hebrewDate/);
    assert.match(calendarComponent, /className = 'kehilat-calendar-gregorian-date'/);
    assert.match(calendarComponent, /className = 'kehilat-calendar-event-hebrew-date'/);
    assert.match(
        homeStyles,
        /\.kehilat-calendar-date-heading \{[^}]*font-size: clamp\([^}]*white-space: nowrap;/,
    );
    assert.match(
        homeStyles,
        /\.kehilat-calendar-gregorian-date,[\s\S]*?\.kehilat-calendar-event-hebrew-date \{ white-space: nowrap; \}/,
    );
    assert.doesNotMatch(homeStyles, /\.kehilat-calendar-date-count/);
});
