<script lang="ts">
    import FloatingIcons from "$lib/components/FloatingIcons.svelte";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { disconnectWallet } from "$lib/wallet";
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

    // Settings
    let alertsLoading = false;
    let socialsLoading = false;
    let minAmount = 0.001;
    let soundUrl =
        "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3";

    // Profile Settings
    let name = "";
    let xUrl = "";
    let redditUrl = "";
    let youtubeUrl = "";
    let kickUrl = "";
    let twitchUrl = "";
    let tiktokUrl = "";
    let facebookUrl = "";
    let instagramUrl = "";
    let description = "";

    // Load session
    function loadSession() {
        if (typeof window === "undefined") return;

        const saved = localStorage.getItem("gliana_session");
        if (saved) {
            const session = JSON.parse(saved);
            walletAddress = session.walletAddress || "";
            slug = session.slug || "";
        }
    }

    // Load settings data
    async function loadSettings() {
        if (!slug) return;

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
                    xUrl = data.streamer.x_url || "";
                    redditUrl = data.streamer.reddit_url || "";
                    youtubeUrl = data.streamer.youtube_url || "";
                    kickUrl = data.streamer.kick_url || "";
                    twitchUrl = data.streamer.twitch_url || "";
                    tiktokUrl = data.streamer.tiktok_url || "";
                    facebookUrl = data.streamer.facebook_url || "";
                    instagramUrl = data.streamer.instagram_url || "";
                    description = data.streamer.description || "";
                }
            }
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }

    // Save settings
    let soundError = "";

    async function saveSettings(type: "alerts" | "socials") {
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
            if (type === "alerts") return;
        }

        if (type === "alerts") alertsLoading = true;
        else socialsLoading = true;

        try {
            const response = await fetch(
                `${WORKER_URL}/api/streamer/${slug}/settings`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        min_amount: Math.floor(minAmount * 1e6),
                        sound_url: soundUrl,
                        name: name,
                        x_url: xUrl,
                        reddit_url: redditUrl,
                        youtube_url: youtubeUrl,
                        kick_url: kickUrl,
                        twitch_url: twitchUrl,
                        tiktok_url: tiktokUrl,
                        facebook_url: facebookUrl,
                        instagram_url: instagramUrl,
                        description: description,
                    }),
                },
            );

            if (response.ok) {
                showToast(
                    type === "alerts"
                        ? "Alert settings saved!"
                        : "Profile settings saved!",
                    "success",
                );
            } else {
                const errorData = await response.json().catch(() => ({}));
                showToast(
                    (errorData as { error?: string }).error ||
                        "Failed to save settings",
                );
            }
        } catch (e) {
            showToast("Failed to save settings");
        } finally {
            alertsLoading = false;
            socialsLoading = false;
        }
    }

    // Logout
    async function handleLogout() {
        await disconnectWallet();
        localStorage.removeItem("gliana_session");
        sessionStorage.setItem("gliana_just_logged_out", "1");
        window.location.href = "/";
    }

    // Go to homepage
    function goToHomepage() {
        window.location.href = "/";
    }

    onMount(() => {
        loadSession();

        if (!walletAddress || !slug) {
            window.location.href = "/login";
            return;
        }

        loadSettings();
        loading = false;
    });
</script>

<svelte:head>
    <title>Settings - GlianaPay</title>
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
                    <a
                        href="/dashboard"
                        class="text-zinc-400 hover:text-white text-sm transition-colors"
                        >Dashboard</a
                    >
                    <span class="text-purple-400 text-sm font-medium"
                        >Settings</span
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

        <div class="max-w-3xl mx-auto px-4 py-8 relative z-10">
            <!-- Page Title -->
            <div class="mb-8">
                <h1 class="text-2xl font-bold">Settings</h1>
                <p class="text-zinc-400 text-sm mt-1">
                    Manage your alerts, profile, and social links
                </p>
            </div>

            <!-- Alert Settings -->
            <div class="glass-card rounded-2xl border border-white/10 p-6 mb-6">
                <h2 class="font-bold text-lg mb-4">Alert Settings</h2>
                <div class="space-y-4">
                    <div>
                        <label
                            for="min-amount"
                            class="block text-sm text-zinc-400 mb-2"
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
                        <label
                            for="sound"
                            class="block text-sm text-zinc-400 mb-2"
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

                    <button
                        on:click={() => saveSettings("alerts")}
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

            <!-- Profile Settings -->
            <div class="glass-card rounded-2xl border border-white/10 p-6 mb-6">
                <h2 class="font-bold text-lg mb-4">Profile Information</h2>
                <div class="space-y-4">
                    <div>
                        <label
                            for="name"
                            class="block text-xs text-zinc-400 mb-1"
                            >Display Name</label
                        >
                        <input
                            type="text"
                            id="name"
                            bind:value={name}
                            placeholder="Your Streamer Name"
                            class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                        />
                    </div>
                    <div>
                        <label
                            for="description"
                            class="block text-xs text-zinc-400 mb-1"
                            >Profile Description</label
                        >
                        <textarea
                            id="description"
                            bind:value={description}
                            placeholder="Tell your supporters about yourself..."
                            rows="3"
                            class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white resize-y"
                        ></textarea>
                    </div>
                </div>

                <div class="mt-6 space-y-4 pt-4 border-t border-white/10">
                    <h3 class="text-sm font-semibold text-zinc-300">
                        Social Links
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                for="x"
                                class="block text-xs text-zinc-400 mb-1"
                                >X (Twitter) URL</label
                            >
                            <input
                                type="url"
                                id="x"
                                bind:value={xUrl}
                                placeholder="https://x.com/username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="twitch"
                                class="block text-xs text-zinc-400 mb-1"
                                >Twitch URL</label
                            >
                            <input
                                type="url"
                                id="twitch"
                                bind:value={twitchUrl}
                                placeholder="https://twitch.tv/username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="youtube"
                                class="block text-xs text-zinc-400 mb-1"
                                >YouTube URL</label
                            >
                            <input
                                type="url"
                                id="youtube"
                                bind:value={youtubeUrl}
                                placeholder="https://youtube.com/@username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="kick"
                                class="block text-xs text-zinc-400 mb-1"
                                >Kick URL</label
                            >
                            <input
                                type="url"
                                id="kick"
                                bind:value={kickUrl}
                                placeholder="https://kick.com/username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="reddit"
                                class="block text-xs text-zinc-400 mb-1"
                                >Reddit URL</label
                            >
                            <input
                                type="url"
                                id="reddit"
                                bind:value={redditUrl}
                                placeholder="https://reddit.com/user/username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="tiktok"
                                class="block text-xs text-zinc-400 mb-1"
                                >TikTok URL</label
                            >
                            <input
                                type="url"
                                id="tiktok"
                                bind:value={tiktokUrl}
                                placeholder="https://tiktok.com/@username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="instagram"
                                class="block text-xs text-zinc-400 mb-1"
                                >Instagram URL</label
                            >
                            <input
                                type="url"
                                id="instagram"
                                bind:value={instagramUrl}
                                placeholder="https://instagram.com/username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="facebook"
                                class="block text-xs text-zinc-400 mb-1"
                                >Facebook URL</label
                            >
                            <input
                                type="url"
                                id="facebook"
                                bind:value={facebookUrl}
                                placeholder="https://facebook.com/username"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                    </div>
                </div>

                <button
                    on:click={() => saveSettings("socials")}
                    disabled={socialsLoading}
                    class="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-semibold transition-all cursor-pointer"
                >
                    {#if socialsLoading}
                        Saving...
                    {:else}
                        Save Profile Settings
                    {/if}
                </button>
            </div>

            <!-- Back to Dashboard -->
            <div class="text-center">
                <a
                    href="/dashboard"
                    class="text-sm text-zinc-400 hover:text-white transition-colors"
                    >← Back to Dashboard</a
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
    </div>
{/if}

<style>
    .glass-card {
        background: rgba(17, 17, 19, 0.8);
        backdrop-filter: blur(12px);
    }
</style>
