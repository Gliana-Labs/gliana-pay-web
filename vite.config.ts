import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

function removeRenderBlockingFonts() {
  return {
    name: 'remove-render-blocking-fonts',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (id.includes('@aztemi/svelte-on-solana-wallet-adapter-ui/styles.css')) {
        return code.replace(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Sans:[^']+'\);/g, '');
      }
      return null;
    }
  };
}

export default defineConfig({
  plugins: [
    removeRenderBlockingFonts(),
    tailwindcss(),
    sveltekit(),
    visualizer({
      emitFile: true,
      filename: 'stats.html',
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['@solana/web3.js', 'buffer'],
  },
  define: {
    'process.env.BROWSER': true,
    'global': 'globalThis',
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@solana/wallet-adapter-wallets')) {
            return 'solana-wallets';
          }
          if (id.includes('@solana/web3.js')) {
            return 'solana-web3';
          }
          if (id.includes('@aztemi/svelte-on-solana-wallet-adapter-ui')) {
            return 'solana-wallet-ui';
          }
          if (id.includes('@walletconnect') || id.includes('@reown/appkit')) {
            return 'walletconnect';
          }
        }
      }
    }
  }
});
