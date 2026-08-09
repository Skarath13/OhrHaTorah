import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const navigationSource = readFileSync(
    new URL('../components/layout/Navigation.astro', import.meta.url),
    'utf8'
);
const chromeStyles = readFileSync(
    new URL('../../public/styles/chrome.css', import.meta.url),
    'utf8'
);
const homeSource = readFileSync(
    new URL('../pages/index.astro', import.meta.url),
    'utf8'
);
const heroRouteSource = readFileSync(
    new URL('../pages/api/hero-video/[variant].ts', import.meta.url),
    'utf8'
);

test('mobile navigation uses disclosure-first rows without split page and menu cues', () => {
    assert.doesNotMatch(navigationSource, /nav-page-cue|nav-expand-label/);
    assert.equal((navigationSource.match(/data-nav-label=/g) ?? []).length, 5);
    assert.match(navigationSource, /class="nav-mobile-page-link" href="\/"/);
    assert.match(navigationSource, /class="nav-mobile-page-link" href="\/resources"/);
    assert.match(chromeStyles, /\.nav-item-row > a\.nav-primary-link \{\s*display: none !important;/);
    assert.match(navigationSource, /class="nav-drawer-header"/);
    assert.doesNotMatch(navigationSource, /nav-drawer-scroll/);
    assert.match(chromeStyles, /\.nav-drawer-header \{[\s\S]*?position: sticky !important;/);
    assert.match(chromeStyles, /\.site-navigation-shell \.nav-container \{[\s\S]*?position: fixed !important;[\s\S]*?inset: 0 0 0 auto !important;/);
    assert.match(chromeStyles, /\.site-navigation-shell \.nav-container \{[\s\S]*?display: none !important;[\s\S]*?overflow-y: auto !important;[\s\S]*?transform: none !important;/);
    assert.match(chromeStyles, /\.site-navigation-shell \.nav-container\.active \{[\s\S]*?display: block !important;/);
    assert.match(chromeStyles, /\.site-navigation-shell \.nav-links \{[\s\S]*?display: block !important;/);
    assert.doesNotMatch(navigationSource, /document\.body\.style\.position/);
    assert.match(navigationSource, /navContainer\.scrollTop = 0/);
});

test('homepage and byte-range route use the versioned forward-reverse hero media', () => {
    const variants = ['desktop', 'mobile'];

    for (const variant of variants) {
        const mp4Name = `ohr-hatorah-hero-${variant}-loop-v2.mp4`;
        const webmName = `ohr-hatorah-hero-${variant}-loop-v2.webm`;
        assert.match(heroRouteSource, new RegExp(mp4Name.replaceAll('.', '\\.')));
        assert.match(homeSource, new RegExp(webmName.replaceAll('.', '\\.')));
        assert.ok(existsSync(new URL(`../../public/media/hero/${mp4Name}`, import.meta.url)));
        assert.ok(existsSync(new URL(`../../public/media/hero/${webmName}`, import.meta.url)));
    }

    assert.match(homeSource, /<video[\s\S]*?\sloop\s/);
    assert.match(homeSource, /\/api\/hero-video\/mobile-v2/);
    assert.match(homeSource, /\/api\/hero-video\/desktop-v2/);
});
