import type { APIRoute } from 'astro';
import {
  deleteSession,
  getSessionFromCookies,
  createLogoutCookie,
  createLogoutIndicatorCookie,
  deleteSessionCSRFTokens,
  createCSRFLogoutCookie
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime;
    const cookieHeader = request.headers.get('cookie');
    const sessionId = getSessionFromCookies(cookieHeader);

    if (sessionId && runtime?.env?.DB) {
      // Delete CSRF tokens for this session
      await deleteSessionCSRFTokens(runtime.env.DB, sessionId);
      // Delete the session
      await deleteSession(runtime.env.DB, sessionId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: [
          ['Content-Type', 'application/json'],
          ['Set-Cookie', createLogoutCookie()],
          ['Set-Cookie', createLogoutIndicatorCookie()],
          ['Set-Cookie', createCSRFLogoutCookie()],
        ],
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
