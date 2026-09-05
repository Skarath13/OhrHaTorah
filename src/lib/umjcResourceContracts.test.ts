import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const umjcPage = readFileSync(new URL('../pages/umjc.astro', import.meta.url), 'utf8');

test('UMJC page leads with membership and primary-source statements', () => {
  assert.match(umjcPage, /<strong>Kehilat Ohr HaTorah<\/strong> is a member of the Union of Messianic Jewish Congregations/);
  assert.match(umjcPage, /href="https:\/\/www\.umjc\.org\/vision"/);
  assert.match(umjcPage, /href="https:\/\/www\.umjc\.org\/defining-messianic-judaism"/);
  assert.match(umjcPage, /href="\/mission#core-commitments"/);
  assert.doesNotMatch(umjcPage, /UMJC Values/);
  assert.match(umjcPage, /IdentityRichText content=\{umjcMembershipValue\}/);
});
