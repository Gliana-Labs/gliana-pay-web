<svelte:head>
  <title>Tip {streamer?.name || 'Streamer'} - GlianaPay</title>
  <meta name="description" content="Send a SOL tip to {streamer?.name || 'this streamer'} on GlianaPay. Real-time OBS alerts included." />
  <meta name="keywords" content="tip, donate, Solana, SOL, {streamer?.name || 'streamer'}, crypto, Web3" />

  <!-- Open Graph -->
  <meta property="og:title" content="Tip {streamer?.name || 'Streamer'} - GlianaPay" />
  <meta property="og:description" content="Send a SOL tip with real-time OBS alerts" />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />
  <meta property="og:type" content="website" />

  <!-- Twitter -->
  <meta name="twitter:title" content="Tip {streamer?.name || 'Streamer'} - GlianaPay" />
  <meta name="twitter:description" content="Send a SOL tip with real-time OBS alerts" />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
  <meta name="twitter:site" content="@glianalabs" />
  <meta name="twitter:creator" content="@glianalabs" />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { Streamer, AlertSettings, TopTipper } from '$lib/types';
  import { getAvailableWallets, connectWallet as connectWalletUtil, disconnectWallet as disconnectWalletUtil } from '$lib/wallet';
  import type { WalletInfo } from '$lib/wallet';
  import { WORKER_URL } from '$lib/config';

  // Client-side data (populated in onMount)
  let streamer: Streamer | undefined = undefined;
  let settings: AlertSettings | null | undefined = undefined;
  let topTippers: TopTipper[] = [];
  let loadError = '';

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

  let isMobile = false;

  // Social Media states
  let xUrl = '';
  let redditUrl = '';
  let youtubeUrl = '';
  let twitchUrl = '';
  let kickUrl = '';
  let description = '';
  let minAmount = 0.01;

  onMount(() => {
    // Fetch streamer data
    async function fetchData() {
      const slug = $page.params.slug;
      try {
        const response = await fetch(`/api/streamer/${slug}`);
        if (response.ok) {
          const data = await response.json();
          streamer = data.streamer;
          settings = data.settings;
          topTippers = data.topTippers || [];

          // Assign alert settings
          if (settings) {
            minAmount = settings.min_amount || 0.01;
          }

          // Assign social settings
          if (streamer) {
            xUrl = streamer.x_url || '';
            redditUrl = streamer.reddit_url || '';
            youtubeUrl = streamer.youtube_url || '';
            twitchUrl = streamer.twitch_url || '';
            kickUrl = streamer.kick_url || '';
            description = streamer.description || '';
          }
        } else {
          loadError = 'Streamer not found';
        }
      } catch (e) {
        console.error('Failed to load streamer:', e);
        loadError = 'Streamer not found';
      }
    }
    
    fetchData();

    // Small delay to ensure wallet extensions are loaded
    setTimeout(checkWallets, 100);
    window.addEventListener('focus', checkWallets);

    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return () => {
      window.removeEventListener('focus', checkWallets);
      if (qrInterval) clearInterval(qrInterval);
    };
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

  let qrInterval: any = null;

  async function generatePayment() {
    if (!streamer) return;

    isLoading = true;
    status = 'Generating payment request...';
    
    // Clear any existing polling intervals
    if (qrInterval) clearInterval(qrInterval);

    try {
      const { Connection, Keypair } = await import('@solana/web3.js');
      const connection = new Connection('https://api.devnet.solana.com');

      const lamports = Math.floor(amount * 1e9);
      // Solana Pay strictly requires an Ed25519 Public Key as the reference parameter, not a UUID string.
      const referenceKeypair = Keypair.generate();
      const reference = referenceKeypair.publicKey.toBase58();

      const paymentUrl = new URL(`solana:${streamer.wallet}`);
      paymentUrl.searchParams.append('amount', amount.toString());
      paymentUrl.searchParams.append('reference', reference);
      paymentUrl.searchParams.append('label', `${streamer.name}'s Tip Jar`);
      paymentUrl.searchParams.append('message', message || `Tip for ${streamer.name}`);

      // Generate QR Code with the correctly encoded solana: URI
      const encodedUrl = encodeURIComponent(paymentUrl.toString().replace('solana://', 'solana:'));
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodedUrl}`;

      status = viewerConnected ? 'Wallet connected! You can pay directly or scan QR' : 'Scan the QR code with your wallet!';
      
      // Start polling the blockchain for the mobile QR Code scan completion
      qrInterval = setInterval(async () => {
        try {
          // Check if any transactions have hit our unique reference key
          const signatures = await connection.getSignaturesForAddress(referenceKeypair.publicKey, { limit: 1 });
          
          if (signatures.length > 0) {
            clearInterval(qrInterval);
            status = 'Mobile payment confirmed! Sending alert to streamer...';
            
            const txSignature = signatures[0].signature;
            
            // Record tip and broadcast to streamer's overlay
            const tipData = {
              slug: streamer!.slug,
              tx_hash: txSignature,
              amount: lamports,
              sender: 'Mobile Wallet User',
              sender_name: name || 'Anonymous (Mobile)',
              message: message || '🎉'
            };

            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const res = await fetch(`${WORKER_URL}/api/tip/record`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(tipData)
                });
                if (res.ok) {
                  status = 'Alert sent! Thank you for your mobile tip! 🎉';
                  qrCodeUrl = ''; 
                  break;
                }
              } catch (e) {
                console.error('[TipPage] Mobile Alert Attempt', attempt, 'failed:', e);
                if (attempt === 3) {
                  status = 'Payment confirmed but alert may be delayed. Thank you!';
                  qrCodeUrl = '';
                }
              }
              if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (pollErr) {
           // Silent catch for network errors during polling
        }
      }, 3000); // Poll every 3 seconds

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
          const res = await fetch(`${WORKER_URL}/api/tip/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tipData)
          });
          if (res.ok) {
            status = 'Alert sent to streamer! Thank you for your tip! 🎉';
            qrCodeUrl = ''; // Hide QR only after success
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

    const overlayWindow = window.open(`/overlay/${streamer.slug}`, 'GlianaPayOverlay', 'width=600,height=400');

    if (!overlayWindow) {
      console.error('[TipPage] Popup blocked! Please allow popups for this site');
      alert('Popup blocked! Please allow popups and try again, or open the overlay manually at /overlay/' + streamer.slug);
      return;
    }

    setTimeout(() => {
      if (overlayWindow) {
        overlayWindow.postMessage({
          type: 'tip',
          data: {
            tx_hash: txHash,
            amount: amountLamports,
            sender: viewerWallet || 'Unknown',
            sender_name: name || viewerWallet?.slice(0, 8) || 'Anonymous',
            message: message || '🎉',
            timestamp: new Date().toISOString(),
            streamer_slug: streamer!.slug
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

  // Format name as Title Case
  function titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  }
</script>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden">
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
  </div>

  <!-- Beta Badge -->
  <div class="absolute top-4 right-4 group z-20">
    <div class="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full cursor-help">
      <span class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
      <span class="text-xs font-medium text-yellow-400">Beta - Devnet</span>
    </div>
    <!-- Tooltip -->
    <div class="absolute right-0 top-full mt-2 w-64 px-3 py-2 bg-zinc-900 border border-yellow-500/40 rounded-lg text-xs text-zinc-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      This is a testnet version. No real money involved. Enable devnet in your wallet settings before using.
    </div>
  </div>

  <div class="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-8">
    
    <!-- Profile Banner & Card Header -->
    <div class="mb-8 w-full mx-auto">
      <!-- Banner Background -->
      <div class="h-24 md:h-32 w-full rounded-t-3xl bg-zinc-800 relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 mix-blend-overlay"></div>
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:24px_24px]"></div>
      </div>

      <!-- Profile Card Container -->
      <div class="bg-[#111113]/90 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-3xl px-6 pb-6 pt-0 relative shadow-2xl">
        <!-- Overlapping Avatar - X/Twitter Style (Left aligned) -->
        <div class="flex justify-between items-end -mt-12 md:-mt-16 mb-4 relative z-10 w-full">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#111113] bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/20 overflow-hidden">
             <!-- Using emoji as requested, but structured to support images later -->
             <span class="text-4xl md:text-6xl drop-shadow-md">🎮</span>
          </div>

          <!-- Social Links moved to right side alongside avatar -->
          {#if streamer && (streamer.x_url || streamer.reddit_url || streamer.youtube_url || streamer.kick_url || streamer.twitch_url)}
            <div class="flex gap-2 mb-2 md:mb-6">
              {#if streamer.x_url}
                <a href={streamer.x_url} target="_blank" rel="noopener noreferrer" class="p-2 md:p-2.5 bg-zinc-900/80 border border-white/5 rounded-full hover:bg-zinc-800 hover:border-white/30 transition-all text-zinc-400 hover:text-white" title="X (Twitter)">
                  <svg class="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              {/if}
              {#if streamer.twitch_url}
                <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" class="p-2 md:p-2.5 bg-zinc-900/80 border border-white/5 rounded-full hover:bg-[#9146FF]/20 hover:border-[#9146FF]/50 transition-all text-zinc-400 hover:text-[#9146FF]" title="Twitch">
                  <svg class="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.806-6.806v-14.149h-21.851zm19.164 13.074l-4.298 4.298h-5.373l-3.045 3.045v-3.045h-4.836v-15.045h17.552v10.746zm-9.134-5.373h-2.149v5.015h2.149v-5.015zm4.836 0h-2.149v5.015h2.149v-5.015z"/></svg>
                </a>
              {/if}
              {#if streamer.youtube_url}
                <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" class="p-2 md:p-2.5 bg-zinc-900/80 border border-white/5 rounded-full hover:bg-[#FF0000]/20 hover:border-[#FF0000]/50 transition-all text-zinc-400 hover:text-[#FF0000]" title="YouTube">
                  <svg class="w-4 h-4 md:w-5 md:h-5 -mx-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              {/if}
              {#if streamer.kick_url}
                <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" class="p-2 md:p-2.5 bg-zinc-900/80 border border-white/5 rounded-full hover:bg-[#53FC18]/20 hover:border-[#53FC18]/50 transition-all text-zinc-400 hover:text-[#53FC18]" title="Kick">
                  <svg class="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M1.385 0h4.223v6.462h3.538V0h4.223v6.462h1.616V0h7.615v6.462h-4.307v2.692h-1.616v2.616h1.616v2.692h4.307V24h-7.615v-6.462h-1.616v-2.615h-1.615v2.615H8.223v2.693h-1.616V24H1.385V0zM12.692 11.846v-2.692H14.154v2.692h-1.462zm0 2.616v-2.616h1.462v2.616h-1.462z"/></svg>
                </a>
              {/if}
              {#if streamer.reddit_url}
                <a href={streamer.reddit_url} target="_blank" rel="noopener noreferrer" class="p-2 md:p-2.5 bg-zinc-900/80 border border-white/5 rounded-full hover:bg-[#FF4500]/20 hover:border-[#FF4500]/50 transition-all text-zinc-400 hover:text-[#FF4500]" title="Reddit">
                  <svg class="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                </a>
              {/if}
            </div>
          {/if}
        </div>

        <div class="text-left">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl md:text-3xl font-bold text-white">
              {streamer?.name ? titleCase(streamer.name) : '...' }
            </h1>
          </div>
          
          <!-- Streamer Custom Description -->
          {#if streamer && ('description' in streamer) && streamer.description}
            <p class="text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed whitespace-pre-wrap">{streamer.description}</p>
          {/if}
        </div>
      </div>
    </div>

    {#if loadError}
      <div class="glass-card rounded-2xl p-8 text-center">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-2xl font-bold text-white mb-2">Streamer Not Found</h2>
        <p class="text-zinc-500">{loadError}</p>
      </div>
    {:else if !streamer}
      <div class="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto">
        <!-- Animated spinner ring -->
        <div class="flex justify-center mb-5">
          <div class="w-12 h-12 rounded-full border-[3px] border-white/10 border-t-cyan-400 animate-spin"></div>
        </div>
        <h2 class="text-lg font-semibold text-white/80 mb-1">Loading streamer…</h2>
        <p class="text-sm text-zinc-500">Hang tight, we're getting everything ready</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start">
        
        <!-- Left Column: Leaderboard -->
        <div class="lg:col-span-5 order-3 lg:order-1 flex flex-col gap-4">
          {#if topTippers.length > 0}
            <div class="glass-card rounded-2xl p-6 border border-white/10 animate-slide-up">
              <div class="flex items-center gap-2 mb-6 px-1">
                <span class="text-xl">👑</span>
                <h3 class="font-bold text-lg text-white">Top Supporters <span class="text-xs font-normal text-zinc-500">(7 Days)</span></h3>
              </div>
              
              <div class="flex flex-col gap-3">
                {#each topTippers as tipper, i}
                  <div class="relative overflow-hidden {i === 0 ? 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20' : 'bg-zinc-900/40 border-white/5'} p-4 rounded-xl border flex items-center justify-between transition-all hover:border-purple-500/30 hover:bg-white/5 group">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10
                        {i === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                         i === 1 ? 'bg-zinc-300 text-black' : 
                         i === 2 ? 'bg-orange-400 text-black' : 
                         'bg-zinc-800 text-zinc-400'}">
                        #{i + 1}
                      </div>
                      <div class="text-sm font-semibold text-white truncate max-w-[140px]">{tipper.sender_name}</div>
                    </div>
                    
                    <div class="text-right z-10">
                      <div class="font-black {i === 0 ? 'text-yellow-400' : 'text-green-400'}">{(tipper.total / 1e9).toFixed(2)} <span class="text-xs font-normal">SOL</span></div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <!-- Empty State for Left Column -->
            <div class="glass-card rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center justify-center min-h-[200px] opacity-70 border-dashed">
              <span class="text-4xl mb-3">💫</span>
              <h3 class="font-bold text-white mb-1">No tips yet</h3>
              <p class="text-sm text-zinc-400">Be the first to support {streamer?.name}!</p>
            </div>
          {/if}
        </div>

        <!-- Right Column: Tip Form -->
        <div class="lg:col-span-7 order-1 lg:order-2 space-y-4 max-w-xl mx-auto w-full">
          <!-- Viewer Wallet Connect -->
          <div class="glass-card rounded-2xl p-5 border border-white/10">
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
                {#if isMobile}
                  <button class="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-medium transition-all border border-purple-500/50 hover:border-purple-400">
                    Connect Wallet
                  </button>
                  <div class="mt-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p class="text-xs text-purple-300">Mobile?</p>
                    <p class="text-xs text-zinc-400">Open this page in your wallet's in-app browser for best experience.</p>
                  </div>
                {:else}
                  <div class="w-full py-3 px-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-left">
                    <p class="text-sm text-zinc-300 font-medium">No wallet found</p>
                    <p class="text-xs text-zinc-500 mt-1">Please install a Solana wallet like Phantom or Solflare to send tips.</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" class="text-xs text-purple-400 hover:text-purple-300">Phantom</a>
                      <span class="text-zinc-600">•</span>
                      <a href="https://solflare.com" target="_blank" rel="noopener noreferrer" class="text-xs text-purple-400 hover:text-purple-300">Solflare</a>
                    </div>
                  </div>
                {/if}
              {/if}
              {#if walletError}
                <p class="text-red-400 text-xs mt-2 text-center">{walletError}</p>
              {/if}
            {:else}
              <div class="flex items-center justify-between">
                <span class="text-sm text-zinc-400">Connected: {viewerWallet.slice(0, 6)}...{viewerWallet.slice(-4)}</span>
                <button on:click={handleDisconnect} class="text-xs text-red-400 hover:text-red-300">Disconnect</button>
              </div>
            {/if}
          </div>

          <!-- Tipping Form -->
          <div class="glass-card rounded-2xl p-6 border border-white/10">
            <form on:submit={handleSubmit} class="space-y-5">
              <div>
                <label for="name" class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-zinc-300">👤 Your Name</span>
                  <!-- Info Icon with Tooltip containing description -->
                  <div class="relative group">
                    <div class="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 cursor-help hover:text-white transition-colors border border-white/10">
                      <span class="text-xs font-bold leading-none">i</span>
                    </div>
                    <div class="absolute right-0 bottom-full mb-2 w-64 bg-zinc-900/95 backdrop-blur-md border border-white/10 text-zinc-300 text-xs px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none text-center">
                      Send a SOL tip and show your support with a custom message on their live stream.
                      <div class="absolute top-full right-2 border-4 border-transparent border-t-white/10"></div>
                    </div>
                  </div>
                </label>
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

              <button type="submit" disabled={isLoading || !streamer} class="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 disabled:opacity-50 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                {#if isLoading}
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {:else}
                  Generate Tip
                {/if}
              </button>
            </form>

            {#if status}
              <div class="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 animate-slide-up">
                <p class="text-center text-purple-300 text-sm">{status}</p>
              </div>
            {/if}
          </div>

        <!-- Close the right column -->
        </div>

      {#if qrCodeUrl}
        <div class="order-2 lg:order-3 lg:col-span-12 max-w-xl mx-auto w-full lg:max-w-none glass-card rounded-2xl border border-white/10 animate-slide-up overflow-hidden">
          <!-- Amount Summary Header -->
          <div class="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-b border-white/5">
            <div class="flex items-center justify-center gap-3">
              <span class="text-green-400 font-bold text-lg">{amount} SOL</span>
              <svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              <span class="text-white font-semibold">{streamer?.name}</span>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="grid grid-cols-1 sm:grid-cols-2">

            <!-- Left: Scan to Pay -->
            <div class="p-6 flex flex-col items-center text-center">
              <div class="flex items-center gap-2 mb-4">
                <span class="text-xl">📱</span>
                <h3 class="text-lg font-bold text-white">Scan to Pay</h3>
              </div>

              <div class="inline-block p-3 bg-white rounded-2xl mb-3 shadow-lg shadow-purple-500/10">
                <img src={qrCodeUrl} alt="QR" class="w-44 h-44" />
              </div>

              <p class="text-zinc-500 text-xs mb-3">Open Phantom or Solflare on your phone and scan</p>

              <!-- Caution -->
              <div class="flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg w-full">
                <span class="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse flex-shrink-0 mt-1"></span>
                <p class="text-yellow-300/80 text-[11px] leading-relaxed text-left">Keep this page open after scanning — the alert fires automatically once confirmed.</p>
              </div>
            </div>

            <!-- Divider (mobile horizontal) -->
            <div class="flex items-center gap-3 px-6 sm:hidden">
              <div class="flex-1 h-px bg-white/10"></div>
              <span class="text-xs text-zinc-500 font-medium">OR</span>
              <div class="flex-1 h-px bg-white/10"></div>
            </div>

            <!-- Right: Pay with Wallet -->
            <div class="p-6 flex flex-col items-center justify-center text-center sm:border-l sm:border-white/5 relative">
              <!-- Vertical OR divider (desktop) -->
              <div class="hidden sm:block absolute -left-px top-1/2 -translate-y-1/2 -translate-x-1/2">
                <div class="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
                  <span class="text-[10px] text-zinc-400 font-bold">OR</span>
                </div>
              </div>

              <div class="flex items-center gap-2 mb-4">
                <span class="text-xl">💳</span>
                <h3 class="text-lg font-bold text-white">Pay with Wallet</h3>
              </div>

              {#if viewerConnected}
                <div class="w-full space-y-3">
                  <div class="flex items-center gap-2 justify-center px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span class="text-green-400 text-xs font-medium">Wallet Connected</span>
                  </div>

                  <button
                    on:click={payWithWallet}
                    disabled={isLoading}
                    class="w-full py-3.5 px-6 bg-gradient-to-r from-green-500 to-emerald-500 disabled:opacity-50 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    {#if isLoading}
                      <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    {:else}
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      Pay {amount} SOL Now
                    {/if}
                  </button>

                  <p class="text-zinc-500 text-[11px]">Instant — no scanning required</p>
                </div>
              {:else}
                <div class="w-full space-y-3">
                  <div class="p-4 bg-zinc-800/50 border border-white/5 rounded-xl">
                    <svg class="w-10 h-10 text-zinc-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>
                    <p class="text-zinc-400 text-sm font-medium">No wallet connected</p>
                    <p class="text-zinc-500 text-xs mt-1">Connect a wallet above to pay directly from your browser</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Close the grid -->
      </div>

      <!-- Powered by Solana -->
      <div class="mt-8 flex items-center justify-center gap-2">
        <span class="text-xs text-zinc-500">Powered by</span>
        <img src="/solana-pay/Color=White.svg" alt="Solana" class="h-4" />
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="absolute bottom-6 left-0 px-4">
    <a href="mailto:support@glianapay.com?subject=Report Bug" class="text-xs text-zinc-500 hover:text-white">Report Bug</a>
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