import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const homepage = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');
const homeStyles = readFileSync(new URL('../../public/styles/home.css', import.meta.url), 'utf8');
const packageSource = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');

test('homepage motion stays decorative, dependency-free, and isolated to the homepage stylesheet', () => {
    assert.match(homepage, /stylesheets=\{\["\/styles\/home\.css\?v=20260823-home-motion-1"\]\}/);
    assert.match(
        homepage,
        /<div class="home-scroll-thread" data-home-scroll-thread aria-hidden="true">/,
    );
    assert.equal((homepage.match(/data-home-motion-heading/g) ?? []).length, 7);
    assert.doesNotMatch(packageSource, /"(?:motion|lenis|gsap)"\s*:/);
});

test('scroll progress uses native scrolling with passive, animation-frame-throttled updates', () => {
    assert.match(homepage, /window\.requestAnimationFrame\(updateHomeScrollThread\)/);
    assert.match(
        homepage,
        /window\.addEventListener\('scroll', requestHomeScrollThreadUpdate, \{ passive: true \}\)/,
    );
    assert.match(homepage, /Math\.min\(1, Math\.max\(0,/);
    assert.match(homepage, /--home-scroll-progress/);
    assert.doesNotMatch(homepage, /preventDefault\(\)|wheelMultiplier|touchMultiplier/);
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

test('progress thread switches orientation and respects reduced motion and forced colors', () => {
    assert.match(homeStyles, /\.home-scroll-thread__progress \{[^}]*scaleX\(var\(--home-scroll-progress\)\)/s);
    assert.match(
        homeStyles,
        /@media \(min-width: 1360px\) \{[\s\S]*?\.home-scroll-thread__progress \{[^}]*scaleY\(var\(--home-scroll-progress\)\)/,
    );
    assert.match(
        homeStyles,
        /@media \(prefers-reduced-motion: reduce\) \{\s*\.home-scroll-thread \{ display: none; \}/,
    );
    assert.match(
        homeStyles,
        /@media \(forced-colors: active\) \{\s*\.home-scroll-thread,[\s\S]*?\.home-button::after \{ display: none; \}/,
    );
    assert.match(
        homeStyles,
        /@media print \{[\s\S]*?\.home-scroll-thread \{ display: none; \}[\s\S]*?opacity: 1 !important;[\s\S]*?transform: none !important;/,
    );
});

test('button sheen is a one-pass fine-pointer enhancement with preserved foreground content', () => {
    assert.match(
        homeStyles,
        /@media \(prefers-reduced-motion: no-preference\) and \(hover: hover\) and \(pointer: fine\)/,
    );
    assert.match(homeStyles, /\.home-button > :is\(span, i, svg\) \{ position: relative; z-index: 1; \}/);
    assert.match(homeStyles, /\.home-button:is\(:hover, :focus-visible\)::after/);
    assert.doesNotMatch(homeStyles, /\.home-button::after[^}]*animation-iteration-count:\s*infinite/s);
});
