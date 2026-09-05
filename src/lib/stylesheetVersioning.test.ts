import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const baseLayoutSource = readFileSync(
    new URL('../layouts/BaseLayout.astro', import.meta.url),
    'utf8'
);

test('site stylesheets use a shared cache-busting version for mobile Safari', () => {
    assert.match(baseLayoutSource, /const stylesheetVersion = '[^']+';/);
    assert.match(baseLayoutSource, /20260904-responsive-polish-6/);
    assert.match(baseLayoutSource, /import\.meta\.env\.DEV \? Date\.now\(\)\.toString\(\) : stylesheetVersion/);
    assert.match(baseLayoutSource, /const versionStylesheet = \(href: string\)/);
    assert.match(baseLayoutSource, /versionStylesheet\('\/styles\/style\.css'\)/);
    assert.match(baseLayoutSource, /stylesheets\.map\(\(href\) => <link rel="stylesheet" href=\{versionStylesheet\(href\)\}/);
    assert.match(baseLayoutSource, /versionStylesheet\('\/styles\/chrome\.css'\)/);
});
