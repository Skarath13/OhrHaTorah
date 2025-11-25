import type { APIRoute } from 'astro';
import { getImage, deleteImageRecord, updateImageAlt } from '../../../lib/db';
import { validateSession, getSessionFromCookies } from '../../../lib/auth';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = parseInt(params.id || '', 10);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const image = await getImage(runtime.env.DB, id);

    if (!image) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: image }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching image:', error);
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

    const id = parseInt(params.id || '', 10);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { altText } = body;

    if (typeof altText !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid alt text' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateImageAlt(runtime.env.DB, id, altText);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating image:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB || !runtime?.env?.IMAGES) {
      return new Response(
        JSON.stringify({ success: false, error: 'Storage not available' }),
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

    const id = parseInt(params.id || '', 10);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete from database and get R2 key
    const r2Key = await deleteImageRecord(runtime.env.DB, id);

    if (!r2Key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete from R2
    await runtime.env.IMAGES.delete(r2Key);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting image:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
