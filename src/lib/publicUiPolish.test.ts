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
        /\.home-torah-quote-primary p \{[^}]*font-size: clamp\(1\.45rem,[^}]*2\.25rem\)/,
    );
    assert.match(
        homeStyles,
        /\.home-torah-quote-secondary p \{[^}]*font-size: clamp\(1\.25rem,[^}]*1\.75rem\)/,
    );
    assert.match(
        homeStyles,
        /@media \(max-width: 767px\) \{[\s\S]*?\.home-torah-quote-primary p \{ font-size: 1\.3rem;[\s\S]*?\.home-torah-quote-secondary p \{ font-size: 1\.16rem; \}/,
    );
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
