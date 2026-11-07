import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const homepage = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');
const homeStyles = readFileSync(new URL('../../public/styles/home.css', import.meta.url), 'utf8');
const packageSource = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');

test('homepage motion stays decorative, dependency-free, and isolated to the homepage stylesheet', () => {
    assert.match(homepage, /stylesheets=\{\["\/styles\/home\.css\?(?:rev|v)=[^"]+"\]\}/);
    assert.doesNotMatch(homepage, /home-scroll-thread/);
    assert.equal((homepage.match(/data-home-motion-heading/g) ?? []).length, 7);
    assert.doesNotMatch(packageSource, /"(?:motion|lenis|gsap)"\s*:/);
});

test('the homepage has no scroll-position tracker', () => {
    assert.doesNotMatch(homepage, /home-scroll-thread|--home-scroll-progress/);
    assert.doesNotMatch(homeStyles, /home-scroll-thread/);
});

test('heading reveals are progressive enhancement and never hide full homepage sections', () => {
    assert.match(homepage, /!\('IntersectionObserver' in window\)/);
    assert.match(homepage, /observer\.unobserve\(entry\.target\)/);
    assert.match(homepage, /reducedMotion\.matches/);
    assert.match(homepage, /disableHomeMotion\(\)/);
    assert.match(
        homeStyles,
        /html\.home-motion-ready \[data-home-motion-heading\] > \* \{[^}]*opacity: 0;/s,
    );
    assert.match(
        homeStyles,
        /html\.home-motion-ready \[data-home-motion-heading\]\.is-home-revealed > \* \{[^}]*opacity: 1;/s,
    );
    assert.doesNotMatch(homeStyles, /html\.home-motion-ready \.home-redesign\s*>\s*\.home-section/);
});

test('button sheen is a one-pass fine-pointer enhancement with preserved foreground content', () => {
    assert.match(
        homeStyles,
        /@media \(prefers-reduced-motion: no-preference\) and \(hover: hover\) and \(pointer: fine\)/,
    );
    assert.match(homeStyles, /\.home-button > :is\(span, i, svg\) \{ position: relative; z-index: 1; \}/);
    assert.match(homeStyles, /\.home-button:is\(:hover, :focus-visible\)::after/);
    assert.match(
        homeStyles,
        /@media \(max-width: 360px\) \{[\s\S]*?\.home-button \{ font-size: 1rem; \}/,
    );
    assert.doesNotMatch(homeStyles, /\.home-button::after[^}]*animation-iteration-count:\s*infinite/s);
});

test('homepage supporting labels remain legible at production mobile sizes', () => {
    assert.match(homeStyles, /--home-gold-700: #8a6518;/);
    assert.match(
        homeStyles,
        /\.home-utility-copy > strong \{[^}]*color: var\(--home-gold-700\);/,
    );
    assert.match(homeStyles, /\.home-timeline-note \{[^}]*font-size: clamp\(1rem,/);

    for (const selector of [
        'home-service-address span',
        'home-map-caption span',
        'home-utility-copy > strong',
        'home-rabbi-title',
        'home-torah-quote cite',
        'kehilat-calendar-date-weekday',
        'kehilat-calendar-event-time',
        'kehilat-calendar-attribution > summary',
        'kehilat-calendar-attribution > p',
    ]) {
        assert.match(homeStyles, new RegExp(`\\.${selector.replaceAll('.', '\\\\.')} \\{[^}]*font-size: 1rem;`));
    }
});
