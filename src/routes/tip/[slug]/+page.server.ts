import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, fetch }) => {
    const slug = params.slug;

    try {
        // Try service binding first (no network hop)
        const worker = (platform as any)?.env?.WORKER;
        if (worker) {
            const response = await worker.fetch(
                new Request(`https://internal/api/streamer/${slug}`)
            );
            if (response.ok) {
                const data = await response.json() as { streamer: any; settings: any };
                return {
                    slug,
                    streamer: data.streamer ?? null,
                    settings: data.settings ?? null
                };
            }
        }

        // Fallback: use SvelteKit's internal fetch (goes through hooks.server.ts proxy)
        const response = await fetch(`/api/streamer/${slug}`);
        if (response.ok) {
            const data = await response.json() as { streamer: any; settings: any };
            return {
                slug,
                streamer: data.streamer ?? null,
                settings: data.settings ?? null
            };
        }
    } catch (e) {
        console.error('Failed to load streamer:', e);
    }

    return { slug, streamer: null, settings: null };
};
