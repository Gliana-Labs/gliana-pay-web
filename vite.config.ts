import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    external: ['@solana/web3.js', '@solana/pay']
  },
  optimizeDeps: {
    exclude: ['@solana/web3.js', '@solana/pay']
  }
});
