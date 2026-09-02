import { defineMiddleware } from 'astro:middleware';
import { validateSession, getSessionFromCookies } from './lib/auth';
import { requiresAdminAuthentication } from './lib/adminPreview';

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

  return next();
});
