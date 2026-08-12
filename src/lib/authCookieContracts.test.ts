import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createAuthIndicatorCookie,
  createCSRFCookie,
  createCSRFLogoutCookie,
  createLogoutCookie,
  createLogoutIndicatorCookie,
  createSessionCookie,
} from './auth.ts';

test('admin cookies are confined to secure same-site transport', () => {
  const cookies = [
    createSessionCookie('session-id'),
    createAuthIndicatorCookie(),
    createCSRFCookie('csrf-token'),
    createLogoutCookie(),
    createLogoutIndicatorCookie(),
    createCSRFLogoutCookie(),
  ];

  cookies.forEach((cookie) => {
    assert.match(cookie, /; Secure;/);
    assert.match(cookie, /; SameSite=Strict;/);
    assert.match(cookie, /; Path=\//);
  });
  assert.match(cookies[0], /; HttpOnly;/);
  assert.match(cookies[3], /; HttpOnly;/);
});
