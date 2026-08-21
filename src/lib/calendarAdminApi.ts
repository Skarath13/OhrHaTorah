import {
  getCSRFTokenFromRequest,
  getSessionFromCookies,
  validateCSRFToken,
  validateSession,
  type User,
} from './auth.ts';

const calendarAdminJsonHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

export const calendarAdminJsonResponse = (
  payload: unknown,
  status = 200,
): Response => new Response(JSON.stringify(payload), {
  status,
  headers: calendarAdminJsonHeaders,
});

export type AuthorizedCalendarEditor = {
  readonly sessionId: string;
  readonly user: User;
};

export type CalendarEditorAuthorizationResult =
  | { readonly success: true; readonly editor: AuthorizedCalendarEditor }
  | { readonly success: false; readonly response: Response };

export const authorizeCalendarEditor = async (
  db: D1Database,
  request: Request,
  requireCsrf: boolean,
): Promise<CalendarEditorAuthorizationResult> => {
  const sessionId = getSessionFromCookies(request.headers.get('cookie'));
  const user = sessionId ? await validateSession(db, sessionId) : null;
  if (!sessionId || !user) {
    return {
      success: false,
      response: calendarAdminJsonResponse({ success: false, error: 'Unauthorized' }, 401),
    };
  }

  if (requireCsrf) {
    const csrfToken = getCSRFTokenFromRequest(request);
    if (!csrfToken) {
      return {
        success: false,
        response: calendarAdminJsonResponse({ success: false, error: 'Missing CSRF token' }, 403),
      };
    }
    if (!await validateCSRFToken(db, csrfToken, sessionId)) {
      return {
        success: false,
        response: calendarAdminJsonResponse({ success: false, error: 'Invalid CSRF token' }, 403),
      };
    }
  }

  return { success: true, editor: { sessionId, user } };
};

export const logCalendarAdminError = (
  operation: string,
  error: unknown,
): void => {
  console.error(JSON.stringify({
    message: 'calendar admin request failed',
    operation,
    error: error instanceof Error ? error.message : String(error),
  }));
};
