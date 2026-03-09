<script lang="ts">
  import FloatingIcons from "$lib/components/FloatingIcons.svelte";
  import { onMount } from "svelte";

  let slug = "";
  let isLoggedIn = false;
  const currentYear = new Date().getFullYear();

  onMount(() => {
    const saved = localStorage.getItem("gliana_session");
    if (saved) {
      const session = JSON.parse(saved);
      if (session.walletAddress && session.slug) {
        isLoggedIn = true;
      }
    }
  });

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const cleanSlug = slug.trim().toLowerCase();
    // Validate slug format (alphanumeric and hyphens only)
    if (cleanSlug && /^[a-zA-Z0-9-]+$/.test(cleanSlug)) {
      window.location.href = `/tip/${cleanSlug}`;
    }
  }
</script>

<svelte:head>
  <title>GlianaPay</title>
  <meta
    name="description"
    content="Accept SOL tips with real-time OBS alerts. The easiest way for streamers to receive cryptocurrency donations. Powered by Solana blockchain."
  />
  <meta
    name="keywords"
    content="streamer tips, Solana tips, crypto donations, OBS overlay, live streaming, Web3 payments, creator monetization"
  />

  <!-- Open Graph -->
  <meta property="og:title" content="GlianaPay - Web3 Tipping for Streamers" />
  <meta
    property="og:description"
    content="Accept SOL tips with real-time OBS alerts. Powered by Solana blockchain."
  />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:title" content="GlianaPay - Web3 Tipping for Streamers" />
  <meta
    name="twitter:description"
    content="Accept SOL tips with real-time OBS alerts. Powered by Solana blockchain."
  />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
  <meta name="twitter:site" content="@glianalabs" />
  <meta name="twitter:creator" content="@glianalabs" />

  <!-- Additional SEO -->
  <link rel="alternate" hreflang="en" href="https://glianapay.com/" />
</svelte:head>

<div
  class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden"
>
  <!-- Animated Background -->
  <div class="absolute inset-0 overflow-hidden">
    <!-- Gradient orbs -->
    <div
      class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
      style="will-change: transform, filter, opacity; transform: translateZ(0);"
    ></div>
    <div
      class="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
      style="animation-delay: 1s; will-change: transform, filter, opacity; transform: translateZ(0);"
    ></div>
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl"
      style="will-change: transform, filter; transform: translateZ(0);"
    ></div>

    <!-- Grid pattern -->
    <div
      class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"
    ></div>

    <!-- Floating icons -->
    <FloatingIcons animation="spaceship" targetId="logo-wrapper" />
  </div>

  <div
    class="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pb-32 pt-16"
  >
    <!-- Top Header (Edge-to-Edge) -->
    <div
      class="absolute top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between"
    >
      <!-- Left Navigation -->
      <nav class="flex items-center gap-2 sm:gap-6">
        <a
          href="/how"
          class="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >How</a
        >
        <a
          href="/docs"
          class="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >Docs</a
        >
        <a
          href="/roadmap"
          class="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >Roadmap</a
        >
        <a
          href="/faq"
          class="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >FAQ</a
        >
      </nav>

      <!-- Right: Beta Badge -->
      <div class="relative group">
        <div
          class="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/10 border border-green-500/30 rounded-full cursor-help hover:bg-green-500/20 transition-colors"
        >
          <span
            class="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"
          ></span>
          <span class="text-[10px] sm:text-xs font-medium text-green-400"
            >Mainnet</span
          >
        </div>
        <!-- Tooltip -->
        <div
          class="absolute right-0 top-full mt-2 w-48 sm:w-64 px-3 py-2 bg-zinc-900 border border-green-500/40 rounded-lg text-xs text-zinc-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-right sm:text-left"
        >
          GlianaPay runs on Solana Mainnet. Real SOL is used for tips. Make sure
          your wallet is set to Mainnet.
        </div>
      </div>
    </div>

    <!-- Logo & Title -->
    <div class="text-center mb-12" id="logo-container">
      <!-- Animated Logo -->
      <div class="relative inline-block mb-6" id="logo-wrapper">
        <img
          src="/logo.svg"
          alt="GlianaPay"
          class="w-24 h-24 bg-transparent rounded-3xl shadow-2xl shadow-purple-500/40 animate-pulse-glow"
        />
        <!-- Sparkles -->
        <div class="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
        <div
          class="absolute -bottom-1 -left-1 text-xl animate-bounce"
          style="animation-delay: 0.5s;"
        >
          ⭐
        </div>
      </div>

      <h1 class="text-5xl md:text-7xl font-bold mb-4">
        <span
          class="text-gradient bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient"
        >
          GlianaPay
        </span>
      </h1>

      <p class="text-xl text-zinc-400 max-w-lg mx-auto mb-2">
        Web3 Tipping Platform for Streamers
      </p>
      <p class="text-zinc-500">Accept SOL tips with real-time OBS alerts</p>
    </div>

    <!-- Search Form -->
    <form on:submit={handleSubmit} class="w-full max-w-md">
      <div class="relative group">
        <div
          class="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"
        ></div>
        <input
          type="text"
          bind:value={slug}
          placeholder="Enter streamer slug..."
          class="relative w-full px-6 py-4 bg-zinc-900/90 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all text-center text-lg backdrop-blur"
        />
      </div>

      <button
        type="submit"
        class="mt-6 w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30"
      >
        <span class="inline-flex items-center gap-2">
          <span>Go to Streamer</span>
          <span>→</span>
        </span>
      </button>
    </form>

    <!-- Features -->
    <h2 class="sr-only">Features</h2>
    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
      <div
        class="glass-card p-5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors"
      >
        <div class="mb-3">
          <svg
            class="w-8 h-8 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 class="font-semibold text-white mb-1">Instant</h3>
        <p class="text-sm text-zinc-500">Receive tips in seconds</p>
      </div>
      <div
        class="glass-card p-5 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-colors"
      >
        <div class="mb-3">
          <svg
            class="w-8 h-8 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h3 class="font-semibold text-white mb-1">Web3 Native</h3>
        <p class="text-sm text-zinc-500">Powered by Solana</p>
      </div>
      <div
        class="glass-card p-5 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-colors"
      >
        <div class="mb-3">
          <svg
            class="w-8 h-8 text-pink-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 class="font-semibold text-white mb-1">OBS Alerts</h3>
        <p class="text-sm text-zinc-500">Real-time overlays</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="mt-12 flex flex-col items-center gap-4">
      {#if isLoggedIn}
        <a
          href="/dashboard"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all"
        >
          Go to Dashboard
        </a>
      {:else}
        <a
          href="/login"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all"
        >
          Start Tipping Page
        </a>
        <p class="text-sm text-zinc-500 max-w-md text-center">
          Connect your wallet to create your tipping page. Share your link and
          start receiving SOL tips with live OBS alerts.
        </p>
      {/if}
    </div>

    <!-- Footer -->
    <div
      class="absolute bottom-6 left-0 right-0 flex justify-center items-center px-4"
    >
      <a
        href="https://glianalabs.com"
        target="_blank"
        class="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <img
          src="/gl-logo.svg"
          alt="gliana"
          class="h-5 w-auto"
          width="80"
          height="20"
        />
        <span class="text-zinc-600 text-xs">
          &copy; {currentYear} by Gliana Labs
        </span>
      </a>
    </div>
  </div>
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

  @keyframes pulse-glow {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
    }
    50% {
      box-shadow: 0 0 40px rgba(236, 72, 153, 0.6);
    }
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .glass-card {
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(12px);
  }
</style>
