const destinationOrigin = 'https://kehilat-ohr-hatorah-chuck-staging.pages.dev';

export default {
    async fetch(request) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return new Response('This legacy staging endpoint has moved.', {
                status: 410,
                headers: {
                    'Cache-Control': 'no-store',
                    'Content-Type': 'text/plain; charset=UTF-8',
                    'X-Robots-Tag': 'noindex',
                },
            });
        }

        const source = new URL(request.url);
        const destination = new URL(source.pathname, destinationOrigin);
        destination.search = source.search;

        return new Response(null, {
            status: 302,
            headers: {
                'Cache-Control': 'no-store',
                Location: destination.toString(),
                'X-Robots-Tag': 'noindex',
            },
        });
    },
};
