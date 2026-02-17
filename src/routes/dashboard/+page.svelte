<script lang="ts">
  import { onMount } from 'svelte';

  // Mock data for demo
  let streamer = {
    id: 1,
    slug: 'zekai',
    wallet: '3VaXM8KmxfmK4Hb4RZhu3ZUWoJDEEMd8sjv9rk1e3keS',
    name: 'Zetakai'
  };

  let donations = [
    { id: 1, amount: 100000000, sender_name: 'Alice', message: 'Love your streams!', timestamp: '2024-01-15T10:30:00Z' },
    { id: 2, amount: 50000000, sender_name: 'Bob', message: 'Keep it up!', timestamp: '2024-01-14T15:20:00Z' },
    { id: 3, amount: 250000000, sender_name: 'Charlie', message: 'You\'re awesome!', timestamp: '2024-01-13T20:45:00Z' },
  ];

  let settings = {
    min_amount: 1000000,
    sound_url: 'https://cdn.gliana.app/alerts/default.mp3'
  };

  let walletAddress = '';
  let connected = false;

  function getPhantomWallet() {
    if (typeof window !== 'undefined') {
      return (window as any).phantom?.solana;
    }
    return null;
  }

  async function connectWallet() {
    const phantom = getPhantomWallet();
    if (!phantom) return;

    try {
      const response = await phantom.connect();
      walletAddress = response.publicKey.toString();
      connected = true;
    } catch (e) {
      console.error(e);
    }
  }

  function formatSOL(lamports: number) {
    return (lamports / 1e9).toFixed(4);
  }

  function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  $: totalReceived = donations.reduce((sum, d) => sum + d.amount, 0);
  $: totalDonations = donations.length;

  onMount(() => {
    connectWallet();
  });
</script>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora']">
  <!-- Header -->
  <div class="border-b border-white/10">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center">
          <span class="font-bold">G</span>
        </div>
        <span class="font-bold">GlianaPay</span>
      </a>
      <div class="flex items-center gap-4">
        <a href="/{streamer.slug}" target="_blank" class="text-zinc-400 hover:text-white text-sm">
          View Page →
        </a>
        <div class="text-sm text-zinc-400">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <p class="text-zinc-400 text-sm">Total Received</p>
        <p class="text-3xl font-bold text-gradient mt-1">{formatSOL(totalReceived)} SOL</p>
      </div>
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <p class="text-zinc-400 text-sm">Total Tips</p>
        <p class="text-3xl font-bold mt-1">{totalDonations}</p>
      </div>
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <p class="text-zinc-400 text-sm">Average</p>
        <p class="text-3xl font-bold mt-1">{formatSOL(totalReceived / totalDonations)} SOL</p>
      </div>
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <p class="text-zinc-400 text-sm">Your Page</p>
        <a href="/{streamer.slug}" target="_blank" class="text-xl font-bold text-purple-400 hover:underline mt-1 block">
          /{streamer.slug}
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
          <div class="divide-y divide-white/5">
            {#each donations as donation}
              <div class="p-4 flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
                  💎
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{donation.sender_name}</span>
                    <span class="text-green-400 font-bold">{formatSOL(donation.amount)} SOL</span>
                  </div>
                  <p class="text-sm text-zinc-400 truncate">{donation.message}</p>
                </div>
                <span class="text-xs text-zinc-500">{formatDate(donation.timestamp)}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div>
        <div class="glass-card rounded-2xl border border-white/10 p-6">
          <h2 class="font-bold text-lg mb-4">⚙️ Settings</h2>

          <div class="space-y-4">
            <div>
              <label for="min-amount" class="block text-sm text-zinc-400 mb-2">
                Minimum Tip Amount (SOL)
              </label>
              <input
                type="number"
                id="min-amount"
                bind:value={settings.min_amount}
                step="0.001"
                min="0"
                class="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white"
              />
            </div>

            <div>
              <label for="sound-url" class="block text-sm text-zinc-400 mb-2">
                Alert Sound URL
              </label>
              <input
                type="url"
                id="sound-url"
                bind:value={settings.sound_url}
                class="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white"
              />
            </div>

            <button class="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all">
              Save Settings
            </button>
          </div>
        </div>

        <!-- OBS Instructions -->
        <div class="glass-card rounded-2xl border border-white/10 p-6 mt-4">
          <h2 class="font-bold text-lg mb-4">📺 OBS Setup</h2>
          <ol class="text-sm text-zinc-400 space-y-2">
            <li>1. Add Browser Source in OBS</li>
            <li>2. Enter this URL:</li>
            <li class="font-mono text-xs text-purple-400 break-all">https://glianapay.com/overlay/{streamer.slug}</li>
            <li>3. Set size to 1920x1080</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .glass-card {
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(12px);
  }

  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .text-gradient {
    background-image: linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #ec4899 100%);
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>
