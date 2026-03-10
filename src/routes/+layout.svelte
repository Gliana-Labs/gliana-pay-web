<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { WalletProvider, ConnectionProvider } from '@aztemi/svelte-on-solana-wallet-adapter-ui';
  import { SOLANA_RPC } from '$lib/config';

  const localStorageKey = 'walletAdapter';

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
  });
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<ConnectionProvider endpoint={SOLANA_RPC} />
<slot />
