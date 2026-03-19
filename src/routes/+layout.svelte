<script lang="ts">
  import "../app.css";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { SOLANA_RPC, PUBLIC_URL } from "$lib/config";
  import {
    WalletProvider,
    ConnectionProvider,
  } from "@aztemi/svelte-on-solana-wallet-adapter-ui";
  const localStorageKey = "walletAdapter";
  $: canonicalUrl = `${PUBLIC_URL}${$page.url.pathname}`;

  let observer: MutationObserver;
  let wallets: any[] = [];

  onMount(async () => {
    const {
      PhantomWalletAdapter,
      SolflareWalletAdapter,
      CoinbaseWalletAdapter,
      TrustWalletAdapter,
      LedgerWalletAdapter,
    } = await import("@solana/wallet-adapter-wallets");

    wallets = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
      new LedgerWalletAdapter(),
    ];

    // Auto-expand wallet download list when no wallets are installed
    observer = new MutationObserver(() => {
      const modal = document.querySelector(".wallet-adapter-modal");
      if (!modal) return;

      const noWalletSection = modal.querySelector(
        ".wallet-adapter-modal-middle",
      );
      if (!noWalletSection) return;

      const toggleBtn = modal.querySelector(
        ".wallet-adapter-modal-list-more",
      ) as HTMLElement | null;
      if (toggleBtn) {
        if (!modal.querySelector(".wallet-adapter-modal-list")) {
          toggleBtn.click();
        }
        toggleBtn.style.display = "none";
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  onDestroy(() => observer?.disconnect());
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<ConnectionProvider endpoint={SOLANA_RPC} />

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main>
<slot />
</main>
