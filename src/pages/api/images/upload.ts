import type { APIRoute } from 'astro';
import { recordImage } from '../../../lib/db';
import { validateSession, getSessionFromCookies, validateCSRFToken, getCSRFTokenFromRequest } from '../../../lib/auth';

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

    if (!runtime.env.IMAGES) {
      return new Response(
        JSON.stringify({ success: false, error: 'Storage not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;
    const altTextEntry = formData.get('altText');
    const altText = typeof altTextEntry === 'string' ? altTextEntry.trim() : null;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    // SVG is intentionally excluded because uploaded active content must never be served from this origin.
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, AVIF' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ success: false, error: 'File too large. Maximum size: 10MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.name.length > 200 || (altText && altText.length > 500)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Filename or alternative text is too long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const r2Key = `uploads/${timestamp}-${safeName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await runtime.env.IMAGES.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Record in database
    const imageId = await recordImage(
      runtime.env.DB,
      file.name,
      r2Key,
      altText || undefined,
      file.size,
      file.type,
      user.id
    );

    // Construct the public URL (will depend on your R2 bucket configuration)
    // For now, we'll use the R2 key and assume a custom domain or public bucket
    const publicUrl = `/api/images/serve/${r2Key}`;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: imageId,
          filename: file.name,
          r2Key,
          url: publicUrl,
          size: file.size,
          mimeType: file.type,
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
