import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { isPendingPage, pendingPagePaths } from '../data/pendingPages.ts';

test('construction routing matches only the five pending pages, including trailing slashes', () => {
    assert.deepEqual(pendingPagePaths, ['/expect', '/faq', '/events', '/resources', '/youth']);
    for (const path of pendingPagePaths) {
        assert.equal(isPendingPage(path), true);
        assert.equal(isPendingPage(path + '/'), true);
        assert.equal(isPendingPage(path + '/published-child'), false);
    }
    for (const path of ['/', '/about', '/mission', '/holidays', '/services', '/umjc', '/faq-extra']) {
        assert.equal(isPendingPage(path), false);
    }
});

test('every pending route keeps its draft behind the server role check and private response headers', () => {
    for (const route of pendingPagePaths) {
        const source = readFileSync(new URL(`../pages${route}.astro`, import.meta.url), 'utf8');
        assert.match(source, /canViewAdminPreview\(Astro\.locals\.user\)/);
        assert.match(source, /\{canPreview \? \(/);
        assert.match(source, /private, no-store, max-age=0/);
        assert.match(source, /headers\.append\('Vary', 'Cookie'\)/);
        assert.match(source, /noindex, nofollow/);
    }
});

test('logout refreshes server-approved draft access instead of leaving an admin bypass in the page', () => {
    const source = readFileSync(new URL('../components/admin/InlineEditor.astro', import.meta.url), 'utf8');
    assert.match(source, /querySelector\('#underConstructionModal\[data-can-preview="true"\]'\)[\s\S]*?window\.location\.reload\(\)/);
});
