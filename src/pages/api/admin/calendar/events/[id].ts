import type { APIRoute } from 'astro';
import {
  authorizeCalendarEditor,
  calendarAdminJsonResponse,
  logCalendarAdminError,
} from '../../../../../lib/calendarAdminApi.ts';
import {
  CalendarEventRequestBodyError,
  deleteManagedCongregationCalendarEvent,
  getManagedCongregationCalendarEvent,
  isValidCongregationCalendarEventId,
  readCalendarEventJsonBody,
  updateManagedCongregationCalendarEvent,
  validateCalendarEventDraft,
} from '../../../../../lib/congregationCalendarEvents.ts';

const readEventId = (id: string | undefined): string | null => {
  const normalized = id?.trim() || '';
  return isValidCongregationCalendarEventId(normalized) ? normalized : null;
};

export const GET: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return calendarAdminJsonResponse({ success: false, error: 'Database not available' }, 500);
  }

  try {
    const authorization = await authorizeCalendarEditor(db, request, false);
    if (!authorization.success) return authorization.response;

    const id = readEventId(params.id);
    if (!id) {
      return calendarAdminJsonResponse({ success: false, error: 'Invalid calendar event id' }, 400);
    }

    const event = await getManagedCongregationCalendarEvent(db, id);
    if (!event) {
      return calendarAdminJsonResponse({ success: false, error: 'Calendar event not found' }, 404);
    }
    return calendarAdminJsonResponse({ success: true, data: event });
  } catch (error) {
    logCalendarAdminError('get', error);
    return calendarAdminJsonResponse({ success: false, error: 'Server error' }, 500);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return calendarAdminJsonResponse({ success: false, error: 'Database not available' }, 500);
  }

  try {
    const authorization = await authorizeCalendarEditor(db, request, true);
    if (!authorization.success) return authorization.response;

    const id = readEventId(params.id);
    if (!id) {
      return calendarAdminJsonResponse({ success: false, error: 'Invalid calendar event id' }, 400);
    }

    const payload = await readCalendarEventJsonBody(request);
    const validation = validateCalendarEventDraft(payload);
    if (!validation.success) {
      return calendarAdminJsonResponse({
        success: false,
        error: 'Invalid calendar event',
        issues: validation.issues,
      }, 400);
    }

    const event = await updateManagedCongregationCalendarEvent(
      db,
      id,
      validation.data,
      authorization.editor.user.id,
    );
    if (!event) {
      return calendarAdminJsonResponse({ success: false, error: 'Calendar event not found' }, 404);
    }
    return calendarAdminJsonResponse({ success: true, data: event });
  } catch (error) {
    if (error instanceof CalendarEventRequestBodyError) {
      return calendarAdminJsonResponse({ success: false, error: error.message }, error.status);
    }
    logCalendarAdminError('update', error);
    return calendarAdminJsonResponse({ success: false, error: 'Server error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return calendarAdminJsonResponse({ success: false, error: 'Database not available' }, 500);
  }

  try {
    const authorization = await authorizeCalendarEditor(db, request, true);
    if (!authorization.success) return authorization.response;

    const id = readEventId(params.id);
    if (!id) {
      return calendarAdminJsonResponse({ success: false, error: 'Invalid calendar event id' }, 400);
    }

    if (!await deleteManagedCongregationCalendarEvent(db, id)) {
      return calendarAdminJsonResponse({ success: false, error: 'Calendar event not found' }, 404);
    }
    return calendarAdminJsonResponse({ success: true, data: { id } });
  } catch (error) {
    logCalendarAdminError('delete', error);
    return calendarAdminJsonResponse({ success: false, error: 'Server error' }, 500);
  }
};
