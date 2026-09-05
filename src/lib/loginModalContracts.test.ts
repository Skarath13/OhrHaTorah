import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const loginModal = readFileSync(
  new URL('../components/admin/LoginModal.astro', import.meta.url),
  'utf8',
);

test('PIN paste remains native while normalizing and distributing six digits', () => {
  const pasteHandler = loginModal.match(
    /input\.addEventListener\('paste',[\s\S]*?\n    \}\);/,
  )?.[0] ?? '';

  assert.ok(pasteHandler, 'expected the PIN paste handler');
  assert.doesNotMatch(pasteHandler, /preventDefault\(\)/);
  assert.match(pasteHandler, /replace\(\/\\D\/g, ''\)\.slice\(0, 6\)/);
  assert.match(pasteHandler, /window\.setTimeout\(\(\) => \{/);
  assert.match(pasteHandler, /pinInput\.value = pastedData\[i\] \?\? '';/);
  assert.match(pasteHandler, /updateInputStates\(\);/);
});

test('server-gated pages reload after login and ignore a stale UI indicator', () => {
  assert.match(loginModal, /document\.querySelector\('\[data-admin-preview-gate\], #underConstructionModal'\)/);
  assert.match(loginModal, /window\.dispatchEvent\(new CustomEvent\('adminLoginSuccess'/);
  assert.match(loginModal, /window\.location\.reload\(\)/);
  assert.match(
    loginModal,
    /if \(document\.querySelector\('\[data-admin-preview-gate\]'\)\) \{\s*window\.showLoginModal\(\);\s*\} else if \(document\.cookie\.includes\('oht_logged_in'\)\)/,
  );
});
