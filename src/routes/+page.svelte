<script lang="ts">
  let slug = '';

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (slug.trim()) {
      window.location.href = `/${slug.trim()}`;
    }
  }
</script>

<svelte:head>
  <title>GlianaPay - Web3 Tipping for Streamers</title>
</svelte:head>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden">
  <!-- Animated Background -->
  <div class="absolute inset-0 overflow-hidden">
    <!-- Gradient orbs -->
    <div class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl"></div>

    <!-- Grid pattern -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
  </div>

  <!-- Floating crypto icons -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-20 left-[10%] text-4xl opacity-20 float">🪙</div>
    <div class="absolute top-40 right-[15%] text-3xl opacity-20 float" style="animation-delay: 0.5s;">🚀</div>
    <div class="absolute bottom-32 left-[20%] text-3xl opacity-20 float" style="animation-delay: 1s;">💎</div>
    <div class="absolute bottom-20 right-[10%] text-4xl opacity-20 float" style="animation-delay: 1.5s;">⚡</div>
  </div>

  <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
    <!-- Logo & Title -->
    <div class="text-center mb-12">
      <!-- Animated Logo -->
      <div class="relative inline-block mb-6">
        <img
          src="/logo.svg"
          alt="GlianaPay"
          class="w-24 h-24 rounded-3xl shadow-2xl shadow-purple-500/40 animate-pulse-glow"
        />
        <!-- Sparkles -->
        <div class="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
        <div class="absolute -bottom-1 -left-1 text-xl animate-bounce" style="animation-delay: 0.5s;">⭐</div>
      </div>

      <h1 class="text-5xl md:text-7xl font-bold mb-4">
        <span class="text-gradient bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
          GlianaPay
        </span>
      </h1>

      <p class="text-xl text-zinc-400 max-w-lg mx-auto mb-2">
        Web3 Tipping Platform for Streamers
      </p>
      <p class="text-zinc-500">
        Accept SOL tips with real-time OBS alerts
      </p>
    </div>

    <!-- Search Form -->
    <form on:submit={handleSubmit} class="w-full max-w-md">
      <div class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
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
    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
      <div class="glass-card p-5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors">
        <div class="mb-3">
          <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="font-semibold text-white mb-1">Instant</h3>
        <p class="text-sm text-zinc-500">Receive tips in seconds</p>
      </div>
      <div class="glass-card p-5 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-colors">
        <div class="mb-3">
          <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
          </svg>
        </div>
        <h3 class="font-semibold text-white mb-1">Web3 Native</h3>
        <p class="text-sm text-zinc-500">Powered by Solana</p>
      </div>
      <div class="glass-card p-5 rounded-2xl border border-white/10 hover:border-pink-500/30 transition-colors">
        <div class="mb-3">
          <svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="font-semibold text-white mb-1">OBS Alerts</h3>
        <p class="text-sm text-zinc-500">Real-time overlays</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="mt-12">
      <a
        href="/login"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all"
      >
        Start Tipping Page
      </a>
    </div>

    <!-- Footer -->
    <script>
      const currentYear = new Date().getFullYear();
    </script>
    <div class="absolute bottom-6 left-0 right-0 flex justify-center">
      <div class="flex items-center gap-2">
        <img src="/logo.svg" alt="gliana" class="h-5 w-auto" />
        <span class="text-zinc-600 text-xs">
          &copy; {currentYear} gliana
        </span>
      </div>
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

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .float {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
    50% { box-shadow: 0 0 40px rgba(236, 72, 153, 0.6); }
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .glass-card {
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(12px);
  }
</style>
