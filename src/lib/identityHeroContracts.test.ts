import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageLayoutSource = readFileSync(
    new URL('../layouts/PageLayout.astro', import.meta.url),
    'utf8'
);
const stockProvenanceSource = readFileSync(
    new URL('../../public/images/stock/PROVENANCE.md', import.meta.url),
    'utf8'
);

test('the identity page uses the documented community table image', () => {
    assert.match(
        pageLayoutSource,
        /'\/mission': \{[\s\S]*?image: '\/images\/stock\/shared-table\.webp',[\s\S]*?alt: 'Several hands sharing a plate of dates around a table'/
    );
    assert.ok(
        existsSync(new URL('../../public/images/stock/shared-table.webp', import.meta.url)),
        'the identity hero image must exist'
    );
    assert.match(
        stockProvenanceSource,
        /## Shared table[\s\S]*?Output: `shared-table\.webp`/
    );
});
