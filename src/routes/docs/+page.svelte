<script lang="ts">
  const currentYear = new Date().getFullYear();
</script>

<svelte:head>
  <title>Docs - GlianaPay</title>
  <meta
    name="description"
    content="Documentation for GlianaPay. Learn how to set up Solana tipping, configure OBS overlays, and accept crypto donations on your stream."
  />
  <meta
    name="keywords"
    content="GlianaPay documentation, Solana tipping docs, OBS overlay setup, crypto donation API, streamer tools"
  />

  <!-- Open Graph -->
  <meta property="og:title" content="Documentation - GlianaPay" />
  <meta
    property="og:description"
    content="Complete documentation for GlianaPay tipping platform."
  />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />

  <!-- Twitter -->
  <meta name="twitter:title" content="Documentation - GlianaPay" />
  <meta
    name="twitter:description"
    content="Complete documentation for GlianaPay tipping platform."
  />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
</svelte:head>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] flex flex-col">
  <!-- Animated Background -->
  <div class="absolute inset-0 overflow-hidden">
    <div
      class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
    ></div>
    <div
      class="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
      style="animation-delay: 1s;"
    ></div>
    <div
      class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"
    ></div>
  </div>

  <!-- Header (Edge-to-Edge) -->
  <div
    class="relative z-10 w-full px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between"
  >
    <a
      href="/"
      class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
    >
      <img
        src="/logo.svg"
        alt="GlianaPay"
        class="w-10 h-10 rounded-xl shadow-lg shadow-purple-500/20"
      />
      <span
        class="font-bold text-sm sm:text-base md:text-lg tracking-wide hidden sm:inline"
        >GlianaPay</span
      >
    </a>
    <a
      href="/"
      class="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
      >← Back</a
    >
  </div>

  <div class="relative z-10 max-w-3xl mx-auto px-4 pt-0 pb-16 flex-1">
    <div class="text-center mb-10">
      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        <span
          class="text-gradient bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient"
        >
          Documentation
        </span>
      </h1>
      <p class="text-zinc-400 max-w-xl mx-auto">
        A quick reference for everything about GlianaPay — how it works, what's
        supported, and how to set it up.
      </p>
    </div>

    <!-- Sections -->
    <div class="space-y-4">
      <!-- What is GlianaPay -->
      <div
        class="glass-card rounded-2xl border border-white/10 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              /></svg
            >
          </div>
          <h2 class="font-semibold text-base">What is GlianaPay?</h2>
        </div>
        <div class="px-6 py-4 text-sm text-zinc-400 leading-relaxed">
          GlianaPay is a Web3 tipping platform built on Solana. Streamers get a
          personal tip page at <span
            class="text-white font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded"
            >glianapay.com/your-slug</span
          > where viewers can send SOL tips directly to their wallet — no payment
          processor, no delays, no chargebacks. When a tip arrives, a real-time alert
          fires on the OBS stream overlay.
        </div>
      </div>

      <!-- Wallet Support -->
      <div
        class="glass-card rounded-2xl border border-white/10 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9"
              /></svg
            >
          </div>
          <h2 class="font-semibold text-base">Supported Wallets</h2>
        </div>
        <div class="px-6 py-4 text-sm text-zinc-400 leading-relaxed">
          <p class="mb-3">GlianaPay currently supports:</p>
          <div class="flex flex-wrap gap-3">
            <a
              href="https://phantom.app"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-colors"
            >
              <span class="text-purple-300 font-semibold text-sm">Phantom</span>
              <span class="text-zinc-500 text-xs">phantom.app ↗</span>
            </a>
            <a
              href="https://solflare.com"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-colors"
            >
              <span class="text-orange-300 font-semibold text-sm">Solflare</span
              >
              <span class="text-zinc-500 text-xs">solflare.com ↗</span>
            </a>
          </div>
          <p class="mt-3 text-zinc-500 text-xs">
            On mobile, open the tip or login page inside the wallet's built-in
            browser. Additional wallets are planned for future releases.
          </p>
        </div>
      </div>

      <!-- Network Status -->
      <div
        class="glass-card rounded-2xl border border-yellow-500/20 overflow-hidden"
      >
        <div
          class="px-6 py-4 border-b border-yellow-500/10 flex items-center gap-3"
        >
          <div
            class="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center text-yellow-400"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              /></svg
            >
          </div>
          <h2 class="font-semibold text-base">Network: Devnet (Beta)</h2>
          <span
            class="ml-auto px-2.5 py-0.5 bg-yellow-500/15 border border-yellow-500/30 rounded-full text-xs font-medium text-yellow-400"
            >Beta</span
          >
        </div>
        <div class="px-6 py-4 text-sm text-zinc-400 leading-relaxed">
          GlianaPay is currently running on <span
            class="text-yellow-400 font-medium">Solana Devnet</span
          >. All tips use test SOL — there is no real monetary value. Before
          connecting, make sure your wallet is switched to Devnet mode. Mainnet
          support is on the roadmap.
        </div>
      </div>

      <!-- OBS Setup -->
      <div
        class="glass-card rounded-2xl border border-white/10 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
              /></svg
            >
          </div>
          <h2 class="font-semibold text-base">OBS Alert Setup</h2>
        </div>
        <div class="px-6 py-4 text-sm text-zinc-400 leading-relaxed space-y-2">
          <p>
            1. Go to your <a
              href="/login"
              class="text-purple-400 hover:underline">Dashboard</a
            > and copy your Overlay URL.
          </p>
          <p>
            2. In OBS Studio, add a new <span class="text-white font-medium"
              >Browser Source</span
            > to your scene.
          </p>
          <p>
            3. Paste the Overlay URL and set the width to <span
              class="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-white"
              >800</span
            >
            and height to
            <span
              class="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-white"
              >600</span
            >.
          </p>
          <p>
            4. Position the source where you want alerts to appear. Tips will
            fire automatically in real-time.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="mt-10">
      <h3
        class="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4"
      >
        Quick Links
      </h3>
      <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <a
          href="/how"
          class="glass-card p-4 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors text-center"
        >
          <h4 class="font-semibold text-sm mb-1">How to Use</h4>
          <p class="text-xs text-zinc-500">Step-by-step guide</p>
        </a>
        <a
          href="/faq"
          class="glass-card p-4 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-colors text-center"
        >
          <h4 class="font-semibold text-sm mb-1">FAQ</h4>
          <p class="text-xs text-zinc-500">Common questions</p>
        </a>
        <a
          href="/roadmap"
          class="glass-card p-4 rounded-xl border border-white/10 hover:border-pink-500/30 transition-colors text-center"
        >
          <h4 class="font-semibold text-sm mb-1">Roadmap</h4>
          <p class="text-xs text-zinc-500">What's coming next</p>
        </a>
        <a
          href="/login"
          class="glass-card p-4 rounded-xl border border-white/10 hover:border-green-500/30 transition-colors text-center"
        >
          <h4 class="font-semibold text-sm mb-1">Get Started</h4>
          <p class="text-xs text-zinc-500">Create your page</p>
        </a>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="h-6"></div>
</div>

<style>
  @keyframes gradient {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .animate-gradient {
    animation: gradient 3s ease infinite;
  }

  .glass-card {
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(12px);
  }
</style>
