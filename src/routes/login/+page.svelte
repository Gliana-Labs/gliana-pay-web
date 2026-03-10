<script lang="ts">
  import { onMount } from "svelte";
  import { walletStore } from "@aztemi/svelte-on-solana-wallet-adapter-core";
  import { WalletMultiButton } from "@aztemi/svelte-on-solana-wallet-adapter-ui";
  import { signAuthMessage } from "$lib/wallet-helpers";
  import { WORKER_URL } from "$lib/config";

  // Simple state
  let mounted = false;
  let loading = false;
  let error = "";
  let name = "";
  let slug = "";
  let hasExistingAccount = false;
  let isVerified = false;

  // Turnstile
  let turnstileToken = "";
  let turnstileContainer: HTMLDivElement;
  let turnstileWidgetId: string | null = null;
  const TURNSTILE_SITE_KEY = "0x4AAAAAACd6patp0WteLo73";

  // ============ REACTIVE WALLET STATE ============

  // Track wallet address reactively from walletStore
  $: walletAddress = $walletStore?.publicKey?.toBase58() || "";
  $: connected = !!$walletStore?.connected;

  // When wallet connects, check for existing user
  $: if (connected && walletAddress && mounted) {
    checkExistingUser();
  }

  // ============ WALLET FUNCTIONS ============

  // Verify wallet ownership with message signing
  async function verifyOwnership() {
    if (!walletAddress) {
      error = "Wallet not connected. Please reconnect.";
      return;
    }

    loading = true;
    error = "";

    try {
      const timestamp = Date.now();
      const message = `Login to GlianaPay at ${timestamp}`;

      const result = await signAuthMessage(message);

      if (!result) {
        error = "Signature failed. Please try again.";
        loading = false;
        return;
      }

      // Send to backend for verification
      const response = await fetch(`${WORKER_URL}/api/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          message: result.message,
          signature: result.signature,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const data = await response.json();

      if (data.verified) {
        isVerified = true;
        if (data.streamer) {
          name = data.streamer.name;
          slug = data.streamer.slug;
        }
        saveSession();
        window.location.replace("/dashboard");
      } else {
        error = data.error || "Verification failed. Please try again.";
      }
    } catch (e: any) {
      error = e.message || "Failed to verify ownership";
    } finally {
      loading = false;
    }
  }

  // Disconnect wallet
  async function handleDisconnect() {
    try {
      await $walletStore.disconnect();
    } catch {}
    isVerified = false;
    name = "";
    slug = "";
    hasExistingAccount = false;
    localStorage.removeItem("gliana_session");
    sessionStorage.setItem("gliana_just_logged_out", "1");
  }

  // ============ USER FUNCTIONS ============

  async function checkExistingUser() {
    if (!walletAddress) return;

    try {
      const response = await fetch(
        `${WORKER_URL}/api/streamer/wallet/${walletAddress}`,
      );
      if (response.ok) {
        const data = await response.json();
        name = data.streamer.name;
        slug = data.streamer.slug;
        hasExistingAccount = true;
      } else {
        hasExistingAccount = false;
      }
    } catch {
      hasExistingAccount = false;
    }
  }

  // Register new user
  async function register() {
    if (!name || !slug) {
      error = "Please fill in all fields";
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
      error = "URL can only contain letters, numbers, and hyphens";
      return;
    }

    if (slug.length < 3 || slug.length > 30) {
      error = "URL must be 3-30 characters";
      return;
    }

    loading = true;
    error = "";

    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          name,
          slug,
          turnstile_token: turnstileToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create");
      }

      // Now verify ownership before going to dashboard
      await verifyOwnership();
    } catch (e: any) {
      error = e.message || "Failed to register";
      loading = false;
    }
  }

  // Session management
  function saveSession() {
    localStorage.setItem(
      "gliana_session",
      JSON.stringify({
        walletAddress,
        name,
        slug,
        walletName: $walletStore?.wallet?.adapter?.name || "Wallet",
      }),
    );
  }

  function loadSession() {
    const saved = localStorage.getItem("gliana_session");
    if (saved) {
      const session = JSON.parse(saved);
      if (session.name && session.slug) {
        window.location.replace("/dashboard");
      }
    }
  }

  // Turnstile
  function loadTurnstile() {
    if (!turnstileContainer || !(window as any).turnstile) return;

    if (turnstileWidgetId) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId);
      } catch {}
    }

    turnstileWidgetId = (window as any).turnstile.render(turnstileContainer, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        turnstileToken = token;
      },
    });
  }

  function initTurnstile() {
    if (typeof window === "undefined") return;

    (window as any).turnstileCallback = (token: string) => {
      turnstileToken = token;
    };

    if ((window as any).turnstile) {
      loadTurnstile();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.onload = loadTurnstile;
      document.head.appendChild(script);
    }
  }

  // ============ LIFECYCLE ============

  onMount(() => {
    mounted = true;
    sessionStorage.removeItem("gliana_just_logged_out");
    loadSession();

    // Load Turnstile when form becomes visible
    const checkTurnstile = setInterval(() => {
      if (
        connected &&
        !hasExistingAccount &&
        turnstileContainer &&
        !(window as any).turnstile
      ) {
        initTurnstile();
      }
      if (connected) clearInterval(checkTurnstile);
    }, 100);
  });
</script>

{#if !mounted}
  <div class="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
    <div
      class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"
    ></div>
  </div>
{:else}
  <div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] flex flex-col">
    <!-- Background -->
    <div class="fixed inset-0 overflow-hidden">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"
      ></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"
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

    <div class="relative z-10 max-w-xl mx-auto px-4 pt-12 md:pt-24 pb-8 flex-1">
      <!-- Beta Badge -->
      <div class="flex justify-center mb-4">
        <div
          class="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full"
        >
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span class="text-xs font-medium text-green-400">Mainnet</span>
        </div>
      </div>
      <p class="text-xs text-green-400/70 text-center mb-4">
        Make sure your wallet is set to Mainnet
      </p>

      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gradient">Streamer Login</h1>
        <p class="text-zinc-400 mt-2">
          Connect wallet to manage your tipping page
        </p>
      </div>

      <div class="glass-card rounded-2xl p-6 border border-white/10">
        {#if !connected}
          <!-- Connect Wallet via Wallet Adapter -->
          <div class="space-y-3 flex flex-col items-center">
            <p class="text-sm text-zinc-400 mb-2">Select your wallet to continue</p>
            <WalletMultiButton />
          </div>

          <div
            class="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-left sm:hidden"
          >
            <p class="text-xs font-medium text-purple-300 mb-1">Mobile?</p>
            <p class="text-xs text-zinc-400">
              Open this page in your wallet's in-app browser for the best
              experience.
            </p>
          </div>
        {:else}
          <!-- Connected -->
          <div
            class="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-400 text-sm">✓ Wallet connected</p>
                <p class="font-mono text-xs mt-1 text-zinc-400">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <button
                on:click={handleDisconnect}
                class="text-xs text-red-400 hover:text-red-300"
                >Disconnect</button
              >
            </div>
          </div>

          <!-- Form -->
          {#if !hasExistingAccount}
            <div class="space-y-4">
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-zinc-300 mb-2"
                  >Display Name</label
                >
                <input
                  type="text"
                  id="name"
                  bind:value={name}
                  placeholder="Your Name"
                  class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label
                  for="slug"
                  class="block text-sm font-medium text-zinc-300 mb-2"
                  >Your Page URL</label
                >
                <input
                  type="text"
                  id="slug"
                  bind:value={slug}
                  placeholder="yourname"
                  class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                />
                <p class="text-xs text-zinc-500 mt-1">
                  glianapay.com/tip/{slug || "yourname"}
                </p>
              </div>

              <!-- Turnstile -->
              <div class="flex justify-center">
                <div bind:this={turnstileContainer} class="cf-turnstile"></div>
              </div>

              <button
                on:click={register}
                disabled={loading || !name || !slug}
                class="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 disabled:opacity-50 rounded-xl font-bold transition-all"
              >
                {loading ? "Setting up..." : "Create My Page →"}
              </button>
            </div>
          {:else}
            <!-- Existing user - must verify ownership first -->
            <button
              on:click={verifyOwnership}
              disabled={loading}
              class="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 disabled:opacity-50 rounded-xl font-bold transition-all"
            >
              {loading ? "Verifying..." : "Login to Dashboard →"}
            </button>
          {/if}
        {/if}

        {#if error}
          <p class="mt-4 text-red-400 text-sm text-center">{error}</p>
        {/if}
      </div>

      <!-- Powered by Solana -->
      <div class="mt-8 flex items-center justify-center gap-2">
        <span class="text-xs text-zinc-500">Powered by</span>
        <img src="/solana-pay/Color=White.svg" alt="Solana" class="h-4" />
      </div>

      <p class="text-center mt-6 text-zinc-500 text-sm">
        <a href="/" class="hover:text-purple-400">← Back to Home</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="relative md:absolute md:bottom-6 left-0 px-4 py-6 md:py-0">
      <a
        href="mailto:support@glianalabs.com?subject=Report Bug"
        class="text-xs text-zinc-500 hover:text-white">Report Bug</a
      >
    </div>
  </div>
{/if}

<style>
  .glass-card {
    background: rgba(17, 17, 19, 0.95);
  }
  @keyframes gradient {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  .text-gradient {
    background-image: linear-gradient(
      135deg,
      #22d3ee 0%,
      #a855f7 50%,
      #ec4899 100%
    );
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>
