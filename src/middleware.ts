import { defineMiddleware } from 'astro:middleware';
import { validateSession, getSessionFromCookies } from './lib/auth';
import { requiresAdminAuthentication } from './lib/adminPreview';
import {
  ACCESS_GATE_PATH,
  findExclusiveArea,
  getAccessTokenFromCookies,
  hasValidAccessSession,
} from './lib/exclusiveAccess';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const runtime = context.locals.runtime;
  const db = runtime?.env?.DB;
  const cookieHeader = context.request.headers.get('cookie');
  const sessionId = getSessionFromCookies(cookieHeader);

  // Resolve a real server-side session for every request that presents one.
  // Public pages use this to reveal review-only content without trusting the
  // browser-readable UI indicator cookie.
  if (sessionId && db) {
    try {
      const user = await validateSession(db, sessionId);
      if (user) context.locals.user = user;
    } catch {
      // Treat unavailable or failed session storage as unauthenticated. This
      // keeps review-only content fail-closed while public pages stay usable.
      console.warn('Session validation unavailable');
    }
  }

  // Protected admin routes fail closed when D1 is missing, the session is
  // absent, or validation fails. Public routes continue with no admin access.
  if (requiresAdminAuthentication(pathname) && !context.locals.user) {
    return context.redirect('/admin/login');
  }

  // Code-gated areas. Signed-in admins pass; everyone else needs a valid
  // access session. Missing tables or D1 fail closed to the code page.
  const exclusiveArea = findExclusiveArea(pathname);
  if (exclusiveArea && !context.locals.user) {
    let allowed = false;
    if (db) {
      try {
        allowed = await hasValidAccessSession(db, exclusiveArea, getAccessTokenFromCookies(cookieHeader, exclusiveArea.area));
      } catch {
        console.warn('Access session validation unavailable');
      }
    }
    if (!allowed) {
      const gate = new URL(ACCESS_GATE_PATH, context.url);
      gate.searchParams.set('area', exclusiveArea.area);
      gate.searchParams.set('next', pathname + context.url.search);
      return context.redirect(gate.pathname + gate.search, 303);
    }
  }

  const response = await next();
  if (exclusiveArea) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
