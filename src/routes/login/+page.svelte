<svelte:head>
  <title>Login - GlianaPay | Web3 Tipping for Streamers</title>
  <meta name="description" content="Connect your wallet to create and manage your GlianaPay tipping page. Accept SOL tips with real-time OBS alerts." />
  <meta name="keywords" content="login, streamer, wallet connect, Phantom, Solflare, Solana, tips, donations, Web3" />

  <!-- Open Graph -->
  <meta property="og:title" content="Login - GlianaPay" />
  <meta property="og:description" content="Connect your wallet to create and manage your tipping page." />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />

  <!-- Twitter -->
  <meta name="twitter:title" content="Login - GlianaPay" />
  <meta name="twitter:description" content="Connect your wallet to create and manage your tipping page." />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
  <meta name="twitter:site" content="@glianalabs" />
  <meta name="twitter:creator" content="@glianalabs" />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { getAvailableWallets, connectWallet, disconnectWallet } from '$lib/wallet';
  import type { WalletInfo } from '$lib/wallet';

  let connected = false;
  let walletAddress = '';
  let loading = false;
  let error = '';
  let name = '';
  let slug = '';
  let turnstileToken = '';
  let turnstileContainer: HTMLDivElement;
  let turnstileWidgetId: string | null = null;
  let turnstileLoaded = false;

  // Turnstile site key - get from https://dash.cloudflare.com/ -> Turnstile
  const TURNSTILE_SITE_KEY = '0x4AAAAAACd6patp0WteLo73';

  // Load Turnstile and render widget
  function loadTurnstile() {
    if (typeof window === 'undefined') return;

    // Define callback first
    (window as any).turnstileCallback = (token: string) => {
      turnstileToken = token;
      console.log('Turnstile token received');
    };

    // If already loaded, render immediately
    if ((window as any).turnstile) {
      renderTurnstile();
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      renderTurnstile();
    };
    document.head.appendChild(script);
  }

  function renderTurnstile() {
    if (!turnstileContainer || !(window as any).turnstile) return;

    // Remove old widget if exists
    if (turnstileWidgetId) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId);
      } catch (e) {}
    }

    // Render new widget
    turnstileWidgetId = (window as any).turnstile.render(turnstileContainer, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        turnstileToken = token;
        console.log('Turnstile token received');
      }
    });
  }

  // Load Turnstile when wallet connects (form becomes visible)
  $: if (connected && turnstileContainer && !turnstileLoaded) {
    turnstileLoaded = true;
    loadTurnstile();
  }

  // Dashboard data
  let totalReceived = 0;
  let totalTips = 0;
  let average = 0;
  let donations: any[] = [];
  let settingsLoading = false;
  let settingsSaved = false;

  // Settings
  let minAmount = 0.001;
  let soundUrl = 'https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3';
  let soundEnabled = false;

  const WORKER_URL = 'https://api.glianapay.com';

  // Load dashboard data
  async function loadDashboardData() {
    if (!slug) return;

    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/${slug}/donations`);
      if (response.ok) {
        const data = await response.json();
        totalReceived = data.stats.totalReceived / 1e9; // Convert lamports to SOL
        totalTips = data.stats.totalTips;
        average = data.stats.average / 1e9;
        donations = data.donations || [];
      }
    } catch (e) {
      console.error('Failed to load donations:', e);
    }

    // Load settings
    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/${slug}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded streamer settings:', data.settings);
        if (data.settings) {
          minAmount = (data.settings.min_amount || 1000000) / 1e9;
          soundUrl = data.settings.sound_url || 'https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3';
          console.log('Sound URL set to:', soundUrl);
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  // Save settings
  let soundError = '';

  async function saveSettings() {
    soundError = '';

    // Validate sound URL
    if (soundUrl && !soundUrl.match(/\.(mp3|wav|ogg)(\?|$)/i) && !soundUrl.includes('/media/sounds/')) {
      soundError = 'URL should end with .mp3 or contain /media/sounds/';
      return;
    }

    console.log('saveSettings called, slug:', slug, 'minAmount:', minAmount, 'soundUrl:', soundUrl);
    settingsLoading = true;
    settingsSaved = false;

    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/${slug}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_amount: Math.floor(minAmount * 1e6),
          sound_url: soundUrl
        })
      });

      console.log('Settings response:', response.status);
      if (response.ok) {
        settingsSaved = true;
        setTimeout(() => settingsSaved = false, 3000);
      } else {
        const err = await response.json();
        console.error('Settings save error:', err);
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      settingsLoading = false;
    }
  }

  // Test alert via postMessage (new tab)
  let testAlertInProgress = false;

  function testAlert() {
    if (testAlertInProgress) return;
    testAlertInProgress = true;

    const testWindow = window.open(`/overlay/${slug}`, 'GlianaPayOverlay', 'width=600,height=400');
    setTimeout(() => {
      if (testWindow) {
        testWindow.postMessage({
          type: 'tip',
          data: {
            tx_hash: 'test_' + Date.now(),
            amount: 100000000,
            sender: walletAddress || 'TestUser',
            sender_name: 'Test User',
            message: 'Test tip! 🎉',
            timestamp: new Date().toISOString(),
            streamer_slug: slug
          }
        }, '*');
      }
      testAlertInProgress = false;
    }, 1000);
  }

  // Test alert via WebSocket (for OBS) - simplified
  let testInProgress = false;

  function testAlertWS() {
    if (testInProgress) {
      console.log('Test already in progress');
      return;
    }
    testInProgress = true;

    // Just call the API directly - no need for WebSocket on client
    // The DO will broadcast to connected viewers
    fetch(`https://api.glianapay.com/api/test-alert/${slug}`, {
      method: 'POST'
    }).then(() => {
      console.log('Test alert sent via WebSocket');
    }).catch(err => {
      console.error('Failed to send test alert:', err);
    }).finally(() => {
      // Allow next test after delay
      setTimeout(() => {
        testInProgress = false;
      }, 2000);
    });
  }

  // Available wallets
  let availableWallets: WalletInfo[] = [];
  let selectedWallet: WalletInfo | null = null;

  // Check available wallets
  function checkWallets() {
    if (typeof window !== 'undefined') {
      availableWallets = getAvailableWallets();
    }
  }

  // Connect to selected wallet
  async function handleConnectWallet(wallet: WalletInfo) {
    selectedWallet = wallet;
    loading = true;
    error = '';

    try {
      const address = await connectWallet(wallet);
      if (address) {
        walletAddress = address;
        connected = true;
        saveSession();
        // Check if user already has an account
        await checkExisting();
      } else {
        error = `Failed to connect to ${wallet.name}. Please try again.`;
      }
    } catch (e: any) {
      error = e?.message || `Failed to connect to ${wallet.name}`;
    } finally {
      loading = false;
      if (!connected) {
        selectedWallet = null;
      }
    }
  }

  // Disconnect
  async function handleDisconnect() {
    if (selectedWallet) {
      await disconnectWallet(selectedWallet);
    }
    selectedWallet = null;
    connected = false;
    walletAddress = '';
    name = '';
    slug = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gliana_session');
    }
  }

  // Legacy function for compatibility
  function getPhantomWallet() {
    if (typeof window !== 'undefined') {
      return (window as any).phantom?.solana;
    }
    return null;
  }

  // Load saved session
  function loadSession() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gliana_session');
      if (saved) {
        const session = JSON.parse(saved);
        walletAddress = session.walletAddress || '';
        name = session.name || '';
        slug = session.slug || '';
        connected = !!walletAddress;
        // If already registered (has name & slug), go to dashboard
        if (name && slug) {
          window.location.href = '/dashboard';
        }
      }
    }
  }

  // Save session
  function saveSession() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gliana_session', JSON.stringify({
        walletAddress,
        name,
        slug
      }));
    }
  }

  async function register() {
    if (!connected || !name || !slug) {
      error = 'Please connect wallet and fill all fields';
      return;
    }

    loading = true;
    error = '';

    try {
      // Save to worker database
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${WORKER_URL}/api/streamer/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          name,
          slug,
          turnstile_token: turnstileToken
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create streamer');
      }

      saveSession();
      // Go to dashboard
      window.location.href = '/dashboard';
    } catch (e: any) {
      console.error('Register error:', e);
      error = e.name === 'AbortError' ? 'Request timed out. Please try again.' : (e.message || 'Failed to register');
    } finally {
      loading = false;
    }
  }

  async function checkExisting() {
    if (!walletAddress) return;
    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/wallet/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        name = data.streamer.name;
        slug = data.streamer.slug;
        saveSession();
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (e) {
      // No existing account
    }
  }

  function goToHomepage() {
    // Go to homepage without logging out
    window.location.href = '/';
  }

  let copied = false;
  async function copyPageUrl() {
    const url = `https://glianapay.com/${slug}`;
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  onMount(() => {
    loadSession();
    checkWallets();

    // If already logged in (has session with wallet and slug), redirect to dashboard
    if (walletAddress && slug) {
      window.location.href = '/dashboard';
      return;
    }

    const phantom = getPhantomWallet();
    if (phantom) {
      phantom.on('connect', () => {
        walletAddress = phantom.publicKey?.toString() || '';
        connected = true;
        saveSession();
        checkExisting();
      });
      if (phantom.publicKey) {
        walletAddress = phantom.publicKey.toString();
        connected = true;
        checkExisting();
      }
    }
  });
</script>

<div>
  <!-- Login View -->
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

    <!-- Header -->
    <div class="relative z-10 flex items-center justify-between px-4 py-4">
      <a href="/" class="flex items-center gap-2">
        <img src="/logo.svg" alt="GlianaPay" class="w-10 h-10 bg-transparent rounded-xl" />
      </a>
      <a href="/" class="text-zinc-400 hover:text-white text-sm">← Back</a>
    </div>

    <div class="relative z-10 max-w-md mx-auto px-4 py-8">
      <!-- Beta - Devnet Badge -->
      <div class="flex justify-center mb-4">
        <div class="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
          <span class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
          <span class="text-xs font-medium text-yellow-400">Beta - Devnet</span>
        </div>
      </div>
      <p class="text-xs text-yellow-400/70 text-center mb-4">Make sure your wallet is set to Devnet</p>

      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gradient">Streamer Login</h1>
        <p class="text-zinc-400 mt-2">Connect wallet to manage your tipping page</p>
      </div>

      <div class="glass-card rounded-2xl p-6 border border-white/10">
        {#if !connected}
          {#if availableWallets.length > 0}
            <p class="text-sm text-zinc-400 mb-4 text-center">Select a wallet to connect</p>
            <div class="space-y-3">
              {#each availableWallets as wallet}
                <button
                  on:click={() => handleConnectWallet(wallet)}
                  disabled={loading}
                  class="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl font-medium transition-all"
                >
                  {#if loading && selectedWallet?.name === wallet.name}
                    <span class="inline-flex items-center gap-2">
                      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Connecting...
                    </span>
                  {:else}
                    Connect {wallet.name}
                  {/if}
                </button>
              {/each}
            </div>
            <!-- Powered by Solana -->
            <div class="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
              <span class="text-xs text-zinc-500">Powered by</span>
              <img src="/solana-pay/Color=White.svg" alt="Solana" class="h-4" />
            </div>
          {:else}
            <p class="text-sm text-zinc-400 mb-4 text-center">No wallet extension found</p>
            <div class="space-y-2">
              <a href="https://phantom.app/" target="_blank" class="block w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-center transition-all">
                Install Phantom
              </a>
              <a href="https://solflare.com/" target="_blank" class="block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium text-center transition-all">
                Install Solflare
              </a>
            </div>
            <!-- Powered by Solana -->
            <div class="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
              <span class="text-xs text-zinc-500">Powered by</span>
              <img src="/solana-pay/Color=White.svg" alt="Solana" class="h-4" />
            </div>
          {/if}
        {:else}
          <div class="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-400 text-sm">✓ Wallet connected</p>
                <p class="font-mono text-xs mt-1 text-zinc-400">{walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}</p>
              </div>
              <button on:click={handleDisconnect} class="text-xs text-red-400 hover:text-red-300">Disconnect</button>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
              <input type="text" id="name" bind:value={name} placeholder="Your Name" class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50" />
            </div>

            <div>
              <label for="slug" class="block text-sm font-medium text-zinc-300 mb-2">Your Page URL</label>
              <input type="text" id="slug" bind:value={slug} placeholder="yourname" class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50" />
              <p class="text-xs text-zinc-500 mt-1">Your page: glianapay.com/{slug || 'yourname'}</p>
            </div>

            <!-- Turnstile Widget -->
            <div class="flex justify-center">
              <div bind:this={turnstileContainer} class="cf-turnstile"></div>
            </div>

            <button on:click={register} disabled={loading || !name || !slug || !turnstileToken} class="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 disabled:opacity-50 rounded-xl font-bold transition-all">
              {#if loading}
                Setting up...
              {:else}
                Create My Page →
              {/if}
            </button>
          </div>
        {/if}

        {#if error}
          <p class="mt-4 text-red-400 text-sm text-center">{error}</p>
        {/if}
      </div>

      <p class="text-center mt-6 text-zinc-500 text-sm">
        <a href="/" class="hover:text-purple-400">← Back to Home</a>
      </p>
    </div>
  </div>
</div>

<style>
  .glass-card { background: rgba(17, 17, 19, 0.8); backdrop-filter: blur(12px); }
  @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  .text-gradient {
    background-image: linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #ec4899 100%);
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>
