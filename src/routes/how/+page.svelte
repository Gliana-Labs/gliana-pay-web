<script lang="ts">
  const currentYear = new Date().getFullYear();
</script>

<svelte:head>
  <title>How to Use - GlianaPay</title>
  <meta name="description" content="Learn how to use GlianaPay to accept SOL tips with real-time OBS alerts. Step-by-step guide for streamers to receive crypto donations." />
  <meta name="keywords" content="how to use GlianaPay, Solana tipping, crypto donations, OBS overlay, streamer tips guide" />

  <!-- Open Graph -->
  <meta property="og:title" content="How to Use - GlianaPay" />
  <meta property="og:description" content="Learn how to accept SOL tips on your stream with real-time OBS alerts." />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />

  <!-- Twitter -->
  <meta name="twitter:title" content="How to Use - GlianaPay" />
  <meta name="twitter:description" content="Learn how to accept SOL tips on your stream with real-time OBS alerts." />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
</svelte:head>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] flex flex-col">
  <!-- Animated Background -->
  <div class="fixed inset-0 overflow-hidden">
    <div class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
  </div>

  <!-- Header (Edge-to-Edge) -->
  <div class="relative z-10 w-full px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
      <img src="/logo.svg" alt="GlianaPay" class="w-10 h-10 rounded-xl shadow-lg shadow-purple-500/20" />
      <span class="font-bold text-sm sm:text-base md:text-lg tracking-wide hidden sm:inline">GlianaPay</span>
    </a>
    <a href="/" class="text-zinc-400 hover:text-white text-sm font-medium transition-colors">← Back</a>
  </div>

  <div class="relative z-10 max-w-3xl mx-auto px-4 pt-0 pb-8 flex-1 overflow-y-auto">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-2xl md:text-3xl font-bold mb-2">
        <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          How to Use
        </span>
      </h1>
      <p class="text-zinc-400 text-base max-w-xl mx-auto">
        Learn how to set up your tipping page and start receiving SOL tips from viewers with real-time OBS alerts.
      </p>
    </div>

    <!-- Steps - Accordion Style -->
    <div class="space-y-3">
      <!-- Step 1 -->
      <div class="glass-card p-4 rounded-xl border border-white/10">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            1
          </div>
          <div class="flex-1">
            <h2 class="font-semibold text-base">Create Your Tipping Page</h2>
            <p class="text-sm text-zinc-400 mt-1">
              Go to <a href="/login" class="text-purple-400 hover:underline">/login</a>, connect your Phantom or Solflare wallet, and choose a unique URL slug (e.g., your stream name). This creates your personal tipping page at glianapay.com/your-slug.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="glass-card p-4 rounded-xl border border-white/10">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            2
          </div>
          <div class="flex-1">
            <h2 class="font-semibold text-base">Configure Alert Settings</h2>
            <p class="text-sm text-zinc-400 mt-1">
              In your dashboard, set the minimum tip amount to trigger alerts (default: 0.01 SOL), customize your alert message, and choose a sound effect. You can also upload a custom image to display with each tip.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="glass-card p-4 rounded-xl border border-white/10">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            3
          </div>
          <div class="flex-1">
            <h2 class="font-semibold text-base">Set Up OBS Overlay</h2>
            <p class="text-sm text-zinc-400 mt-1">
              Copy your overlay URL from the dashboard and add it as a Browser Source in OBS. Position it in your scene where you want tips to appear. The overlay shows tipper name, amount, and message in real-time.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="glass-card p-4 rounded-xl border border-white/10">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            4
          </div>
          <div class="flex-1">
            <h2 class="font-semibold text-base">Share Your Link</h2>
            <p class="text-sm text-zinc-400 mt-1">
              Share your tipping page link (glianapay.com/your-slug) with your viewers. You can add it to your stream bio, chat commands, or anywhere your audience can find it. Viewers can tip using any Solana wallet.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="glass-card p-4 rounded-xl border border-white/10">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            5
          </div>
          <div class="flex-1">
            <h2 class="font-semibold text-base">Receive Real-Time Alerts</h2>
            <p class="text-sm text-zinc-400 mt-1">
              When viewers send tips, you'll get instant OBS notifications showing their name, the amount (in SOL), and their message. Tips work on Solana devnet for testing - switch to mainnet when ready for real SOL!
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="text-center mt-6 pb-6">
      <a
        href="/login"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 rounded-xl font-semibold transition-all"
      >
        Get Started
      </a>
    </div>
  </div>
</div>

<style>
  .glass-card {
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(12px);
  }
</style>
