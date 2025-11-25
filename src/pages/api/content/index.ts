import type { APIRoute } from 'astro';
import { getAllContent, setContent } from '../../../lib/db';
import { validateSession, getSessionFromCookies } from '../../../lib/auth';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const content = await getAllContent(runtime.env.DB);

    return new Response(
      JSON.stringify({ success: true, data: content }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching content:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify authentication
    const cookieHeader = request.headers.get('cookie');
    const sessionId = getSessionFromCookies(cookieHeader);
    const user = sessionId ? await validateSession(runtime.env.DB, sessionId) : null;

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { key, value, contentType = 'text' } = body;

    if (!key || typeof key !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (value === undefined || value === null) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid value' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await setContent(runtime.env.DB, key, String(value), contentType, user.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error saving content:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
