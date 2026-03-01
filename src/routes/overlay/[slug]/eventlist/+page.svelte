<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { WSTipEvent, WSMessage } from "$lib/types";

    let { data } = $props();

    // --- Config from URL params ---
    let mode = $state("recent");
    let limit = $state(5);
    let theme = $state("dark"); // dark | light | minimal

    interface EventItem {
        id: number;
        sender_name: string;
        sender: string;
        amount: number;
        message: string;
        timestamp: string;
    }

    let items: EventItem[] = $state([]);
    let isLoading = $state(true);

    // --- WebSocket ---
    let socket: WebSocket | null = null;
    let isConnected = $state(false);
    let wsReconnectAttempts = 0;
    let wsReconnectDelay = 1000;
    let wsConnectionTimeout: ReturnType<typeof setTimeout> | null = null;

    // --- Read URL params on mount ---
    function loadParams() {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        mode = params.get("mode") || "recent";
        limit = Math.min(parseInt(params.get("limit") || "5"), 20);
        theme = params.get("theme") || "dark";
    }

    // --- Fetch initial data ---
    async function fetchEventList() {
        try {
            const res = await fetch(
                `/api/streamer/${data.slug}/eventlist?mode=${mode}&limit=${limit}`,
            );
            if (res.ok) {
                const result = await res.json();
                items = result.items || [];
            }
        } catch (e) {
            console.error("[EventList] Failed to fetch:", e);
        } finally {
            isLoading = false;
        }
    }

    // --- Format helpers ---
    function formatSOL(lamports: number): string {
        const sol = lamports / 1e9;
        if (sol < 0.01) return sol.toFixed(4);
        if (sol < 1) return sol.toFixed(3);
        return sol.toFixed(2);
    }

    function formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    function truncateWallet(wallet: string): string {
        if (wallet.length <= 8) return wallet;
        return wallet.slice(0, 4) + "..." + wallet.slice(-4);
    }

    function getModeLabel(m: string): string {
        switch (m) {
            case "top_today":
                return "🏆 Top Today";
            case "top_week":
                return "🏆 Top This Week";
            case "top_month":
                return "🏆 Top This Month";
            case "recent":
            default:
                return "⚡ Recent Tips";
        }
    }

    // --- WebSocket for real-time updates ---
    function connectWebSocket() {
        if (typeof window === "undefined") return;

        if (socket) {
            socket.onclose = null;
            socket.close();
            socket = null;
        }

        if (wsConnectionTimeout) {
            clearTimeout(wsConnectionTimeout);
            wsConnectionTimeout = null;
        }

        const wsUrl = `wss://${window.location.host}/ws/${data.slug}`;

        try {
            socket = new WebSocket(wsUrl);

            wsConnectionTimeout = setTimeout(() => {
                if (socket && socket.readyState !== WebSocket.OPEN) {
                    socket.close();
                }
            }, 10000);

            socket.onopen = () => {
                isConnected = true;
                wsReconnectAttempts = 0;
                wsReconnectDelay = 1000;
                if (wsConnectionTimeout) clearTimeout(wsConnectionTimeout);
            };

            socket.onmessage = (event) => {
                try {
                    const message: WSMessage = JSON.parse(event.data);
                    if (message.type === "tip") {
                        handleNewTip(message.data as WSTipEvent["data"]);
                    }
                } catch (error) {
                    console.error(
                        "[EventList] Failed to parse WS message:",
                        error,
                    );
                }
            };

            socket.onclose = () => {
                isConnected = false;
                if (wsConnectionTimeout) {
                    clearTimeout(wsConnectionTimeout);
                    wsConnectionTimeout = null;
                }
                wsReconnectAttempts++;
                const delay = Math.min(
                    wsReconnectDelay * Math.pow(1.5, wsReconnectAttempts - 1),
                    30000,
                );
                setTimeout(connectWebSocket, delay);
            };

            socket.onerror = (error) => {
                console.error("[EventList] WebSocket error:", error);
            };
        } catch (error) {
            console.error("[EventList] Failed to create WebSocket:", error);
            setTimeout(connectWebSocket, 3000);
        }
    }

    function handleNewTip(tipData: WSTipEvent["data"]) {
        const newItem: EventItem = {
            id: Date.now(),
            sender_name: tipData.sender_name || "",
            sender: tipData.sender,
            amount: tipData.amount,
            message: tipData.message,
            timestamp: tipData.timestamp,
        };

        if (mode === "recent") {
            // Prepend to list and trim to limit
            items = [newItem, ...items].slice(0, limit);
        } else {
            // For top modes, insert in sorted position if it qualifies
            const updated = [...items, newItem]
                .sort((a, b) => b.amount - a.amount)
                .slice(0, limit);
            items = updated;
        }
    }

    let connectionCheckInterval: ReturnType<typeof setInterval> | null = null;

    onMount(() => {
        loadParams();
        fetchEventList();

        setTimeout(() => {
            connectWebSocket();
        }, 100);

        // Periodic connection check
        connectionCheckInterval = setInterval(() => {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                wsReconnectAttempts = 0;
                connectWebSocket();
            }
        }, 15000);

        // Handle OBS visibility
        document.addEventListener("visibilitychange", handleVisibility);
    });

    function handleVisibility() {
        if (document.visibilityState === "visible") {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                wsReconnectAttempts = 0;
                connectWebSocket();
            }
            // Refresh data on visibility
            fetchEventList();
        }
    }

    onDestroy(() => {
        if (socket) {
            socket.onclose = null;
            socket.close();
            socket = null;
        }
        if (wsConnectionTimeout) clearTimeout(wsConnectionTimeout);
        if (connectionCheckInterval) clearInterval(connectionCheckInterval);
        if (typeof window !== "undefined") {
            document.removeEventListener("visibilitychange", handleVisibility);
        }
    });
</script>

<svelte:head>
    <title>Event List - {data.slug}</title>
</svelte:head>

<!-- OBS Event List Widget - Transparent Background -->
<div
    class="event-list-container"
    class:theme-dark={theme === "dark"}
    class:theme-light={theme === "light"}
    class:theme-minimal={theme === "minimal"}
>
    <!-- Header -->
    <div class="event-header">
        <span class="mode-label">{getModeLabel(mode)}</span>
        <span class="connection-dot" class:connected={isConnected}></span>
    </div>

    <!-- List -->
    {#if isLoading}
        <div class="loading-state">Loading...</div>
    {:else if items.length === 0}
        <div class="empty-state">No tips yet</div>
    {:else}
        <div class="event-items">
            {#each items as item, i (item.id || i)}
                <div class="event-item" style="animation-delay: {i * 0.05}s;">
                    <!-- Rank / Position -->
                    <div class="item-rank">
                        {#if mode !== "recent" && i < 3}
                            <span class="rank-medal">
                                {#if i === 0}🥇{:else if i === 1}🥈{:else}🥉{/if}
                            </span>
                        {:else}
                            <span class="rank-number">{i + 1}</span>
                        {/if}
                    </div>

                    <!-- Info -->
                    <div class="item-info">
                        <div class="item-name">
                            {item.sender_name || truncateWallet(item.sender)}
                        </div>
                        {#if item.message}
                            <div class="item-message">{item.message}</div>
                        {/if}
                    </div>

                    <!-- Amount + Time -->
                    <div class="item-right">
                        <div class="item-amount">
                            {formatSOL(item.amount)} SOL
                        </div>
                        <div class="item-time">
                            {formatTime(item.timestamp)}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background: transparent !important;
        margin: 0;
        padding: 0;
        overflow: hidden;
        font-family:
            "Sora",
            "Inter",
            -apple-system,
            sans-serif;
    }

    :global(html) {
        background: transparent !important;
    }

    .event-list-container {
        width: 100%;
        max-width: 400px;
        padding: 8px;
    }

    /* ---- Dark Theme (default) ---- */
    .theme-dark .event-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(10, 10, 11, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px 12px 0 0;
        backdrop-filter: blur(12px);
    }

    .theme-dark .mode-label {
        font-size: 12px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
        letter-spacing: 0.5px;
    }

    .theme-dark .event-items {
        background: rgba(10, 10, 11, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-top: none;
        border-radius: 0 0 12px 12px;
        backdrop-filter: blur(12px);
        overflow: hidden;
    }

    .theme-dark .event-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        animation: slideIn 0.3s ease-out both;
    }

    .theme-dark .event-item:last-child {
        border-bottom: none;
    }

    .theme-dark .item-rank {
        width: 28px;
        flex-shrink: 0;
        text-align: center;
    }

    .theme-dark .rank-medal {
        font-size: 18px;
    }

    .theme-dark .rank-number {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.3);
    }

    .theme-dark .item-info {
        flex: 1;
        min-width: 0;
    }

    .theme-dark .item-name {
        font-size: 13px;
        font-weight: 600;
        color: #c4b5fd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .theme-dark .item-message {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
    }

    .theme-dark .item-right {
        text-align: right;
        flex-shrink: 0;
    }

    .theme-dark .item-amount {
        font-size: 13px;
        font-weight: 700;
        color: #67e8f9;
    }

    .theme-dark .item-time {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
        margin-top: 2px;
    }

    .theme-dark .loading-state,
    .theme-dark .empty-state {
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        background: rgba(10, 10, 11, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-top: none;
        border-radius: 0 0 12px 12px;
        backdrop-filter: blur(12px);
    }

    /* ---- Light Theme ---- */
    .theme-light .event-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px 12px 0 0;
        backdrop-filter: blur(12px);
    }

    .theme-light .mode-label {
        font-size: 12px;
        font-weight: 700;
        color: #1a1a1a;
    }

    .theme-light .event-items {
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-top: none;
        border-radius: 0 0 12px 12px;
        backdrop-filter: blur(12px);
    }

    .theme-light .event-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        animation: slideIn 0.3s ease-out both;
    }

    .theme-light .event-item:last-child {
        border-bottom: none;
    }

    .theme-light .item-rank {
        width: 28px;
        flex-shrink: 0;
        text-align: center;
    }

    .theme-light .rank-medal {
        font-size: 18px;
    }

    .theme-light .rank-number {
        font-size: 12px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.3);
    }

    .theme-light .item-info {
        flex: 1;
        min-width: 0;
    }

    .theme-light .item-name {
        font-size: 13px;
        font-weight: 600;
        color: #7c3aed;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .theme-light .item-message {
        font-size: 11px;
        color: rgba(0, 0, 0, 0.4);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
    }

    .theme-light .item-right {
        text-align: right;
        flex-shrink: 0;
    }

    .theme-light .item-amount {
        font-size: 13px;
        font-weight: 700;
        color: #0891b2;
    }

    .theme-light .item-time {
        font-size: 10px;
        color: rgba(0, 0, 0, 0.3);
        margin-top: 2px;
    }

    .theme-light .loading-state,
    .theme-light .empty-state {
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.4);
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-top: none;
        border-radius: 0 0 12px 12px;
    }

    /* ---- Minimal Theme (no bg, just text) ---- */
    .theme-minimal .event-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        margin-bottom: 4px;
    }

    .theme-minimal .mode-label {
        font-size: 11px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.7);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    .theme-minimal .event-items {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .theme-minimal .event-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        animation: slideIn 0.3s ease-out both;
    }

    .theme-minimal .item-rank {
        width: 24px;
        flex-shrink: 0;
        text-align: center;
    }

    .theme-minimal .rank-medal {
        font-size: 14px;
    }

    .theme-minimal .rank-number {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    .theme-minimal .item-info {
        flex: 1;
        min-width: 0;
    }

    .theme-minimal .item-name {
        font-size: 12px;
        font-weight: 600;
        color: #fff;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .theme-minimal .item-message {
        display: none;
    }

    .theme-minimal .item-right {
        text-align: right;
        flex-shrink: 0;
    }

    .theme-minimal .item-amount {
        font-size: 12px;
        font-weight: 700;
        color: #67e8f9;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    .theme-minimal .item-time {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.4);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    .theme-minimal .loading-state,
    .theme-minimal .empty-state {
        padding: 8px 0;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    /* ---- Shared ---- */
    .connection-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ef4444;
        flex-shrink: 0;
    }

    .connection-dot.connected {
        background: #22c55e;
        box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
</style>
