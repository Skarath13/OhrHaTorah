import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageLayoutSource = readFileSync(
    new URL('../layouts/PageLayout.astro', import.meta.url),
    'utf8'
);
const interiorStyles = readFileSync(
    new URL('../../public/styles/interior.css', import.meta.url),
    'utf8'
);
const chromeStyles = readFileSync(
    new URL('../../public/styles/chrome.css', import.meta.url),
    'utf8'
);
const motionStyles = readFileSync(
    new URL('../../public/styles/motion.css', import.meta.url),
    'utf8'
);
const homeSource = readFileSync(
    new URL('../pages/index.astro', import.meta.url),
    'utf8'
);
const pagesDirectory = new URL('../pages/', import.meta.url);
const expectedInteriorRoutes = [
    'about.astro',
    'contact.astro',
    'donate.astro',
    'events.astro',
    'expect.astro',
    'faq.astro',
    'holidays.astro',
    'israel.astro',
    'mission.astro',
    'resources.astro',
    'services.astro',
    'umjc.astro',
    'youth.astro',
];

const pageLayoutRoutes = readdirSync(pagesDirectory)
    .filter((fileName) => fileName.endsWith('.astro') && fileName !== 'index.astro')
    .filter((fileName) =>
        readFileSync(new URL(fileName, pagesDirectory), 'utf8').includes("import PageLayout from '../layouts/PageLayout.astro'")
    );

test('every public interior route keeps its hero free of stock media', () => {
    for (const fileName of expectedInteriorRoutes) {
        assert.ok(pageLayoutRoutes.includes(fileName), `${fileName} should use the shared interior layout`);
    }

    for (const fileName of pageLayoutRoutes) {
        const source = readFileSync(new URL(fileName, pagesDirectory), 'utf8');
        assert.doesNotMatch(source, /\/images\/stock\//, `${fileName} must not add stock media directly`);
    }

    assert.doesNotMatch(pageLayoutSource, /\/images\/stock\/|\bimage\s*:|\balt\s*:|\bposition\s*:|<figure|<img|page-hero-media/);
    assert.doesNotMatch(interiorStyles, /page-hero-media|--hero-position/);
    assert.doesNotMatch(motionStyles, /page-hero-media|oht-image-settle/);
});

test('the homepage retains its hero and generated supporting imagery', () => {
    assert.match(homeSource, /class="home-hero-media"/);
    assert.match(homeSource, /\/images\/generated\//);
});

test('the shared interior hero remains responsive and text-led', () => {
    assert.match(pageLayoutSource, /type PageSection = \{[\s\S]*?section: string;[\s\S]*?sectionHref: string;/);
    assert.match(pageLayoutSource, /<nav class="site-breadcrumbs" aria-label="Breadcrumb">/);
    assert.match(pageLayoutSource, /<li aria-current="page"><span>\{pageTitle\}<\/span><\/li>/);
    assert.match(pageLayoutSource, /<h1 id="page-title">\{pageTitle\}<\/h1>/);
    assert.match(interiorStyles, /\.page-hero-inner \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);[\s\S]*?min-height: clamp\(188px, 17vw, 236px\);/);
    assert.match(interiorStyles, /\.page-hero-title \{[^}]*max-width: 100%;/);
    assert.match(interiorStyles, /\.page-hero h1 \{[^}]*max-width: none;/);
    assert.doesNotMatch(interiorStyles, /\.page-hero h1 \{[^}]*max-width: \d+ch;/);
    assert.match(interiorStyles, /\.page-hero h1 \{[\s\S]*?overflow-wrap: normal;[\s\S]*?word-break: normal;[\s\S]*?text-wrap: balance;/);
    assert.match(
        chromeStyles,
        /\.site-breadcrumbs \[aria-current='page'\] > span \{[^}]*overflow: hidden;[^}]*text-overflow: ellipsis;[^}]*white-space: nowrap;/s,
    );
    assert.match(
        chromeStyles,
        /@media \(max-width: 680px\) \{[\s\S]*?\.site-breadcrumbs li \{[^}]*font-size: 1rem;[\s\S]*?\.site-breadcrumbs \[aria-current='page'\] \{[^}]*font-size: 1rem;/,
    );
});

test('narrow Services actions fit the content column and stack before they can clip', () => {
    assert.match(
        interiorStyles,
        /@media \(max-width: 420px\) \{[\s\S]*?\.service-contact-actions \{[^}]*width: 100% !important;[^}]*min-width: 0 !important;[^}]*grid-template-columns: minmax\(0, 1fr\) !important;/,
    );
});
