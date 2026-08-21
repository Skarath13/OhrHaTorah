import type { APIRoute } from 'astro';
import {
  authorizeCalendarEditor,
  calendarAdminJsonResponse,
  logCalendarAdminError,
} from '../../../../../lib/calendarAdminApi.ts';
import {
  CalendarEventRequestBodyError,
  createCongregationCalendarEventId,
  createManagedCongregationCalendarEvent,
  getManagedCongregationCalendarEvent,
  getManagedCongregationCalendarEvents,
  readCalendarEventJsonBody,
  validateCalendarEventDraft,
} from '../../../../../lib/congregationCalendarEvents.ts';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return calendarAdminJsonResponse({ success: false, error: 'Database not available' }, 500);
  }

  try {
    const authorization = await authorizeCalendarEditor(db, request, false);
    if (!authorization.success) return authorization.response;

    const events = await getManagedCongregationCalendarEvents(db);
    return calendarAdminJsonResponse({ success: true, data: events });
  } catch (error) {
    logCalendarAdminError('list', error);
    return calendarAdminJsonResponse({ success: false, error: 'Server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return calendarAdminJsonResponse({ success: false, error: 'Database not available' }, 500);
  }

  try {
    const authorization = await authorizeCalendarEditor(db, request, true);
    if (!authorization.success) return authorization.response;

    const payload = await readCalendarEventJsonBody(request);
    const validation = validateCalendarEventDraft(payload);
    if (!validation.success) {
      return calendarAdminJsonResponse({
        success: false,
        error: 'Invalid calendar event',
        issues: validation.issues,
      }, 400);
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const id = createCongregationCalendarEventId();
      if (await getManagedCongregationCalendarEvent(db, id)) continue;
      const event = await createManagedCongregationCalendarEvent(
        db,
        id,
        validation.data,
        authorization.editor.user.id,
      );
      return calendarAdminJsonResponse({ success: true, data: event }, 201);
    }

    return calendarAdminJsonResponse({
      success: false,
      error: 'Could not allocate a unique calendar event id',
    }, 409);
  } catch (error) {
    if (error instanceof CalendarEventRequestBodyError) {
      return calendarAdminJsonResponse({ success: false, error: error.message }, error.status);
    }
    logCalendarAdminError('create', error);
    return calendarAdminJsonResponse({ success: false, error: 'Server error' }, 500);
  }
};
