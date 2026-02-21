<script lang="ts">
  import { slide } from 'svelte/transition';
  let openIndex: number | null = null;

  const faqs = [
    {
      question: "What is GlianaPay?",
      answer: "GlianaPay is a Web3 tipping platform that allows streamers to accept Solana (SOL) tips with real-time OBS alerts. It's the easiest way to receive cryptocurrency donations during live streams."
    },
    {
      question: "How do I start receiving tips?",
      answer: "Simply create an account, connect your Solana wallet, and share your unique tip page URL with your viewers. You'll receive instant notifications whenever someone sends you a tip."
    },
    {
      question: "Is GlianaPay free to use?",
      answer: "Yes, GlianaPay is free to sign up and use. We don't charge any setup fees or monthly fees. Transaction fees are minimal and go to the Solana network, not GlianaPay."
    },
    {
      question: "What wallets are supported?",
      answer: "GlianaPay supports all Solana-compatible wallets including Phantom and Solflare. Simply connect your wallet to get started."
    },
    {
      question: "How do OBS alerts work?",
      answer: "When you receive a tip, GlianaPay sends a real-time alert that can be displayed in your OBS stream. You can customize the alert appearance in your dashboard."
    },
    {
      question: "How do I cash out my tips?",
      answer: "Your tips are sent directly to your connected Solana wallet. You can hold them as SOL, swap to other tokens, or transfer to an exchange to cash out to fiat."
    },
    {
      question: "Is it safe to use?",
      answer: "Yes, GlianaPay is built on the Solana blockchain, one of the most secure and fast blockchain networks. Your funds are secured by your wallet's private keys, never stored on our servers."
    },
    {
      question: "Can I use GlianaPay with Twitch, YouTube, or TikTok?",
      answer: "Yes! GlianaPay works with any streaming platform. Simply share your tip page link in your stream, social media, or bio. The OBS overlay works with any streaming software."
    }
  ];

  function toggle(index: number) {
    openIndex = openIndex === index ? null : index;
  }
</script>

<svelte:head>
  <title>FAQ - GlianaPay</title>
  <meta name="description" content="Frequently asked questions about GlianaPay. Learn how to accept Solana tips, set up OBS alerts, and start monetizing your stream with cryptocurrency." />
  <meta name="keywords" content="FAQ, Solana tipping, crypto donations, streamer tips, OBS alerts, cryptocurrency, Web3, FAQ" />

  <!-- Open Graph -->
  <meta property="og:title" content="FAQ - GlianaPay | Web3 Tipping for Streamers" />
  <meta property="og:description" content="Frequently asked questions about accepting Solana tips and crypto donations as a streamer." />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />

  <!-- Twitter -->
  <meta name="twitter:title" content="FAQ - GlianaPay | Web3 Tipping for Streamers" />
  <meta name="twitter:description" content="Frequently asked questions about accepting Solana tips and crypto donations as a streamer." />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />

  <link rel="alternate" hreflang="en" href="https://glianapay.com/faq" />
</svelte:head>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] flex flex-col">
  <!-- Animated Background -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
  </div>

  <!-- Header (Edge-to-Edge) -->
  <div class="relative z-10 w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
      <img src="/logo.svg" alt="GlianaPay" class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-purple-500/20" />
      <span class="font-bold text-sm sm:text-base md:text-lg tracking-wide hidden sm:inline">GlianaPay</span>
    </a>
    <a href="/" class="text-zinc-400 hover:text-white text-sm font-medium transition-colors">← Back</a>
  </div>

  <div class="relative z-10 max-w-3xl mx-auto px-4 pt-4 sm:pt-6 pb-8 flex-1">
    <div class="text-center mb-12">
      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Frequently Asked Questions
        </span>
      </h1>
      <p class="text-zinc-400 text-base max-w-xl mx-auto">
        Everything you need to know about receiving crypto tips on your stream
      </p>
    </div>

    <!-- FAQ Items -->
    <div class="space-y-4">
      {#each faqs as faq, index}
        <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <button
            class="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition-colors"
            on:click={() => toggle(index)}
          >
            <span class="font-medium text-lg">{faq.question}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 text-zinc-400 transition-transform duration-200 {openIndex === index ? 'rotate-180' : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {#if openIndex === index}
            <div transition:slide={{ duration: 300 }} class="px-6 pb-5 text-zinc-300 leading-relaxed">
              {faq.answer}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- CTA -->
    <div class="mt-12 text-center space-y-3">
      <p class="text-zinc-400 mb-4">Still have questions?</p>
      <a
        href="https://twitter.com/glianalabs"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 rounded-lg font-medium transition-all"
      >
        Contact Us on Twitter
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <a
        href="mailto:support@glianapay.com"
        class="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-medium transition-all"
      >
        Email Support
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </a>
    </div>
  </div>

  <!-- Footer placeholder -->
  <div class="h-6"></div>
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }

  .float {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
</style>
