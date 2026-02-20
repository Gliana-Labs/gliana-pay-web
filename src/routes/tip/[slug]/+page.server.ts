import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
    const slug = params.slug;

    try {
        const worker = (platform as any)?.env?.WORKER;
        if (worker) {
            // Use service binding to call worker directly (no network hop)
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
    } catch (e) {
        console.error('Failed to load streamer via service binding:', e);
    }

    return { slug, streamer: null, settings: null };
};
