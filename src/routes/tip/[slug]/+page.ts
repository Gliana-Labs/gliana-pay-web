import type { PageLoad } from './$types';

// Disable SSR for this page - data loads client-side
export const ssr = false;

export const load: PageLoad = ({ params }) => {
  return {
    slug: params.slug
  };
};
