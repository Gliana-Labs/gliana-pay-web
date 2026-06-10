<script lang="ts">
  import FloatingIcons from "$lib/components/FloatingIcons.svelte";
  import { onMount } from "svelte";
  import { PUBLIC_URL } from "$lib/config";

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
  <title>GlianaPay — Web3 Tipping Platform for Streamers | Accept SOL & USDC Tips</title>
  <meta
    name="description"
    content="GlianaPay is the easiest way for streamers to accept SOL and USDC tips with real-time OBS alerts. Zero platform fees, instant payouts, powered by Solana."
  />
  <meta
    name="keywords"
    content="GlianaPay, gliana pay, streamer tips, Solana tips, USDC tips, crypto donations, OBS overlay, live streaming, Web3 payments, creator monetization"
  />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{PUBLIC_URL}/" />
  <meta property="og:title" content="GlianaPay — Web3 Tipping for Streamers" />
  <meta
    property="og:description"
    content="Accept SOL and USDC tips with real-time OBS alerts. Zero fees, instant payouts."
  />
  <meta property="og:image" content="{PUBLIC_URL}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="GlianaPay" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="GlianaPay — Web3 Tipping for Streamers" />
  <meta
    name="twitter:description"
    content="Accept SOL and USDC tips with real-time OBS alerts. Zero fees, instant payouts."
  />
  <meta name="twitter:image" content="{PUBLIC_URL}/og-image.png" />
  <meta name="twitter:site" content="@glianapay" />
  <meta name="twitter:creator" content="@glianapay" />

  <!-- Additional SEO -->
  <link rel="alternate" hreflang="en" href="{PUBLIC_URL}/" />

  <!-- JSON-LD Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "GlianaPay",
    "url": "https://glianapay.com",
    "description": "Web3 tipping platform for streamers. Accept SOL and USDC tips with real-time OBS alerts.",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Gliana Labs",
      "url": "https://glianalabs.com"
    }
  })}</script>`}
</svelte:head>

<div
  class="min-h-[100dvh] bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden"
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
    class="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-4 pb-32 pt-24"
  >
    <!-- Top Header (Edge-to-Edge) -->
    <div
      class="absolute top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between"
    >
      <!-- Left: brand + nav -->
      <div class="flex items-center gap-4 sm:gap-8">
        <a href="/" class="flex items-center gap-2 group">
          <img
            src="/logo.svg"
            alt="GlianaPay"
            class="w-8 h-8 transition-transform group-hover:scale-110"
            width="32"
            height="32"
          />
          <span class="font-bold tracking-tight hidden sm:inline">GlianaPay</span>
        </a>
        <nav class="flex items-center gap-2 sm:gap-5">
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
            class="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:inline"
            >Roadmap</a
          >
          <a
            href="/faq"
            class="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >FAQ</a
          >
        </nav>
      </div>

      <!-- Right: primary account CTA -->
      {#if isLoggedIn}
        <a
          href="/dashboard"
          class="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all"
          >Dashboard</a
        >
      {:else}
        <a
          href="/login"
          class="px-4 py-2 text-sm font-semibold rounded-xl border border-white/15 text-zinc-200 hover:border-purple-500/50 hover:text-white transition-all"
          >Log in</a
        >
      {/if}
    </div>

    <!-- Live badge -->
    <div
      class="reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur mb-7"
      style="animation-delay: 0ms;"
    >
      <span class="relative flex h-2 w-2">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
        ></span>
        <span class="relative inline-flex h-2 w-2 rounded-full bg-green-400"
        ></span>
      </span>
      Live on Solana · Zero platform fees
    </div>

    <!-- Logo & Title -->
    <div class="text-center mb-10" id="logo-container">
      <!-- Animated Logo -->
      <div class="relative inline-block mb-6 reveal" id="logo-wrapper" style="animation-delay: 60ms;">
        <div
          class="absolute inset-0 -z-10 blur-2xl bg-gradient-to-br from-cyan-500/40 via-purple-500/40 to-pink-500/40 rounded-full scale-90"
        ></div>
        <img
          src="/logo.svg"
          alt="GlianaPay"
          class="w-24 h-24 bg-transparent animate-float-soft"
          width="96"
          height="96"
        />
      </div>

      <h1
        class="reveal text-5xl md:text-7xl font-bold mb-5 tracking-tight"
        style="animation-delay: 120ms;"
      >
        <span
          class="text-gradient bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient"
        >
          Get paid to stream.
        </span>
      </h1>

      <p
        class="reveal text-lg md:text-xl text-zinc-400 max-w-xl mx-auto"
        style="animation-delay: 180ms;"
      >
        Accept SOL &amp; USDC tips with real-time OBS alerts. Instant payouts,
        zero platform fees.
      </p>
    </div>

    <!-- Tipper search -->
    <div class="reveal w-full max-w-md" style="animation-delay: 240ms;">
      <p class="text-center text-xs uppercase tracking-[0.18em] text-zinc-500 mb-3">
        Tipping a creator? Find their page
      </p>
      <form on:submit={handleSubmit}>
        <div class="relative group">
          <div
            class="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 group-focus-within:opacity-70 transition-opacity duration-300"
          ></div>
          <div class="relative flex items-center gap-2 bg-zinc-900/90 border border-white/10 rounded-2xl p-1.5 backdrop-blur">
            <span class="pl-3 text-zinc-500 text-sm font-mono select-none hidden sm:inline"
              >glianapay.com/tip/</span
            >
            <input
              type="text"
              bind:value={slug}
              placeholder="creator-name"
              aria-label="Creator page name"
              class="flex-1 min-w-0 px-3 sm:px-1 py-3 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base"
            />
            <button
              type="submit"
              aria-label="Go to creator page"
              class="shrink-0 px-4 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 rounded-xl font-semibold text-white transition-all active:scale-95"
            >
              Go →
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Features -->
    <h2 class="sr-only">Features</h2>
    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
      <div
        class="reveal feature-card group p-6 rounded-2xl"
        style="animation-delay: 300ms;"
      >
        <img
          src="/3dicons-wallet-dynamic-color.webp"
          alt=""
          class="w-14 h-14 mb-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
          width="56"
          height="56"
          loading="lazy"
        />
        <h3 class="font-semibold text-white mb-1">Instant payouts</h3>
        <p class="text-sm text-zinc-500">
          SOL &amp; USDC land in your wallet in seconds. No middleman holding
          your money.
        </p>
      </div>
      <div
        class="reveal feature-card group p-6 rounded-2xl"
        style="animation-delay: 360ms;"
      >
        <img
          src="/3dicons-video-cam-dynamic-color.webp"
          alt=""
          class="w-14 h-14 mb-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
          width="56"
          height="56"
          loading="lazy"
        />
        <h3 class="font-semibold text-white mb-1">Live OBS alerts</h3>
        <p class="text-sm text-zinc-500">
          On-stream popups fire the moment a tip lands. Hype your chat in real
          time.
        </p>
      </div>
      <div
        class="reveal feature-card group p-6 rounded-2xl"
        style="animation-delay: 420ms;"
      >
        <img
          src="/3dicons-dollar-dynamic-color.webp"
          alt=""
          class="w-14 h-14 mb-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
          width="56"
          height="56"
          loading="lazy"
        />
        <h3 class="font-semibold text-white mb-1">Keep 100%</h3>
        <p class="text-sm text-zinc-500">
          Zero platform fees. You only ever pay Solana network gas, which is
          fractions of a cent.
        </p>
      </div>
    </div>

    <!-- CTA -->
    <div class="reveal mt-14 flex flex-col items-center gap-4" style="animation-delay: 480ms;">
      {#if isLoggedIn}
        <a
          href="/dashboard"
          class="inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-purple-500/30"
        >
          Go to Dashboard →
        </a>
      {:else}
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <a
            href="/login"
            class="inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-purple-500/30"
          >
            Start your tip page →
          </a>
          <a
            href="/how"
            class="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-semibold text-zinc-300 border border-white/10 hover:border-white/25 hover:text-white transition-all"
          >
            See how it works
          </a>
        </div>
        <p class="text-sm text-zinc-500 max-w-md text-center">
          Connect your wallet, claim your link, and start receiving tips in under
          a minute.
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

  /* Gentle logo float — calmer than the old pulse-glow + emoji */
  @keyframes float-soft {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  .animate-float-soft {
    animation: float-soft 4s ease-in-out infinite;
  }

  /* Staggered entrance. Global prefers-reduced-motion rule in app.css
     collapses the duration so content snaps to its final (visible) state. */
  @keyframes reveal {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .reveal {
    opacity: 0;
    animation: reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .feature-card {
    background: rgba(17, 17, 19, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    transition:
      border-color 0.3s ease,
      transform 0.3s ease,
      background 0.3s ease;
  }

  .feature-card:hover {
    border-color: rgba(168, 85, 247, 0.4);
    background: rgba(24, 24, 27, 0.7);
    transform: translateY(-2px);
  }
</style>
