import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.IMAGES) {
      return new Response('Storage not available', { status: 500 });
    }

    const path = params.path;
    if (!path) {
      return new Response('Path required', { status: 400 });
    }

    // Get the object from R2
    const object = await runtime.env.IMAGES.get(path);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    // Get the content type from the object's metadata
    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

    // Return the image with caching headers
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Server error', { status: 500 });
  }
};
