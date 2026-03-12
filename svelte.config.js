import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { enhancedImages } from '@sveltejs/enhanced-img';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  plugins: [enhancedImages()],
  kit: {
    adapter: adapter(),
    output: {
      preloadStrategy: 'modulepreload'
    }
  }
};

export default config;
