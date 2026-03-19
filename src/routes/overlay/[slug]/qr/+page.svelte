<script lang="ts">
    import { onMount } from "svelte";
    import QRCode from "qrcode";

    let { data } = $props();

    let canvas: HTMLCanvasElement;
    let streamerName = $state("");
    let tipUrl = $state("");

    // URL params for customization
    let theme = $state<"dark" | "light" | "neon">("dark");
    let size = $state<"sm" | "md" | "lg">("md");
    let showLabel = $state(true);

    function loadUrlParams() {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const t = params.get("theme");
        if (t === "light" || t === "neon") theme = t;
        const s = params.get("size");
        if (s === "sm" || s === "lg") size = s;
        if (params.get("label") === "0") showLabel = false;
    }

    async function loadStreamerInfo() {
        try {
            const res = await fetch(`/api/streamer/${data.slug}`);
            if (res.ok) {
                const result = await res.json();
                streamerName = result.streamer?.name || data.slug;
            } else {
                streamerName = data.slug;
            }
        } catch {
            streamerName = data.slug;
        }
    }

    function generateQR() {
        if (!canvas || !tipUrl) return;

        const qrSize = size === "sm" ? 140 : size === "lg" ? 220 : 180;
        const isDark = theme !== "light";

        QRCode.toCanvas(canvas, tipUrl, {
            width: qrSize,
            margin: 2,
            color: {
                dark: isDark ? "#ffffff" : "#0a0a0b",
                light: "#00000000", // transparent background
            },
            errorCorrectionLevel: "M",
        });
    }

    onMount(() => {
        tipUrl = `${window.location.origin}/tip/${data.slug}`;
        loadUrlParams();
        loadStreamerInfo();

        // Wait for canvas and URL to be ready
        setTimeout(() => {
            generateQR();
        }, 100);
    });
</script>

<svelte:head>
    <title>QR Overlay - {data.slug} - GlianaPay</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap"
        rel="stylesheet"
    />
    <style>
        body {
            background: transparent !important;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
    </style>
</svelte:head>

<div
    class="qr-overlay"
    class:theme-light={theme === "light"}
    class:theme-neon={theme === "neon"}
    class:size-sm={size === "sm"}
    class:size-lg={size === "lg"}
>
    <!-- Main card -->
    <div class="card">
        <!-- Scan to tip label -->
        {#if showLabel}
            <div class="label">
                <span class="label-icon">📱</span>
                <span class="label-text">Scan to tip SOL / USDC</span>
            </div>
        {/if}

        <!-- QR code -->
        <div class="qr-container">
            <div class="qr-frame">
                <!-- Corner decorations -->
                <div class="corner corner-tl"></div>
                <div class="corner corner-tr"></div>
                <div class="corner corner-bl"></div>
                <div class="corner corner-br"></div>

                <canvas bind:this={canvas}></canvas>
            </div>
        </div>

        <!-- Streamer name -->
        {#if streamerName}
            <div class="streamer-name">{streamerName}</div>
        {/if}

        <!-- Branding -->
        <div class="branding">
            <span class="brand-dot"></span>
            <span class="brand-text">glianapay</span>
        </div>
    </div>
</div>

<style>
    .qr-overlay {
        font-family: "Sora", "Inter", sans-serif;
        display: inline-flex;
        padding: 16px;
    }


    /* ───── Card ───── */
    .card {
        position: relative;
        background: rgba(10, 10, 11, 0.92);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        z-index: 1;
    }
    .theme-light .card {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }
    .theme-neon .card {
        background: rgba(5, 5, 15, 0.95);
        border: 1px solid rgba(0, 255, 136, 0.15);
    }

    /* Size variants */
    .size-sm .card {
        padding: 14px 18px;
        border-radius: 12px;
        gap: 8px;
    }
    .size-lg .card {
        padding: 28px 32px;
        border-radius: 20px;
        gap: 14px;
    }

    /* ───── Label ───── */
    .label {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .label-icon {
        font-size: 14px;
        animation: wiggle 2s ease-in-out infinite;
    }
    .label-text {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.02em;
        background: linear-gradient(90deg, #22d3ee, #a855f7);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .theme-light .label-text {
        background: linear-gradient(90deg, #6366f1, #a855f7);
        -webkit-background-clip: text;
        background-clip: text;
    }
    .theme-neon .label-text {
        background: linear-gradient(90deg, #00ff88, #00c8ff);
        -webkit-background-clip: text;
        background-clip: text;
    }
    .size-sm .label-icon {
        font-size: 12px;
    }
    .size-sm .label-text {
        font-size: 11px;
    }
    .size-lg .label-icon {
        font-size: 16px;
    }
    .size-lg .label-text {
        font-size: 15px;
    }

    @keyframes wiggle {
        0%,
        100% {
            transform: rotate(0deg);
        }
        20% {
            transform: rotate(-8deg);
        }
        40% {
            transform: rotate(8deg);
        }
        60% {
            transform: rotate(-4deg);
        }
        80% {
            transform: rotate(4deg);
        }
    }

    /* ───── QR Container ───── */
    .qr-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .qr-frame {
        position: relative;
        padding: 10px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .theme-light .qr-frame {
        background: rgba(0, 0, 0, 0.02);
        border: 1px solid rgba(0, 0, 0, 0.06);
    }
    .theme-neon .qr-frame {
        background: rgba(0, 255, 136, 0.03);
        border: 1px solid rgba(0, 255, 136, 0.08);
    }

    .qr-frame canvas {
        display: block;
        border-radius: 6px;
    }

    /* Corner decorations */
    .corner {
        position: absolute;
        width: 14px;
        height: 14px;
        border-color: rgba(168, 85, 247, 0.5);
        border-style: solid;
        border-width: 0;
    }
    .theme-neon .corner {
        border-color: rgba(0, 255, 136, 0.6);
    }
    .theme-light .corner {
        border-color: rgba(99, 102, 241, 0.4);
    }
    .corner-tl {
        top: -1px;
        left: -1px;
        border-top-width: 2px;
        border-left-width: 2px;
        border-top-left-radius: 8px;
    }
    .corner-tr {
        top: -1px;
        right: -1px;
        border-top-width: 2px;
        border-right-width: 2px;
        border-top-right-radius: 8px;
    }
    .corner-bl {
        bottom: -1px;
        left: -1px;
        border-bottom-width: 2px;
        border-left-width: 2px;
        border-bottom-left-radius: 8px;
    }
    .corner-br {
        bottom: -1px;
        right: -1px;
        border-bottom-width: 2px;
        border-right-width: 2px;
        border-bottom-right-radius: 8px;
    }

    /* ───── Streamer Name ───── */
    .streamer-name {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
    }
    .theme-light .streamer-name {
        color: rgba(0, 0, 0, 0.8);
    }
    .theme-neon .streamer-name {
        color: rgba(0, 255, 136, 0.9);
        text-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
    }
    .size-sm .streamer-name {
        font-size: 12px;
    }
    .size-lg .streamer-name {
        font-size: 16px;
    }

    /* ───── Branding ───── */
    .branding {
        display: flex;
        align-items: center;
        gap: 5px;
        opacity: 0.4;
    }
    .brand-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: linear-gradient(135deg, #22d3ee, #a855f7);
    }
    .theme-neon .brand-dot {
        background: linear-gradient(135deg, #00ff88, #00c8ff);
        box-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
    }
    .brand-text {
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.04em;
        color: rgba(255, 255, 255, 0.7);
    }
    .theme-light .brand-text {
        color: rgba(0, 0, 0, 0.5);
    }
    .theme-neon .brand-text {
        color: rgba(0, 255, 136, 0.5);
    }
</style>
