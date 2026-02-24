<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { WSTipEvent, WSMessage } from "$lib/types";

  let { data } = $props();

  let socket: WebSocket | null = null;
  let isConnected = $state(false);
  let isReconnecting = $state(false);
  let wsError = $state("");
  let currentTip: WSTipEvent["data"] | null = $state(null);
  let showAlert = $state(false);
  let alertSound: HTMLAudioElement | null = $state(null);
  let wsUrl = "";
  let soundEnabled = $state(false);
  let soundLoading = $state(false);
  let soundUrl = $state(
    "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3",
  );
  let alertQueue: WSTipEvent["data"][] = [];
  let isShowingAlert = false;

  // Hotkey for skip alert (from URL param)
  let skipHotkey = "s";

  // Load hotkey from URL param
  function loadHotkey() {
    const urlParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const urlHotkey = urlParams.get("hotkey");
    if (urlHotkey) {
      skipHotkey = urlHotkey;
    }
  }

  // Load sound preference from URL param only (ignore localStorage for OBS)
  function loadSoundPreference() {
    // Check URL param first (?sound=1 or ?enableSound=true)
    const urlParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const urlSound = urlParams.get("sound") || urlParams.get("enableSound");

    // Only enable sound if URL param says so - ignore localStorage
    if (urlSound === "1" || urlSound === "true") {
      soundEnabled = true;
    }

    // Preload the sound if enabled
    if (soundEnabled) {
      alertSound = new Audio(soundUrl);
      alertSound.volume = 1;
    }
  }

  function enableSound() {
    soundEnabled = true;
    soundLoading = true;

    // Save preference
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("soundEnabled", "true");
    }

    // Create new audio with the sound URL
    alertSound = new Audio(soundUrl);
    alertSound.volume = 1;

    alertSound
      .play()
      .then(() => {})
      .catch((e) => {
        console.error("Failed to play sound:", e);
      })
      .finally(() => {
        soundLoading = false;
      });
  }

  // Fetch streamer settings on mount
  async function loadSettings() {
    try {
      const response = await fetch(`/api/streamer/${data.slug}/settings`);
      if (response.ok) {
        const result = await response.json();
        if (result.settings?.sound_url) {
          soundUrl = result.settings.sound_url;
        }
        // Load skip_hotkey from streamer
        console.log("[Overlay] Settings response:", JSON.stringify(result));
        if (result.streamer?.skip_hotkey) {
          skipHotkey = result.streamer.skip_hotkey;
          console.log("[Overlay] Loaded skip_hotkey:", skipHotkey);
        }
        // Preload sound after getting URL
        if (soundEnabled) {
          alertSound = new Audio(soundUrl);
          alertSound.volume = 1;
        }
      }
    } catch (e) {
      console.error("[Overlay] Failed to load settings:", e);
    }
  }

  const ALERT_DURATION = 5000;

  function formatSOL(lamports: number): string {
    return (lamports / 1e9).toFixed(4);
  }

  let wsReconnectAttempts = 0;
  let wsReconnectDelay = 1000;
  let wsConnectionTimeout: ReturnType<typeof setTimeout> | null = null;
  let alertTimeout: ReturnType<typeof setTimeout> | null = null;
  let alertDelayTimeout: ReturnType<typeof setTimeout> | null = null;

  function connectWebSocket() {
    // Mark as reconnecting
    isReconnecting = true;
    wsError = "";

    // Properly close existing connection
    if (socket) {
      socket.onclose = null; // Remove handler to prevent reconnection loop
      socket.close();
      socket = null;
    }

    // Clear connection timeout
    if (wsConnectionTimeout) {
      clearTimeout(wsConnectionTimeout);
      wsConnectionTimeout = null;
    }

    wsUrl = `wss://${window.location.host}/ws/${data.slug}`;

    try {
      socket = new WebSocket(wsUrl);
      socket.binaryType = "arraybuffer";

      // Connection timeout - fail fast
      wsConnectionTimeout = setTimeout(() => {
        if (socket && socket.readyState !== WebSocket.OPEN) {
          socket.close();
        }
      }, 10000);

      socket.onopen = () => {
        isConnected = true;
        isReconnecting = false;
        wsReconnectAttempts = 0;
        wsReconnectDelay = 1000;
        if (wsConnectionTimeout) {
          clearTimeout(wsConnectionTimeout);
        }
      };

      socket.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          if (message.type === "tip") {
            handleTip(message.data as WSTipEvent["data"]);
          } else if (message.type === "skip") {
            // Skip current alert from dashboard
            skipAlert();
          } else if (message.type === "settings_changed") {
            // Reload settings when changed from dashboard
            loadSettings();
            loadHotkey();
          } else if (message.type === "welcome") {
          } else if (message.type === "error") {
            console.error("WebSocket error:", message.message);
            wsError = message.message || "Unknown error";
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      socket.onclose = () => {
        isConnected = false;
        isReconnecting = true;
        if (wsConnectionTimeout) {
          clearTimeout(wsConnectionTimeout);
          wsConnectionTimeout = null;
        }
        // Exponential backoff
        wsReconnectAttempts++;
        const delay = Math.min(
          wsReconnectDelay * Math.pow(1.5, wsReconnectAttempts - 1),
          30000,
        );
        setTimeout(connectWebSocket, delay);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setTimeout(connectWebSocket, 3000);
    }
  }

  let refreshInterval: ReturnType<typeof setInterval> | null = null;
  let connectionCheckInterval: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    // Load settings first (includes sound URL from streamer config)
    await loadSettings();
    // Then load sound preference from URL param
    loadSoundPreference();
    // Load hotkey from URL param
    loadHotkey();

    // Force reset before connecting
    wsReconnectAttempts = 0;
    wsReconnectDelay = 1000;

    // Small delay before initial connection to ensure clean state
    setTimeout(() => {
      connectWebSocket();
    }, 100);

    // Listen for test messages from parent window
    window.addEventListener("message", handleMessage);

    // Listen for keyboard shortcuts
    window.addEventListener("keydown", handleOverlayKeydown);

    // Poll settings every 30 seconds to pick up updates (for OBS which caches pages)
    refreshInterval = setInterval(async () => {
      await loadSettings();
    }, 30000);

    // Also refresh settings when window gains focus
    window.addEventListener("focus", () => {
      loadSettings();
      loadHotkey();
    });

    // Handle visibility change - reconnect when page becomes visible (important for OBS)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic connection check - reconnect if disconnected (backup for OBS)
    connectionCheckInterval = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        wsReconnectAttempts = 0;
        connectWebSocket();
      }
    }, 15000);
  });

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        wsReconnectAttempts = 0;
        connectWebSocket();
      }
      // Also reload settings when becoming visible
      loadSettings();
      loadHotkey();
    }
  }

  onDestroy(() => {
    isReconnecting = false;
    if (socket) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
    if (wsConnectionTimeout) {
      clearTimeout(wsConnectionTimeout);
    }
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("keydown", handleOverlayKeydown);
      window.removeEventListener("focus", loadSettings);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  });

  function handleTip(tipData: WSTipEvent["data"]) {
    // Add to queue
    alertQueue.push(tipData);

    // Process queue if not currently showing
    if (!isShowingAlert) {
      processQueue();
    }
  }

  async function processQueue() {
    if (alertQueue.length === 0 || isShowingAlert) return;

    isShowingAlert = true;
    const tipData = alertQueue.shift()!;
    currentTip = tipData;
    showAlert = true;

    // Reload settings right before playing sound to get latest URL
    await loadSettings();

    // Play sound
    if (soundEnabled && soundUrl) {
      playSound();
    }

    // After alert duration, show next in queue
    alertTimeout = setTimeout(() => {
      showAlert = false;
      // Small delay before next alert
      alertDelayTimeout = setTimeout(() => {
        isShowingAlert = false;
        processQueue();
      }, 500);
    }, ALERT_DURATION);
  }

  function playSound() {
    if (!soundUrl) {
      console.error("No sound URL");
      return;
    }

    // Use preloaded audio if available, otherwise create new
    if (alertSound) {
      alertSound.currentTime = 0;
      alertSound.play().catch((e) => {
        console.error("Failed to play alert sound:", e);
      });
    } else {
      // Fallback: create new audio
      const audio = new Audio();
      audio.volume = 1;
      audio.src = soundUrl;
      audio.crossOrigin = "anonymous";
      audio.play().catch((e) => {
        console.error("Failed to play alert sound:", e);
      });
    }
  }

  // Skip current alert - dismiss immediately, clear queue
  function skipAlert() {
    if (!isShowingAlert) return;

    // Cancel any pending timeouts
    if (alertTimeout) {
      clearTimeout(alertTimeout);
      alertTimeout = null;
    }
    if (alertDelayTimeout) {
      clearTimeout(alertDelayTimeout);
      alertDelayTimeout = null;
    }

    // Stop current alert immediately
    showAlert = false;
    isShowingAlert = false;

    // Clear the queue entirely - just dismiss
    alertQueue = [];
  }

  function handleMessage(event: MessageEvent) {
    // Accept test messages from parent
    if (event.data && event.data.type === "tip") {
      handleTip(event.data.data);
    }
  }

  // Handle keyboard for skip alert
  function handleOverlayKeydown(event: KeyboardEvent) {
    // Build the current key combination
    const parts: string[] = [];
    if (event.ctrlKey) parts.push("ctrl");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");
    if (event.metaKey) parts.push("meta");
    parts.push(event.key.toLowerCase());
    const currentCombo = parts.join("+");

    // Check if pressed combination matches hotkey
    if (currentCombo === skipHotkey.toLowerCase()) {
      event.preventDefault();
      skipAlert();
    }
  }
</script>

<svelte:head>
  <title>Overlay - {data.slug}</title>
</svelte:head>

<!-- Hidden audio element -->
<audio bind:this={alertSound} preload="auto" src={soundUrl}>
  <source src={soundUrl} type="audio/mpeg" />
</audio>

<!-- OBS Overlay - Transparent Background -->
<div
  class="fixed inset-0 pointer-events-none overflow-hidden"
  style="background: transparent;"
>
  <!-- Connection Status - Debug info -->
  <div class="absolute top-2 left-2 right-2 flex justify-between items-start">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <div class="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
          {#if isConnected}
            🟢 Connected | {data.slug}
          {:else if isReconnecting}
            🟡 Reconnecting... | {data.slug}
          {:else}
            🔴 Disconnected | {data.slug}
          {/if}
        </div>
        {#if !isConnected && !isReconnecting}
          <button
            onclick={() => {
              wsReconnectAttempts = 0;
              wsError = "";
              connectWebSocket();
            }}
            class="text-xs bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded pointer-events-auto"
          >
            Reconnect
          </button>
        {/if}
      </div>
    </div>

    <!-- Skip Alert Button -->
    <button
      onclick={skipAlert}
      class="text-xs bg-red-600/80 hover:bg-red-600 text-white px-3 py-1 rounded pointer-events-auto font-medium"
    >
      {skipHotkey?.toUpperCase() || "S"} | Skip Alert
    </button>

    <!-- Enable Sound Button -->
    {#if !soundEnabled}
      <button
        onclick={enableSound}
        disabled={soundLoading}
        class="text-xs bg-black/80 hover:bg-black/60 text-yellow-400 px-3 py-1 rounded border border-yellow-400/50 pointer-events-auto disabled:opacity-50 font-bold"
      >
        🔊 Enable Sound
      </button>
    {/if}
  </div>

  <!-- Alert Container -->
  <div
    class="absolute bottom-4 right-4 max-w-sm transition-all duration-500 ease-out"
    class:translate-x-0={showAlert}
    class:translate-x-[150%]={!showAlert}
    class:opacity-100={showAlert}
    class:opacity-0={!showAlert}
  >
    {#if currentTip}
      <div class="relative">
        <!-- Glow -->
        <div
          class="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 animate-pulse"
        ></div>

        <!-- Main Card -->
        <div
          class="relative bg-[#0a0a0b]/95 backdrop-blur border border-white/20 rounded-2xl p-5 shadow-2xl"
        >
          <!-- Animated gradient border -->
          <div
            class="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30 animate-pulse"
          ></div>

          <div class="relative flex items-center gap-4">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              <div
                class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
              >
                <span class="text-2xl">💎</span>
              </div>
              <!-- Sparkles -->
              <div class="absolute -top-1 -right-1 text-lg animate-bounce">
                ✨
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <!-- Header -->
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-bold text-cyan-400 animate-pulse">
                  🎉 NEW TIP!
                </span>
              </div>

              <!-- Amount -->
              <div class="text-2xl font-bold text-white mb-1">
                {formatSOL(currentTip.amount)} SOL
              </div>

              <!-- Name & Message -->
              {#if currentTip.sender_name}
                <div class="text-base font-semibold text-purple-300 truncate">
                  {currentTip.sender_name}
                </div>
              {/if}

              {#if currentTip.message}
                <div
                  class="text-sm text-zinc-300 bg-white/5 rounded-lg px-2 py-1 mt-1 truncate"
                >
                  {currentTip.message}
                </div>
              {/if}
            </div>

            <!-- Coin icon -->
            <div class="flex-shrink-0 text-3xl animate-bounce">🪙</div>
          </div>

          <!-- Sparkle decorations -->
          <div class="absolute top-2 right-8">
            <span
              class="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
            ></span>
          </div>
          <div class="absolute bottom-3 left-6">
            <span
              class="absolute w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping"
              style="animation-delay: 0.3s;"
            ></span>
          </div>
        </div>

        <!-- Bottom line -->
        <div
          class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3/4 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"
        ></div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background: transparent !important;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  :global(html) {
    background: transparent !important;
  }
</style>
