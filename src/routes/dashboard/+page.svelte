<script lang="ts">
  import FloatingIcons from "$lib/components/FloatingIcons.svelte";
  import { onMount, onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { walletStore } from "@aztemi/svelte-on-solana-wallet-adapter-core";
  import { signAuthMessage } from "$lib/wallet-helpers";
  import { WORKER_URL } from "$lib/config";
  import { fetchCloudflareStatus } from "$lib/cloudflare-status";

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
  let totalSol = 0; // in SOL (human units)
  let totalUsdc = 0; // in USDC (human units)
  let totalTips = 0;
  let average = 0;
  let donations: any[] = [];
  let biggestTip = 0;
  let biggestTipOriginal = 0; // original amount in human units
  let biggestTipCurrency = "SOL";
  let biggestTipper = "";
  let solPrice = 0; // USD price of 1 SOL
  let page = 1;
  let hasMore = false;
  let loadingMore = false;
  let alertsLoading = false;

  // Hide earnings toggle (default to hidden)
  let hideEarnings = true;

  // Hotkey for skip alert
  let skipHotkey = "s";
  let isRecordingHotkey = false;

  // Alert Settings
  let minAmount = 0.01;
  let soundUrl = "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3";
  let soundEnabled = false;
  let soundError = "";
  let name = "";

  // Event List Widget settings
  let eventListMode = "recent";
  let eventListLimit = 5;
  let eventListTheme = "dark";
  let eventListCopied = false;

  $: eventListUrl = `https://glianapay.com/overlay/${slug}/eventlist?mode=${eventListMode}&limit=${eventListLimit}&theme=${eventListTheme}`;

  // Tipping Goals
  let goals: any[] = [];
  let newGoalTitle = "";
  let newGoalTarget = "";
  let goalsLoading = false;

  // Edit Goal State
  let editingGoalId: number | null = null;
  let editGoalTitle = "";
  let editGoalTarget = "";
  let editGoalLoading = false;

  let goalBarTheme = "dark";
  let goalBarColor = "a855f7";
  let goalBarCopied = false;

  $: goalBarUrl = `https://glianapay.com/overlay/${slug}/goalbar?theme=${goalBarTheme}&color=${goalBarColor}`;

  // Cloudflare Status
  let cfStatus:
    | "operational"
    | "partial_outage"
    | "major_outage"
    | "under_maintenance"
    | "loading"
    | "error" = "loading";
  let cfRegionName = "";
  let cfCityName = "";
  let cfCityStatus = "";
  let cfDegradedItems: { name: string; status: string }[] = [];
  let showStatusDropdown = false;

  function getStatusLabel(s: string): string {
    if (s === "operational") return "Operational";
    if (s === "partial_outage") return "Degraded";
    if (s === "major_outage") return "Outage";
    if (s === "under_maintenance") return "Maintenance";
    return s;
  }

  async function loadCloudflareStatus() {
    try {
      const cached = sessionStorage.getItem("cf_status");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 300000) {
          cfStatus = parsed.status;
          cfRegionName = parsed.region;
          cfCityName = parsed.city || "";
          cfCityStatus = parsed.cityStatus || "";
          cfDegradedItems = parsed.degraded || [];
          return;
        }
      }

      const result = await fetchCloudflareStatus("cf_status");
      cfStatus = result.status;
      cfRegionName = result.region;
      cfCityName = result.cityName;
      cfCityStatus = result.cityStatus;
      cfDegradedItems = result.degradedItems;

      sessionStorage.setItem(
        "cf_status",
        JSON.stringify({
          status: cfStatus,
          region: cfRegionName,
          city: cfCityName,
          cityStatus: cfCityStatus,
          degraded: cfDegradedItems,
          ts: Date.now(),
        }),
      );
    } catch {
      cfStatus = "error";
    }
  }

  async function copyEventListUrl() {
    await navigator.clipboard.writeText(eventListUrl);
    eventListCopied = true;
    setTimeout(() => (eventListCopied = false), 2000);
  }

  async function copyGoalBarUrl() {
    await navigator.clipboard.writeText(goalBarUrl);
    goalBarCopied = true;
    setTimeout(() => (goalBarCopied = false), 2000);
  }

  async function loadGoals() {
    if (!slug) return;
    try {
      const res = await fetch(`${WORKER_URL}/api/streamer/${slug}/goals`);
      if (res.ok) {
        const data = await res.json();
        goals = data.goals || [];
      }
    } catch (e) {
      console.error("Failed to load goals:", e);
    }
  }

  async function createGoal() {
    if (!newGoalTarget || parseFloat(newGoalTarget) <= 0) {
      showToast("Enter a valid target amount", "error");
      return;
    }
    goalsLoading = true;
    try {
      const message = `Update GlianaPay settings for ${slug}`;
      const sig = await signAuthMessage(message);
      if (!sig) {
        showToast("Signature cancelled", "error");
        goalsLoading = false;
        return;
      }

      const res = await fetch(`${WORKER_URL}/api/streamer/${slug}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${walletAddress}:${sig.signature}`,
        },
        body: JSON.stringify({
          title: newGoalTitle || "Tipping Goal",
          target_amount: parseFloat(newGoalTarget),
        }),
      });
      if (res.ok) {
        showToast("Goal created!", "success");
        newGoalTitle = "";
        newGoalTarget = "";
        await loadGoals();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast((d as any).error || "Failed", "error");
      }
    } catch (e) {
      showToast("Failed to create goal", "error");
    } finally {
      goalsLoading = false;
    }
  }

  async function deleteGoal(goalId: number) {
    try {
      const message = `Update GlianaPay settings for ${slug}`;
      const sig = await signAuthMessage(message);
      if (!sig) return;

      const res = await fetch(
        `${WORKER_URL}/api/streamer/${slug}/goals/${goalId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${walletAddress}:${sig.signature}`,
          },
        },
      );
      if (res.ok) {
        showToast("Goal deleted", "success");
        await loadGoals();
      }
    } catch (e) {
      showToast("Failed", "error");
    }
  }

  async function resetGoal(goalId: number) {
    try {
      const message = `Update GlianaPay settings for ${slug}`;
      const sig = await signAuthMessage(message);
      if (!sig) return;

      const res = await fetch(
        `${WORKER_URL}/api/streamer/${slug}/goals/${goalId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${walletAddress}:${sig.signature}`,
          },
          body: JSON.stringify({ current_amount: 0, is_active: 1 }),
        },
      );
      if (res.ok) {
        showToast("Goal reset", "success");
        await loadGoals();
      }
    } catch (e) {
      showToast("Failed", "error");
    }
  }

  function startEditGoal(goal: any) {
    editingGoalId = goal.id;
    editGoalTitle = goal.title;
    editGoalTarget = goal.target_amount.toString();
  }

  function cancelEditGoal() {
    editingGoalId = null;
    editGoalTitle = "";
    editGoalTarget = "";
  }

  async function updateGoal(goalId: number) {
    if (!editGoalTarget || parseFloat(editGoalTarget) <= 0) {
      showToast("Enter a valid target amount", "error");
      return;
    }

    editGoalLoading = true;
    try {
      const message = `Update GlianaPay settings for ${slug}`;
      const sig = await signAuthMessage(message);
      if (!sig) {
        editGoalLoading = false;
        return;
      }

      const res = await fetch(
        `${WORKER_URL}/api/streamer/${slug}/goals/${goalId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${walletAddress}:${sig.signature}`,
          },
          body: JSON.stringify({
            title: editGoalTitle || "Tipping Goal",
            target_amount: parseFloat(editGoalTarget),
          }),
        },
      );

      if (res.ok) {
        showToast("Goal updated!", "success");
        cancelEditGoal();
        await loadGoals();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast((d as any).error || "Failed to update", "error");
      }
    } catch (e) {
      showToast("Failed to update goal", "error");
    } finally {
      editGoalLoading = false;
    }
  }

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
      event.stopPropagation();

      // Don't allow empty or special keys
      if (
        event.key === "Control" ||
        event.key === "Shift" ||
        event.key === "Alt" ||
        event.key === "Meta"
      ) {
        return;
      }

      const parts: string[] = [];
      if (event.ctrlKey) parts.push("ctrl");
      if (event.shiftKey) parts.push("shift");
      if (event.altKey) parts.push("alt");
      if (event.metaKey) parts.push("meta");
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
      // Fetch SOL price for $ conversion
      const priceRes = await fetch(`${WORKER_URL}/api/price/sol`);
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        solPrice = priceData.price || 0;
      }
    } catch {}

    try {
      page = 1;
      const response = await fetch(
        `${WORKER_URL}/api/streamer/${slug}/donations?page=1&limit=10`,
      );
      if (response.ok) {
        const data = await response.json();
        totalTips = data.stats.totalTips;
        // Convert to human-readable units
        totalSol = (data.stats.totalSolLamports || 0) / 1e9;
        totalUsdc = (data.stats.totalUsdcUnits || 0) / 1e6;
        // Total in USD
        totalReceived = totalSol * solPrice + totalUsdc;
        average = totalTips > 0 ? totalReceived / totalTips : 0;
        donations = data.donations || [];
        if (donations.length > 0) {
          const top = donations.reduce((max: any, d: any) => {
            const maxUsd =
              max.currency === "USDC"
                ? max.amount / 1e6
                : (max.amount / 1e9) * solPrice;
            const dUsd =
              d.currency === "USDC"
                ? d.amount / 1e6
                : (d.amount / 1e9) * solPrice;
            return dUsd > maxUsd ? d : max;
          }, donations[0]);
          biggestTip =
            top.currency === "USDC"
              ? top.amount / 1e6
              : (top.amount / 1e9) * solPrice;
          biggestTipOriginal =
            top.currency === "USDC" ? top.amount / 1e6 : top.amount / 1e9;
          biggestTipCurrency = top.currency || "SOL";
          biggestTipper = top.sender_name || "Anonymous";
        }
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
          const loadedAmount = data.settings.min_amount || 10000000;
          minAmount = Math.max(loadedAmount, 10000000) / 1e9;
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

    if (minAmount < 0.01) {
      minAmount = 0.01;
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
      const message = `Update GlianaPay settings for ${slug}`;
      const signatureData = await signAuthMessage(message);

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
            min_amount: Math.floor(minAmount * 1e9),
            sound_url: soundUrl,
            skip_hotkey: skipHotkey,
          }),
        },
      );

      if (response.ok) {
        showToast("Alert settings saved!", "success");

        // Notify overlay about settings change via WebSocket
        if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
          console.log("[Dashboard] Sending settings_changed to overlay");
          wsSocket.send(JSON.stringify({ type: "settings_changed" }));
        } else {
          console.log(
            "[Dashboard] WebSocket not connected, overlay won't be notified",
          );
        }
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
    try {
      await $walletStore.disconnect();
    } catch {}
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
    loadGoals();
    loading = false;

    // Fetch Cloudflare status (non-blocking)
    loadCloudflareStatus();

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
        class="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between"
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

    <div class="max-w-[1600px] mx-auto px-4 py-8 relative z-10">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <div class="flex justify-between items-start">
            <p class="text-zinc-400 text-sm">Total Received</p>
            <button
              on:click={() => (hideEarnings = !hideEarnings)}
              class="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title={hideEarnings ? "Show earnings" : "Hide earnings"}
            >
              {#if hideEarnings}
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              {:else}
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              {/if}
            </button>
          </div>
          <p class="text-3xl font-bold text-gradient mt-1">
            {hideEarnings ? "••••••" : `$${totalReceived.toFixed(2)}`}
          </p>
          {#if !hideEarnings && (totalUsdc > 0 || totalSol > 0)}
            <div class="flex items-center gap-2 mt-2 text-xs font-medium">
              {#if totalUsdc > 0}
                <div
                  class="flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400"
                >
                  <span class="opacity-70 font-normal">USDC</span>
                  <span>{totalUsdc.toFixed(2)}</span>
                </div>
              {/if}
              {#if totalSol > 0}
                <div
                  class="flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400"
                >
                  <span class="opacity-70 font-normal">SOL</span>
                  <span>{parseFloat(totalSol.toFixed(3))}</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Total Tips</p>
          <p class="text-3xl font-bold mt-1">
            {hideEarnings ? "•••" : totalTips}
          </p>
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Average</p>
          <p class="text-3xl font-bold mt-1">
            {hideEarnings ? "••••" : `$${average.toFixed(2)}`}
          </p>
          {#if !hideEarnings && totalTips > 0}
            <p class="text-xs text-zinc-500 mt-1">per tip</p>
          {/if}
        </div>
        <div class="glass-card p-6 rounded-2xl border border-white/10">
          <p class="text-zinc-400 text-sm">Biggest Tip</p>
          <p class="text-3xl font-bold text-yellow-400 mt-1">
            {hideEarnings ? "••••" : `$${biggestTip.toFixed(2)}`}
          </p>
          {#if !hideEarnings && biggestTipper}
            <p class="text-xs text-zinc-500 mt-1">
              {parseFloat(
                biggestTipOriginal.toFixed(
                  biggestTipCurrency === "USDC" ? 2 : 3,
                ),
              )}
              {biggestTipCurrency} · by {biggestTipper}
            </p>
          {/if}
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

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Recent Donations -->
        <div class="lg:col-span-3">
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
                        {hideEarnings
                          ? "••••"
                          : donation.currency === "USDC"
                            ? `${parseFloat((donation.amount / 1e6).toFixed(2))} USDC`
                            : `${parseFloat((donation.amount / 1e9).toFixed(3))} SOL`}
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

        <div class="lg:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Alert Settings -->
            <div class="glass-card rounded-2xl border border-white/10 p-6">
              <h2 class="font-bold text-lg mb-4">Alert Settings</h2>
              <div class="space-y-4">
                <div>
                  <label
                    for="min-amount"
                    class="block text-sm text-zinc-400 mb-2"
                    >Minimum Tip to Show Alert (SOL)</label
                  >
                  <input
                    type="number"
                    id="min-amount"
                    bind:value={minAmount}
                    step="0.01"
                    min="0.01"
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
                        >Default</button
                      >
                    </div>
                  </div>
                </div>
                {#if soundError}
                  <p class="text-red-400 text-sm">{soundError}</p>
                {/if}
                <div>
                  <label class="block text-sm text-zinc-400 mb-2"
                    >Skip Alert Hotkey</label
                  >
                  <div class="flex items-center gap-2">
                    <button
                      on:click={() => (isRecordingHotkey = true)}
                      on:keydown|preventDefault
                      class="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-white font-mono text-center cursor-pointer"
                    >
                      {#if isRecordingHotkey}
                        <span class="text-yellow-400"
                          >Press key or combo...</span
                        >
                      {:else}
                        {skipHotkey || "Click to set"}
                      {/if}
                    </button>
                    <button
                      on:click={() => (isRecordingHotkey = !isRecordingHotkey)}
                      class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300"
                      >{isRecordingHotkey ? "Cancel" : "Change"}</button
                    >
                  </div>
                  <p class="text-xs text-zinc-500 mt-1">
                    Works when dashboard or overlay is focused
                  </p>
                </div>
                <button
                  on:click={saveAlertSettings}
                  disabled={alertsLoading}
                  class="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  {#if alertsLoading}Saving...{:else}Save Alert Settings{/if}
                </button>
              </div>
            </div>

            <!-- OBS Overlay -->
            <div class="glass-card rounded-2xl border border-white/10 p-6">
              <h2 class="font-bold text-lg mb-4">OBS Overlay</h2>
              <p class="text-sm text-zinc-400 mb-3">
                How to add tip alerts to your stream:
              </p>
              <ol class="text-sm text-zinc-300 space-y-1 mb-4">
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">1.</span><span
                    >In OBS, add a <strong>Browser Source</strong></span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">2.</span><span
                    >Toggle sound below, copy URL, paste in Browser Source</span
                  >
                </li>
              </ol>
              <div class="mb-3">
                <label
                  class="flex items-center gap-2 text-sm text-zinc-300 mb-2"
                >
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
                    >https://glianapay.com/overlay/{slug}{soundEnabled
                      ? "?sound=1"
                      : ""}</code
                  >
                  <button
                    on:click={() =>
                      navigator.clipboard.writeText(
                        `https://glianapay.com/overlay/${slug}${soundEnabled ? "?sound=1" : ""}`,
                      )}
                    class="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg text-xs whitespace-nowrap cursor-pointer"
                    >Copy</button
                  >
                </div>
              </div>
              <ol class="text-sm text-zinc-300 space-y-1 mb-3">
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">3.</span><span
                    >Set Width: <strong>600</strong>, Height:
                    <strong>400</strong></span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">4.</span><span
                    >Check "Shutdown source when not visible"</span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">5.</span><span
                    >Position the overlay in your scene</span
                  >
                </li>
              </ol>
              <div class="flex flex-wrap items-center gap-3 mt-3">
                <a
                  href="/overlay/{slug}?sound=1&preview=1"
                  target="_blank"
                  class="inline-flex items-center text-sm text-cyan-400 hover:underline"
                  ><span>Preview Overlay</span></a
                >
                <button
                  on:click={testAlertWS}
                  disabled={testInProgress}
                  class="inline-flex items-center text-sm text-yellow-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  ><span>{testInProgress ? "Sending..." : "Test Alert"}</span
                  ></button
                >
                <button
                  on:click={skipCurrentAlert}
                  class="inline-flex items-center text-sm text-red-400 hover:underline"
                  ><span>Skip Alert</span></button
                >
              </div>
              <p class="text-xs text-zinc-500 mt-3">
                <span class="text-yellow-500">Tip:</span> If settings don't update,
                right-click the Browser Source in OBS and select "Interact" then
                refresh the page.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <!-- Goal Bar Widget -->
            <div class="glass-card rounded-2xl border border-white/10 p-6">
              <h2 class="font-bold text-lg mb-1">Tipping Goals</h2>
              <p class="text-sm text-zinc-400 mb-4">
                Set a tipping goal that your audience can see and contribute to
                in real time.
              </p>

              <!-- Create Goal -->
              <div class="space-y-2 mb-4">
                <input
                  type="text"
                  bind:value={newGoalTitle}
                  placeholder="Goal title (e.g. New Mic)"
                  class="w-full text-sm bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                />
                <input
                  type="number"
                  bind:value={newGoalTarget}
                  placeholder="Target amount in SOL"
                  step="0.01"
                  min="0.01"
                  class="w-full text-sm bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  on:click={createGoal}
                  disabled={goalsLoading}
                  class="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm cursor-pointer"
                  >{goalsLoading ? "Creating..." : "+ Create Goal"}</button
                >
              </div>

              <!-- Active Goals List -->
              {#if goals.length > 0}
                <div class="space-y-3 mb-4">
                  {#each goals as goal}
                    {@const pct =
                      goal.target_amount > 0
                        ? Math.min(
                            (goal.current_amount / goal.target_amount) * 100,
                            100,
                          )
                        : 0}
                    <div
                      class="bg-black/30 rounded-xl p-3 border border-white/5"
                    >
                      {#if editingGoalId === goal.id}
                        <!-- Edit Form -->
                        <div class="space-y-2 mb-2">
                          <input
                            type="text"
                            bind:value={editGoalTitle}
                            placeholder="Goal title"
                            class="w-full text-sm bg-black/60 border border-white/20 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500/50"
                          />
                          <input
                            type="number"
                            bind:value={editGoalTarget}
                            placeholder="Target amount in SOL"
                            step="0.01"
                            min="0.01"
                            class="w-full text-sm bg-black/60 border border-white/20 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500/50"
                          />
                          <div class="flex gap-2">
                            <button
                              on:click={() => updateGoal(goal.id)}
                              disabled={editGoalLoading}
                              class="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
                            >
                              {editGoalLoading ? "..." : "Save"}
                            </button>
                            <button
                              on:click={cancelEditGoal}
                              disabled={editGoalLoading}
                              class="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      {:else}
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium">
                            {goal.title}
                            {#if !goal.is_active}
                              <span class="text-green-400 text-xs ml-1"
                                >✓ Done</span
                              >
                            {/if}
                          </span>
                          <div class="flex items-center gap-1">
                            {#if goal.is_active}
                              <button
                                on:click={() => startEditGoal(goal)}
                                class="text-xs text-zinc-500 hover:text-purple-400 px-1.5 py-0.5 rounded cursor-pointer"
                                title="Edit goal">✎</button
                              >
                            {/if}
                            <button
                              on:click={() => resetGoal(goal.id)}
                              class="text-xs text-zinc-500 hover:text-cyan-400 px-1.5 py-0.5 rounded cursor-pointer"
                              title="Reset progress">↻</button
                            >
                            <button
                              on:click={() => deleteGoal(goal.id)}
                              class="text-xs text-zinc-500 hover:text-red-400 px-1.5 py-0.5 rounded cursor-pointer"
                              title="Delete">✕</button
                            >
                          </div>
                        </div>
                        <div
                          class="relative h-4 bg-white/5 rounded-full overflow-hidden"
                        >
                          <div
                            class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                            style="width: {pct}%"
                          ></div>
                        </div>
                        <div class="text-xs text-zinc-500 mt-1">
                          ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(
                            2,
                          )}
                          <span class="text-zinc-600">({pct.toFixed(0)}%)</span>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-sm text-zinc-500 mb-4">
                  No goals yet. Create one above.
                </p>
              {/if}

              <!-- Goal Bar OBS URL -->
              <h3 class="text-sm font-semibold text-zinc-300 mb-2">
                OBS Goal Bar
              </h3>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="text-xs text-zinc-400 block mb-1">Theme</label>
                  <select
                    bind:value={goalBarTheme}
                    class="w-full text-xs bg-black/40 border border-white/10 text-white rounded-lg px-2 py-2 focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-zinc-400 block mb-1"
                    >Bar Color</label
                  >
                  <input
                    type="text"
                    bind:value={goalBarColor}
                    placeholder="a855f7"
                    class="w-full text-xs bg-black/40 border border-white/10 text-white rounded-lg px-2 py-2 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2 mb-3">
                <code
                  class="flex-1 text-xs text-green-400 bg-black/30 p-2 rounded break-all"
                  >{goalBarUrl}</code
                >
                <button
                  on:click={copyGoalBarUrl}
                  class="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg text-xs whitespace-nowrap cursor-pointer"
                  >{goalBarCopied ? "✓ Copied!" : "Copy"}</button
                >
              </div>
              <ol class="text-sm text-zinc-300 space-y-1">
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">1.</span><span
                    >In OBS, add a new <strong>Browser Source</strong></span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">2.</span><span
                    >Paste the URL above</span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">3.</span><span
                    >Set Width: <strong>400</strong>, Height:
                    <strong>80</strong></span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">4.</span><span
                    >Position it anywhere on your scene</span
                  >
                </li>
              </ol>
              <a
                href="/overlay/{slug}/goalbar?theme={goalBarTheme}&color={goalBarColor}&preview=1"
                target="_blank"
                class="inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline mt-2"
                ><span>Preview Goal Bar</span></a
              >
            </div>

            <!-- Event List Widget -->
            <div class="glass-card rounded-2xl border border-white/10 p-6">
              <h2 class="font-bold text-lg mb-1">Event List</h2>
              <p class="text-sm text-zinc-400 mb-4">
                Show recent tips or top tippers as a live list on your stream.
              </p>
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label class="text-xs text-zinc-400 block mb-1">Display</label
                  >
                  <select
                    bind:value={eventListMode}
                    class="w-full text-xs bg-black/40 border border-white/10 text-white rounded-lg px-2 py-2 focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="recent">Recent Tips</option>
                    <option value="top_today">Top Today</option>
                    <option value="top_week">Top This Week</option>
                    <option value="top_month">Top This Month</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-zinc-400 block mb-1">Show</label>
                  <select
                    bind:value={eventListLimit}
                    class="w-full text-xs bg-black/40 border border-white/10 text-white rounded-lg px-2 py-2 focus:outline-none focus:border-purple-500/50"
                  >
                    <option value={1}>1 item</option>
                    <option value={3}>3 items</option>
                    <option value={5}>5 items</option>
                    <option value={10}>10 items</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-zinc-400 block mb-1">Theme</label>
                  <select
                    bind:value={eventListTheme}
                    class="w-full text-xs bg-black/40 border border-white/10 text-white rounded-lg px-2 py-2 focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center gap-2 mb-3">
                <code
                  class="flex-1 text-xs text-green-400 bg-black/30 p-2 rounded break-all"
                  >{eventListUrl}</code
                >
                <button
                  on:click={copyEventListUrl}
                  class="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg text-xs whitespace-nowrap cursor-pointer"
                  >{eventListCopied ? "✓ Copied!" : "Copy"}</button
                >
              </div>
              <ol class="text-sm text-zinc-300 space-y-1 mb-3">
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">1.</span><span
                    >In OBS, add a new <strong>Browser Source</strong></span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">2.</span><span
                    >Paste the URL above</span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">3.</span><span
                    >Set Width: <strong>400</strong>, Height:
                    <strong>300</strong></span
                  >
                </li>
                <li class="flex gap-2">
                  <span class="text-purple-400 font-bold">4.</span><span
                    >Position it anywhere on your scene</span
                  >
                </li>
              </ol>
              <a
                href="/overlay/{slug}/eventlist?mode={eventListMode}&limit={eventListLimit}&theme={eventListTheme}&preview=1"
                target="_blank"
                class="inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline"
                ><span>Preview Event List</span></a
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="relative md:absolute md:bottom-6 left-0 right-0 px-4 py-6 md:py-0 flex items-center justify-between"
    >
      <a
        href="mailto:support@glianapay.com?subject=Report Bug"
        class="text-xs text-zinc-500 hover:text-white transition-colors"
        >Report Bug</a
      >

      <!-- Cloudflare Status -->
      {#if cfStatus !== "loading"}
        <div
          class="relative"
          on:mouseenter={() => (showStatusDropdown = true)}
          on:mouseleave={() => (showStatusDropdown = false)}
          role="status"
        >
          <button
            on:click={() => (showStatusDropdown = !showStatusDropdown)}
            class="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <span
              class="w-1.5 h-1.5 rounded-full
              {cfStatus === 'operational'
                ? 'bg-emerald-400'
                : cfStatus === 'under_maintenance'
                  ? 'bg-blue-400'
                  : cfStatus === 'partial_outage'
                    ? 'bg-yellow-400'
                    : cfStatus === 'major_outage'
                      ? 'bg-red-400'
                      : 'bg-zinc-400'}"
            ></span>
            <span class="hidden sm:inline">
              {cfStatus === "operational"
                ? "All Systems Operational"
                : cfStatus === "under_maintenance"
                  ? "Under Maintenance"
                  : cfStatus === "partial_outage"
                    ? "Partial Degradation"
                    : cfStatus === "major_outage"
                      ? "Major Outage"
                      : "Status Unavailable"}
            </span>
          </button>

          {#if showStatusDropdown}
            <div
              class="absolute right-0 bottom-full mb-2 w-72 glass-card rounded-xl border border-white/10 p-4 z-50 shadow-2xl"
              transition:fade={{ duration: 150 }}
            >
              <div
                class="text-[10px] text-zinc-500 uppercase tracking-wider mb-3"
              >
                Status
              </div>

              {#if cfCityName}
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="w-2 h-2 rounded-full shrink-0
                      {cfCityStatus === 'operational'
                        ? 'bg-emerald-400'
                        : cfCityStatus === 'partial_outage'
                          ? 'bg-yellow-400'
                          : cfCityStatus === 'major_outage'
                            ? 'bg-red-400'
                            : cfCityStatus === 'under_maintenance'
                              ? 'bg-blue-400'
                              : 'bg-zinc-400'}"
                    ></span>
                    <span class="text-xs font-medium text-white"
                      >{cfCityName}</span
                    >
                  </div>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded font-medium
                    {cfCityStatus === 'operational'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : cfCityStatus === 'partial_outage'
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : cfCityStatus === 'major_outage'
                          ? 'text-red-400 bg-red-500/10'
                          : cfCityStatus === 'under_maintenance'
                            ? 'text-blue-400 bg-blue-500/10'
                            : 'text-zinc-400 bg-zinc-500/10'}"
                  >
                    {getStatusLabel(cfCityStatus)}
                  </span>
                </div>
              {:else}
                <div class="flex items-center gap-2 text-emerald-400 text-xs">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  All systems operational
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Toast -->
  {#if toast}
    <div
      transition:slide={{ duration: 300 }}
      class="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 {toastType ===
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
