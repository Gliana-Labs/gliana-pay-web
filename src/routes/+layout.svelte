<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { WalletProvider, ConnectionProvider } from '@aztemi/svelte-on-solana-wallet-adapter-ui';
  import { SOLANA_RPC } from '$lib/config';

  const localStorageKey = 'walletAdapter';

  let observer: MutationObserver;
  let wallets: any[] = [];

  onMount(async () => {
    const {
      PhantomWalletAdapter,
      SolflareWalletAdapter,
      CoinbaseWalletAdapter,
      TrustWalletAdapter,
      LedgerWalletAdapter,
    } = await import('@solana/wallet-adapter-wallets');

    wallets = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
      new LedgerWalletAdapter(),
    ];

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

  import { onDestroy } from 'svelte';
  onDestroy(() => observer?.disconnect());
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<ConnectionProvider endpoint={SOLANA_RPC} />
<slot />
