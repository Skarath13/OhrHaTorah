import type { APIRoute } from 'astro';
import { parseSingleByteRange } from '../../../lib/mediaRange';

const HERO_VIDEOS = {
    mobile: '/media/hero/ohr-hatorah-hero-mobile.mp4',
    desktop: '/media/hero/ohr-hatorah-hero-desktop.mp4'
} as const;

type HeroVariant = keyof typeof HERO_VIDEOS;

function isHeroVariant(value: string | undefined): value is HeroVariant {
    return value === 'mobile' || value === 'desktop';
}

function buildHeaders(upstream: Response, contentLength: number): Headers {
    const headers = new Headers();
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Content-Length', String(contentLength));
    headers.set('Content-Type', 'video/mp4');

    const etag = upstream.headers.get('ETag');
    const lastModified = upstream.headers.get('Last-Modified');
    if (etag) headers.set('ETag', etag);
    if (lastModified) headers.set('Last-Modified', lastModified);
    return headers;
}

const serveHeroVideo: APIRoute = async ({ params, request, locals }) => {
    if (!isHeroVariant(params.variant)) {
        return new Response('Video not found', { status: 404 });
    }

    const staticPath = HERO_VIDEOS[params.variant];
    const assets = locals.runtime?.env?.ASSETS;
    if (!assets) {
        return Response.redirect(new URL(staticPath, request.url), 307);
    }

    const upstream = await assets.fetch(new URL(staticPath, request.url).href);

    if (!upstream.ok) {
        return new Response('Video unavailable', { status: upstream.status === 404 ? 404 : 502 });
    }

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    const headers = buildHeaders(upstream, bytes.byteLength);
    const rangeHeader = request.headers.get('Range');
    const ifRange = request.headers.get('If-Range');
    const etag = headers.get('ETag');
    const lastModified = headers.get('Last-Modified');
    const ifRangeMatches = !ifRange || (
        ifRange.startsWith('W/')
            ? false
            : (etag && !etag.startsWith('W/') ? ifRange === etag : ifRange === lastModified)
    );
    const canHonorRange = rangeHeader && ifRangeMatches;

    if (canHonorRange) {
        const range = parseSingleByteRange(rangeHeader, bytes.byteLength);
        if (!range) {
            headers.set('Content-Range', `bytes */${bytes.byteLength}`);
            headers.set('Content-Length', '0');
            return new Response(null, { status: 416, headers });
        }

        const body = bytes.slice(range.start, range.end + 1);
        headers.set('Content-Length', String(body.byteLength));
        headers.set('Content-Range', `bytes ${range.start}-${range.end}/${bytes.byteLength}`);
        return new Response(request.method === 'HEAD' ? null : body, { status: 206, headers });
    }

    return new Response(request.method === 'HEAD' ? null : bytes, { status: 200, headers });
};

export const GET = serveHeroVideo;
export const HEAD = serveHeroVideo;
