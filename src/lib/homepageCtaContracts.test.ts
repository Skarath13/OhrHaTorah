import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const homeSource = readFileSync(new URL('../pages/index.astro', import.meta.url), 'utf8');
const homeStyles = readFileSync(new URL('../../public/styles/home.css', import.meta.url), 'utf8');

test('homepage CTAs keep labels intact and stack the hero actions on narrow screens', () => {
    assert.match(homeSource, /<span>Plan Your Visit<\/span>/);
    assert.match(homeSource, /<span>Get Directions<\/span>/);
    assert.match(homeStyles, /\.home-hero-actions \{[\s\S]*?width: min\(100%, 400px\);/);
    assert.match(
        homeStyles,
        /\.home-button > span,[\s\S]*?\.home-text-link > span,[\s\S]*?\.home-map-load > span \{\s*white-space: nowrap;/
    );
    assert.match(
        homeStyles,
        /@media \(max-width: 360px\) \{[\s\S]*?\.home-hero-actions \{ grid-template-columns: 1fr; \}/
    );
});
