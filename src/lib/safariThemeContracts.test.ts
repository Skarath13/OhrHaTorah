import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const baseLayoutSource = readFileSync(
    new URL('../layouts/BaseLayout.astro', import.meta.url),
    'utf8'
);
const chromeStyles = readFileSync(
    new URL('../../public/styles/chrome.css', import.meta.url),
    'utf8'
);

test('Safari receives a declared site theme and an edge-to-edge safe viewport', () => {
    assert.match(
        baseLayoutSource,
        /<meta name="viewport" content="width=device-width, initial-scale=1\.0, viewport-fit=cover">/
    );
    assert.match(baseLayoutSource, /<meta name="theme-color" content="#061d35">/);
    assert.match(
        baseLayoutSource,
        /<meta name="theme-color" content="#061d35" media="\(prefers-color-scheme: light\)">/
    );
    assert.match(
        baseLayoutSource,
        /<meta name="theme-color" content="#031323" media="\(prefers-color-scheme: dark\)">/
    );
    assert.match(baseLayoutSource, /<meta name="color-scheme" content="light">/);
});

test('safe-area backgrounds and spacing use standards-based environment insets', () => {
    assert.match(
        chromeStyles,
        /--site-nav-height: calc\(var\(--site-nav-content-height\) \+ env\(safe-area-inset-top\)\);/
    );
    assert.match(chromeStyles, /:root \{[\s\S]*?color-scheme: light;[\s\S]*?background-color: var\(--site-chrome-navy\);/);
    assert.match(chromeStyles, /html \{[\s\S]*?background-color: var\(--site-chrome-navy\);/);
    assert.match(
        chromeStyles,
        /body \.site-footer \{[\s\S]*?padding: 4rem 0 calc\(1\.5rem \+ env\(safe-area-inset-bottom\)\) !important;/
    );
});

test('browser theming does not opt ordinary Safari pages into legacy standalone mode', () => {
    assert.doesNotMatch(baseLayoutSource, /apple-mobile-web-app-capable/);
    assert.doesNotMatch(baseLayoutSource, /apple-mobile-web-app-status-bar-style/);
});
