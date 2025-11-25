import type { APIRoute } from 'astro';
import { getAllContent, setContent, getContent } from '../../../lib/db';
import { validateSession, getSessionFromCookies, validateCSRFToken, getCSRFTokenFromRequest } from '../../../lib/auth';
import { recordContentRevision } from '../../../lib/revisions';

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

    // Verify CSRF token
    const csrfToken = getCSRFTokenFromRequest(request);
    if (!csrfToken || !sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validCSRF = await validateCSRFToken(runtime.env.DB, csrfToken, sessionId);
    if (!validCSRF) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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

    // Get old value for revision history
    const existingContent = await getContent(runtime.env.DB, key);
    const oldValue = existingContent?.value || null;
    const changeType = existingContent ? 'update' : 'create';

    // Save the content
    await setContent(runtime.env.DB, key, String(value), contentType, user.id);

    // Record revision
    await recordContentRevision(
      runtime.env.DB,
      key,
      oldValue,
      String(value),
      contentType,
      user.id,
      changeType
    );

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
