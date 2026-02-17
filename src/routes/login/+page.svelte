<script lang="ts">
  import { onMount } from 'svelte';

  let connected = false;
  let walletAddress = '';
  let loading = false;
  let error = '';
  let name = '';
  let slug = '';
  let showDashboard = false;
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

  // Check if Phantom is available
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
          showDashboard = true;
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

  async function connectWallet() {
    const phantom = getPhantomWallet();
    if (!phantom) {
      error = 'Phantom wallet not found. Please install Phantom wallet.';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await phantom.connect();
      walletAddress = response.publicKey.toString();
      connected = true;
      saveSession();
    } catch (e: any) {
      error = e.message || 'Failed to connect wallet';
    } finally {
      loading = false;
    }
  }

  async function disconnectWallet() {
    const phantom = getPhantomWallet();
    if (phantom) {
      await phantom.disconnect();
    }
    connected = false;
    walletAddress = '';
    name = '';
    slug = '';
    showDashboard = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gliana_session');
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
      window.location.href = `/${slug}`;
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
        showDashboard = true;
        loadDashboardData();
      }
    } catch (e) {
      // No existing account
    }
  }

  function goToDashboard() {
    showDashboard = true;
    loadDashboardData();
  }

  function goToHome() {
    showDashboard = false;
  }

  onMount(() => {
    loadSession();

    // Load dashboard data if already logged in
    if (showDashboard && slug) {
      loadDashboardData();
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

{#if showDashboard}
  <!-- Dashboard View -->
  <div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora']">
    <!-- Header -->
    <div class="border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <button on:click={goToHome} class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center">
            <span class="font-bold">G</span>
          </div>
          <span class="font-bold">GlianaPay</span>
        </button>
        <div class="flex items-center gap-4">
          <button on:click={goToHome} class="text-zinc-400 hover:text-white text-sm">My Page</button>
          <div class="text-sm text-zinc-400">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
          <button on:click={disconnectWallet} class="text-sm text-red-400 hover:text-red-300">Logout</button>
        </div>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Total Received</p>
          <p class="text-3xl font-bold text-gradient mt-1">{totalReceived.toFixed(3)} SOL</p>
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Total Tips</p>
          <p class="text-3xl font-bold mt-1">{totalTips}</p>
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Average</p>
          <p class="text-3xl font-bold mt-1">{average.toFixed(3)} SOL</p>
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Your Page</p>
          <a href="/{slug || 'yourname'}" target="_blank" class="text-xl font-bold text-purple-400 hover:underline mt-1 block">
            /{slug || 'yourname'}
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Recent Donations -->
        <div class="lg:col-span-2">
          <div class="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div class="p-4 border-b border-white/10">
              <h2 class="font-bold text-lg">Recent Tips</h2>
            </div>
            {#if donations.length > 0}
              <div class="divide-y divide-white/5">
                {#each donations as donation}
                  <div class="p-4 flex items-center justify-between">
                    <div>
                      <p class="font-medium text-white">{donation.sender_name || 'Anonymous'}</p>
                      <p class="text-sm text-zinc-500">{donation.message || 'No message'}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-green-400">{(donation.amount / 1e9).toFixed(3)} SOL</p>
                      <p class="text-xs text-zinc-500">{new Date(donation.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="p-8 text-center text-zinc-500">
                No tips yet. Share your page to start receiving tips!
              </div>
            {/if}
          </div>
        </div>

        <!-- Settings -->
        <div>
          <div class="glass-card rounded-2xl border border-white/10 p-6">
            <h2 class="font-bold text-lg mb-4">Settings</h2>
            <div class="space-y-4">
              <div>
                <label for="min-amount" class="block text-sm text-zinc-400 mb-2">Minimum (SOL)</label>
                <input type="number" id="min-amount" bind:value={minAmount} step="0.001" min="0.001" class="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white" />
              </div>
              <div>
                <label for="sound" class="block text-sm text-zinc-400 mb-2">Alert Sound URL</label>
                <div class="flex gap-2 items-center">
                  <input type="url" id="sound" bind:value={soundUrl} class="flex-1 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm" />
                  <button on:click={() => soundUrl = 'https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3'} class="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300 whitespace-nowrap">
                    Default
                  </button>
                </div>
              </div>
              {#if soundError}
                <p class="text-red-400 text-sm">{soundError}</p>
              {/if}
              <button on:click={saveSettings} disabled={settingsLoading} class="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-semibold transition-all">
                {#if settingsLoading}
                  Saving...
                {:else}
                  Save Settings
                {/if}
              </button>
              {#if settingsSaved}
                <p class="text-green-400 text-sm text-center">Settings saved!</p>
              {/if}
            </div>
          </div>

          <div class="glass-card rounded-2xl border border-white/10 p-6 mt-4">
            <h2 class="font-bold text-lg mb-4">OBS Overlay</h2>

            <p class="text-sm text-zinc-400 mb-3">How to add tip alerts to your stream:</p>

            <ol class="text-sm text-zinc-300 space-y-2 mb-4">
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">1.</span>
                <span>In OBS, add a <strong>Browser Source</strong></span>
              </li>
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">2.</span>
                <span>Toggle sound below, copy URL, paste in Browser Source</span>
              </li>
            </ol>

            <div class="mb-3">
              <label class="flex items-center gap-2 text-sm text-zinc-300 mb-2">
                <input type="checkbox" bind:checked={soundEnabled} class="w-4 h-4 accent-purple-500" />
                Enable sound alerts
              </label>
            </div>

            <div class="space-y-2 mb-3">
              <div class="flex items-center gap-2">
                <code class="flex-1 text-xs text-green-400 bg-black/30 p-2 rounded break-all">
                  https://glianapay.com/overlay/{slug || 'yourname'}{soundEnabled ? '?sound=1' : ''}
                </code>
                <button on:click={() => navigator.clipboard.writeText(`https://glianapay.com/overlay/${slug || 'yourname'}${soundEnabled ? '?sound=1' : ''}`)} class="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                  Copy
                </button>
              </div>
            </div>

            <ol class="text-sm text-zinc-300 space-y-2 mb-3">
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">3.</span>
                <span>Set Width: <strong>600</strong>, Height: <strong>400</strong></span>
              </li>
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">4.</span>
                <span>Check "Shutdown source when not visible"</span>
              </li>
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">5.</span>
                <span>Position the overlay in your scene</span>
              </li>
            </ol>

            <a href="/overlay/{slug || 'yourname'}{soundEnabled ? '?sound=1' : ''}" target="_blank" class="inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline">
              <span>Preview Overlay</span>
            </a>

            <button on:click={testAlertWS} class="ml-3 inline-flex items-center gap-2 text-sm text-yellow-400 hover:underline">
              <span>Test Alert</span>
            </button>

            <p class="text-xs text-zinc-500 mt-3">
              <span class="text-yellow-500">Tip:</span> If settings don't update, right-click the Browser Source in OBS and select "Interact" then refresh the page, or remove and re-add the Browser Source.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Login View -->
  <div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>

    <!-- Header -->
    <div class="relative z-10 flex items-center justify-between px-4 py-4">
      <a href="/" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
          G
        </div>
      </a>
    </div>

    <div class="relative z-10 max-w-md mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gradient">Streamer Login</h1>
        <p class="text-zinc-400 mt-2">Connect wallet to manage your tipping page</p>
      </div>

      <div class="glass-card rounded-2xl p-6 border border-white/10">
        {#if !connected}
          <button
            on:click={connectWallet}
            disabled={loading}
            class="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {#if loading}
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            {:else}
              {/if}
            Connect Phantom Wallet
          </button>
          <p class="text-xs text-zinc-500 mt-4 text-center">
            Don't have Phantom? <a href="https://phantom.app/" target="_blank" class="text-purple-400 hover:underline">Get it here</a>
          </p>
        {:else}
          <div class="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-400 text-sm">✓ Wallet connected</p>
                <p class="font-mono text-xs mt-1 text-zinc-400">{walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}</p>
              </div>
              <button on:click={disconnectWallet} class="text-xs text-red-400 hover:text-red-300">Disconnect</button>
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
{/if}

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
