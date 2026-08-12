import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const dividerSource = readFileSync(
    new URL('../components/layout/SectionDivider.astro', import.meta.url),
    'utf8'
);
const homeSource = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');
const pageLayoutSource = readFileSync(new URL('../layouts/PageLayout.astro', import.meta.url), 'utf8');
const chromeStyles = readFileSync(new URL('../../public/styles/chrome.css', import.meta.url), 'utf8');
const baseLayoutSource = readFileSync(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
const motionStyles = readFileSync(new URL('../../public/styles/motion.css', import.meta.url), 'utf8');
const homeStyles = readFileSync(new URL('../../public/styles/home.css', import.meta.url), 'utf8');

test('organic divider is a decorative, responsive SVG seam with explicit adjacent colors', () => {
    assert.match(dividerSource, /aria-hidden="true"/);
    assert.match(dividerSource, /--divider-from:/);
    assert.match(dividerSource, /--divider-to:/);
    assert.match(dividerSource, /'rise' \| 'crest' \| 'sweep' \| 'sweep-reverse'/);
    assert.match(dividerSource, /<svg/);
    assert.match(dividerSource, /viewBox="0 0 1440 120"/);
    assert.match(dividerSource, /preserveAspectRatio="none"/);
    assert.match(dividerSource, /<path d=\{shapePaths\[shape\]\} fill="var\(--divider-to\)"/);
    assert.doesNotMatch(dividerSource, /<img|data:image/);
    assert.match(chromeStyles, /\.organic-section-divider \{/);
    assert.match(chromeStyles, /margin-top: calc\(-1 \* var\(--divider-height\)\)/);
    assert.match(chromeStyles, /background: transparent;/);
    assert.match(chromeStyles, /\.organic-section-divider__svg \{/);
    assert.doesNotMatch(chromeStyles, /\.organic-section-divider[^\n{]*\{[^}]*background:\s*var\(--divider-from\)/s);
    assert.doesNotMatch(chromeStyles, /\.organic-section-divider::before|clip-path: ellipse/);
});

test('homepage and interior layout use full-width transitions at major color boundaries', () => {
    assert.equal((homeSource.match(/<SectionDivider /g) ?? []).length, 4);
    assert.equal((pageLayoutSource.match(/<SectionDivider /g) ?? []).length, 2);
    assert.match(
        homeSource,
        /<\/section>\s*<section class="home-section home-community"/,
        'the viewport-height homepage hero must end on a flat boundary'
    );
    assert.match(homeSource, /shape="rise"/);
    assert.match(homeSource, /shape="crest"/);
    assert.match(homeSource, /shape="sweep-reverse"/);
    assert.match(pageLayoutSource, /interior-navy\)" to="var\(--interior-cream/);
    assert.match(pageLayoutSource, /interior-cream\)" to="var\(--site-chrome-navy/);
});

test('divider release has an explicit stylesheet cache version', () => {
    assert.match(baseLayoutSource, /20260812-responsive-type-1/);
});

test('large sections never remain partially transparent while scrolling', () => {
    assert.doesNotMatch(motionStyles, /animation-timeline:\s*view\(\)/);
    assert.doesNotMatch(motionStyles, /\.home-redesign\s*>\s*\.home-section/);
});

test('calendar artwork keeps a localized caption scrim instead of a heavy full-image wash', () => {
    assert.match(homeStyles, /\.home-calendar-image::after[^}]*rgba\(6, 26, 50, 0\.76\)[^}]*transparent 68%/s);
    assert.doesNotMatch(homeStyles, /\.home-calendar-image::after[^}]*0\.92/s);
});
