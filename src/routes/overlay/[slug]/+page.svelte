<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { WSTipEvent, WSMessage } from '$lib/types';

  export let data: {
    slug: string;
  };

  let socket: WebSocket | null = null;
  let isConnected = false;
  let currentTip: WSTipEvent['data'] | null = null;
  let showAlert = false;
  let alertSound: HTMLAudioElement | null = null;
  let wsUrl = '';
  let soundEnabled = false;
  let soundLoading = false;
  let soundUrl = 'https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3';
  let alertQueue: WSTipEvent['data'][] = [];
  let isShowingAlert = false;

  // Load sound preference from localStorage or URL param on mount
  function loadSoundPreference() {
    // Check URL param first (?sound=1 or ?enableSound=true)
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const urlSound = urlParams.get('sound') || urlParams.get('enableSound');

    if (urlSound === '1' || urlSound === 'true') {
      soundEnabled = true;
      console.log('Sound enabled via URL parameter');
    } else if (typeof localStorage !== 'undefined') {
      const enabled = localStorage.getItem('soundEnabled');
      if (enabled === 'true') {
        soundEnabled = true;
        console.log('Sound preference loaded from localStorage');
      }
    }

    // Preload the sound if enabled
    if (soundEnabled) {
      alertSound = new Audio(soundUrl);
      alertSound.volume = 1;
    }
  }

  function enableSound() {
    console.log('Enable sound clicked, soundUrl:', soundUrl);
    soundEnabled = true;
    soundLoading = true;

    // Save preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('soundEnabled', 'true');
    }

    // Create new audio with the sound URL
    alertSound = new Audio(soundUrl);
    alertSound.volume = 1;

    alertSound.play()
      .then(() => {
        console.log('Sound enabled and playing');
      })
      .catch((e) => {
        console.error('Failed to play sound:', e);
      })
      .finally(() => {
        soundLoading = false;
      });
  }

  // Fetch streamer settings on mount
  async function loadSettings() {
    try {
      const response = await fetch(`https://${WORKER_HOST}/api/streamer/${data.slug}/settings`);
      if (response.ok) {
        const result = await response.json();
        if (result.settings?.sound_url) {
          soundUrl = result.settings.sound_url;
          console.log('Loaded sound URL:', soundUrl);
        }
        // Preload sound after getting URL
        if (soundEnabled) {
          alertSound = new Audio(soundUrl);
          alertSound.volume = 1;
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  const ALERT_DURATION = 5000;
  const WORKER_HOST = 'api.glianapay.com';

  function formatSOL(lamports: number): string {
    return (lamports / 1e9).toFixed(4);
  }

  let wsReconnectAttempts = 0;
  let wsReconnectDelay = 1000;
  let wsConnectionTimeout: ReturnType<typeof setTimeout> | null = null;

  function connectWebSocket() {
    // Clear any existing connection
    if (socket) {
      socket.close();
      socket = null;
    }

    // Clear connection timeout
    if (wsConnectionTimeout) {
      clearTimeout(wsConnectionTimeout);
    }

    wsUrl = `wss://${WORKER_HOST}/ws/${data.slug}`;
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      socket = new WebSocket(wsUrl);
      socket.binaryType = 'arraybuffer';

      // Connection timeout - fail fast
      wsConnectionTimeout = setTimeout(() => {
        if (socket && socket.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, closing...');
          socket.close();
        }
      }, 10000);

      socket.onopen = () => {
        console.log('WebSocket connected');
        isConnected = true;
        wsReconnectAttempts = 0;
        wsReconnectDelay = 1000;
        if (wsConnectionTimeout) {
          clearTimeout(wsConnectionTimeout);
        }
      };

      socket.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          if (message.type === 'tip') {
            handleTip(message.data as WSTipEvent['data']);
          } else if (message.type === 'welcome') {
            console.log('Welcome:', message.message);
          } else if (message.type === 'error') {
            console.error('WebSocket error:', message.message);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        isConnected = false;
        if (wsConnectionTimeout) {
          clearTimeout(wsConnectionTimeout);
        }
        // Exponential backoff
        wsReconnectAttempts++;
        const delay = Math.min(wsReconnectDelay * Math.pow(1.5, wsReconnectAttempts - 1), 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${wsReconnectAttempts})`);
        setTimeout(connectWebSocket, delay);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setTimeout(connectWebSocket, 3000);
    }
  }

  onMount(async () => {
    // First load sound preference from localStorage
    loadSoundPreference();
    // Then load settings (which may override soundUrl)
    await loadSettings();
    // Connect WebSocket
    connectWebSocket();

    // Listen for test messages from parent window
    window.addEventListener('message', handleMessage);
  });

  onDestroy(() => {
    if (socket) {
      socket.close();
    }
    if (wsConnectionTimeout) {
      clearTimeout(wsConnectionTimeout);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage);
    }
  });

  function handleTip(tipData: WSTipEvent['data']) {
    // Add to queue
    alertQueue.push(tipData);
    console.log('Alert queued, queue length:', alertQueue.length);

    // Process queue if not currently showing
    if (!isShowingAlert) {
      processQueue();
    }
  }

  function processQueue() {
    if (alertQueue.length === 0 || isShowingAlert) return;

    isShowingAlert = true;
    const tipData = alertQueue.shift()!;
    currentTip = tipData;
    showAlert = true;

    // Play sound
    if (soundEnabled && soundUrl) {
      console.log('Playing alert sound for tip:', tipData);
      playSound();
    }

    // After alert duration, show next in queue
    setTimeout(() => {
      showAlert = false;
      // Small delay before next alert
      setTimeout(() => {
        isShowingAlert = false;
        processQueue();
      }, 500);
    }, ALERT_DURATION);
  }

  function playSound() {
    if (!soundUrl) {
      console.error('No sound URL');
      return;
    }

    console.log('Playing sound from URL:', soundUrl);

    // Use preloaded audio if available, otherwise create new
    if (alertSound) {
      alertSound.currentTime = 0;
      alertSound.play().catch((e) => {
        console.error('Failed to play alert sound:', e);
      });
    } else {
      // Fallback: create new audio
      const audio = new Audio();
      audio.volume = 1;
      audio.src = soundUrl;
      audio.crossOrigin = 'anonymous';
      audio.play().catch((e) => {
        console.error('Failed to play alert sound:', e);
      });
    }
  }

  function handleMessage(event: MessageEvent) {
    // Accept test messages from parent
    if (event.data && event.data.type === 'tip') {
      handleTip(event.data.data);
    }
  }
</script>

<svelte:head>
  <title>Alert Overlay - {data.slug}</title>
</svelte:head>

<!-- Hidden audio element -->
<audio bind:this={alertSound} preload="auto" src={soundUrl}>
  <source src={soundUrl} type="audio/mpeg" />
</audio>

<!-- OBS Overlay - Transparent Background -->
<div class="fixed inset-0 pointer-events-none overflow-hidden" style="background: transparent;">
  <!-- Connection Status - Debug info -->
  <div class="absolute top-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
    {isConnected ? '🟢 Connected' : '🔴 Disconnected'} | {data.slug}
  </div>

  <!-- Enable Sound Button -->
  {#if !soundEnabled}
    <button
      on:click={enableSound}
      disabled={soundLoading}
      class="absolute top-2 right-2 text-xs bg-black/80 hover:bg-black/60 text-yellow-400 px-3 py-2 rounded-lg border border-yellow-400/50 pointer-events-auto disabled:opacity-50 font-bold"
    >
      🔊 {soundLoading ? 'Loading...' : 'Enable Sound'}
    </button>
  {/if}

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
        <div class="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 animate-pulse"></div>

        <!-- Main Card -->
        <div class="relative bg-[#0a0a0b]/95 backdrop-blur border border-white/20 rounded-2xl p-5 shadow-2xl">
          <!-- Animated gradient border -->
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30 animate-pulse"></div>

          <div class="relative flex items-center gap-4">
            <!-- Avatar -->
            <div class="relative flex-shrink-0">
              <div class="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span class="text-2xl">💎</span>
              </div>
              <!-- Sparkles -->
              <div class="absolute -top-1 -right-1 text-lg animate-bounce">✨</div>
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
                <div class="text-sm text-zinc-300 bg-white/5 rounded-lg px-2 py-1 mt-1 truncate">
                  {currentTip.message}
                </div>
              {/if}
            </div>

            <!-- Coin icon -->
            <div class="flex-shrink-0 text-3xl animate-bounce">
              🪙
            </div>
          </div>

          <!-- Sparkle decorations -->
          <div class="absolute top-2 right-8">
            <span class="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
          </div>
          <div class="absolute bottom-3 left-6">
            <span class="absolute w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style="animation-delay: 0.3s;"></span>
          </div>
        </div>

        <!-- Bottom line -->
        <div class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3/4 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"></div>
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
