import type { PageServerLoad } from './$types';
import type { Streamer, AlertSettings, StreamerPageData } from '$lib/types';

export const load: PageServerLoad = async ({ params, platform }) => {
  const { slug } = params;

  // Try Service binding first
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
      console.error('Worker response:', response.status);
    } catch (e) {
      console.error('Worker error:', e);
    }
  }

  // Fallback: try relative URL (goes to proxy)
  try {
    const response = await fetch(`/api/streamer/${slug}`);
    if (response.ok) {
      const data = await response.json() as { streamer: Streamer; settings: AlertSettings | null };
      return {
        streamer: data.streamer,
        settings: data.settings
      } as StreamerPageData;
    }
    console.error('Fetch response:', response.status, await response.text());
  } catch (e) {
    console.error('Fetch error:', e);
  }

  return {
    error: 'Streamer not found'
  };
};
