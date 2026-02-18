<script lang="ts">
  import FloatingIcons from '$lib/components/FloatingIcons.svelte';

  const currentYear = new Date().getFullYear();
</script>

<svelte:head>
  <title>Documentation - GlianaPay</title>
  <meta name="description" content="Documentation for GlianaPay. Learn how to set up Solana tipping, configure OBS overlays, and accept crypto donations on your stream." />
  <meta name="keywords" content="GlianaPay documentation, Solana tipping docs, OBS overlay setup, crypto donation API, streamer tools" />
</svelte:head>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden">
  <!-- Animated Background -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
  </div>

  <FloatingIcons />

  <div class="relative z-10 min-h-screen px-4 py-16">
    <!-- Back to Home -->
    <a href="/" class="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
      </svg>
      Back to Home
    </a>

    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        <span class="text-gradient bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
          Documentation
        </span>
      </h1>
      <p class="text-lg text-zinc-400 max-w-2xl mx-auto">
        Everything you need to know about GlianaPay
      </p>
    </div>

    <!-- Coming Soon -->
    <div class="max-w-2xl mx-auto">
      <div class="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <div class="mb-6">
          <svg class="w-16 h-16 mx-auto text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold mb-4">Developer Documentation</h2>
        <p class="text-zinc-400 mb-6">
          Full API documentation and integration guides are coming soon. For now, check out our <a href="/how" class="text-purple-400 hover:underline">How to Use</a> guide to get started.
        </p>
        <a
          href="/how"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 rounded-xl font-semibold transition-all"
        >
          Read How-To Guide
        </a>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="max-w-3xl mx-auto mt-12">
      <h3 class="text-xl font-semibold mb-6 text-center">Quick Links</h3>
      <div class="grid md:grid-cols-3 gap-4">
        <a href="/how" class="glass-card p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors text-center">
          <h4 class="font-semibold mb-2">How to Use</h4>
          <p class="text-sm text-zinc-500">Step-by-step guide</p>
        </a>
        <a href="/faq" class="glass-card p-6 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-colors text-center">
          <h4 class="font-semibold mb-2">FAQ</h4>
          <p class="text-sm text-zinc-500">Common questions</p>
        </a>
        <a href="/login" class="glass-card p-6 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-colors text-center">
          <h4 class="font-semibold mb-2">Get Started</h4>
          <p class="text-sm text-zinc-500">Create your page</p>
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-16 text-center">
      <a href="https://glianalabs.com" target="_blank" class="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/gl-logo.svg" alt="gliana" class="h-5 w-auto" />
        <span class="text-zinc-600 text-xs">
          &copy; {currentYear} by Gliana Labs
        </span>
      </a>
    </div>
  </div>
</div>

<style>
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .animate-gradient {
    animation: gradient 3s ease infinite;
  }

  .glass-card {
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(12px);
  }
</style>
