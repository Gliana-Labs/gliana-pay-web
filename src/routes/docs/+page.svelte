<script lang="ts">
  import FloatingIcons from '$lib/components/FloatingIcons.svelte';

  const currentYear = new Date().getFullYear();

  const docs = [
    {
      title: 'Getting Started',
      items: [
        { label: 'Quick Start Guide', href: '#quickstart' },
        { label: 'Wallet Setup', href: '#wallet' },
        { label: 'Creating Your Page', href: '#create' }
      ]
    },
    {
      title: 'Features',
      items: [
        { label: 'OBS Overlay', href: '#overlay' },
        { label: 'Alert Customization', href: '#alerts' },
        { label: 'Tip Settings', href: '#tips' }
      ]
    },
    {
      title: 'Technical',
      items: [
        { label: 'Network & Blockchain', href: '#network' },
        { label: 'Security', href: '#security' },
        { label: 'Troubleshooting', href: '#troubleshoot' }
      ]
    }
  ];
</script>

<svelte:head>
  <title>Documentation - GlianaPay</title>
  <meta name="description" content="Complete documentation for GlianaPay. Learn how to set up Solana tipping, configure OBS overlays, and accept crypto donations on your stream." />
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
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">
        <span class="text-gradient bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
          Documentation
        </span>
      </h1>
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto">
        Everything you need to know about GlianaPay
      </p>
    </div>

    <div class="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
      <!-- Sidebar -->
      <nav class="md:col-span-1">
        <div class="glass-card p-6 rounded-2xl border border-white/10 sticky top-8">
          <h3 class="font-semibold mb-4 text-purple-400">Contents</h3>
          {#each docs as section}
            <div class="mb-4">
              <h4 class="text-sm font-medium text-zinc-300 mb-2">{section.title}</h4>
              <ul class="space-y-1">
                {#each section.items as item}
                  <li>
                    <a href={item.href} class="text-zinc-500 hover:text-cyan-400 transition-colors text-sm">
                      {item.label}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </nav>

      <!-- Content -->
      <div class="md:col-span-2 space-y-8">
        <!-- Getting Started -->
        <section id="quickstart" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Quick Start Guide</h2>
          <div class="space-y-4 text-zinc-400">
            <p>GlianaPay is a Web3 tipping platform that lets streamers accept SOL tips with real-time OBS alerts. Here's how to get started:</p>
            <ol class="list-decimal list-inside space-y-2 ml-2">
              <li>Connect your Solana wallet at <a href="/login" class="text-purple-400 hover:underline">/login</a></li>
              <li>Create your unique tipping page with a custom slug</li>
              <li>Configure your alert settings (minimum amount, sounds, messages)</li>
              <li>Add the overlay to OBS using your unique overlay URL</li>
              <li>Share your tipping link with your audience</li>
            </ol>
          </div>
        </section>

        <section id="wallet" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Wallet Setup</h2>
          <div class="space-y-4 text-zinc-400">
            <p>GlianaPay supports the following Solana wallets:</p>
            <ul class="list-disc list-inside space-y-2 ml-2">
              <li><strong class="text-white">Phantom</strong> - Most popular Solana wallet</li>
              <li><strong class="text-white">Solflare</strong> - Great for staking and DeFi</li>
              <li><strong class="text-white">Backpack</strong> - Advanced trading features</li>
            </ul>
            <p class="mt-4">Make sure your wallet is set to <strong class="text-yellow-400">Devnet</strong> for testing, or <strong class="text-green-400">Mainnet</strong> for real tips.</p>
          </div>
        </section>

        <section id="create" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Creating Your Page</h2>
          <div class="space-y-4 text-zinc-400">
            <p>Your tipping page URL follows this format:</p>
            <code class="block bg-zinc-900 p-3 rounded-lg text-cyan-400">glianapay.com/[your-slug]</code>
            <p>The slug can contain letters, numbers, and hyphens. Choose something memorable and unique - ideally matching your Twitch or YouTube username.</p>
          </div>
        </section>

        <!-- Features -->
        <section id="overlay" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">OBS Overlay</h2>
          <div class="space-y-4 text-zinc-400">
            <p>The OBS overlay displays real-time tip alerts. To add it to OBS:</p>
            <ol class="list-decimal list-inside space-y-2 ml-2">
              <li>Copy your overlay URL from your dashboard</li>
              <li>In OBS, add a new "Browser" source</li>
              <li>Paste the URL and set width to 800, height to 200</li>
              <li>Position it in your stream layout</li>
            </ol>
            <p class="mt-4">Overlay URL format:</p>
            <code class="block bg-zinc-900 p-3 rounded-lg text-cyan-400">glianapay.com/overlay/[your-slug]</code>
          </div>
        </section>

        <section id="alerts" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Alert Customization</h2>
          <div class="space-y-4 text-zinc-400">
            <p>Customize how tips appear with these settings:</p>
            <ul class="list-disc list-inside space-y-2 ml-2">
              <li><strong class="text-white">Alert Sound</strong> - Choose from preset sounds or use a custom URL</li>
              <li><strong class="text-white">Avatar</strong> - Upload a custom profile picture</li>
              <li><strong class="text-white">Message Template</strong> - Customize the alert text with variables like {name} and {amount}</li>
            </ul>
          </div>
        </section>

        <section id="tips" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Tip Settings</h2>
          <div class="space-y-4 text-zinc-400">
            <p>Configure tip接收settings in your dashboard:</p>
            <ul class="list-disc list-inside space-y-2 ml-2">
              <li><strong class="text-white">Minimum Amount</strong> - Set the smallest tip you'll accept (default: 0.001 SOL)</li>
              <li><strong class="text-white">Alert Duration</strong> - How long alerts stay on screen (default: 5 seconds)</li>
              <li><strong class="text-white">Wallet Address</strong> - Your Solana address for receiving tips</li>
            </ul>
          </div>
        </section>

        <!-- Technical -->
        <section id="network" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Network & Blockchain</h2>
          <div class="space-y-4 text-zinc-400">
            <p>GlianaPay currently operates on:</p>
            <ul class="list-disc list-inside space-y-2 ml-2">
              <li><strong class="text-yellow-400">Devnet</strong> - For testing (no real value)</li>
              <li><strong class="text-green-400">Mainnet</strong> - For real tips (coming soon)</li>
            </ul>
            <p class="mt-4">All transactions are processed on the Solana blockchain, ensuring instant confirmation and minimal fees.</p>
          </div>
        </section>

        <section id="security" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Security</h2>
          <div class="space-y-4 text-zinc-400">
            <p>GlianaPay prioritizes security:</p>
            <ul class="list-disc list-inside space-y-2 ml-2">
              <li>No private keys stored - only wallet connection via read-only access</li>
              <li>Direct peer-to-peer transactions on Solana blockchain</li>
              <li>All settings stored securely in Cloudflare Workers</li>
              <li>Uses industry-standard encryption</li>
            </ul>
          </div>
        </section>

        <section id="troubleshoot" class="glass-card p-6 rounded-2xl border border-white/10">
          <h2 class="text-2xl font-bold mb-4">Troubleshooting</h2>
          <div class="space-y-4 text-zinc-400">
            <p><strong class="text-white">Wallet not connecting?</strong> Make sure you have a supported wallet installed and it's set to the correct network.</p>
            <p><strong class="text-white">Overlay not showing alerts?</strong> Check that the overlay URL is correct and your browser source is set to "Interact" mode.</p>
            <p><strong class="text-white">Tips not arriving?</strong> Verify your wallet address in the dashboard and check the blockchain explorer.</p>
          </div>
        </section>
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
