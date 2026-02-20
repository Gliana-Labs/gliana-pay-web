import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;

    // Proxy /api/* and /ws/* requests to the worker via service binding
    if (pathname.startsWith('/api/') || pathname.startsWith('/ws/')) {
        const worker = (event.platform as any)?.env?.GLIANA_PAY_WORKER;
        if (worker) {
            try {
                // Build a new request to forward to the worker
                const workerUrl = new URL(event.request.url);
                const workerRequest = new Request(workerUrl.toString(), {
                    method: event.request.method,
                    headers: event.request.headers,
                    body: event.request.method !== 'GET' && event.request.method !== 'HEAD'
                        ? event.request.body
                        : undefined,
                    // @ts-ignore — duplex is needed for streaming request bodies
                    duplex: 'half',
                });

                return await worker.fetch(workerRequest);
            } catch (e) {
                console.error('Service binding proxy error:', e);
                return new Response(JSON.stringify({ error: 'Service unavailable' }), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
    }

    return resolve(event);
};
