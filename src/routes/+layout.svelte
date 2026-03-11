<script lang="ts">
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { WalletProvider, ConnectionProvider } from '@aztemi/svelte-on-solana-wallet-adapter-ui';
  import { SOLANA_RPC } from '$lib/config';
  import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
  import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
  import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';
  import { TrustWalletAdapter } from '@solana/wallet-adapter-wallets';
  import { LedgerWalletAdapter } from '@solana/wallet-adapter-wallets';

  const localStorageKey = 'walletAdapter';

  let observer: MutationObserver;

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new TrustWalletAdapter(),
    new LedgerWalletAdapter(),
  ];

  onMount(() => {
    // Auto-expand wallet download list when no wallets are installed
    observer = new MutationObserver(() => {
      const modal = document.querySelector('.wallet-adapter-modal');
      if (!modal) return;

      // .wallet-adapter-modal-middle only exists when no wallets are detected
      const noWalletSection = modal.querySelector('.wallet-adapter-modal-middle');
      if (!noWalletSection) return;

      const toggleBtn = modal.querySelector('.wallet-adapter-modal-list-more') as HTMLElement | null;
      if (toggleBtn) {
        // Auto-click to expand wallet list if not already expanded
        if (!modal.querySelector('.wallet-adapter-modal-list')) {
          toggleBtn.click();
        }
        // Hide the toggle button itself
        toggleBtn.style.display = 'none';
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  onDestroy(() => observer?.disconnect());
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<ConnectionProvider endpoint={SOLANA_RPC} />
<slot />
