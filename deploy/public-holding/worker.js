const canonicalHost = 'ohrhatorahoc.org';
const alternateHosts = new Set([
  'ohrhatorah-oc.com', 'www.ohrhatorah-oc.com',
  'ohrhatorahoc.com', 'www.ohrhatorahoc.com',
  'ohrhatorah-oc.org', 'www.ohrhatorah-oc.org',
  'www.ohrhatorahoc.org',
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (alternateHosts.has(url.hostname) || (url.hostname === canonicalHost && url.protocol !== 'https:')) {
      url.hostname = canonicalHost;
      url.protocol = 'https:';
      url.port = '';
      return new Response(null, {
        status: 301,
        headers: { Location: url.href, 'Cache-Control': 'public, max-age=3600' },
      });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    if (response.status === 404) response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  },
};
