<script lang="ts">
  import FloatingIcons from '$lib/components/FloatingIcons.svelte';

  const currentYear = new Date().getFullYear();
</script>

<svelte:head>
  <title>How to Use - GlianaPay</title>
  <meta name="description" content="Learn how to use GlianaPay to accept SOL tips with real-time OBS alerts. Step-by-step guide for streamers to receive crypto donations." />
  <meta name="keywords" content="how to use GlianaPay, Solana tipping, crypto donations, OBS overlay, streamer tips guide" />
</svelte:head>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden">
  <!-- Animated Background -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
  </div>

  <FloatingIcons />

  <div class="relative z-10 min-h-screen px-4 py-16">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">
        <span class="text-gradient bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
          How to Use GlianaPay
        </span>
      </h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        Accept SOL tips on your stream in just a few simple steps
      </p>
    </div>

    <!-- Steps -->
    <div class="max-w-3xl mx-auto space-y-8">
      <!-- Step 1 -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-lg">
            1
          </div>
          <div>
            <h2 class="text-xl font-semibold mb-2">Create Your Tipping Page</h2>
            <p class="text-zinc-400">
              Go to <a href="/login" class="text-purple-400 hover:underline">/login</a> and connect your Solana wallet (Phantom, Solflare, or Backpack). Choose a unique slug for your page (e.g., your Twitch username).
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-lg">
            2
          </div>
          <div>
            <h2 class="text-xl font-semibold mb-2">Customize Your Settings</h2>
            <p class="text-zinc-400">
              Set your minimum tip amount, customize the alert message, choose an alert sound, and upload a custom avatar. These settings control what your viewers see when they tip.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-lg">
            3
          </div>
          <div>
            <h2 class="text-xl font-semibold mb-2">Add OBS Overlay</h2>
            <p class="text-zinc-400">
              Copy your overlay URL (format: <code class="text-cyan-400">glianapay.com/overlay/your-slug</code>) and add it as a Browser Source in OBS. Resize to fit your layout.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center font-bold text-lg">
            4
          </div>
          <div>
            <h2 class="text-xl font-semibold mb-2">Share Your Link</h2>
            <p class="text-zinc-400">
              Share your tipping page URL (<code class="text-cyan-400">glianapay.com/your-slug</code>) with your viewers. They can tip any amount using their Solana wallet.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="glass-card p-6 rounded-2xl border border-white/10">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-lg">
            5
          </div>
          <div>
            <h2 class="text-xl font-semibold mb-2">Receive Real-Time Alerts</h2>
            <p class="text-zinc-400">
              When someone tips, you'll see a real-time alert on your OBS overlay showing the tipper's name, amount, and message. Alerts stay on screen for 5 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="text-center mt-12">
      <a
        href="/login"
        class="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg shadow-purple-500/30"
      >
        Get Started Now
      </a>
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
