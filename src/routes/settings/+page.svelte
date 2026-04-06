<script lang="ts">
    import FloatingIcons from "$lib/components/FloatingIcons.svelte";
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { walletStore } from "@aztemi/svelte-on-solana-wallet-adapter-core";
    import { signAuthMessage } from "$lib/wallet-helpers";
    import { WORKER_URL } from "$lib/config";
    import {
        RegExpMatcher,
        englishDataset,
        englishRecommendedTransformers,
    } from "obscenity";

    const matcher = new RegExpMatcher({
        ...englishDataset.build(),
        ...englishRecommendedTransformers,
    });

    function containsProfanity(text: string): boolean {
        if (!text) return false;
        return matcher.hasMatch(text);
    }
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
    let socialsLoading = false;

    // Alert Settings
    let minAmountSol = 0.01; // in SOL
    let minAmountUsdc = 1; // in USDC
    let soundUrl = "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3";
    let soundError = "";
    let skipHotkey = "s";
    let isRecordingHotkey = false;

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
    let discordUrl = "";
    let email = "";
    let description = "";
    let tipBgColor = "";

    // Image Upload State
    let profileImageUrl = "";
    let bannerUrl = "";
    let tipBgUrl = "";
    let alertImageUrl = "";
    let imageVersion = 1;

    // Track original URLs to detect deletions
    let originalProfileUrl = "";
    let originalBannerUrl = "";
    let originalTipBgUrl = "";
    let originalAlertImageUrl = "";

    // Local Files Pending Upload
    let pendingProfileFile: File | null = null;
    let pendingBannerFile: File | null = null;
    let pendingBgFile: File | null = null;
    let pendingAlertImageFile: File | null = null;

    // Local URLs for immediate UI Preview before save
    let localProfilePreview = "";
    let localBannerPreview = "";
    let localBgPreview = "";
    let localAlertImagePreview = "";

    let uploadingProfile = false;
    let uploadingBanner = false;
    let uploadingBg = false;
    let uploadingAlertImage = false;
    let profileInput: HTMLInputElement;
    let bannerInput: HTMLInputElement;
    let bgInput: HTMLInputElement;
    let alertImageInput: HTMLInputElement;
    let cacheBust = Date.now();

    // Streaming Platform Chat Connections
    let connectedPlatforms = {
        twitch: false,
        kick: false,
        youtube: false,
    };
    let connectingPlatform = "";
    let streamingLoading = false;

    // Track images marked for deletion (sent to server on save)
    let deletedImages: string[] = [];

    // Listen for OAuth callback messages
    function handleOAuthMessage(event: MessageEvent) {
        const data = event.data;
        if (data.success) {
            showToast(`Connected to ${data.platform} successfully!`, "success");
            checkConnectedPlatforms();
        } else if (data.error) {
            showToast(`Failed to connect: ${data.error}`, "error");
        }
        connectingPlatform = "";
    }

    // Clean up local object URLs when component is destroyed
    import { onDestroy } from "svelte";
    onDestroy(() => {
        if (localProfilePreview) URL.revokeObjectURL(localProfilePreview);
        if (localBannerPreview) URL.revokeObjectURL(localBannerPreview);
        if (localBgPreview) URL.revokeObjectURL(localBgPreview);
        if (localAlertImagePreview) URL.revokeObjectURL(localAlertImagePreview);
    });

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
                    discordUrl = data.streamer.discord_url || "";
                    email = data.streamer.email || "";
                    description = data.streamer.description || "";
                    profileImageUrl = data.streamer.profile_image_url || "";
                    bannerUrl = data.streamer.banner_url || "";
                    tipBgColor = data.streamer.tip_bg_color || "";
                    tipBgUrl = data.streamer.tip_bg_url || "";
                    imageVersion = data.streamer.image_version || 1;
                    skipHotkey = data.streamer.skip_hotkey || "s";

                    // Store original URLs for deletion tracking
                    originalProfileUrl = data.streamer.profile_image_url || "";
                    originalBannerUrl = data.streamer.banner_url || "";
                    originalTipBgUrl = data.streamer.tip_bg_url || "";
                }
                // Load alert settings
                if (data.settings) {
                    const loadedAmountSol = data.settings.min_amount_sol || 10000000;
                    minAmountSol = Math.max(loadedAmountSol, 10000000) / 1e9;
                    const loadedAmountUsdc = data.settings.min_amount_usdc || 1000000;
                    minAmountUsdc = Math.max(loadedAmountUsdc, 1000000) / 1e6;
                    soundUrl = data.settings.sound_url || "https://www.myinstants.com/media/sounds/default_eKkIk7O.mp3";
                }
                // Load alert image from settings
                if (
                    data.settings?.image_url &&
                    data.settings.image_url !==
                        "https://cdn.gliana.app/alerts/default.png"
                ) {
                    alertImageUrl = data.settings.image_url;
                    originalAlertImageUrl = data.settings.image_url;
                }
            }
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }

    // Save settings
    async function saveSettings() {
        if (!walletAddress) {
            showToast("Please connect your wallet first", "error");
            return;
        }

        if (name && containsProfanity(name)) {
            showToast("Display Name contains restricted words.", "error");
            return;
        }

        if (description && containsProfanity(description)) {
            showToast(
                "Profile Description contains restricted words.",
                "error",
            );
            return;
        }

        socialsLoading = true;

        try {
            // Prompt for signature
            const message = `Update GlianaPay settings for ${slug}`;
            const signatureData = await signAuthMessage(message);

            if (!signatureData) {
                showToast("Signature request cancelled", "error");
                socialsLoading = false;
                return;
            }

            // Upload any pending pending images first
            if (
                pendingProfileFile ||
                pendingBannerFile ||
                pendingBgFile ||
                pendingAlertImageFile
            ) {
                // If there are files to upload, we'll do it sequentially here using the same signature
                if (pendingProfileFile) {
                    uploadingProfile = true;
                    showToast("Uploading profile photo...", "success");
                    const ok = await performImageUpload(
                        "profile",
                        pendingProfileFile,
                        signatureData.signature,
                    );
                    if (!ok) {
                        socialsLoading = false;
                        return;
                    }
                    uploadingProfile = false;
                }

                if (pendingBannerFile) {
                    uploadingBanner = true;
                    showToast("Uploading banner...", "success");
                    const ok = await performImageUpload(
                        "banner",
                        pendingBannerFile,
                        signatureData.signature,
                    );
                    if (!ok) {
                        socialsLoading = false;
                        return;
                    }
                    uploadingBanner = false;
                }

                if (pendingBgFile) {
                    uploadingBg = true;
                    showToast("Uploading background...", "success");
                    const ok = await performImageUpload(
                        "background",
                        pendingBgFile,
                        signatureData.signature,
                    );
                    if (!ok) {
                        socialsLoading = false;
                        return;
                    }
                    uploadingBg = false;
                }

                if (pendingAlertImageFile) {
                    uploadingAlertImage = true;
                    showToast("Uploading alert image...", "success");
                    const ok = await performImageUpload(
                        "alert_image",
                        pendingAlertImageFile,
                        signatureData.signature,
                    );
                    if (!ok) {
                        socialsLoading = false;
                        return;
                    }
                    uploadingAlertImage = false;
                }
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
                        name: name,
                        x_url: xUrl,
                        reddit_url: redditUrl,
                        youtube_url: youtubeUrl,
                        kick_url: kickUrl,
                        twitch_url: twitchUrl,
                        tiktok_url: tiktokUrl,
                        facebook_url: facebookUrl,
                        instagram_url: instagramUrl,
                        discord_url: discordUrl,
                        email: email,
                        description: description,
                        profile_image_url: profileImageUrl,
                        banner_url: bannerUrl,
                        tip_bg_url: tipBgUrl,
                        image_url: alertImageUrl,
                        min_amount_sol: Math.floor(minAmountSol * 1e9),
                        min_amount_usdc: Math.floor(minAmountUsdc * 1e6),
                        sound_url: soundUrl,
                        skip_hotkey: skipHotkey,
                        deleted_images: deletedImages.filter(
                            (url) =>
                                url !== profileImageUrl &&
                                url !== bannerUrl &&
                                url !== tipBgUrl &&
                                url !== alertImageUrl,
                        ),
                    }),
                },
            );

            if (response.ok) {
                // Clear pending files after successful save
                pendingProfileFile = null;
                pendingBannerFile = null;
                pendingBgFile = null;
                pendingAlertImageFile = null;
                if (localProfilePreview)
                    URL.revokeObjectURL(localProfilePreview);
                if (localBannerPreview) URL.revokeObjectURL(localBannerPreview);
                if (localBgPreview) URL.revokeObjectURL(localBgPreview);
                if (localAlertImagePreview)
                    URL.revokeObjectURL(localAlertImagePreview);
                localProfilePreview = "";
                localBannerPreview = "";
                localBgPreview = "";
                localAlertImagePreview = "";

                // Clear deleted images tracking after successful save
                deletedImages = [];

                showToast("Profile settings saved!", "success");
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
            socialsLoading = false;
        }
    }

    // Helper to actually perform backend upload using an already-obtained signature
    async function performImageUpload(
        type: "profile" | "banner" | "background" | "alert_image",
        file: File,
        signature: string,
    ): Promise<boolean> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const skipDb = type === "alert_image" ? "false" : "true";
            const response = await fetch(
                `${WORKER_URL}/api/streamer/${slug}/upload?type=${type}&skipDb=${skipDb}`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${walletAddress}:${signature}`,
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                if (type === "profile") profileImageUrl = data.url;
                else if (type === "banner") bannerUrl = data.url;
                else if (type === "alert_image") alertImageUrl = data.url;
                else tipBgUrl = data.url;
                // Increment version to bust cache after upload
                imageVersion += 1;
                return true;
            } else {
                const err = await response.json().catch(() => ({}));
                showToast((err as { error?: string }).error || "Upload failed");
                return false;
            }
        } catch (e) {
            showToast("Upload failed");
            return false;
        }
    }

    function handleProfileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) {
            pendingProfileFile = input.files[0];
            if (localProfilePreview) URL.revokeObjectURL(localProfilePreview);
            localProfilePreview = URL.createObjectURL(pendingProfileFile);
        }
    }

    function handleBannerSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) {
            pendingBannerFile = input.files[0];
            if (localBannerPreview) URL.revokeObjectURL(localBannerPreview);
            localBannerPreview = URL.createObjectURL(pendingBannerFile);
        }
    }

    function handleBgSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) {
            pendingBgFile = input.files[0];
            if (localBgPreview) URL.revokeObjectURL(localBgPreview);
            localBgPreview = URL.createObjectURL(pendingBgFile);
        }
    }

    function handleAlertImageSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) {
            pendingAlertImageFile = input.files[0];
            if (localAlertImagePreview)
                URL.revokeObjectURL(localAlertImagePreview);
            localAlertImagePreview = URL.createObjectURL(pendingAlertImageFile);
        }
    }

    async function removeImage(
        type: "profile" | "banner" | "background" | "alert_image",
    ) {
        if (type === "profile") {
            if (
                originalProfileUrl &&
                !deletedImages.includes(originalProfileUrl)
            ) {
                deletedImages.push(originalProfileUrl);
            }
            originalProfileUrl = "";
            profileImageUrl = "";
            pendingProfileFile = null;
            if (localProfilePreview) URL.revokeObjectURL(localProfilePreview);
            localProfilePreview = "";
        } else if (type === "banner") {
            if (
                originalBannerUrl &&
                !deletedImages.includes(originalBannerUrl)
            ) {
                deletedImages.push(originalBannerUrl);
            }
            originalBannerUrl = "";
            bannerUrl = "";
            pendingBannerFile = null;
            if (localBannerPreview) URL.revokeObjectURL(localBannerPreview);
            localBannerPreview = "";
        } else if (type === "alert_image") {
            if (
                originalAlertImageUrl &&
                !deletedImages.includes(originalAlertImageUrl)
            ) {
                deletedImages.push(originalAlertImageUrl);
            }
            originalAlertImageUrl = "";
            alertImageUrl = "";
            pendingAlertImageFile = null;
            if (localAlertImagePreview)
                URL.revokeObjectURL(localAlertImagePreview);
            localAlertImagePreview = "";
        } else {
            if (originalTipBgUrl && !deletedImages.includes(originalTipBgUrl)) {
                deletedImages.push(originalTipBgUrl);
            }
            originalTipBgUrl = "";
            tipBgUrl = "";
            pendingBgFile = null;
            if (localBgPreview) URL.revokeObjectURL(localBgPreview);
            localBgPreview = "";
        }
        imageVersion += 1;
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

    // Test & Skip alert
    let testInProgress = false;

    function testAlert() {
        if (testInProgress) return;
        testInProgress = true;
        const safetyTimeout = setTimeout(() => {
            testInProgress = false;
        }, 10000);
        fetch(`${WORKER_URL}/api/test-alert/${slug}`, { method: "POST" })
            .then(() => {
                showToast("Test alert sent!", "success");
            })
            .catch(() => {
                showToast("Failed to send test alert", "error");
            })
            .finally(() => {
                clearTimeout(safetyTimeout);
                testInProgress = false;
            });
    }

    function skipAlert() {
        fetch(`${WORKER_URL}/api/skip-alert/${slug}`, { method: "POST" })
            .then(() => showToast("Skipping current alert...", "success"))
            .catch(() => {});
    }
    // Handle keyboard for hotkey recording + skip alert
    function handleKeydown(event: KeyboardEvent) {
        // If recording hotkey, capture the key combination
        if (isRecordingHotkey) {
            event.preventDefault();
            event.stopPropagation();

            // Don't allow empty or modifier-only keys
            if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;

            const parts: string[] = [];
            if (event.ctrlKey) parts.push("ctrl");
            if (event.shiftKey) parts.push("shift");
            if (event.altKey) parts.push("alt");
            if (event.metaKey) parts.push("meta");
            parts.push(event.key.toLowerCase());
            skipHotkey = parts.join("+");
            isRecordingHotkey = false;
            return;
        }

        // Check if pressed combination matches skip hotkey
        const parts: string[] = [];
        if (event.ctrlKey) parts.push("ctrl");
        if (event.shiftKey) parts.push("shift");
        if (event.altKey) parts.push("alt");
        parts.push(event.key.toLowerCase());
        const currentCombo = parts.join("+");

        if (currentCombo === skipHotkey.toLowerCase()) {
            // Don't trigger if user is typing in an input
            const target = event.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
                return;
            }
            event.preventDefault();
            skipAlert();
        }
    }

    onMount(() => {
        loadSession();

        if (!walletAddress || !slug) {
            window.location.href = "/login";
            return;
        }

        // Listen for OAuth callback messages
        window.addEventListener("message", handleOAuthMessage);
        window.addEventListener("keydown", handleKeydown);

        loadSettings();
        checkConnectedPlatforms();
        loading = false;

        return () => {
            window.removeEventListener("message", handleOAuthMessage);
            window.removeEventListener("keydown", handleKeydown);
        };
    });

    // Check which platforms are connected
    async function checkConnectedPlatforms() {
        if (!slug) return;
        try {
            const res = await fetch(
                `${WORKER_URL}/api/streamer/${slug}/platforms`,
            );
            const data = await res.json();
            if (data.platforms) {
                connectedPlatforms = data.platforms;
            }
        } catch (e) {
            console.error("Failed to check platforms:", e);
        }
    }

    // Connect to a streaming platform
    async function connectPlatform(platform: string) {
        if (!slug) return;
        connectingPlatform = platform;
        try {
            const res = await fetch(
                `${WORKER_URL}/api/streamer/${slug}/connect/${platform}`,
                {
                    method: "POST",
                },
            );
            const data = await res.json();
            if (data.authUrl) {
                // Open OAuth popup
                const width = 600;
                const height = 700;
                const left = (window.innerWidth - width) / 2;
                const top = (window.innerHeight - height) / 2;
                window.open(
                    data.authUrl,
                    `${platform} connect`,
                    `width=${width},height=${height},left=${left},top=${top}`,
                );
            }
        } catch (e) {
            showToast(`Failed to connect to ${platform}`, "error");
            connectingPlatform = "";
        }
    }

    // Disconnect a streaming platform
    async function disconnectPlatform(platform: string) {
        if (!slug) return;
        streamingLoading = true;
        try {
            await fetch(
                `${WORKER_URL}/api/streamer/${slug}/disconnect/${platform}`,
                {
                    method: "POST",
                },
            );
            connectedPlatforms[platform as keyof typeof connectedPlatforms] =
                false;
            showToast(`Disconnected from ${platform}`, "success");
        } catch (e) {
            showToast(`Failed to disconnect ${platform}`, "error");
        }
        streamingLoading = false;
    }
</script>

<svelte:head>
    <meta name="robots" content="noindex, nofollow" />
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

        <div class="max-w-5xl mx-auto px-4 py-8 relative z-10">
            <!-- Page Title -->
            <div class="mb-8">
                <h1 class="text-2xl font-bold">Settings</h1>
                <p class="text-zinc-400 text-sm mt-1">
                    Manage your profile and social links
                </p>
            </div>

            <!-- Profile Settings -->
            <div class="glass-card rounded-2xl border border-white/10 p-6 mb-6">
                <h2 class="font-bold text-lg mb-4">Profile Information</h2>

                <!-- Banner Upload -->
                <div class="mb-5 relative">
                    <label
                        for="bannerUpload"
                        class="block text-xs text-zinc-400 mb-2"
                        >Banner Image <span class="text-zinc-600"
                            >(1500×500 recommended, max 5MB)</span
                        ></label
                    >
                    <button
                        id="bannerUpload"
                        on:click={() => bannerInput.click()}
                        class="w-full h-28 md:h-36 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-all overflow-hidden relative group cursor-pointer"
                    >
                        {#if localBannerPreview || bannerUrl}
                            <img
                                src={localBannerPreview
                                    ? localBannerPreview
                                    : `${WORKER_URL}/api/media/${bannerUrl}?v=${imageVersion}`}
                                alt="Banner"
                                class="w-full h-full object-cover"
                            />
                            <div
                                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                <span class="text-sm font-medium"
                                    >Change Banner</span
                                >
                            </div>
                        {:else}
                            <div
                                class="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 flex items-center justify-center"
                            >
                                {#if uploadingBanner}
                                    <div
                                        class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                    ></div>
                                {:else}
                                    <div class="text-center">
                                        <span class="text-2xl block mb-1"
                                            >🖼️</span
                                        >
                                        <span class="text-xs text-zinc-400"
                                            >Click to upload banner</span
                                        >
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </button>
                    <input
                        bind:this={bannerInput}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        on:change={handleBannerSelect}
                        class="hidden"
                    />
                    {#if localBannerPreview || bannerUrl}
                        <button
                            on:click={() => removeImage("banner")}
                            class="absolute top-2 right-2 z-10 w-6 h-6 bg-black/70 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all text-xs"
                            title="Remove banner">✕</button
                        >
                    {/if}
                </div>

                <!-- Tip Page Background Image -->
                <div class="mb-5 relative">
                    <label
                        for="bgUpload"
                        class="block text-xs text-zinc-400 mb-2"
                        >Tip Page Background <span class="text-zinc-600"
                            >(1920×1080 recommended, max 5MB)</span
                        ></label
                    >
                    <button
                        id="bgUpload"
                        on:click={() => bgInput.click()}
                        class="w-full h-24 md:h-28 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-all overflow-hidden relative group cursor-pointer"
                    >
                        {#if localBgPreview || tipBgUrl}
                            <img
                                src={localBgPreview
                                    ? localBgPreview
                                    : `${WORKER_URL}/api/media/${tipBgUrl}?v=${imageVersion}`}
                                alt="Background"
                                class="w-full h-full object-cover"
                            />
                            <div
                                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                <span class="text-sm font-medium"
                                    >Change Background</span
                                >
                            </div>
                        {:else}
                            <div
                                class="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 flex items-center justify-center"
                            >
                                {#if uploadingBg}
                                    <div
                                        class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                    ></div>
                                {:else}
                                    <div class="text-center">
                                        <span class="text-2xl block mb-1"
                                            >🌌</span
                                        >
                                        <span class="text-xs text-zinc-400"
                                            >Click to upload background</span
                                        >
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </button>
                    <input
                        bind:this={bgInput}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        on:change={handleBgSelect}
                        class="hidden"
                    />
                    {#if localBgPreview || tipBgUrl}
                        <button
                            on:click={() => removeImage("background")}
                            class="absolute top-2 right-2 z-10 w-6 h-6 bg-black/70 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all text-xs"
                            title="Remove background">✕</button
                        >
                    {/if}
                </div>

                <!-- Profile Photo Upload -->
                <div class="mb-5 flex items-center gap-4">
                    <div class="relative">
                        <button
                            on:click={() => profileInput.click()}
                            class="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-all overflow-hidden relative group cursor-pointer"
                        >
                            {#if localProfilePreview || profileImageUrl}
                                <img
                                    src={localProfilePreview
                                        ? localProfilePreview
                                        : `${WORKER_URL}/api/media/${profileImageUrl}?v=${imageVersion}`}
                                    alt="Profile"
                                    class="w-full h-full object-cover"
                                />
                                <div
                                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                                >
                                    <span class="text-[10px] font-medium"
                                        >Change</span
                                    >
                                </div>
                            {:else}
                                <div
                                    class="w-full h-full bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center"
                                >
                                    {#if uploadingProfile}
                                        <div
                                            class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                        ></div>
                                    {:else}
                                        <span class="text-2xl">📷</span>
                                    {/if}
                                </div>
                            {/if}
                        </button>
                        <input
                            bind:this={profileInput}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            on:change={handleProfileSelect}
                            class="hidden"
                        />
                        {#if localProfilePreview || profileImageUrl}
                            <button
                                on:click={() => removeImage("profile")}
                                class="absolute -top-1 -right-1 z-10 w-5 h-5 bg-black/70 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all text-[10px]"
                                title="Remove photo">✕</button
                            >
                        {/if}
                    </div>
                    <div class="text-xs text-zinc-500">
                        <p class="font-medium text-zinc-300 mb-0.5">
                            Profile Photo
                        </p>
                        <p>400×400 recommended</p>
                        <p>Max 2MB · PNG, JPEG, WebP</p>
                    </div>
                </div>

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

                <!-- Alert Settings -->
                <div class="mt-6 space-y-4 pt-4 border-t border-white/10">
                    <h3 class="text-sm font-semibold text-zinc-300">
                        Alert Settings
                    </h3>

                    <!-- Alert Image Upload -->
                    <div class="space-y-2">
                        <p class="text-xs text-zinc-400">
                            Custom image or GIF for your OBS tip alert overlay.
                            Replaces the default avatar.
                        </p>
                        <div class="relative inline-block">
                            <button
                                on:click={() => alertImageInput.click()}
                                class="w-28 h-28 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-all overflow-hidden relative group cursor-pointer"
                            >
                                {#if localAlertImagePreview || alertImageUrl}
                                    <img
                                        src={localAlertImagePreview
                                            ? localAlertImagePreview
                                            : `${WORKER_URL}/api/media/${alertImageUrl}?v=${imageVersion}`}
                                        alt="Alert preview"
                                        class="w-full h-full object-contain bg-black/50"
                                    />
                                    <div
                                        class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <span class="text-xs font-medium"
                                            >Change</span
                                        >
                                    </div>
                                {:else}
                                    <div
                                        class="w-full h-full bg-gradient-to-br from-cyan-400/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center"
                                    >
                                        {#if uploadingAlertImage}
                                            <div
                                                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                            ></div>
                                        {:else}
                                            <div class="text-center">
                                                <span class="text-2xl block mb-1"
                                                    >🎨</span
                                                >
                                                <span
                                                    class="text-[10px] text-zinc-400"
                                                    >Upload</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </button>
                            <input
                                bind:this={alertImageInput}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                on:change={handleAlertImageSelect}
                                class="hidden"
                            />
                            {#if localAlertImagePreview || alertImageUrl}
                                <button
                                    on:click={() => removeImage("alert_image")}
                                    class="absolute -top-1 -right-1 z-10 w-5 h-5 bg-black/70 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all text-[10px]"
                                    title="Remove alert image">✕</button
                                >
                            {/if}
                        </div>
                        <p class="text-[10px] text-zinc-600">
                            Max 5MB · PNG, JPEG, WebP, GIF
                        </p>
                    </div>

                    <div>
                        <label
                            for="min-amount-sol"
                            class="block text-xs text-zinc-400 mb-1"
                            >Minimum SOL Tip</label
                        >
                        <input
                            type="number"
                            id="min-amount-sol"
                            bind:value={minAmountSol}
                            step="0.01"
                            min="0.01"
                            class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                        />
                    </div>
                    <div>
                        <label
                            for="min-amount-usdc"
                            class="block text-xs text-zinc-400 mb-1"
                            >Minimum USDC Tip</label
                        >
                        <input
                            type="number"
                            id="min-amount-usdc"
                            bind:value={minAmountUsdc}
                            step="1"
                            min="1"
                            class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                        />
                    </div>
                    <div>
                        <label
                            for="alert-sound"
                            class="block text-xs text-zinc-400 mb-1"
                            >Alert Sound URL</label
                        >
                        <div class="space-y-2">
                            <input
                                type="url"
                                id="alert-sound"
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
                        {#if soundError}
                            <p class="text-red-400 text-xs mt-1"
                                >{soundError}</p
                            >
                        {/if}
                    </div>
                    <div>
                        <label class="block text-xs text-zinc-400 mb-1"
                            >Skip Alert Hotkey</label
                        >
                        <div class="flex items-center gap-2">
                            <button
                                on:click={() => (isRecordingHotkey = true)}
                                on:keydown|preventDefault
                                class="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-white font-mono text-center text-sm cursor-pointer"
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
                                on:click={() =>
                                    (isRecordingHotkey = !isRecordingHotkey)}
                                class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300 cursor-pointer"
                                >{isRecordingHotkey
                                    ? "Cancel"
                                    : "Change"}</button
                            >
                        </div>
                        <p class="text-xs text-zinc-500 mt-1">
                            Works when dashboard, settings, or overlay is focused
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/5">
                        <a
                            href="/overlay/{slug}?sound=1&preview=1"
                            target="_blank"
                            class="inline-flex items-center text-xs text-cyan-400 hover:underline"
                            >Preview Overlay</a
                        >
                        <button
                            on:click={testAlert}
                            disabled={testInProgress}
                            class="inline-flex items-center text-xs text-yellow-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >{testInProgress ? "Sending..." : "Test Alert"}</button
                        >
                        <button
                            on:click={skipAlert}
                            class="inline-flex items-center text-xs text-red-400 hover:underline cursor-pointer"
                            >Skip Alert</button
                        >
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
                        <div>
                            <label
                                for="discord"
                                class="block text-xs text-zinc-400 mb-1"
                                >Discord</label
                            >
                            <input
                                type="text"
                                id="discord"
                                bind:value={discordUrl}
                                placeholder="https://discord.gg/your-server"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="email"
                                class="block text-xs text-zinc-400 mb-1"
                                >Email</label
                            >
                            <input
                                type="email"
                                id="email"
                                bind:value={email}
                                placeholder="you@example.com"
                                class="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                    </div>
                </div>

                <!-- Streaming Chat Connections -->
                <div class="mt-6 space-y-4 pt-4 border-t border-white/10">
                    <h3 class="text-sm font-semibold text-zinc-300">
                        Stream Chat Alerts
                    </h3>
                    <p class="text-xs text-zinc-500">
                        Connect your streaming accounts to post tip alerts in
                        your chat automatically.
                    </p>

                    <div class="space-y-3">
                        <!-- Twitch -->
                        <div
                            class="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-white/5"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[#9146FF] rounded-lg flex items-center justify-center"
                                >
                                    <svg
                                        class="w-6 h-6 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                        ><path
                                            d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"
                                        /></svg
                                    >
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-white">
                                        Twitch
                                    </div>
                                    <div class="text-xs text-zinc-500">
                                        {connectedPlatforms.twitch
                                            ? "Connected"
                                            : "Coming Soon"}
                                    </div>
                                </div>
                            </div>
                            <span
                                class="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 rounded-lg cursor-not-allowed"
                            >
                                Coming Soon
                            </span>
                        </div>

                        <!-- Kick -->
                        <div
                            class="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-white/5"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[#53FC18] rounded-lg flex items-center justify-center"
                                >
                                    <svg
                                        class="w-6 h-6 text-black"
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        ><path
                                            d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z"
                                        /></svg
                                    >
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-white">
                                        Kick
                                    </div>
                                    <div class="text-xs text-zinc-500">
                                        {connectedPlatforms.kick
                                            ? "Connected"
                                            : "Coming Soon"}
                                    </div>
                                </div>
                            </div>
                            <span
                                class="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-500 rounded-lg"
                                >Coming Soon</span
                            >
                        </div>

                        <!-- YouTube -->
                        <div
                            class="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-white/5"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[#FF0000] rounded-lg flex items-center justify-center"
                                >
                                    <svg
                                        class="w-6 h-6 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                        ><path
                                            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                                        /></svg
                                    >
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-white">
                                        YouTube
                                    </div>
                                    <div class="text-xs text-zinc-500">
                                        {connectedPlatforms.youtube
                                            ? "Connected"
                                            : "Coming Soon"}
                                    </div>
                                </div>
                            </div>
                            <span
                                class="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-500 rounded-lg"
                                >Coming Soon</span
                            >
                        </div>
                    </div>
                </div>

                <button
                    on:click={saveSettings}
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
        background: rgba(17, 17, 19, 0.95);
    }
</style>
