import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const navigationSource = readFileSync(
    new URL('../components/layout/Navigation.astro', import.meta.url),
    'utf8'
);
const mobileNavigationSource = readFileSync(
    new URL('../components/layout/MobileNavigation.astro', import.meta.url),
    'utf8'
);
const headerSource = readFileSync(
    new URL('../components/layout/Header.astro', import.meta.url),
    'utf8'
);
const chromeStyles = readFileSync(
    new URL('../../public/styles/chrome.css', import.meta.url),
    'utf8'
);
const homeStyles = readFileSync(
    new URL('../../public/styles/home.css', import.meta.url),
    'utf8'
);
const legacyStyles = readFileSync(
    new URL('../../public/styles/style.css', import.meta.url),
    'utf8'
);
const homeSource = readFileSync(
    new URL('../pages/index.astro', import.meta.url),
    'utf8'
);
const pageLayoutSource = readFileSync(
    new URL('../layouts/PageLayout.astro', import.meta.url),
    'utf8'
);
const heroRouteSource = readFileSync(
    new URL('../pages/api/hero-video/[variant].ts', import.meta.url),
    'utf8'
);

test('mobile navigation is an isolated native dialog with native disclosure groups', () => {
    assert.match(headerSource, /aria-controls="mobile-nav-dialog"/);
    assert.match(mobileNavigationSource, /<dialog class="mobile-nav-dialog" id="mobile-nav-dialog"/);
    assert.equal((mobileNavigationSource.match(/<details class="mobile-nav-group">/g) ?? []).length, 5);
    assert.match(mobileNavigationSource, /mobileNavDialog\.showModal\(\)/);
    assert.match(mobileNavigationSource, /mobileNavDialog\.close\(\)/);
    assert.match(mobileNavigationSource, /mobileNavScroll\.scrollTop = 0/);
    assert.match(mobileNavigationSource, /mobile-nav-landing-link" href="\/"/);
    assert.match(mobileNavigationSource, /mobile-nav-landing-link" href="\/services"/);
    assert.match(mobileNavigationSource, /mobile-nav-landing-link" href="\/resources"/);

    for (const legacyClass of ['nav-container', 'nav-links', 'dropdown', 'nav-overlay', 'nav-drawer']) {
        assert.doesNotMatch(
            mobileNavigationSource,
            new RegExp(`class="[^"]*\\b${legacyClass}\\b`),
            `mobile dialog must not reuse legacy .${legacyClass} geometry`
        );
    }

    assert.match(chromeStyles, /\.mobile-nav-dialog\[open\] \{\s*display: grid !important;/);
    assert.match(chromeStyles, /\.mobile-nav-dialog \{[\s\S]*?height: 100dvh !important;[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\);/);
    assert.match(chromeStyles, /\.mobile-nav-scroll \{[\s\S]*?overflow-y: auto;/);
});

test('legacy 431-768 nav positioning cannot move the mobile dialog below the viewport', () => {
    assert.match(
        legacyStyles,
        /@media \(min-width: 431px\) and \(max-width: 768px\) \{[\s\S]*?\.nav-links \{[\s\S]*?position: absolute;[\s\S]*?top: 100%;/
    );
    assert.doesNotMatch(mobileNavigationSource, /class="[^"]*\bnav-links\b/);
    assert.match(chromeStyles, /\.site-navigation-shell \.nav-container,\s*\.site-navigation-shell \.nav-container\.active \{\s*display: none !important;/);
    assert.match(homeSource, /<\/div>\s*<MobileNavigation \/>/);
    assert.match(pageLayoutSource, /<\/div>\s*<MobileNavigation \/>/);
    assert.doesNotMatch(navigationSource, /nav-drawer-header|nav-close-btn|nav-overlay/);
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

test('responsive brand fills the fixed header and hero separates brand from copy at every width', () => {
    assert.match(chromeStyles, /--site-nav-content-height: 64px;/);
    assert.match(
        chromeStyles,
        /--site-nav-height: calc\(var\(--site-nav-content-height\) \+ env\(safe-area-inset-top\)\);/
    );
    assert.match(chromeStyles, /\.site-navigation-shell \.mobile-site-mark \{[\s\S]*?width: 72px !important;[\s\S]*?height: 48px !important;/);
    assert.match(chromeStyles, /@media \(max-width: 359px\) \{[\s\S]*?width: 66px !important;[\s\S]*?height: 44px !important;/);
    assert.match(chromeStyles, /@media \(min-width: 768px\) and \(max-width: 1023px\) \{[\s\S]*?width: 75px !important;[\s\S]*?height: 50px !important;/);
    assert.match(chromeStyles, /@media \(min-width: 1024px\) and \(max-width: 1359px\) \{[\s\S]*?width: 78px !important;[\s\S]*?height: 52px !important;/);

    assert.match(homeStyles, /\.home-hero-inner \{[\s\S]*?display: grid;[\s\S]*?min-height: inherit;[\s\S]*?grid-template-rows: auto minmax\(clamp\(2\.5rem, 10dvh, 8rem\), 1fr\) auto;/);
    assert.match(homeStyles, /\.home-hero-copy \{[\s\S]*?grid-row: 3;[\s\S]*?align-self: end;/);
    assert.match(homeStyles, /\.home-hero-logo \{[\s\S]*?grid-row: 1;/);
    assert.doesNotMatch(homeStyles, /\.home-hero-copy \{[^}]*margin-top: auto;/);
    assert.match(homeStyles, /@media \(min-width: 768px\) \{[\s\S]*?\.home-hero-logo \{ justify-self: center; \}/);
    assert.match(homeStyles, /@media \(min-width: 768px\) \{[\s\S]*?\.home-hero-copy \{[\s\S]*?justify-items: center;[\s\S]*?text-align: center;/);
    assert.match(homeStyles, /@media \(min-width: 768px\) \{[\s\S]*?\.home-hero-actions \{ margin-inline: auto; \}/);
});
