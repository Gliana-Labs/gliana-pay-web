<script lang="ts">
  import { slide } from "svelte/transition";
  let openIndex: number | null = null;

  const faqs = [
    {
      question: "What is GlianaPay?",
      answer:
        "GlianaPay is a Web3 tipping platform built on Solana that lets streamers accept SOL tips directly to their wallet with real-time OBS stream alerts — no middleman, no payout delays, no chargebacks.",
    },
    {
      question: "Why GlianaPay?",
      answer:
        "Here's the hard truth about traditional platforms: they charge a $0.30–$0.49 flat fee + 2.9–3.5% processing fee + 0–10% platform fee + 2.5–3% fiat conversion. That's 6–56% gone per tip! GlianaPay? Zero platform fees, zero conversion — just ~$0.0002 in Solana gas.\n\n<div class=\"fee-table\"><table><thead><tr><th>Tip Amount</th><th>StreamElements*</th><th>StreamLabs*</th><th>Patreon*</th><th>GlianaPay</th></tr></thead><tbody><tr><td>$1</td><td>$0.36 (36%)</td><td>$0.56 (56%)</td><td>$0.28 (28%)</td><td>$0.0002</td></tr><tr><td>$5</td><td>$0.59 (12%)</td><td>$0.80 (16%)</td><td>$1.09 (22%)</td><td>$0.0002</td></tr><tr><td>$10</td><td>$0.87 (9%)</td><td>$1.12 (11%)</td><td>$1.58 (16%)</td><td>$0.0002</td></tr><tr><td>$100</td><td>$5.95 (6%)</td><td>$6.74 (7%)</td><td>$13.05 (13%)</td><td>$0.0002</td></tr><tr><td>$1,000</td><td>$56.70 (6%)</td><td>$62.90 (6%)</td><td>$127.80 (13%)</td><td>$0.0005</td></tr><tr><td>$10,000</td><td>$565.20 (6%)</td><td>$625.40 (6%)</td><td>$1,275.30 (13%)</td><td>$0.001</td></tr></tbody></table></div>\n\n<div class=\"fee-notes\">* All fees are per tip. Includes: flat fee ($0.30–$0.49) + processing (2.9–3.5%) + platform (0–10%) + fiat conversion (2.75%). GlianaPay fees under $0.001 per tip — you keep 99.9%+.</div>",
    },
    {
      question: "Which wallets are supported?",
      answer:
        "Currently, GlianaPay supports Phantom and Solflare — the two most popular Solana wallets. On mobile, make sure to open your tip or login link inside the wallet's built-in browser for the best experience. More wallet support is planned.",
    },
    {
      question: "Is this on mainnet or devnet?",
      answer:
        "GlianaPay is currently in Beta and runs on Solana Devnet, which uses test SOL with no real monetary value. Make sure your wallet is set to Devnet mode before connecting. Mainnet support is on the roadmap.",
    },
    {
      question: "How do OBS alerts work?",
      answer:
        "Your dashboard provides a unique Browser Source URL. Paste it into OBS as a Browser Source. Whenever a tip comes in, the overlay automatically animates on-screen showing the tipper's name, amount, and message in real-time — no refresh needed.",
    },
    {
      question:
        "Can I use GlianaPay with Twitch, YouTube, Kick, or other platforms?",
      answer:
        "Yes! GlianaPay works with any streaming platform. Just share your glianapay.com/your-slug link in your chat, stream description, or panels. The OBS overlay is compatible with OBS Studio, Streamlabs OBS, and any software that supports Browser Sources.",
    },
    {
      question: "Is it safe?",
      answer:
        "Your funds are secured by your own wallet's private keys — we never store or access them. GlianaPay only reads your public wallet address to route tips. Solana's on-chain architecture makes transactions transparent and verifiable by anyone.",
    },
  ];

  function toggle(index: number) {
    openIndex = openIndex === index ? null : index;
  }
</script>

<svelte:head>
  <title>FAQ - GlianaPay</title>
  <meta
    name="description"
    content="Frequently asked questions about GlianaPay. Learn how to accept Solana tips, set up OBS alerts, and start monetizing your stream with cryptocurrency."
  />
  <meta
    name="keywords"
    content="FAQ, Solana tipping, crypto donations, streamer tips, OBS alerts, cryptocurrency, Web3, FAQ"
  />

  <!-- Open Graph -->
  <meta
    property="og:title"
    content="FAQ - GlianaPay | Web3 Tipping for Streamers"
  />
  <meta
    property="og:description"
    content="Frequently asked questions about accepting Solana tips and crypto donations as a streamer."
  />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />

  <!-- Twitter -->
  <meta
    name="twitter:title"
    content="FAQ - GlianaPay | Web3 Tipping for Streamers"
  />
  <meta
    name="twitter:description"
    content="Frequently asked questions about accepting Solana tips and crypto donations as a streamer."
  />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />

  <link rel="alternate" hreflang="en" href="https://glianapay.com/faq" />
</svelte:head>

<div
  class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] flex flex-col overflow-x-hidden overflow-y-scroll"
>
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

  <div class="relative z-10 max-w-3xl w-full mx-auto px-4 pt-0 pb-8 flex-1">
    <div class="text-center mb-12">
      <h1 class="text-3xl md:text-4xl font-bold mb-4">
        <span
          class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
        >
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
        <div
          class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <button
            class="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition-colors"
            on:click={() => toggle(index)}
          >
            <span class="font-medium text-lg min-w-0">{faq.question}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 text-zinc-400 transition-transform duration-200 {openIndex ===
              index
                ? 'rotate-180'
                : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {#if openIndex === index}
            <div
              transition:slide={{ duration: 300 }}
              class="px-6 pb-5 text-zinc-300 leading-relaxed w-full break-words"
            >
              {@html faq.answer}
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      </a>
      <a
        href="mailto:support@glianapay.com"
        class="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-medium transition-all"
      >
        Email Support
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          ></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </a>
    </div>
  </div>

  <!-- Footer placeholder -->
  <div class="h-6"></div>
</div>

<style>
  :global(.fee-table) {
    overflow-x: auto;
    margin: 1.5rem auto;
    max-width: 100%;
  }
  :global(.fee-table table) {
    width: 100%;
    min-width: 500px;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.85rem;
    border: 1px solid #52525b;
    border-radius: 8px;
    overflow: hidden;
  }
  :global(.fee-table th),
  :global(.fee-table td) {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid #3f3f46;
    border-right: 1px solid #3f3f46;
    text-align: center;
    color: #ffffff;
  }
  :global(.fee-table th:last-child),
  :global(.fee-table td:last-child) {
    border-right: none;
  }
  :global(.fee-table tr:last-child td) {
    border-bottom: none;
  }
  :global(.fee-table th) {
    background: #27272a;
    font-weight: 600;
  }
  :global(.fee-table td) {
    background: #18181b;
  }
  :global(.fee-table tr:nth-child(even) td) {
    background: #1f1f23;
  }
  :global(.fee-table td:last-child) {
    color: #c084fc;
    font-weight: 600;
  }
  :global(.fee-notes) {
    font-size: 0.7rem;
    color: #71717a;
    margin-top: 0.5rem;
    text-align: center;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }
</style>
