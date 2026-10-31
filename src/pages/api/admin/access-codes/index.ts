import type { APIRoute } from 'astro';
import {
  authorizeCalendarEditor,
  calendarAdminJsonResponse as json,
} from '../../../../lib/calendarAdminApi.ts';
import {
  createAccessCode,
  exclusiveAreas,
  listAccessCodes,
  validateAccessCodeDraft,
} from '../../../../lib/exclusiveAccess.ts';

const logError = (operation: string, error: unknown) => console.error(JSON.stringify({
  message: 'access code admin request failed',
  operation,
  error: error instanceof Error ? error.message : String(error),
}));

// Admin role only: codes open private pages, so editors cannot mint them.
const forbidden = () => json({ success: false, error: 'Admin role required' }, 403);

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) return json({ success: false, error: 'Database not available' }, 500);
  try {
    const authorization = await authorizeCalendarEditor(db, request, false);
    if (!authorization.success) return authorization.response;
    if (authorization.editor.user.role !== 'admin') return forbidden();
    return json({ success: true, data: { areas: exclusiveAreas, codes: await listAccessCodes(db) } });
  } catch (error) {
    logError('list', error);
    return json({ success: false, error: 'Server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) return json({ success: false, error: 'Database not available' }, 500);
  try {
    const authorization = await authorizeCalendarEditor(db, request, true);
    if (!authorization.success) return authorization.response;
    if (authorization.editor.user.role !== 'admin') return forbidden();

    const validation = validateAccessCodeDraft(await request.json().catch(() => null));
    if (!validation.success) return json({ success: false, error: validation.error }, 400);

    const created = await createAccessCode(db, validation.data, authorization.editor.user.id);
    // The plain code is returned only here; it cannot be recovered later.
    return json({ success: true, data: created }, 201);
  } catch (error) {
    logError('create', error);
    return json({ success: false, error: 'Server error' }, 500);
  }
};
