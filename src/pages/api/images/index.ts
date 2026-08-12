import type { APIRoute } from 'astro';
import { getAllImages } from '../../../lib/db';
import { getSessionFromCookies, validateSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionId = getSessionFromCookies(request.headers.get('cookie'));
    const user = sessionId ? await validateSession(runtime.env.DB, sessionId) : null;
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const images = await getAllImages(runtime.env.DB);

    return new Response(
      JSON.stringify({ success: true, data: images }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching images:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
