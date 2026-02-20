import type { PageServerLoad } from './$types';
import type { Streamer, AlertSettings, StreamerPageData } from '$lib/types';

export const load: PageServerLoad = async ({ params, platform }) => {
  const { slug } = params;

  // Use Service binding if available, otherwise fallback to URL
  if (platform?.env?.WORKER) {
    try {
      const response = await platform.env.WORKER.fetch(`/api/streamer/${slug}`);
      if (response.ok) {
        const data = await response.json() as { streamer: Streamer; settings: AlertSettings | null };
        return {
          streamer: data.streamer,
          settings: data.settings
        } as StreamerPageData;
      }
    } catch (e) {
      console.error('Worker API error:', e);
    }
  }

  return {
    error: 'Streamer not found'
  };
};
