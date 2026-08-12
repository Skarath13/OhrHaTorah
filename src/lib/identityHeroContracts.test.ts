import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageLayoutSource = readFileSync(
    new URL('../layouts/PageLayout.astro', import.meta.url),
    'utf8'
);
const interiorStyles = readFileSync(
    new URL('../../public/styles/interior.css', import.meta.url),
    'utf8'
);

test('the identity page inherits the deliberate text-only interior hero', () => {
    assert.match(
        pageLayoutSource,
        /'\/mission': \{\s*section: 'Welcome',\s*sectionHref: '\/about',\s*\}/
    );
    assert.doesNotMatch(pageLayoutSource, /shared-table\.webp|page-hero-media|<figure|<img/);
    assert.match(pageLayoutSource, /<header class="page-hero">/);
    assert.match(interiorStyles, /\.page-hero-inner \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/);
    assert.match(interiorStyles, /\.page-hero::before \{/);
});
