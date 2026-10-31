import type { APIRoute } from 'astro';
import {
  authorizeCalendarEditor,
  calendarAdminJsonResponse as json,
} from '../../../../lib/calendarAdminApi.ts';
import { revokeAccessCode } from '../../../../lib/exclusiveAccess.ts';

// DELETE revokes (keeps the row for audit) and signs out every browser using the code.
export const DELETE: APIRoute = async ({ request, locals, params }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) return json({ success: false, error: 'Database not available' }, 500);
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) return json({ success: false, error: 'Invalid id' }, 400);
  try {
    const authorization = await authorizeCalendarEditor(db, request, true);
    if (!authorization.success) return authorization.response;
    if (authorization.editor.user.role !== 'admin') {
      return json({ success: false, error: 'Admin role required' }, 403);
    }
    const revoked = await revokeAccessCode(db, id);
    return revoked
      ? json({ success: true })
      : json({ success: false, error: 'Code not found or already revoked' }, 404);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'access code admin request failed',
      operation: 'revoke',
      error: error instanceof Error ? error.message : String(error),
    }));
    return json({ success: false, error: 'Server error' }, 500);
  }
};
