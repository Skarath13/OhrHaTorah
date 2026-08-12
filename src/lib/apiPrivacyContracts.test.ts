import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const contentIndex = read('../pages/api/content/index.ts');
const contentItem = read('../pages/api/content/[key].ts');
const imageIndex = read('../pages/api/images/index.ts');
const imageItem = read('../pages/api/images/[id].ts');
const imageServe = read('../pages/api/images/serve/[...path].ts');
const imageUpload = read('../pages/api/images/upload.ts');

test('bulk CMS and image metadata endpoints require an authenticated editor', () => {
  for (const source of [contentIndex, imageIndex, imageItem]) {
    assert.match(source, /getSessionFromCookies\(request\.headers\.get\('cookie'\)\)|getSessionFromCookies\(cookieHeader\)/);
    assert.match(source, /validateSession\(runtime\.env\.DB, sessionId\)/);
    assert.match(source, /error: 'Unauthorized'/);
  }
});

test('only date-scoped Brit Chadashah overrides remain publicly readable', () => {
  assert.match(contentItem, /\^brit-chadashah:\\d\{4\}-\\d\{2\}-\\d\{2\}\$/);
  assert.match(contentItem, /wantsHistory \|\| !isPublicBritChadashahOverride/);
  assert.match(contentItem, /\{ key: content\.key, value: content\.value, content_type: content\.content_type \}/);
  assert.doesNotMatch(contentItem, /isPublicBritChadashahOverride[\s\S]*updated_by/);
});

test('image metadata mutations require CSRF while public image delivery remains available', () => {
  const mutationSources = imageItem.split('export const PUT:')[1] ?? '';
  assert.match(mutationSources, /export const DELETE:/);
  assert.equal((mutationSources.match(/getCSRFTokenFromRequest\(request\)/g) ?? []).length, 2);
  assert.equal((mutationSources.match(/validateCSRFToken\(runtime\.env\.DB, csrfToken, sessionId\)/g) ?? []).length, 2);
  assert.doesNotMatch(imageServe, /validateSession|Unauthorized/);
  assert.doesNotMatch(imageUpload, /image\/svg\+xml|Allowed:[^'\n]*SVG/);
  assert.match(imageServe, /allowedContentTypes = new Set\(\['image\/jpeg', 'image\/png', 'image\/gif', 'image\/webp', 'image\/avif'\]\)/);
  assert.match(imageServe, /'X-Content-Type-Options': 'nosniff'/);
  assert.match(imageServe, /'ETag': object\.httpEtag/);
  assert.ok(
    imageUpload.indexOf("error: 'Unauthorized'") < imageUpload.indexOf("error: 'Storage not available'"),
    'upload authentication must happen before reporting an unavailable R2 binding',
  );
});
