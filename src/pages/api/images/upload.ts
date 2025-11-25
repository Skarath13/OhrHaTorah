import type { APIRoute } from 'astro';
import { recordImage } from '../../../lib/db';
import { validateSession, getSessionFromCookies } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('altText') as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, AVIF, SVG' }),
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
