import type { APIRoute } from 'astro';
import { getContent, setContent, deleteContent } from '../../../lib/db';
import { validateSession, getSessionFromCookies, validateCSRFToken, getCSRFTokenFromRequest } from '../../../lib/auth';
import { recordContentRevision, getRevisionHistory } from '../../../lib/revisions';

export const GET: APIRoute = async ({ params, locals, request }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { key } = params;
    if (!key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Key required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const decodedKey = decodeURIComponent(key);

    // Check if requesting revision history
    const url = new URL(request.url);
    if (url.searchParams.get('history') === 'true') {
      // Require authentication for viewing history
      const cookieHeader = request.headers.get('cookie');
      const sessionId = getSessionFromCookies(cookieHeader);
      const user = sessionId ? await validateSession(runtime.env.DB, sessionId) : null;

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const history = await getRevisionHistory(runtime.env.DB, decodedKey, limit);

      return new Response(
        JSON.stringify({ success: true, data: history }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const content = await getContent(runtime.env.DB, decodedKey);

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    const { key } = params;
    if (!key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Key required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { value, contentType = 'text' } = body;

    if (value === undefined || value === null) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid value' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const decodedKey = decodeURIComponent(key);

    // Get old value for revision history
    const existingContent = await getContent(runtime.env.DB, decodedKey);
    const oldValue = existingContent?.value || null;
    const changeType = existingContent ? 'update' : 'create';

    // Save the content
    await setContent(runtime.env.DB, decodedKey, String(value), contentType, user.id);

    // Record revision
    await recordContentRevision(
      runtime.env.DB,
      decodedKey,
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
    console.error('Error updating content:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
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

    const { key } = params;
    if (!key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Key required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const decodedKey = decodeURIComponent(key);

    // Get old value for revision history
    const existingContent = await getContent(runtime.env.DB, decodedKey);

    if (existingContent) {
      // Record deletion in revision history
      await recordContentRevision(
        runtime.env.DB,
        decodedKey,
        existingContent.value,
        '', // empty string for deleted content
        existingContent.content_type,
        user.id,
        'delete'
      );
    }

    await deleteContent(runtime.env.DB, decodedKey);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting content:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
