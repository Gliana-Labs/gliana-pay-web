<script lang="ts">
  import { onMount } from 'svelte';
  import { disconnectWallet } from '$lib/wallet';
  import type { WalletInfo } from '$lib/wallet';

  // Check auth
  let walletAddress = '';
  let slug = '';
  let loading = true;

  const WORKER_URL = 'https://api.glianapay.com';

  // Toast notifications
  let toast = '';
  let toastType: 'success' | 'error' | '' = '';
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  function showToast(message: string, type: 'success' | 'error' = 'error') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast = message;
    toastType = type;
    toastTimeout = setTimeout(() => {
      toast = '';
      toastType = '';
    }, 5000);
  }

  // Dashboard data
  let totalReceived = 0;
  let totalTips = 0;
  let average = 0;
  let donations: any[] = [];
  let settingsLoading = false;

  // Settings
  let minAmount = 0.001;
  let soundUrl = 'https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3';
  let soundEnabled = false;

  // Copy state
  let copied = false;
  async function copyPageUrl() {
    const url = `https://glianapay.com/${slug}`;
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  // Load session
  function loadSession() {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('gliana_session');
    if (saved) {
      const session = JSON.parse(saved);
      walletAddress = session.walletAddress || '';
      slug = session.slug || '';
    }
  }

  // Load dashboard data
  async function loadDashboardData() {
    if (!slug) return;

    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/${slug}/donations`);
      if (response.ok) {
        const data = await response.json();
        totalReceived = data.stats.totalReceived / 1e9;
        totalTips = data.stats.totalTips;
        average = data.stats.average / 1e9;
        donations = data.donations || [];
      }
    } catch (e) {
      console.error('Failed to load donations:', e);
    }

    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/${slug}`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          minAmount = (data.settings.min_amount || 1000000) / 1e9;
          soundUrl = data.settings.sound_url || 'https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3';
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

    if (soundUrl && !soundUrl.match(/\.(mp3|wav|ogg)(\?|$)/i) && !soundUrl.includes('/media/sounds/')) {
      soundError = 'URL should end with .mp3 or contain /media/sounds/';
      return;
    }

    settingsLoading = true;

    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/${slug}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_amount: Math.floor(minAmount * 1e6),
          sound_url: soundUrl
        })
      });

      if (response.ok) {
        showToast('Settings saved!', 'success');
      } else {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
      showToast('Failed to save settings', 'error');
    } finally {
      settingsLoading = false;
    }
  }

  // Test alert
  let testInProgress = false;

  function testAlertWS() {
    if (testInProgress) return;
    testInProgress = true;

    fetch(`https://api.glianapay.com/api/test-alert/${slug}`, {
      method: 'POST'
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      showToast('Test alert sent!', 'success');
    }).catch(err => {
      console.error('Failed to send test alert:', err);
      showToast(err.message || 'Failed to send test alert', 'error');
    }).finally(() => {
      setTimeout(() => {
        testInProgress = false;
      }, 2000);
    });
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem('gliana_session');
    window.location.href = '/';
  }

  // Go to homepage
  function goToHomepage() {
    window.location.href = '/';
  }

  onMount(() => {
    loadSession();

    if (!walletAddress || !slug) {
      // Not logged in, redirect to login
      window.location.href = '/login';
      return;
    }

    loadDashboardData();
    loading = false;
  });
</script>

{#if !loading}
  <div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden">
    <!-- Floating icons -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <img src="/3dicons-dollar-dynamic-color.png" alt="" class="absolute top-[10%] left-[5%] w-16 h-16 opacity-25 float" />
      <img src="/3dicons-wallet-dynamic-color.png" alt="" class="absolute top-[15%] right-[8%] w-16 h-16 opacity-25 float" style="animation-delay: 1s;" />
      <img src="/3dicons-shield-dynamic-color.png" alt="" class="absolute bottom-[20%] left-[10%] w-14 h-14 opacity-20 float" style="animation-delay: 2s;" />
      <img src="/3dicons-video-cam-dynamic-color.png" alt="" class="absolute bottom-[15%] right-[5%] w-16 h-16 opacity-25 float" style="animation-delay: 1.5s;" />
    </div>

    <!-- Header -->
    <div class="border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <button on:click={goToHomepage} class="flex items-center gap-2">
          <img src="/logo.svg" alt="GlianaPay" class="w-10 h-10 bg-transparent rounded-xl" />
          <span class="font-bold">GlianaPay</span>
        </button>
        <div class="flex items-center gap-4">
          <span class="text-zinc-400 text-sm">Dashboard</span>
          <div class="text-sm text-zinc-400">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
          <button on:click={handleLogout} class="text-sm text-red-400 hover:text-red-300">Logout</button>
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
          <div class="flex items-center gap-2 mt-1">
            <a href="/{slug || 'yourname'}" target="_blank" class="text-xl font-bold text-purple-400 hover:underline">
              /{slug || 'yourname'}
            </a>
            <button on:click={copyPageUrl} class="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded transition-all">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p class="text-xs text-zinc-500 mt-1">Share this link to receive tips</p>
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
                <div class="flex gap-2">
                  <input type="url" id="sound" bind:value={soundUrl} class="flex-1 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm" />
                  <button on:click={() => soundUrl = 'https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3'} class="px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300 whitespace-nowrap">
                    Reset
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
                  https://glianapay.com/overlay/{slug}{soundEnabled ? '?sound=1' : ''}
                </code>
                <button on:click={() => navigator.clipboard.writeText(`https://glianapay.com/overlay/${slug}${soundEnabled ? '?sound=1' : ''}`)} class="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg text-xs whitespace-nowrap">
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

            <a href="/overlay/{slug}?sound=1" target="_blank" class="inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline">
              <span>Preview Overlay</span>
            </a>

            <button on:click={testAlertWS} disabled={testInProgress} class="ml-3 inline-flex items-center gap-2 text-sm text-yellow-400 hover:underline disabled:opacity-50">
              <span>{testInProgress ? 'Sending...' : 'Test Alert'}</span>
            </button>

            <p class="text-xs text-zinc-500 mt-3">
              <span class="text-yellow-500">Tip:</span> If settings don't update, right-click the Browser Source in OBS and select "Interact" then refresh the page, or remove and re-add the Browser Source.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast -->
  {#if toast}
    <div
      class="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 {toastType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white text-sm font-medium"
    >
      {toast}
    </div>
  {/if}
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
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .float {
    animation: float 3s ease-in-out infinite;
  }
</style>
