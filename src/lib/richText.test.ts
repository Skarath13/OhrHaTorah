import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRichDocument, renderRichDocument, renderRichInline, safeHref } from './richText.ts';
import { imageOverrideSrc, renderTextOverride, validateSiteContentWrite } from './siteContent.ts';

const doc = (content: unknown[]) => JSON.stringify({ type: 'doc', content });
const text = (value: string, marks?: unknown[]) => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });

test('allowed nodes and marks render; everything is escaped', () => {
  const parsed = parseRichDocument(doc([
    { type: 'heading', attrs: { level: 2 }, content: [text('Shabbat')] },
    { type: 'paragraph', content: [text('<script>alert(1)</script> & '), text('bold', [{ type: 'bold' }])] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [text('one')] }] }] },
  ]));
  assert.ok(parsed);
  assert.equal(
    renderRichDocument(parsed),
    '<h2>Shabbat</h2><p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; <strong>bold</strong></p><ul><li><p>one</p></li></ul>',
  );
});

test('unknown nodes, h1, and unsafe links are dropped', () => {
  const parsed = parseRichDocument(doc([
    { type: 'heading', attrs: { level: 1 }, content: [text('Title')] },
    { type: 'iframe', attrs: { src: 'https://evil.example' } },
    { type: 'paragraph', content: [
      text('bad', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]),
      text('good', [{ type: 'link', attrs: { href: 'https://umjc.org/' } }]),
      text('local', [{ type: 'link', attrs: { href: '/donate' } }]),
      text('x', [{ type: 'unknownMark' }]),
    ] },
  ]));
  assert.ok(parsed);
  assert.equal(
    renderRichDocument(parsed),
    '<h2>Title</h2><p>bad<a href="https://umjc.org/" target="_blank" rel="noopener noreferrer">good<span class="visually-hidden"> (opens in a new tab)</span></a><a href="/donate">local</a>x</p>',
  );
});

test('safeHref accepts only web, mail, phone, and same-site targets', () => {
  assert.equal(safeHref('/about'), '/about');
  assert.equal(safeHref('mailto:office@example.org'), 'mailto:office@example.org');
  assert.equal(safeHref('tel:+17145550100'), 'tel:+17145550100');
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', '/\\evil', 'java\nscript:x', '', 42]) {
    assert.equal(safeHref(bad), null, String(bad));
  }
});

test('inline rendering flattens paragraphs into line breaks', () => {
  const parsed = parseRichDocument(doc([
    { type: 'paragraph', content: [text('Line one'), { type: 'hardBreak' }, text('two')] },
    { type: 'paragraph', content: [text('three', [{ type: 'italic' }])] },
  ]));
  assert.ok(parsed);
  assert.equal(renderRichInline(parsed), 'Line one<br>two<br><em>three</em>');
});

test('divine-name substitutes keep their small-cap markup after editing', () => {
  const parsed = parseRichDocument(doc([{ type: 'paragraph', content: [text('love for Hashem and Adonai')] }]));
  assert.ok(parsed);
  const html = renderRichDocument(parsed);
  assert.match(html, /<span class="divine-name"><span class="divine-name__initial">H<\/span><span class="divine-name__small-caps">ashem<\/span><\/span>/);
  assert.match(html, /<span class="divine-name__initial">A<\/span><span class="divine-name__small-caps">donai<\/span>/);
});

test('malformed documents are rejected', () => {
  assert.equal(parseRichDocument('not json'), null);
  assert.equal(parseRichDocument('{"type":"paragraph"}'), null);
  assert.equal(parseRichDocument(doc([]).padEnd(100_001, ' ')), null);
});

test('overrides: text is escaped, legacy html is ignored, bad json keeps the default', () => {
  assert.equal(renderTextOverride({ value: '<b>x</b>\nnext', contentType: 'text' }, 'inline'), '&lt;b&gt;x&lt;/b&gt;<br>next');
  assert.equal(renderTextOverride({ value: 'Hi', contentType: 'text' }, 'block'), '<p>Hi</p>');
  assert.equal(renderTextOverride({ value: '<img onerror=x>', contentType: 'html' }, 'block'), null);
  assert.equal(renderTextOverride({ value: '{bad', contentType: 'json' }, 'inline'), null);
  assert.equal(renderTextOverride(undefined, 'inline'), null);
});

test('image overrides must stay on this site', () => {
  assert.equal(imageOverrideSrc({ value: '/api/images/serve/abc.webp', contentType: 'text' }), '/api/images/serve/abc.webp');
  assert.equal(imageOverrideSrc({ value: 'https://evil.example/x.png', contentType: 'text' }), null);
  assert.equal(imageOverrideSrc({ value: 'javascript:x', contentType: 'text' }), null);
});

test('content writes are validated on the server', () => {
  assert.deepEqual(validateSiteContentWrite('home.hero-title', 'Hi', 'text'), { ok: true });
  assert.deepEqual(validateSiteContentWrite('brit-chadashah:2026-11-07', 'John 1', 'text'), { ok: true });
  assert.deepEqual(validateSiteContentWrite('home.intro', doc([{ type: 'paragraph' }]), 'json'), { ok: true });
  assert.equal(validateSiteContentWrite('home.intro', '<p>x</p>', 'html').ok, false);
  assert.equal(validateSiteContentWrite('home.intro', 'not json', 'json').ok, false);
  assert.equal(validateSiteContentWrite('bad key!', 'x', 'text').ok, false);
  assert.equal(validateSiteContentWrite('home.intro', 5, 'text').ok, false);
});
