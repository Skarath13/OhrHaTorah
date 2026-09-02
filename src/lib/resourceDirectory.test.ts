import assert from 'node:assert/strict';
import test from 'node:test';
import { candidateReadingList, resourceDirectorySections } from '../data/resourceDirectory.ts';

test('review-only directory implements every requested replacement and addition', () => {
  const directoryText = JSON.stringify(resourceDirectorySections);

  for (const expected of [
    'Messianic Jewish Theological Institute',
    "The King's University: Messianic Jewish Studies",
    'Messianic Jewish Rabbinical Council',
    'First Fruits of Zion',
    'Menorah Ministries and Dr. John Fischer',
    'ArtScroll',
    'Chabad.org highlighted study sections',
  ]) {
    assert.match(directoryText, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(directoryText, /Jews for Jesus|Chosen People Ministries|Jewish Voice Ministries/);
});

test('resource links are HTTPS and book retailer links are plain non-affiliate searches', () => {
  const directoryLinks = resourceDirectorySections.flatMap((section) =>
    section.entries.flatMap((entry) => entry.links),
  );

  assert.ok(directoryLinks.length >= 10);
  assert.ok(candidateReadingList.length >= 6);

  for (const link of directoryLinks) {
    assert.match(link.url, /^https:\/\//);
  }

  for (const book of candidateReadingList) {
    assert.match(book.sourceUrl, /^https:\/\//);
    assert.match(book.amazonUrl, /^https:\/\/www\.amazon\.com\/s\?k=/);
    assert.doesNotMatch(book.amazonUrl, /(?:tag|ref|ascsubtag)=/i);
  }
});
