import { defineMiddleware } from 'astro:middleware';
import { validateSession, getSessionFromCookies } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Only protect /admin/* routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const runtime = context.locals.runtime;

    // Check if we have the Cloudflare runtime (D1 database)
    if (!runtime?.env?.DB) {
      // In development without D1, allow access for testing
      console.warn('D1 database not available - auth check skipped');
      return next();
    }

    const db = runtime.env.DB;
    const cookieHeader = context.request.headers.get('cookie');
    const sessionId = getSessionFromCookies(cookieHeader);

    if (!sessionId) {
      return context.redirect('/admin/login');
    }

    const user = await validateSession(db, sessionId);

    if (!user) {
      return context.redirect('/admin/login');
    }

    // Add user to locals for use in pages
    context.locals.user = user;
  }

  return next();
});
