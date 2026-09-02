import assert from 'node:assert/strict';
import test from 'node:test';
import { canViewAdminPreview, requiresAdminAuthentication } from './adminPreview.ts';

test('only a server-validated admin role can view review-only page content', () => {
  assert.equal(canViewAdminPreview({ role: 'admin' }), true);
  assert.equal(canViewAdminPreview({ role: 'editor' }), false);
  assert.equal(canViewAdminPreview(undefined), false);
  assert.equal(canViewAdminPreview(null), false);
});

test('admin route matching is bounded and keeps the login route public', () => {
  assert.equal(requiresAdminAuthentication('/admin'), true);
  assert.equal(requiresAdminAuthentication('/admin/calendar'), true);
  assert.equal(requiresAdminAuthentication('/admin/login'), false);
  assert.equal(requiresAdminAuthentication('/administration'), false);
  assert.equal(requiresAdminAuthentication('/resources'), false);
});
