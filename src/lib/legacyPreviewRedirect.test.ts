import assert from 'node:assert/strict';
import test from 'node:test';

import legacyPreviewRedirect from '../../deploy/legacy-preview-redirect/_worker.js';

test('legacy preview sends browser navigation to Chuck staging without caching', async () => {
    const response = await legacyPreviewRedirect.fetch(new Request(
        'https://fresh-design-staging.ohrhatorah.pages.dev/mission?from=legacy',
    ));

    assert.equal(response.status, 302);
    assert.equal(
        response.headers.get('location'),
        'https://kehilat-ohr-hatorah-chuck-staging.pages.dev/mission?from=legacy',
    );
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
});

test('legacy preview does not forward mutations to the isolated staging site', async () => {
    const response = await legacyPreviewRedirect.fetch(new Request(
        'https://fresh-design-staging.ohrhatorah.pages.dev/api/content',
        { method: 'POST' },
    ));

    assert.equal(response.status, 410);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('location'), null);
});

test('legacy preview cannot redirect double-slash paths to another host', async () => {
    const response = await legacyPreviewRedirect.fetch(new Request(
        'https://fresh-design-staging.ohrhatorah.pages.dev//malicious.example/path?from=legacy',
    ));

    const location = new URL(response.headers.get('location') || '');
    assert.equal(location.origin, 'https://kehilat-ohr-hatorah-chuck-staging.pages.dev');
    assert.equal(location.pathname, '//malicious.example/path');
    assert.equal(location.search, '?from=legacy');
});
