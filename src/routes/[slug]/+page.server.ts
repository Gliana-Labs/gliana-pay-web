import type { PageServerLoad } from './$types';
import type { Streamer, AlertSettings, StreamerPageData } from '$lib/types';
import { WORKER_URL } from '$lib/config';

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;

  // Try worker API first
  try {
    const response = await fetch(`${WORKER_URL}/api/streamer/${slug}`);

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

  return {
    error: 'Streamer not found'
  };
};
