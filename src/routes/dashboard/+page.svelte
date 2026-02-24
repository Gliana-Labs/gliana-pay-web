<script lang="ts">
  import FloatingIcons from "$lib/components/FloatingIcons.svelte";
  import { onMount, onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";
  import {
    disconnectWallet,
    signMessage,
    getAvailableWallets,
  } from "$lib/wallet";
  import type { WalletInfo } from "$lib/wallet";
  import { WORKER_URL } from "$lib/config";

  // Check auth
  let walletAddress = "";
  let slug = "";
  let loading = true;

  // Toast notifications
  let toast = "";
  let toastType: "success" | "error" | "" = "";
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  function showToast(message: string, type: "success" | "error" = "error") {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast = message;
    toastType = type;
    toastTimeout = setTimeout(() => {
      toast = "";
      toastType = "";
    }, 5000);
  }

  // Dashboard data
  let totalReceived = 0;
  let totalTips = 0;
  let average = 0;
  let donations: any[] = [];
  let page = 1;
  let hasMore = false;
  let loadingMore = false;
  let alertsLoading = false;

  // Hide earnings toggle
  let hideEarnings = false;

  // Hotkey for skip alert
  let skipHotkey = "s";
  let isRecordingHotkey = false;

  // Alert Settings
  let minAmount = 0.001;
  let soundUrl = "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3";
  let soundEnabled = false;
  let soundError = "";
  let name = "";

  // Copy state
  let copied = false;
  async function copyPageUrl() {
    const url = `https://glianapay.com/tip/${slug}`;
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  // Load session
  function loadSession() {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("gliana_session");
    if (saved) {
      const session = JSON.parse(saved);
      walletAddress = session.walletAddress || "";
      slug = session.slug || "";
    }

    // Load hotkey from localStorage
    const savedHotkey = localStorage.getItem("skipHotkey");
    if (savedHotkey) {
      skipHotkey = savedHotkey;
    }
  }

  // Save hotkey to localStorage
  function saveHotkey() {
    if (typeof window !== "undefined") {
      localStorage.setItem("skipHotkey", skipHotkey);
    }
  }

  // Handle keyboard for skip alert
  function handleKeydown(event: KeyboardEvent) {
    // If recording hotkey, capture the key combination
    if (isRecordingHotkey) {
      event.preventDefault();
      const parts: string[] = [];
      if (event.ctrlKey) parts.push("ctrl");
      if (event.shiftKey) parts.push("shift");
      if (event.altKey) parts.push("alt");
      parts.push(event.key.toLowerCase());
      skipHotkey = parts.join("+");
      isRecordingHotkey = false;
      saveHotkey();
      return;
    }

    // Build the current key combination
    const parts: string[] = [];
    if (event.ctrlKey) parts.push("ctrl");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");
    parts.push(event.key.toLowerCase());
    const currentCombo = parts.join("+");

    // Check if pressed combination matches hotkey
    if (currentCombo === skipHotkey.toLowerCase()) {
      // Don't trigger if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }
      event.preventDefault();
      skipCurrentAlert();
    }
  }

  // Load dashboard data
  async function loadDashboardData() {
    if (!slug) return;

    try {
      page = 1;
      const response = await fetch(
        `${WORKER_URL}/api/streamer/${slug}/donations?page=1&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        totalReceived = data.stats.totalReceived / 1e9;
        totalTips = data.stats.totalTips;
        average = data.stats.average / 1e9;
        donations = data.donations || [];
        hasMore = data.pagination?.hasMore || false;
      }
    } catch (e) {
      console.error("Failed to load donations:", e);
    }

    try {
      const response = await fetch(`${WORKER_URL}/api/streamer/${slug}`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          const loadedAmount = data.settings.min_amount || 1000000;
          minAmount = Math.max(loadedAmount, 1000000) / 1e9;
          soundUrl =
            data.settings.sound_url ||
            "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3";
        }
        if (data.streamer) {
          name = data.streamer.name || "";
          skipHotkey = data.streamer.skip_hotkey || "s";
        }
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }

  // Load more donations
  async function loadMoreDonations() {
    if (!slug || loadingMore || !hasMore) return;

    loadingMore = true;
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `${WORKER_URL}/api/streamer/${slug}/donations?page=${nextPage}&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        donations = [...donations, ...(data.donations || [])];
        page = nextPage;
        hasMore = data.pagination?.hasMore || false;
      }
    } catch (e) {
      console.error("Failed to load more donations:", e);
    } finally {
      loadingMore = false;
    }
  }

  // Save alert settings
  async function saveAlertSettings() {
    soundError = "";

    if (minAmount < 0.001) {
      minAmount = 0.001;
    }

    if (
      soundUrl &&
      !soundUrl.match(/\.(mp3|wav|ogg)(\?|$)/i) &&
      !soundUrl.includes("/media/sounds/")
    ) {
      soundError = "URL should end with .mp3 or contain /media/sounds/";
      return;
    }

    alertsLoading = true;

    try {
      // Get the connected wallet provider
      const wallets = getAvailableWallets();
      const savedSession = localStorage.getItem("gliana_session");
      const sessionData = savedSession ? JSON.parse(savedSession) : {};
      const savedWalletName = sessionData.walletName || "";

      let currentProvider =
        wallets.find((w) => w.name === savedWalletName) || wallets[0];

      if (!currentProvider) {
        showToast("Could not find wallet provider. Please reconnect.", "error");
        alertsLoading = false;
        return;
      }

      // Prompt for signature
      const message = `Update GlianaPay settings for ${slug}`;
      const signatureData = await signMessage(currentProvider, message);

      if (!signatureData) {
        showToast("Signature request cancelled", "error");
        alertsLoading = false;
        return;
      }

      const response = await fetch(
        `${WORKER_URL}/api/streamer/${slug}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${walletAddress}:${signatureData.signature}`,
          },
          body: JSON.stringify({
            min_amount: Math.floor(minAmount * 1e6),
            sound_url: soundUrl,
            skip_hotkey: skipHotkey,
          }),
        },
      );

      if (response.ok) {
        showToast("Alert settings saved!", "success");
      } else {
        const data = await response.json().catch(() => ({}));
        showToast((data as any).error || "Failed to save", "error");
      }
    } catch (e) {
      showToast("Failed to connect to server", "error");
    } finally {
      alertsLoading = false;
    }
  }

  // Test alert
  let testInProgress = false;

  function testAlertWS() {
    if (testInProgress) return;
    testInProgress = true;

    // Safety timeout to reset state
    const safetyTimeout = setTimeout(() => {
      testInProgress = false;
    }, 10000);

    fetch(`${WORKER_URL}/api/test-alert/${slug}`, {
      method: "POST",
    })
      .then(async (res) => {
        clearTimeout(safetyTimeout);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error ||
              data.message ||
              `HTTP ${res.status}: ${res.statusText}`,
          );
        }
        showToast("Test alert sent!", "success");
      })
      .catch((err) => {
        clearTimeout(safetyTimeout);
        console.error("Failed to send test alert:", err);
        showToast(err.message || "Failed to send test alert", "error");
      })
      .finally(() => {
        setTimeout(() => {
          testInProgress = false;
        }, 2000);
      });
  }

  // Logout
  async function handleLogout() {
    // Disconnect wallet first
    await disconnectWallet();
    // Clear local data
    localStorage.removeItem("gliana_session");
    sessionStorage.setItem("gliana_just_logged_out", "1");
    window.location.href = "/";
  }

  // Go to homepage
  function goToHomepage() {
    window.location.href = "/";
  }

  // WebSocket for skip alert
  let wsSocket: WebSocket | null = null;

  function connectWebSocket() {
    if (!slug) return;

    const wsUrl = `wss://${window.location.host}/ws/${slug}`;

    try {
      wsSocket = new WebSocket(wsUrl);

      wsSocket.onopen = () => {
        console.log("[Dashboard] WebSocket connected");
      };

      wsSocket.onclose = () => {
        console.log("[Dashboard] WebSocket disconnected");
        // Reconnect after delay
        setTimeout(connectWebSocket, 5000);
      };

      wsSocket.onerror = (error) => {
        console.error("[Dashboard] WebSocket error:", error);
      };
    } catch (error) {
      console.error("[Dashboard] Failed to create WebSocket:", error);
      setTimeout(connectWebSocket, 5000);
    }
  }

  function skipCurrentAlert() {
    if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
      wsSocket.send(JSON.stringify({ type: "skip" }));
      showToast("Skipping current alert...", "success");
    } else {
      showToast("Not connected to overlay", "error");
    }
  }

  onMount(() => {
    loadSession();

    if (!walletAddress || !slug) {
      // Not logged in, redirect to login
      window.location.href = "/login";
      return;
    }

    loadDashboardData();
    loading = false;

    // Connect WebSocket for skip functionality
    connectWebSocket();

    // Add keyboard listener for hotkey
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown);
    }
  });
</script>

<svelte:head>
  <title>Dashboard - GlianaPay</title>
</svelte:head>

{#if !loading}
  <div
    class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden"
  >
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"
      ></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"
      ></div>
    </div>

    <!-- Floating Icons (Rain) -->
    <FloatingIcons animation="rain" />

    <!-- Header -->
    <div class="border-b border-white/10 relative z-10">
      <div
        class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between"
      >
        <button
          on:click={goToHomepage}
          class="flex items-center gap-2 cursor-pointer"
        >
          <img
            src="/logo.svg"
            alt="GlianaPay"
            class="w-10 h-10 bg-transparent rounded-xl"
          />
          <span class="font-bold hidden md:inline">GlianaPay</span>
        </button>
        <div class="flex items-center gap-2 md:gap-4">
          <a href="/dashboard" class="text-purple-400 text-sm font-medium"
            >Dashboard</a
          >
          <a
            href="/settings"
            class="text-zinc-400 hover:text-white text-sm transition-colors"
            >Settings</a
          >
          <div class="text-sm text-zinc-400">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
          <button
            on:click={handleLogout}
            class="text-sm text-red-400 hover:text-red-300 cursor-pointer"
            >Logout</button
          >
        </div>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <div class="flex justify-between items-start">
            <p class="text-zinc-400 text-sm">Total Received</p>
            <button
              on:click={() => hideEarnings = !hideEarnings}
              class="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title={hideEarnings ? "Show earnings" : "Hide earnings"}
            >
              {#if hideEarnings}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              {/if}
            </button>
          </div>
          <p class="text-3xl font-bold text-gradient mt-1">
            {hideEarnings ? "••••••" : `${totalReceived.toFixed(3)} SOL`}
          </p>
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Total Tips</p>
          <p class="text-3xl font-bold mt-1">{hideEarnings ? "•••" : totalTips}</p>
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Average</p>
          <p class="text-3xl font-bold mt-1">{hideEarnings ? "••••" : `${average.toFixed(3)} SOL`}</p>
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Your Page</p>
          <div class="flex items-center gap-2 mt-1">
            <a
              href="/{slug || 'yourname'}"
              target="_blank"
              class="text-xl font-bold text-purple-400 hover:underline"
            >
              /{slug || "yourname"}
            </a>
            <button
              on:click={copyPageUrl}
              class="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded transition-all cursor-pointer"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p class="text-xs text-zinc-500 mt-1">
            Share this link to receive tips
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Recent Donations -->
        <div class="lg:col-span-2">
          <div
            class="glass-card rounded-2xl border border-white/10 overflow-hidden"
          >
            <div class="p-4 border-b border-white/10">
              <h2 class="font-bold text-lg">Recent Tips</h2>
            </div>
            {#if donations.length > 0}
              <div class="divide-y divide-white/5">
                {#each donations as donation}
                  <div class="p-4 flex items-center justify-between">
                    <div>
                      <p class="font-medium text-white">
                        {donation.sender_name || "Anonymous"}
                      </p>
                      <p class="text-sm text-zinc-500">
                        {donation.message || "No message"}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-green-400">
                        {hideEarnings ? "••••" : `${(donation.amount / 1e9).toFixed(3)} SOL`}
                      </p>
                      <p class="text-xs text-zinc-500">
                        {new Date(donation.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>

              {#if hasMore}
                <div
                  class="px-4 pb-4 pt-2 flex justify-center border-t border-white/5 mt-2"
                >
                  <button
                    class="px-5 py-2 text-sm font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-purple-500/10"
                    on:click={loadMoreDonations}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load More Tips"}
                  </button>
                </div>
              {/if}
            {:else}
              <div class="p-8 text-center text-zinc-500">
                No tips yet. Share your page to start receiving tips!
              </div>
            {/if}
          </div>
        </div>

        <!-- Alert Settings + OBS Overlay -->
        <div>
          <div class="glass-card rounded-2xl border border-white/10 p-6">
            <h2 class="font-bold text-lg mb-4">Alert Settings</h2>
            <div class="space-y-4">
              <div>
                <label for="min-amount" class="block text-sm text-zinc-400 mb-2"
                  >Minimum Tip (SOL)</label
                >
                <input
                  type="number"
                  id="min-amount"
                  bind:value={minAmount}
                  step="0.001"
                  min="0.001"
                  class="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label for="sound" class="block text-sm text-zinc-400 mb-2"
                  >Alert Sound URL</label
                >
                <div class="space-y-2">
                  <input
                    type="url"
                    id="sound"
                    bind:value={soundUrl}
                    placeholder="https://example.com/sound.mp3"
                    class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm"
                  />
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-zinc-500"
                      >Recommended: short MP3 URLs</span
                    >
                    <button
                      on:click={() =>
                        (soundUrl =
                          "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3")}
                      class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300 cursor-pointer"
                    >
                      Default
                    </button>
                  </div>
                </div>
              </div>
              {#if soundError}
                <p class="text-red-400 text-sm">{soundError}</p>
              {/if}

              <!-- Skip Hotkey -->
              <div>
                <label class="block text-sm text-zinc-400 mb-2"
                  >Skip Alert Hotkey</label
                >
                <div class="flex gap-2">
                  <button
                    on:click={() => isRecordingHotkey = true}
                    class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-white font-mono min-w-[120px] text-center"
                  >
                    {#if isRecordingHotkey}
                      Press key...
                    {:else}
                      {skipHotkey || "Click to set"}
                    {/if}
                  </button>
                  <span class="text-xs text-zinc-500 self-center">
                    Press a key or combo (e.g., ctrl+shift+s)
                  </span>
                </div>
              </div>

              <button
                on:click={saveAlertSettings}
                disabled={alertsLoading}
                class="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-semibold transition-all cursor-pointer"
              >
                {#if alertsLoading}
                  Saving...
                {:else}
                  Save Alert Settings
                {/if}
              </button>
            </div>
          </div>

          <div class="glass-card rounded-2xl border border-white/10 p-6 mt-4">
            <h2 class="font-bold text-lg mb-4">OBS Overlay</h2>

            <p class="text-sm text-zinc-400 mb-3">
              How to add tip alerts to your stream:
            </p>

            <ol class="text-sm text-zinc-300 space-y-2 mb-4">
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">1.</span>
                <span>In OBS, add a <strong>Browser Source</strong></span>
              </li>
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">2.</span>
                <span
                  >Toggle sound below, copy URL, paste in Browser Source</span
                >
              </li>
            </ol>

            <div class="mb-3">
              <label class="flex items-center gap-2 text-sm text-zinc-300 mb-2">
                <input
                  type="checkbox"
                  bind:checked={soundEnabled}
                  class="w-4 h-4 accent-purple-500"
                />
                Enable sound alerts
              </label>
            </div>

            <div class="space-y-2 mb-3">
              <div class="flex items-center gap-2">
                <code
                  class="flex-1 text-xs text-green-400 bg-black/30 p-2 rounded break-all"
                >
                  https://glianapay.com/overlay/{slug}{soundEnabled
                    ? "?sound=1"
                    : ""}
                </code>
                <button
                  on:click={() =>
                    navigator.clipboard.writeText(
                      `https://glianapay.com/overlay/${slug}${soundEnabled ? "?sound=1" : ""}`,
                    )}
                  class="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg text-xs whitespace-nowrap cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            <ol class="text-sm text-zinc-300 space-y-2 mb-3">
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">3.</span>
                <span
                  >Set Width: <strong>600</strong>, Height:
                  <strong>400</strong></span
                >
              </li>
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">4.</span>
                <span>Check "Shutdown source when not visible"</span>
              </li>
              <li class="flex gap-2">
                <span class="text-purple-400 font-bold">5.</span>
                <span>Position the overlay in your scene</span>
              </li>
            </ol>

            <a
              href="/overlay/{slug}?sound=1"
              target="_blank"
              class="inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline ml-3 first:ml-0"
            >
              <span>Preview Overlay</span>
            </a>

            <button
              on:click={testAlertWS}
              disabled={testInProgress}
              class="ml-3 inline-flex items-center gap-2 text-sm text-yellow-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{testInProgress ? "Sending..." : "Test Alert"}</span>
            </button>

            <button
              on:click={skipCurrentAlert}
              class="ml-3 inline-flex items-center gap-2 text-sm text-red-400 hover:underline"
            >
              <span>Skip Alert</span>
            </button>

            <p class="text-xs text-zinc-500 mt-3">
              <span class="text-yellow-500">Tip:</span> If settings don't update,
              right-click the Browser Source in OBS and select "Interact" then refresh
              the page, or remove and re-add the Browser Source.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="relative md:absolute md:bottom-6 left-0 px-4 py-6 md:py-0">
      <a
        href="mailto:support@glianapay.com?subject=Report Bug"
        class="text-xs text-zinc-500 hover:text-white">Report Bug</a
      >
    </div>
  </div>

  <!-- Toast -->
  {#if toast}
    <div
      transition:slide={{ duration: 300 }}
      class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 {toastType ===
      'success'
        ? 'bg-green-600'
        : 'bg-red-600'} text-white text-sm font-medium"
    >
      {toast}
    </div>
  {/if}
{/if}

<style>
  .glass-card {
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(12px);
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
