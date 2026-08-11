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

test('organic divider is decorative, CSS-only, and accepts explicit adjacent colors', () => {
    assert.match(dividerSource, /aria-hidden="true"/);
    assert.match(dividerSource, /--divider-from:/);
    assert.match(dividerSource, /--divider-to:/);
    assert.doesNotMatch(dividerSource, /<svg|<img|data:image/);
    assert.match(chromeStyles, /\.organic-section-divider \{/);
    assert.match(chromeStyles, /border-radius:/);
    assert.match(chromeStyles, /overflow: hidden;/);
});

test('homepage and interior layout use full-width transitions at major color boundaries', () => {
    assert.equal((homeSource.match(/<SectionDivider /g) ?? []).length, 7);
    assert.equal((pageLayoutSource.match(/<SectionDivider /g) ?? []).length, 2);
    assert.match(homeSource, /home-blue-950\)" to="var\(--home-cream-100/);
    assert.match(pageLayoutSource, /interior-navy\)" to="var\(--interior-cream/);
    assert.match(pageLayoutSource, /interior-cream\)" to="var\(--site-chrome-navy/);
});

test('divider release has an explicit stylesheet cache version', () => {
    assert.match(baseLayoutSource, /20260811-organic-section-dividers-1/);
});
