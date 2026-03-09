<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let { data } = $props();

    // Goal state
    let goalTitle = $state("Tipping Goal");
    let targetAmount = $state(0);
    let currentAmount = $state(0);
    let isActive = $state(false);
    let progress = $derived(
        targetAmount > 0
            ? Math.min((currentAmount / targetAmount) * 100, 100)
            : 0,
    );
    let isCompleted = $derived(
        currentAmount >= targetAmount && targetAmount > 0,
    );

    // WebSocket
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    // URL customization params
    let theme = $state<"dark" | "light">("dark");
    let barColor = $state("#a855f7"); // purple-500

    function loadUrlParams() {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("theme") === "light") theme = "light";
        if (params.get("color")) barColor = `#${params.get("color")}`;
    }

    async function loadGoal() {
        try {
            const res = await fetch(`/api/streamer/${data.slug}/goals`);
            if (res.ok) {
                const result = await res.json();
                const active = result.goals?.find(
                    (g: any) => g.is_active === 1,
                );
                if (active) {
                    goalTitle = active.title;
                    targetAmount = active.target_amount;
                    currentAmount = active.current_amount;
                    isActive = true;
                }
            }
        } catch (e) {
            console.error("[GoalBar] Failed to load goal:", e);
        }
    }

    function connectWebSocket() {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/${data.slug}`;

        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("[GoalBar] WebSocket connected");
        };

        socket.onmessage = async (event) => {
            try {
                const msg = JSON.parse(event.data);
                // On any tip or goal_update, reload goal data
                if (msg.type === "tip" || msg.type === "goal_update") {
                    await loadGoal();
                }
            } catch (e) {
                // ignore non-JSON messages
            }
        };

        socket.onclose = () => {
            console.log("[GoalBar] WebSocket closed, reconnecting...");
            reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = () => {
            socket?.close();
        };
    }

    onMount(() => {
        loadUrlParams();
        loadGoal();
        connectWebSocket();
    });

    onDestroy(() => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (socket) socket.close();
    });

    function formatUsd(amount: number): string {
        return amount.toFixed(2);
    }
</script>

<svelte:head>
    <title>Goal Bar - {data.slug} - GlianaPay</title>
    <style>
        body {
            background: transparent !important;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
    </style>
</svelte:head>

{#if isActive && targetAmount > 0}
    <div
        class="goal-bar"
        class:light={theme === "light"}
        style="--bar-color: {barColor}"
    >
        <!-- Title + Amount -->
        <div class="goal-header">
            <span class="goal-title">{goalTitle}</span>
            <span class="goal-amount">
                ${formatUsd(currentAmount)} / ${formatUsd(targetAmount)}
            </span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-track">
            <div
                class="progress-fill"
                class:completed={isCompleted}
                style="width: {progress}%"
            >
                {#if progress > 15}
                    <span class="progress-text">{progress.toFixed(0)}%</span>
                {/if}
            </div>
            {#if progress <= 15 && progress > 0}
                <span
                    class="progress-text-outside"
                    style="left: {progress + 1}%">{progress.toFixed(0)}%</span
                >
            {/if}
        </div>

        {#if isCompleted}
            <div class="completed-badge">🎉 Goal Reached!</div>
        {/if}
    </div>
{/if}

<style>
    .goal-bar {
        font-family: "Sora", "Inter", sans-serif;
        padding: 12px 16px;
        border-radius: 12px;
        background: rgba(10, 10, 11, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        color: white;
        min-width: 280px;
        max-width: 400px;
    }

    .goal-bar.light {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(0, 0, 0, 0.1);
        color: #1a1a1a;
    }

    .goal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
    }

    .goal-title {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 55%;
    }

    .goal-amount {
        font-size: 12px;
        opacity: 0.7;
        font-variant-numeric: tabular-nums;
    }

    .progress-track {
        position: relative;
        height: 22px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 11px;
        overflow: hidden;
    }

    .goal-bar.light .progress-track {
        background: rgba(0, 0, 0, 0.08);
    }

    .progress-fill {
        height: 100%;
        background: var(--bar-color);
        border-radius: 11px;
        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
        min-width: 0;
        position: relative;
        box-shadow: 0 0 12px
            color-mix(in srgb, var(--bar-color), transparent 50%);
    }

    .progress-fill.completed {
        background: linear-gradient(90deg, var(--bar-color), #22c55e);
        box-shadow: 0 0 16px rgba(34, 197, 94, 0.5);
    }

    .progress-text {
        font-size: 11px;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .progress-text-outside {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        font-weight: 700;
        opacity: 0.6;
    }

    .completed-badge {
        text-align: center;
        margin-top: 6px;
        font-size: 12px;
        font-weight: 600;
        color: #22c55e;
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.6;
        }
    }
</style>
