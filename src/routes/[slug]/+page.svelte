<svelte:head>
  <title>Tip {data.streamer?.name || 'Streamer'} - GlianaPay</title>
  <meta name="description" content="Send a SOL tip to {data.streamer?.name || 'this streamer'} on GlianaPay. Real-time OBS alerts included." />
  <meta name="keywords" content="tip, donate, Solana, SOL, {data.streamer?.name || 'streamer'}, crypto, Web3" />

  <!-- Open Graph -->
  <meta property="og:title" content="Tip {data.streamer?.name || 'Streamer'} - GlianaPay" />
  <meta property="og:description" content="Send a SOL tip with real-time OBS alerts" />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />
  <meta property="og:type" content="website" />

  <!-- Twitter -->
  <meta name="twitter:title" content="Tip {data.streamer?.name || 'Streamer'} - GlianaPay" />
  <meta name="twitter:description" content="Send a SOL tip with real-time OBS alerts" />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
  <meta name="twitter:site" content="@glianalabs" />
  <meta name="twitter:creator" content="@glianalabs" />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import type { Streamer, AlertSettings } from '$lib/types';
  import { getAvailableWallets, connectWallet as connectWalletUtil, disconnectWallet as disconnectWalletUtil } from '$lib/wallet';
  import type { WalletInfo } from '$lib/wallet';

  export let data: {
    streamer?: Streamer;
    settings?: AlertSettings | null;
    error?: string;
  };

  let name = '';
  let message = '';
  let amount = 0.01;
  let isLoading = false;
  let qrCodeUrl = '';
  let status = '';
  let viewerWallet = '';
  let viewerConnected = false;
  let availableWallets: WalletInfo[] = [];
  let selectedWallet: WalletInfo | null = null;
  let walletError = '';

  $: streamer = data.streamer;
  $: settings = data.settings;

  onMount(() => {
    // Small delay to ensure wallet extensions are loaded
    setTimeout(checkWallets, 100);
    // Re-check wallets when window gains focus (e.g., after installing extension)
    window.addEventListener('focus', checkWallets);
    return () => window.removeEventListener('focus', checkWallets);
  });

  // Check available wallets
  function checkWallets() {
    if (typeof window !== 'undefined') {
      availableWallets = getAvailableWallets();
    }
  }

  // Connect to selected wallet
  async function handleConnectWallet(wallet: WalletInfo) {
    selectedWallet = wallet;
    walletError = '';

    const address = await connectWalletUtil(wallet);
    if (address) {
      viewerWallet = address;
      viewerConnected = true;
      if (!name) name = address.slice(0, 8);
    } else {
      walletError = `Failed to connect to ${wallet.name}`;
      selectedWallet = null;
    }
  }

  // Disconnect
  async function handleDisconnect() {
    if (selectedWallet) {
      await disconnectWalletUtil(selectedWallet);
    }
    selectedWallet = null;
    viewerConnected = false;
    viewerWallet = '';
  }

  // Wallet connection
  function getPhantomWallet() {
    if (typeof window !== 'undefined') {
      return (window as any).phantom?.solana;
    }
    return null;
  }

  async function generatePayment() {
    if (!streamer) return;

    isLoading = true;
    status = 'Generating payment request...';

    try {
      const lamports = Math.floor(amount * 1e9);
      const reference = crypto.randomUUID();

      const paymentUrl = new URL('https://solana.com/pay');
      paymentUrl.searchParams.set('recipient', streamer.wallet);
      paymentUrl.searchParams.set('amount', lamports.toString());
      paymentUrl.searchParams.set('reference', reference);
      paymentUrl.searchParams.set('label', `${streamer.name}'s Tip Jar`);
      paymentUrl.searchParams.set('message', message || `Tip for ${streamer.name}`);

      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(paymentUrl.toString())}`;

      status = viewerConnected ? 'Wallet connected! You can pay directly or scan QR' : 'Scan the QR code with your wallet!';
    } catch (error) {
      console.error('Failed to generate payment:', error);
      status = 'Failed to generate payment. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    await generatePayment();
  }

  async function payWithWallet() {
    if (!streamer || !viewerConnected || !viewerWallet || !selectedWallet) return;

    isLoading = true;
    status = 'Preparing transaction...';

    try {
      const provider = selectedWallet.provider;
      if (!provider) {
        status = 'Wallet provider not found';
        return;
      }

      // Dynamic import to avoid SSR issues
      const { Connection, PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');

      // Create connection to Solana
      const connection = new Connection('https://api.devnet.solana.com');

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Create transfer transaction
      const transaction = new Transaction({
        feePayer: new PublicKey(viewerWallet),
        recentBlockhash: blockhash,
      });

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(viewerWallet),
          toPubkey: new PublicKey(streamer.wallet),
          lamports: Math.floor(amount * 1e9),
        })
      );

      // Request Phantom to sign and send
      const signedTx = await provider.signAndSendTransaction(transaction);

      status = 'Payment sent! Waiting for confirmation...';

      // Wait for confirmation
      await connection.confirmTransaction(signedTx.signature);

      status = 'Payment confirmed! Sending alert to streamer... (please don\'t close this page)';

      // Record tip and broadcast to streamer's overlay (with retry)
      console.log('[TipPage] Recording tip and broadcasting to streamer:', signedTx.signature);
      const tipData = {
        slug: streamer.slug,
        tx_hash: signedTx.signature,
        amount: Math.floor(amount * 1e9),
        sender: viewerWallet,
        sender_name: name || viewerWallet?.slice(0, 8) || 'Anonymous',
        message: message || '🎉'
      };

      // Retry up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch('https://api.glianapay.com/api/tip/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tipData)
          });
          if (res.ok) {
            status = 'Alert sent to streamer! Thank you for your tip! 🎉';
            qrCodeUrl = ''; // Hide QR only after success
            console.log('[TipPage] Tip recorded successfully');
            break;
          }
        } catch (e) {
          console.error('[TipPage] Attempt', attempt, 'failed:', e);
          if (attempt < 3) {
            status = `Sending alert... (attempt ${attempt}/3)`;
          }
          if (attempt === 3) {
            status = 'Payment confirmed but alert may be delayed. Thank you!';
            qrCodeUrl = '';
            console.error('[TipPage] Failed to record tip after 3 attempts');
          }
        }
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      status = error.message?.includes('User rejected')
        ? 'Transaction cancelled'
        : 'Payment failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  let testWindow: Window | null = null;

  function sendTipToOverlay(txHash: string, amountLamports: number) {
    if (!streamer) return;
    console.log('[TipPage] Opening overlay for:', streamer.slug);

    const overlayWindow = window.open(`/overlay/${streamer.slug}`, 'GlianaPayOverlay', 'width=600,height=400');

    if (!overlayWindow) {
      console.error('[TipPage] Popup blocked! Please allow popups for this site');
      alert('Popup blocked! Please allow popups and try again, or open the overlay manually at /overlay/' + streamer.slug);
      return;
    }

    setTimeout(() => {
      if (overlayWindow) {
        console.log('[TipPage] Sending tip data to overlay:', { tx_hash: txHash, amount: amountLamports });
        overlayWindow.postMessage({
          type: 'tip',
          data: {
            tx_hash: txHash,
            amount: amountLamports,
            sender: viewerWallet || 'Unknown',
            sender_name: name || viewerWallet?.slice(0, 8) || 'Anonymous',
            message: message || '🎉',
            timestamp: new Date().toISOString(),
            streamer_slug: streamer.slug
          }
        }, '*');
      }
    }, 1500);
  }

  function triggerAlert(signature: string) {
    if (!streamer) return;
    const lamports = Math.floor(amount * 1e9);
    sendTipToOverlay(signature, lamports);
  }

  function testAlert() {
    if (!streamer) return;
    sendTipToOverlay('test_' + crypto.randomUUID(), 100000000);
  }
</script>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden">
  <!-- Floating icons -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <img src="/3dicons-dollar-dynamic-color.png" alt="" class="absolute top-[10%] left-[5%] w-16 h-16 opacity-25 float" />
    <img src="/3dicons-wallet-dynamic-color.png" alt="" class="absolute top-[15%] right-[8%] w-16 h-16 opacity-25 float" style="animation-delay: 1s;" />
    <img src="/3dicons-shield-dynamic-color.png" alt="" class="absolute bottom-[20%] left-[10%] w-14 h-14 opacity-20 float" style="animation-delay: 2s;" />
    <img src="/3dicons-video-cam-dynamic-color.png" alt="" class="absolute bottom-[15%] right-[5%] w-16 h-16 opacity-25 float" style="animation-delay: 1.5s;" />
  </div>

  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
  </div>

  <div class="relative z-10 max-w-xl mx-auto px-4 py-8">
    <div class="text-center mb-6">
      <div class="relative inline-block mb-4">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30">
          <span class="text-4xl">🎮</span>
        </div>
      </div>

      <h1 class="text-3xl md:text-4xl font-bold mb-2">
        <span class="text-gradient bg-clip-text text-transparent">
          {streamer?.name || 'Streamer'}
        </span>
      </h1>

      <p class="text-zinc-400 text-sm max-w-xs mx-auto">Send a SOL tip and show your support with a custom message on their live stream</p>

      <!-- Beta Devnet Badge with tooltip -->
      <div class="mt-4">
        <div class="relative inline-block group">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-medium cursor-help">
            <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
            Beta - Devnet
          </span>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-yellow-500/30 rounded-lg text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Make sure your wallet is set to Devnet
            <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900"></div>
          </div>
        </div>
      </div>
    </div>

    {#if data.error}
      <div class="glass-card rounded-2xl p-8 text-center">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-2xl font-bold text-white mb-2">Streamer Not Found</h2>
        <p class="text-zinc-500">{data.error}</p>
      </div>
    {:else}
      <!-- Viewer Wallet Connect -->
      <div class="glass-card rounded-2xl p-5 border border-white/10 mb-4">
        {#if !viewerConnected}
          {#if availableWallets.length > 0}
            <div class="space-y-3">
              {#each availableWallets as wallet}
                <button
                  on:click={() => handleConnectWallet(wallet)}
                  disabled={isLoading}
                  class="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl font-medium transition-all border border-purple-500/50 hover:border-purple-400"
                >
                  Connect {wallet.name}
                </button>
              {/each}
            </div>
          {:else}
            <button class="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-medium transition-all border border-purple-500/50 hover:border-purple-400">
              Connect Wallet
            </button>
            <p class="text-xs text-zinc-500 mt-2 text-center">No wallet found. <a href="https://phantom.app/" target="_blank" class="text-purple-400">Install Phantom</a> or <a href="https://solflare.com/" target="_blank" class="text-purple-400">Solflare</a></p>
          {/if}
          {#if walletError}
            <p class="text-red-400 text-xs mt-2 text-center">{walletError}</p>
          {/if}
        {:else}
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-400">Connected: {viewerWallet.slice(0, 6)}...{viewerWallet.slice(-4)}</span>
            <button on:click={handleDisconnect} class="text-xs text-red-400">Disconnect</button>
          </div>
        {/if}
      </div>

      <div class="glass-card rounded-2xl p-6 border border-white/10">
        <form on:submit={handleSubmit} class="space-y-5">
          <div>
            <label for="name" class="block text-sm font-medium text-zinc-300 mb-2">👤 Your Name</label>
            <input type="text" id="name" bind:value={name} placeholder="Anonymous" maxlength="50" class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50" />
          </div>

          <div>
            <label for="message" class="block text-sm font-medium text-zinc-300 mb-2">💬 Message</label>
            <textarea id="message" bind:value={message} placeholder="Say something nice..." maxlength="200" rows="2" class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"></textarea>
          </div>

          <div>
            <label for="amount" class="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Amount (SOL)
            </label>
            <div class="relative">
              <input type="number" id="amount" bind:value={amount} min="0.001" step="0.001" class="w-full px-4 py-3 pr-16 bg-zinc-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50" />
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 font-semibold">SOL</div>
            </div>
            <p class="mt-2 text-xs text-zinc-500">Min: 0.001 SOL</p>
          </div>

          <button type="submit" disabled={isLoading || !streamer} class="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 disabled:opacity-50 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2">
            {#if isLoading}
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            {:else}
              Generate Tip
            {/if}
          </button>
        </form>

        {#if status}
          <div class="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <p class="text-center text-purple-300 text-sm">{status}</p>
          </div>
        {/if}
      </div>

      {#if qrCodeUrl}
        <div class="mt-6 glass-card rounded-2xl p-6 text-center border border-white/10 animate-slide-up">
          <div class="flex items-center justify-center gap-2 mb-4"><span class="text-2xl">📱</span><h3 class="text-xl font-bold text-white">Scan to Pay</h3></div>
          <div class="inline-block p-3 bg-white rounded-2xl mb-4"><img src={qrCodeUrl} alt="QR" class="w-48 h-48" /></div>
          <p class="text-zinc-400 text-sm mb-4">Or pay directly with connected wallet</p>
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-xl"><span class="text-green-400 font-bold">{amount} SOL</span><span class="text-zinc-500">→</span><span class="text-white font-semibold">{streamer?.name}</span></div>

          {#if viewerConnected}
            <button
              on:click={payWithWallet}
              disabled={isLoading}
              class="mt-4 w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 disabled:opacity-50 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
            >
              {#if isLoading}
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {:else}
                Pay {amount} SOL Now
              {/if}
            </button>
          {/if}
        </div>
      {/if}

      <div class="mt-8 text-center space-y-3">
        <p class="text-zinc-600 text-sm">Streamer: <span class="text-purple-400 font-mono">{streamer?.slug}</span></p>

        <!-- Powered by Solana -->
        <div class="flex items-center justify-center gap-2 pt-3 border-t border-white/5">
          <span class="text-xs text-zinc-500">Powered by</span>
          <img src="/solana-pay/Color=White.svg" alt="Solana" class="h-4" />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .glass-card { background: rgba(17, 17, 19, 0.8); backdrop-filter: blur(12px); }
  @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  .text-gradient { background-image: linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #ec4899 100%); background-size: 200% 200%; animation: gradient 3s ease infinite; }
  @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .animate-slide-up { animation: slide-up 0.4s ease-out; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  .float { animation: float 3s ease-in-out infinite; }
</style>