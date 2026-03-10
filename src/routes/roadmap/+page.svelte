<svelte:head>
    <title>Roadmap - GlianaPay</title>
    <meta
        name="description"
        content="GlianaPay's product roadmap. See what's been built, what's in progress, and what's coming next for the Web3 streamer tipping platform."
    />
    <meta
        name="keywords"
        content="GlianaPay roadmap, Solana tipping future, Web3 streamer tools, crypto donations roadmap"
    />

    <!-- Open Graph -->
    <meta property="og:title" content="Roadmap - GlianaPay" />
    <meta
        property="og:description"
        content="See what's coming next for GlianaPay — the Web3 tipping platform for streamers."
    />
    <meta property="og:image" content="https://glianapay.com/og-image.png" />

    <!-- Twitter -->
    <meta name="twitter:title" content="Roadmap - GlianaPay" />
    <meta
        name="twitter:description"
        content="See what's coming next for GlianaPay — the Web3 tipping platform for streamers."
    />
    <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
</svelte:head>

<div class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] flex flex-col">
    <!-- Animated Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div
            class="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse"
        ></div>
        <div
            class="absolute bottom-1/3 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse"
            style="animation-delay: 1.5s;"
        ></div>
        <div
            class="absolute top-2/3 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
            style="animation-delay: 3s;"
        ></div>
        <div
            class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"
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

    <!-- Content -->
    <div class="relative z-10 max-w-3xl mx-auto px-4 pt-0 pb-16 flex-1 w-full">
        <!-- Page Header -->
        <div class="text-center mb-14">
            <div
                class="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300 mb-5"
            >
                <span
                    class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"
                ></span>
                In Active Development
            </div>
            <h1 class="text-3xl md:text-4xl font-bold mb-4">
                <span
                    class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
                >
                    Product Roadmap
                </span>
            </h1>
            <p class="text-zinc-400 text-base max-w-xl mx-auto">
                Here's where GlianaPay is headed. We build in public — this is
                the honest, no-hype version of what's coming.
            </p>
        </div>

        <!-- Phases -->
        <div class="space-y-6">
            <!-- Phase 0: Beta (Done) -->
            <div class="relative">
                <div
                    class="phase-card rounded-2xl border border-green-500/20 bg-green-500/5 overflow-hidden"
                >
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-green-500/10"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 text-sm font-bold"
                            >
                                ✓
                            </div>
                            <div>
                                <p
                                    class="text-xs text-green-400/70 font-medium uppercase tracking-wider"
                                >
                                    Phase 0
                                </p>
                                <h2 class="font-bold text-base text-white">
                                    Beta Launch
                                </h2>
                            </div>
                        </div>
                        <span
                            class="px-3 py-1 bg-green-500/15 border border-green-500/30 rounded-full text-xs font-semibold text-green-400"
                        >
                            ✓ Done
                        </span>
                    </div>
                    <div class="px-6 py-4">
                        <div class="grid sm:grid-cols-2 gap-2">
                            {#each ["Solana Devnet tipping (SOL)", "Real-time OBS alert overlay", "Multi-wallet support (Phantom, Solflare, Backpack, & more)", "Custom streamer tip pages (/your-slug)", "Dashboard with settings & top tippers", "Top tippers leaderboard", "Minimum tip amount threshold", "Custom alert sound URL", "Social links on tip page (Twitch, Kick, YT, X, Reddit)"] as item}
                                <div
                                    class="flex items-start gap-2 text-sm text-zinc-300"
                                >
                                    <span
                                        class="text-green-400 mt-0.5 flex-shrink-0"
                                        >✓</span
                                    >
                                    {item}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Phase 1: v1 Launch -->
            <div class="relative">
                <div
                    class="phase-card rounded-2xl border border-purple-500/25 bg-purple-500/5 overflow-hidden"
                >
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-purple-500/10"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-sm font-bold"
                            >
                                1
                            </div>
                            <div>
                                <p
                                    class="text-xs text-purple-400/70 font-medium uppercase tracking-wider"
                                >
                                    Phase 1
                                </p>
                                <h2 class="font-bold text-base text-white">
                                    Improvements & Polish
                                </h2>
                            </div>
                        </div>
                        <span
                            class="px-3 py-1 bg-purple-500/15 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300"
                        >
                            ✓ Done
                        </span>
                    </div>
                    <div class="px-6 py-4">
                        <div class="grid sm:grid-cols-2 gap-2">
                            {#each ["UI & Performance polish", "Improved dashboard analytics", "Tip page with suggested amounts", "Live SOL/USD price display", "Tip page customization (backgrounds, profile photos, banners)", "Mobile-optimized tip page experience"] as item}
                                <div
                                    class="flex items-start gap-2 text-sm text-zinc-300"
                                >
                                    <span
                                        class="text-purple-400 mt-0.5 flex-shrink-0"
                                        >✓</span
                                    >
                                    {item}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Phase 2: Ecosystem -->
            <div class="relative">
                <div
                    class="phase-card rounded-2xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden"
                >
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-cyan-500/10"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 text-sm font-bold"
                            >
                                2
                            </div>
                            <div>
                                <p
                                    class="text-xs text-cyan-400/70 font-medium uppercase tracking-wider"
                                >
                                    Phase 2
                                </p>
                                <h2 class="font-bold text-base text-white">
                                    Ecosystem Expansion
                                </h2>
                            </div>
                        </div>
                        <span
                            class="px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300"
                        >
                            ✓ Live
                        </span>
                    </div>
                    <div class="px-6 py-4">
                        <div class="grid sm:grid-cols-2 gap-2">
                            {#each ["Solana Mainnet launch (real SOL)", "API Security & Wallet Auth", "Profanity filter for tips", "Custom media upload for alerts (GIF/image)", "OBS Goal Bar widget", "OBS Event List widget (recent tippers)"] as item}
                                <div
                                    class="flex items-start gap-2 text-sm text-zinc-400"
                                >
                                    <span
                                        class="text-cyan-400/50 mt-0.5 flex-shrink-0"
                                        >✓</span
                                    >
                                    {item}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Phase 3: Platform -->
            <div class="relative">
                <div
                    class="phase-card rounded-2xl border border-pink-500/20 bg-pink-500/5 overflow-hidden"
                >
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-pink-500/10"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400 text-sm font-bold"
                            >
                                3
                            </div>
                            <div>
                                <p
                                    class="text-xs text-pink-400/70 font-medium uppercase tracking-wider"
                                >
                                    Phase 3
                                </p>
                                <h2 class="font-bold text-base text-white">
                                    Creator Platform
                                </h2>
                            </div>
                        </div>
                        <span
                            class="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs font-semibold text-zinc-400"
                        >
                            ◷ Future
                        </span>
                    </div>
                    <div class="px-6 py-4">
                        <div class="grid sm:grid-cols-2 gap-2">
                            {#each ["Stream chat bot (GlianaBot for Twitch/Kick/YouTube)", "Text-to-speech (TTS) alerts", "Monthly on-chain subscriptions (recurring tips)", "Twitch / YouTube OAuth login", "USDC stablecoin tipping support", "Export tipping data (CSV/JSON)", "NFT supporter badges (gamification)", "One-click staking for verified/featured status", "Expanded wallet compatibility", "Creator marketplace (sell digital goods)", "Multi-streamer event tipping (charity streams)", "Mobile app (iOS & Android)", "Public API & developer docs", "Smart account integration", "Sentiment-based alert styling (alert color follows message mood)"] as item}
                                <div
                                    class="flex items-start gap-2 text-sm text-zinc-400"
                                >
                                    <span
                                        class="text-pink-400/40 mt-0.5 flex-shrink-0"
                                        >○</span
                                    >
                                    {item}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom CTA -->
        <div class="mt-12 text-center">
            <p class="text-zinc-500 text-sm mb-4">
                Want to shape what we build next? Reach out.
            </p>
            <div class="flex flex-wrap justify-center gap-3">
                <a
                    href="https://twitter.com/glianalabs"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-sm font-semibold transition-all"
                >
                    Follow on X/Twitter
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                        />
                    </svg>
                </a>
                <a
                    href="/login"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-semibold transition-all"
                >
                    Get Started Now →
                </a>
            </div>
        </div>
    </div>
</div>

<style>
    .phase-card {
        backdrop-filter: blur(12px);
    }
</style>
