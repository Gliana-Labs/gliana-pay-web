import type { PageServerLoad } from './$types';
import type { Streamer, AlertSettings, StreamerPageData } from '$lib/types';

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;

  // Try relative URL first (goes through route to worker)
  try {
    const response = await fetch(`/api/streamer/${slug}`);
    if (response.ok) {
      const data = await response.json() as { streamer: Streamer; settings: AlertSettings | null };
      return {
        streamer: data.streamer,
        settings: data.settings
      } as StreamerPageData;
    }
    console.error('API response:', response.status, await response.text());
  } catch (e) {
    console.error('API error:', e);
  }

  return {
    error: 'Streamer not found'
  };
};
