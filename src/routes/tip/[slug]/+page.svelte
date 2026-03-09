<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import {
    RegExpMatcher,
    englishDataset,
    englishRecommendedTransformers,
  } from "obscenity";
  import {
    fetchCloudflareStatus,
    getStatusLabel,
    getStatusColor,
    getStatusDotColor,
  } from "$lib/cloudflare-status";

  // Helper to capitalize each word
  function capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Best practice: Use englishDataset with recommended transformers
  // The transformers handle leet-speak, padded words, etc. (heuristic matching)
  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

  function containsProfanity(text: string): boolean {
    if (!text) return false;
    return matcher.hasMatch(text);
  }

  import type { Streamer, AlertSettings, TopTipper } from "$lib/types";
  import {
    getAvailableWallets,
    connectWallet as connectWalletUtil,
    disconnectWallet as disconnectWalletUtil,
  } from "$lib/wallet";
  import type { WalletInfo } from "$lib/wallet";
  import { WORKER_URL } from "$lib/config";

  // Client-side data (populated in onMount)
  let streamer: Streamer | undefined = undefined;
  let settings: AlertSettings | null | undefined = undefined;
  let topTippers: TopTipper[] = [];
  let loadError = "";

  let name = "";
  let message = "";
  let amount = 0.01;
  let selectedCurrency: "SOL" | "USDC" = "SOL";
  let isLoading = false;
  let qrCodeUrl = "";
  let status = "";
  let viewerWallet = "";
  let viewerConnected = false;
  let availableWallets: WalletInfo[] = [];
  let selectedWallet: WalletInfo | null = null;
  let walletError = "";

  // USDC devnet mint address
  const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

  let isMobile = false;
  let solPrice = 0; // USD price of 1 SOL
  $: usdEquivalent =
    selectedCurrency === "USDC"
      ? amount.toFixed(2)
      : solPrice > 0
        ? (amount * solPrice).toFixed(2)
        : "";

  // Social Media states
  let xUrl = "";
  let redditUrl = "";
  let youtubeUrl = "";
  let twitchUrl = "";
  let kickUrl = "";
  let tiktokUrl = "";
  let facebookUrl = "";
  let instagramUrl = "";
  let discordUrl = "";
  let email = "";
  let description = "";
  let minAmount = 0.01;

  onMount(() => {
    // Fetch streamer data
    async function fetchData() {
      const slug = $page.params.slug;
      try {
        const response = await fetch(`/api/streamer/${slug}`);
        if (response.ok) {
          const data = await response.json();
          streamer = data.streamer;
          settings = data.settings;
          topTippers = data.topTippers || [];

          // Assign alert settings
          if (settings) {
            minAmount = settings.min_amount || 0.01;
          }

          // Assign social settings
          if (streamer) {
            xUrl = streamer.x_url || "";
            redditUrl = streamer.reddit_url || "";
            youtubeUrl = streamer.youtube_url || "";
            twitchUrl = streamer.twitch_url || "";
            kickUrl = streamer.kick_url || "";
            tiktokUrl = streamer.tiktok_url || "";
            facebookUrl = streamer.facebook_url || "";
            instagramUrl = streamer.instagram_url || "";
            discordUrl = streamer.discord_url || "";
            email = streamer.email || "";
            description = streamer.description || "";
          }
        } else {
          loadError = "Streamer not found";
        }
      } catch (e) {
        console.error("Failed to load streamer:", e);
        loadError = "Streamer not found";
      }
    }

    fetchData();

    // Fetch SOL price from our Cloudflare Worker Backend (which applies global 60s KV Rate Limit Caching)
    async function fetchSolPrice() {
      try {
        const res = await fetch(`${WORKER_URL}/api/price/sol`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.price && data.price > 0) {
          solPrice = data.price;
        }
      } catch (e) {
        console.error("Failed to fetch SOL price from backend:", e);
      }
    }

    fetchSolPrice();
    fetchCfStatus();
    const priceInterval = setInterval(fetchSolPrice, 60000); // refresh every 60s

    // Small delay to ensure wallet extensions are loaded
    setTimeout(checkWallets, 100);
    window.addEventListener("focus", checkWallets);

    isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    return () => {
      window.removeEventListener("focus", checkWallets);
      if (qrInterval) clearInterval(qrInterval);
      clearInterval(priceInterval);
    };
  });

  // Check available wallets
  function checkWallets() {
    if (typeof window !== "undefined") {
      availableWallets = getAvailableWallets();
    }
  }

  // Connect to selected wallet
  async function handleConnectWallet(wallet: WalletInfo) {
    selectedWallet = wallet;
    walletError = "";

    const address = await connectWalletUtil(wallet);
    if (address) {
      viewerWallet = address;
      viewerConnected = true;
      if (!name) name = address.slice(0, 8);
    } else {
      walletError = `Failed to connect to ${wallet.name}`;
      selectedWallet = null;
    }
  }

  // Disconnect
  async function handleDisconnect() {
    if (selectedWallet) {
      await disconnectWalletUtil(selectedWallet);
    }
    selectedWallet = null;
    viewerConnected = false;
    viewerWallet = "";
  }

  // Wallet connection
  function getPhantomWallet() {
    if (typeof window !== "undefined") {
      return (window as any).phantom?.solana;
    }
    return null;
  }

  let qrInterval: any = null;

  async function generatePayment() {
    if (!streamer) return;

    if (name && containsProfanity(name)) {
      status = "Sender name contains restricted words.";
      return;
    }
    if (message && containsProfanity(message)) {
      status = "Tip message contains restricted words.";
      return;
    }

    isLoading = true;
    status = "Generating payment request...";

    // Clear any existing polling intervals
    if (qrInterval) clearInterval(qrInterval);

    try {
      const { Connection, Keypair, PublicKey } = await import(
        "@solana/web3.js"
      );
      const connection = new Connection("https://api.devnet.solana.com");

      const smallestUnits =
        selectedCurrency === "USDC"
          ? Math.floor(amount * 1e6)
          : Math.floor(amount * 1e9);
      // Solana Pay strictly requires an Ed25519 Public Key as the reference parameter, not a UUID string.
      const referenceKeypair = Keypair.generate();
      const reference = referenceKeypair.publicKey.toBase58();

      const paymentUrl = new URL(`solana:${streamer.wallet}`);
      paymentUrl.searchParams.append("amount", amount.toString());
      paymentUrl.searchParams.append("reference", reference);
      paymentUrl.searchParams.append("label", `${streamer.name}'s Tip Jar`);
      paymentUrl.searchParams.append(
        "message",
        message || `Tip for ${streamer.name}`,
      );
      // For USDC, add spl-token param per Solana Pay spec
      if (selectedCurrency === "USDC") {
        paymentUrl.searchParams.append("spl-token", USDC_MINT);
      }

      // Generate QR Code with the correctly encoded solana: URI
      const encodedUrl = encodeURIComponent(
        paymentUrl.toString().replace("solana://", "solana:"),
      );
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodedUrl}`;

      status = viewerConnected
        ? "Wallet connected! You can pay directly or scan QR"
        : "Scan the QR code with your wallet!";

      // Start polling the blockchain for the mobile QR Code scan completion
      qrInterval = setInterval(async () => {
        try {
          // Check if any transactions have hit our unique reference key
          const signatures = await connection.getSignaturesForAddress(
            referenceKeypair.publicKey,
            { limit: 1 },
          );

          if (signatures.length > 0) {
            clearInterval(qrInterval);
            status = "Mobile payment confirmed! Sending alert to streamer...";

            const txSignature = signatures[0].signature;

            // Record tip and broadcast to streamer's overlay
            const tipData = {
              slug: streamer!.slug,
              tx_hash: txSignature,
              amount: smallestUnits,
              currency: selectedCurrency,
              sender: "Mobile Wallet User",
              sender_name: name || "Anonymous (Mobile)",
              message: message || "🎉",
            };

            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const res = await fetch(`${WORKER_URL}/api/tip/record`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(tipData),
                });
                if (res.ok) {
                  status = "Alert sent! Thank you for your mobile tip! 🎉";
                  qrCodeUrl = "";
                  break;
                }
              } catch (e) {
                console.error(
                  "[TipPage] Mobile Alert Attempt",
                  attempt,
                  "failed:",
                  e,
                );
                if (attempt === 3) {
                  status =
                    "Payment confirmed but alert may be delayed. Thank you!";
                  qrCodeUrl = "";
                }
              }
              if (attempt < 3) await new Promise((r) => setTimeout(r, 1000));
            }
          }
        } catch (pollErr) {
          // Silent catch for network errors during polling
        }
      }, 3000); // Poll every 3 seconds
    } catch (error) {
      console.error("Failed to generate payment:", error);
      status = "Failed to generate payment. Please try again.";
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    await generatePayment();
  }

  async function payWithWallet() {
    if (!streamer || !viewerConnected || !viewerWallet || !selectedWallet)
      return;

    if (name && containsProfanity(name)) {
      status = "Sender name contains restricted words.";
      return;
    }
    if (message && containsProfanity(message)) {
      status = "Tip message contains restricted words.";
      return;
    }

    isLoading = true;
    status = "Preparing transaction...";

    try {
      const provider = selectedWallet.provider;
      if (!provider) {
        status = "Wallet provider not found";
        return;
      }

      // Dynamic import to avoid SSR issues
      const { Connection, PublicKey, Transaction, SystemProgram } =
        await import("@solana/web3.js");

      // Create connection to Solana
      const connection = new Connection("https://api.devnet.solana.com");

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Create transfer transaction
      const transaction = new Transaction({
        feePayer: new PublicKey(viewerWallet),
        recentBlockhash: blockhash,
      });

      if (selectedCurrency === "USDC") {
        // Polyfill Buffer for browser (required by @solana/spl-token)
        if (typeof globalThis.Buffer === "undefined") {
          const { Buffer: BufferPolyfill } = await import("buffer");
          globalThis.Buffer = BufferPolyfill;
        }

        // SPL Token transfer for USDC
        const {
          getAssociatedTokenAddress,
          createAssociatedTokenAccountInstruction,
          createTransferInstruction,
        } = await import("@solana/spl-token");

        const mintPubkey = new PublicKey(USDC_MINT);
        const senderPubkey = new PublicKey(viewerWallet);
        const recipientPubkey = new PublicKey(streamer.wallet);

        // Get sender's USDC token account
        const senderATA = await getAssociatedTokenAddress(
          mintPubkey,
          senderPubkey,
        );
        // Get/create recipient's USDC token account
        const recipientATA = await getAssociatedTokenAddress(
          mintPubkey,
          recipientPubkey,
        );

        // Check if recipient ATA exists, create if not
        const recipientATAInfo = await connection.getAccountInfo(recipientATA);
        if (!recipientATAInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              senderPubkey, // payer
              recipientATA, // ata
              recipientPubkey, // owner
              mintPubkey, // mint
            ),
          );
        }

        // Add USDC transfer instruction (6 decimals)
        const usdcAmount = Math.floor(amount * 1e6);
        transaction.add(
          createTransferInstruction(
            senderATA, // source
            recipientATA, // destination
            senderPubkey, // owner
            usdcAmount, // amount in smallest units
          ),
        );
      } else {
        // Native SOL transfer
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(viewerWallet),
            toPubkey: new PublicKey(streamer.wallet),
            lamports: Math.floor(amount * 1e9),
          }),
        );
      }

      // Request wallet to sign and send
      const signedTx = await provider.signAndSendTransaction(transaction);

      status = "Payment sent! Waiting for confirmation...";

      // Wait for confirmation
      await connection.confirmTransaction(signedTx.signature);

      status =
        "Payment confirmed! Sending alert to streamer... (please don't close this page)";

      // Record tip and broadcast to streamer's overlay (with retry)
      const smallestUnits =
        selectedCurrency === "USDC"
          ? Math.floor(amount * 1e6)
          : Math.floor(amount * 1e9);
      const tipData = {
        slug: streamer.slug,
        tx_hash: signedTx.signature,
        amount: smallestUnits,
        currency: selectedCurrency,
        sender: viewerWallet,
        sender_name: name || viewerWallet?.slice(0, 8) || "Anonymous",
        message: message || "🎉",
      };

      // Retry up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(`${WORKER_URL}/api/tip/record`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tipData),
          });
          if (res.ok) {
            status = "Alert sent to streamer! Thank you for your tip! 🎉";
            qrCodeUrl = ""; // Hide QR only after success
            break;
          }
        } catch (e) {
          console.error("[TipPage] Attempt", attempt, "failed:", e);
          if (attempt < 3) {
            status = `Sending alert... (attempt ${attempt}/3)`;
          }
          if (attempt === 3) {
            status = "Payment confirmed but alert may be delayed. Thank you!";
            qrCodeUrl = "";
            console.error("[TipPage] Failed to record tip after 3 attempts");
          }
        }
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      status = error.message?.includes("User rejected")
        ? "Transaction cancelled"
        : "Payment failed. Please try again.";
    } finally {
      isLoading = false;
    }
  }

  let testWindow: Window | null = null;

  function sendTipToOverlay(txHash: string, amountLamports: number) {
    if (!streamer) return;

    const overlayWindow = window.open(
      `/overlay/${streamer.slug}`,
      "GlianaPayOverlay",
      "width=600,height=400",
    );

    if (!overlayWindow) {
      console.error(
        "[TipPage] Popup blocked! Please allow popups for this site",
      );
      alert(
        "Popup blocked! Please allow popups and try again, or open the overlay manually at /overlay/" +
          streamer.slug,
      );
      return;
    }

    setTimeout(() => {
      if (overlayWindow) {
        overlayWindow.postMessage(
          {
            type: "tip",
            data: {
              tx_hash: txHash,
              amount: amountLamports,
              sender: viewerWallet || "Unknown",
              sender_name: name || viewerWallet?.slice(0, 8) || "Anonymous",
              message: message || "🎉",
              timestamp: new Date().toISOString(),
              streamer_slug: streamer!.slug,
            },
          },
          "*",
        );
      }
    }, 1500);
  }

  function triggerAlert(signature: string) {
    if (!streamer) return;
    const lamports = Math.floor(amount * 1e9);
    sendTipToOverlay(signature, lamports);
  }

  function testAlert() {
    if (!streamer) return;
    sendTipToOverlay("test_" + crypto.randomUUID(), 100000000);
  }

  // Format name as Title Case
  function titleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
    );
  }

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

  async function fetchCfStatus() {
    const result = await fetchCloudflareStatus("cf_status");
    cfStatus = result.status;
    cfRegionName = result.region;
    cfCityName = result.cityName;
    cfCityStatus = result.cityStatus;
    cfDegradedItems = result.degradedItems;
  }
</script>

<svelte:head>
  <title
    >Tip {streamer?.name ? capitalizeWords(streamer.name) : "Streamer"} - GlianaPay</title
  >
  <meta
    name="description"
    content="Send a SOL tip to {streamer?.name ||
      'this streamer'} on GlianaPay. Real-time OBS alerts included."
  />
  <meta
    name="keywords"
    content="tip, donate, Solana, SOL, {streamer?.name ||
      'streamer'}, crypto, Web3"
  />

  <!-- Open Graph -->
  <meta
    property="og:title"
    content="Tip {streamer?.name || 'Streamer'} - GlianaPay"
  />
  <meta
    property="og:description"
    content="Send a SOL tip with real-time OBS alerts"
  />
  <meta property="og:image" content="https://glianapay.com/og-image.png" />
  <meta property="og:type" content="website" />

  <!-- Twitter -->
  <meta
    name="twitter:title"
    content="Tip {streamer?.name || 'Streamer'} - GlianaPay"
  />
  <meta
    name="twitter:description"
    content="Send a SOL tip with real-time OBS alerts"
  />
  <meta name="twitter:image" content="https://glianapay.com/og-image.png" />
  <meta name="twitter:site" content="@glianalabs" />
  <meta name="twitter:creator" content="@glianalabs" />
</svelte:head>

<div
  class="min-h-screen bg-[#0a0a0b] text-white font-['Sora'] relative overflow-hidden"
>
  <!-- Header (Edge-to-Edge) -->
  <div
    class="absolute top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between"
  >
    <a
      href="/"
      class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
    >
      <img
        src="/logo.svg"
        alt="GlianaPay"
        class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-purple-500/20"
      />
      <span class="font-bold text-sm sm:text-base md:text-lg tracking-wide"
        >GlianaPay</span
      >
    </a>

    <!-- Beta Badge -->
    <div class="relative group z-20">
      <div
        class="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full cursor-help hover:bg-yellow-500/20 transition-colors"
      >
        <span
          class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]"
        ></span>
        <span class="text-[10px] sm:text-xs font-medium text-yellow-400"
          >Beta - Devnet</span
        >
      </div>
      <!-- Tooltip -->
      <div
        class="absolute right-0 top-full mt-2 w-48 sm:w-64 px-3 py-2 bg-zinc-900 border border-yellow-500/40 rounded-lg text-xs text-zinc-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-right sm:text-left"
      >
        This is a testnet version. No real money involved. Enable devnet in your
        wallet settings before using.
      </div>
    </div>
  </div>

  <!-- Background Effects -->
  {#if streamer?.tip_bg_url}
    <!-- Custom background image -->
    {@const imgVersion = streamer.image_version || 1}
    <div class="fixed inset-0 pointer-events-none">
      <img
        src="{WORKER_URL}/api/media/{streamer.tip_bg_url}?v={imgVersion}"
        alt=""
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div class="absolute inset-0 bg-black/60"></div>
    </div>
  {:else}
    <!-- Default background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"
      ></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
    </div>
  {/if}

  <div class="relative z-10 max-w-5xl mx-auto px-4 pt-16 sm:pt-20 pb-8">
    <!-- Profile Banner & Card - Full bleed background -->
    <div
      class="mb-4 sm:mb-5 lg:mb-6 w-full mx-auto rounded-3xl relative overflow-hidden border border-white/10"
    >
      <!-- Banner image as FULL background -->
      {#if streamer?.banner_url}
        {@const imgVersion = streamer.image_version || 1}
        <img
          src="{WORKER_URL}/api/media/{streamer.banner_url}?v={imgVersion}"
          alt="Banner"
          class="absolute inset-0 w-full h-full object-cover object-center"
          fetchpriority="high"
          decoding="async"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/60 to-[#111113]/20"
        ></div>
      {:else}
        <!-- Default: original design (c17fd02) -->
        <div class="absolute inset-0 bg-[#111113]"></div>
        <div class="absolute top-0 left-0 right-0 h-[18%] bg-zinc-800"></div>
        <div
          class="absolute top-0 left-0 right-0 h-[18%] bg-gradient-to-r from-purple-900/50 to-indigo-900/50 mix-blend-overlay"
        ></div>
        <div
          class="absolute top-0 left-0 right-0 h-[18%] opacity-20 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:24px_24px]"
        ></div>
      {/if}

      <!-- Content -->
      <div class="relative z-10 px-5 sm:px-8 pt-6 sm:pt-8 md:pt-10 pb-6">
        <!-- Avatar Row -->
        <div class="flex justify-between items-end mb-5 w-full">
          <div class="relative">
            <div
              class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 rounded-full border-4 border-[#111113] bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/20 overflow-hidden"
            >
              {#if streamer?.profile_image_url}
                {@const imgVersion = streamer.image_version || 1}
                <img
                  src="{WORKER_URL}/api/media/{streamer.profile_image_url}?v={imgVersion}"
                  alt={streamer.name}
                  class="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              {:else}
                <span class="text-3xl md:text-4xl select-none">🎮</span>
              {/if}
            </div>
          </div>

          <!-- Social Links -->
          {#if streamer && (streamer.x_url || streamer.reddit_url || streamer.youtube_url || streamer.kick_url || streamer.twitch_url || streamer.tiktok_url || streamer.facebook_url || streamer.instagram_url || streamer.discord_url || streamer.email)}
            <div
              class="flex flex-wrap justify-end ml-4 gap-1.5 sm:gap-2 mb-1 sm:mb-3"
            >
              {#if streamer.x_url}
                <a
                  href={streamer.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-200 text-white/70 hover:text-white"
                  title="X (Twitter)"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    ><path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.twitch_url}
                <a
                  href={streamer.twitch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-[#9146FF]/20 hover:border-[#9146FF]/40 transition-all duration-200 text-white/70 hover:text-[#9146FF]"
                  title="Twitch"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    ><path
                      d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.806-6.806v-14.149h-21.851zm19.164 13.074l-4.298 4.298h-5.373l-3.045 3.045v-3.045h-4.836v-15.045h17.552v10.746zm-9.134-5.373h-2.149v5.015h2.149v-5.015zm4.836 0h-2.149v5.015h2.149v-5.015z"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.youtube_url}
                <a
                  href={streamer.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-[#FF0000]/20 hover:border-[#FF0000]/40 transition-all duration-200 text-white/70 hover:text-[#FF0000]"
                  title="YouTube"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    ><path
                      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.kick_url}
                <a
                  href={streamer.kick_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-[#53FC18]/20 hover:border-[#53FC18]/40 transition-all duration-200 text-white/70 hover:text-[#53FC18]"
                  title="Kick"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    stroke-linejoin="round"
                    stroke-miterlimit="2"
                    ><path
                      d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z"
                      fill="currentColor"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.reddit_url}
                <a
                  href={streamer.reddit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-[#FF4500]/20 hover:border-[#FF4500]/40 transition-all duration-200 text-white/70 hover:text-[#FF4500]"
                  title="Reddit"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    ><path
                      d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.tiktok_url}
                <a
                  href={streamer.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-200 text-white/70 hover:text-white"
                  title="TikTok"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 455 512.098"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    ><path
                      d="M321.331.011h-81.882v347.887c0 45.59-32.751 74.918-72.582 74.918-39.832 0-75.238-29.327-75.238-74.918 0-52.673 41.165-80.485 96.044-74.727v-88.153c-7.966-1.333-15.932-1.77-22.576-1.77C75.249 183.248 0 255.393 0 344.794c0 94.722 74.353 167.304 165.534 167.304 80.112 0 165.097-58.868 165.097-169.96V161.109c35.406 35.406 78.341 46.476 124.369 46.476V126.14C398.35 122.151 335.494 84.975 321.331 0v.011z"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.instagram_url}
                <a
                  href={streamer.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-[#E4405F]/20 hover:border-[#E4405F]/40 transition-all duration-200 text-white/70 hover:text-[#E4405F]"
                  title="Instagram"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    ><path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.facebook_url}
                <a
                  href={streamer.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-[#1877F2]/20 hover:border-[#1877F2]/40 transition-all duration-200 text-white/70 hover:text-[#1877F2]"
                  title="Facebook"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    ><path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    /></svg
                  >
                </a>
              {/if}
              {#if streamer.discord_url}
                <a
                  href={streamer.discord_url.startsWith("http")
                    ? streamer.discord_url
                    : `https://${streamer.discord_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-[#5865F2]/20 hover:border-[#5865F2]/40 transition-all duration-200 text-white/70 hover:text-[#5865F2]"
                  title="Discord"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                    />
                  </svg>
                </a>
              {/if}
              {#if streamer.email}
                <a
                  href={"mailto:" + streamer.email}
                  class="p-2 md:p-2.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-200 text-white/70 hover:text-white"
                  title="Email"
                >
                  <svg
                    class="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </a>
              {/if}
            </div>
          {/if}
        </div>
        <!-- Name & Bio -->
        <div class="text-left">
          <h1
            class="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg min-h-[2.5rem] sm:min-h-[3rem]"
          >
            {streamer?.name ? titleCase(streamer.name) : "Loading..."}
          </h1>

          {#if streamer && "description" in streamer && streamer.description}
            <p
              class="text-white/60 text-sm sm:text-[15px] mt-2.5 max-w-2xl leading-relaxed whitespace-pre-wrap drop-shadow min-h-[1.5rem]"
            >
              {streamer.description}
            </p>
          {/if}
        </div>
      </div>
    </div>

    {#if loadError}
      <div class="glass-card rounded-2xl p-8 text-center">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-2xl font-bold text-white mb-2">Streamer Not Found</h2>
        <p class="text-zinc-500">{loadError}</p>
      </div>
    {:else if !streamer}
      <div class="glass-card rounded-2xl p-10 text-center max-w-xl mx-auto">
        <!-- Animated spinner ring -->
        <div class="flex justify-center mb-5">
          <div
            class="w-12 h-12 rounded-full border-[3px] border-white/10 border-t-cyan-400 animate-spin"
          ></div>
        </div>
        <h2 class="text-lg font-semibold text-white/80 mb-1">
          Loading streamer…
        </h2>
        <p class="text-sm text-zinc-500">
          Hang tight, we're getting everything ready
        </p>
      </div>
    {:else}
      <div
        class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start"
      >
        <!-- Left Column: Leaderboard -->
        <div class="lg:col-span-5 order-3 lg:order-1 flex flex-col gap-4">
          {#if topTippers.length > 0}
            <div
              class="glass-card rounded-2xl p-6 border border-white/10 animate-slide-up min-h-[200px]"
            >
              <div class="flex items-center gap-2 mb-6 px-1">
                <span class="text-xl">👑</span>
                <h3 class="font-bold text-lg text-white">
                  Top Supporters <span class="text-xs font-normal text-zinc-500"
                    >(7 Days)</span
                  >
                </h3>
              </div>

              <div class="flex flex-col gap-3">
                {#each topTippers as tipper, i}
                  <div
                    class="relative overflow-hidden {i === 0
                      ? 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20'
                      : 'bg-zinc-900/40 border-white/5'} p-4 rounded-xl border flex items-center justify-between transition-all hover:border-purple-500/30 hover:bg-white/5 group"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10
                        {i === 0
                          ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                          : i === 1
                            ? 'bg-zinc-300 text-black'
                            : i === 2
                              ? 'bg-orange-400 text-black'
                              : 'bg-zinc-800 text-zinc-400'}"
                      >
                        #{i + 1}
                      </div>
                      <div
                        class="text-sm font-semibold text-white truncate max-w-[140px]"
                      >
                        {tipper.sender_name}
                      </div>
                    </div>

                    <div class="text-right z-10">
                      <div
                        class="font-black {i === 0
                          ? 'text-yellow-400'
                          : 'text-green-400'}"
                      >
                        ${(
                          (tipper.total_sol / 1e9) * solPrice +
                          tipper.total_usdc / 1e6
                        ).toFixed(2)}
                        <span class="text-xs font-normal">USD</span>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <!-- Empty State for Left Column -->
            <div
              class="glass-card rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center justify-center min-h-[200px] opacity-70 border-dashed"
            >
              <span class="text-4xl mb-3">💫</span>
              <h3 class="font-bold text-white mb-1">No tips yet</h3>
              <p class="text-sm text-zinc-400">
                Be the first to support {streamer?.name}!
              </p>
            </div>
          {/if}
        </div>

        <!-- Right Column: Tip Form -->
        <div
          class="lg:col-span-7 order-1 lg:order-2 space-y-4 max-w-xl mx-auto w-full"
        >
          <!-- Viewer Wallet Connect -->
          <div class="glass-card rounded-2xl p-5 border border-white/10">
            {#if !viewerConnected}
              {#if availableWallets.length > 0}
                <div class="space-y-3">
                  {#each availableWallets as wallet}
                    <button
                      on:click={() => handleConnectWallet(wallet)}
                      disabled={isLoading}
                      class="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl font-medium transition-all border border-purple-500/50 hover:border-purple-400"
                    >
                      Connect {wallet.name}
                    </button>
                  {/each}
                </div>
              {:else}
                <div
                  class="text-left p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
                >
                  <p class="text-sm text-zinc-300 font-medium">
                    No wallet found
                  </p>
                  <p class="text-xs text-zinc-500 mt-1">
                    Please install a Solana wallet to continue.
                  </p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <a
                      href="https://phantom.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-purple-400 hover:text-purple-300"
                      >Phantom</a
                    >
                    <span class="text-zinc-600">•</span>
                    <a
                      href="https://solflare.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-purple-400 hover:text-purple-300"
                      >Solflare</a
                    >
                  </div>
                </div>

                <div
                  class="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-left sm:hidden"
                >
                  <p class="text-xs font-medium text-purple-300 mb-1">
                    Mobile?
                  </p>
                  <p class="text-xs text-zinc-400">
                    Open this page in your wallet's in-app browser for the best
                    experience.
                  </p>
                </div>
              {/if}
              {#if walletError}
                <p class="text-red-400 text-xs mt-2 text-center">
                  {walletError}
                </p>
              {/if}
            {:else}
              <div class="flex items-center justify-between">
                <span class="text-sm text-zinc-400"
                  >Connected: {viewerWallet.slice(0, 6)}...{viewerWallet.slice(
                    -4,
                  )}</span
                >
                <button
                  on:click={handleDisconnect}
                  class="text-xs text-red-400 hover:text-red-300"
                  >Disconnect</button
                >
              </div>
            {/if}
          </div>

          <!-- Tipping Form -->
          <div class="glass-card rounded-2xl p-6 border border-white/10">
            <form on:submit={handleSubmit} class="space-y-5">
              <div>
                <label
                  for="name"
                  class="flex items-center justify-between mb-2"
                >
                  <span class="text-sm font-medium text-zinc-300"
                    >👤 Your Name</span
                  >
                  <!-- Info Icon with Tooltip containing description -->
                  <div class="relative group">
                    <div
                      class="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 cursor-help hover:text-white transition-colors border border-white/10"
                    >
                      <span class="text-xs font-bold leading-none">i</span>
                    </div>
                    <div
                      class="absolute right-0 bottom-full mb-2 w-64 bg-zinc-900/95 backdrop-blur-md border border-white/10 text-zinc-300 text-xs px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none text-center"
                    >
                      Send a {selectedCurrency} tip and show your support with a
                      custom message on their live stream.
                      <div
                        class="absolute top-full right-2 border-4 border-transparent border-t-white/10"
                      ></div>
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  bind:value={name}
                  placeholder="Anonymous"
                  maxlength="50"
                  class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label
                  for="message"
                  class="block text-sm font-medium text-zinc-300 mb-2"
                  >💬 Message</label
                >
                <textarea
                  id="message"
                  bind:value={message}
                  placeholder="Say something nice..."
                  maxlength="200"
                  rows="2"
                  class="w-full px-4 py-3 bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
                ></textarea>
              </div>

              <div>
                <!-- Currency Toggle -->
                <div class="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    on:click={() => {
                      selectedCurrency = "SOL";
                      amount = 0.01;
                    }}
                    class="flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all border {selectedCurrency ===
                    'SOL'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-purple-500/30'}"
                  >
                    ◎ SOL
                  </button>
                  <button
                    type="button"
                    on:click={() => {
                      selectedCurrency = "USDC";
                      amount = 1;
                    }}
                    class="flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all border {selectedCurrency ===
                    'USDC'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-blue-500/30'}"
                  >
                    $ USDC
                  </button>
                </div>

                <label
                  for="amount"
                  class="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2"
                >
                  <svg
                    class="w-4 h-4 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Amount ({selectedCurrency})
                  {#if selectedCurrency === "SOL" && solPrice > 0}
                    <span class="ml-auto text-xs text-zinc-500 font-normal"
                      >1 SOL ≈ ${solPrice.toFixed(2)}</span
                    >
                  {/if}
                </label>

                <!-- Suggested Amounts -->
                <div class="flex flex-wrap gap-2 mb-3">
                  {#if selectedCurrency === "SOL"}
                    {#each [0.01, 0.05, 0.1, 0.5, 1] as suggestedAmount}
                      <button
                        type="button"
                        on:click={() => (amount = suggestedAmount)}
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border {amount ===
                        suggestedAmount
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-purple-500/30 hover:text-zinc-300'}"
                      >
                        {suggestedAmount} SOL
                      </button>
                    {/each}
                  {:else}
                    {#each [1, 2, 5, 10, 25] as suggestedAmount}
                      <button
                        type="button"
                        on:click={() => (amount = suggestedAmount)}
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border {amount ===
                        suggestedAmount
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-blue-500/30 hover:text-zinc-300'}"
                      >
                        ${suggestedAmount}
                      </button>
                    {/each}
                  {/if}
                </div>

                <div class="relative">
                  <input
                    type="number"
                    id="amount"
                    bind:value={amount}
                    min={selectedCurrency === "USDC" ? "1" : "0.01"}
                    step={selectedCurrency === "USDC" ? "1" : "0.01"}
                    class="w-full px-4 py-3 pr-16 bg-zinc-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                  <div
                    class="absolute right-4 top-1/2 -translate-y-1/2 font-semibold {selectedCurrency ===
                    'USDC'
                      ? 'text-blue-400'
                      : 'text-purple-400'}"
                  >
                    {selectedCurrency}
                  </div>
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <p class="text-xs text-zinc-500">
                    Min: {selectedCurrency === "USDC" ? "1 USDC" : "0.01 SOL"}
                  </p>
                  {#if usdEquivalent}
                    <p class="text-xs text-zinc-400">
                      ≈ <span class="text-green-400 font-medium"
                        >${usdEquivalent} USD</span
                      >
                    </p>
                  {/if}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !streamer}
                class="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 disabled:opacity-50 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {#if isLoading}
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"
                    ><circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                      fill="none"
                    ></circle><path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path></svg
                  >
                {:else}
                  Generate Tip
                {/if}
              </button>
            </form>

            {#if status}
              <div
                class="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 animate-slide-up"
              >
                <p class="text-center text-purple-300 text-sm">{status}</p>
              </div>
            {/if}
          </div>

          <!-- Close the right column -->
        </div>

        {#if qrCodeUrl}
          <div
            class="order-2 lg:order-3 lg:col-span-12 max-w-xl mx-auto w-full lg:max-w-none glass-card rounded-2xl border border-white/10 animate-slide-up overflow-hidden"
          >
            <!-- Amount Summary Header -->
            <div
              class="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-b border-white/5"
            >
              <div class="flex items-center justify-center gap-3">
                <span class="text-green-400 font-bold text-lg"
                  >{amount} {selectedCurrency}</span
                >
                <svg
                  class="w-4 h-4 text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  /></svg
                >
                <span class="text-white font-semibold">{streamer?.name}</span>
              </div>
            </div>

            <!-- Payment Methods -->
            <div class="grid grid-cols-1 sm:grid-cols-2">
              <!-- Left: Scan to Pay -->
              <div class="p-6 flex flex-col items-center text-center">
                <div class="flex items-center gap-2 mb-4">
                  <span class="text-xl">📱</span>
                  <h3 class="text-lg font-bold text-white">Scan to Pay</h3>
                </div>

                <div
                  class="inline-block p-3 bg-white rounded-2xl mb-3 shadow-lg shadow-purple-500/10"
                >
                  <img src={qrCodeUrl} alt="QR" class="w-44 h-44" />
                </div>

                <p class="text-zinc-500 text-xs mb-3">
                  Open Phantom or Solflare on your phone and scan
                </p>

                <!-- Caution -->
                <div
                  class="flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg w-full"
                >
                  <span
                    class="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse flex-shrink-0 mt-1"
                  ></span>
                  <p
                    class="text-yellow-300/80 text-[11px] leading-relaxed text-left"
                  >
                    Keep this page open after scanning — the alert fires
                    automatically once confirmed.
                  </p>
                </div>
              </div>

              <!-- Divider (mobile horizontal) -->
              <div class="flex items-center gap-3 px-6 sm:hidden">
                <div class="flex-1 h-px bg-white/10"></div>
                <span class="text-xs text-zinc-500 font-medium">OR</span>
                <div class="flex-1 h-px bg-white/10"></div>
              </div>

              <!-- Right: Pay with Wallet -->
              <div
                class="p-6 flex flex-col items-center justify-center text-center sm:border-l sm:border-white/5 relative"
              >
                <!-- Vertical OR divider (desktop) -->
                <div
                  class="hidden sm:block absolute -left-px top-1/2 -translate-y-1/2 -translate-x-1/2"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"
                  >
                    <span class="text-[10px] text-zinc-400 font-bold">OR</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 mb-4">
                  <span class="text-xl">💳</span>
                  <h3 class="text-lg font-bold text-white">Pay with Wallet</h3>
                </div>

                {#if viewerConnected}
                  <div class="w-full space-y-3">
                    <div
                      class="flex items-center gap-2 justify-center px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg"
                    >
                      <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span class="text-green-400 text-xs font-medium"
                        >Wallet Connected</span
                      >
                    </div>

                    <button
                      on:click={payWithWallet}
                      disabled={isLoading}
                      class="w-full py-3.5 px-6 bg-gradient-to-r from-green-500 to-emerald-500 disabled:opacity-50 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                    >
                      {#if isLoading}
                        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"
                          ><circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                            fill="none"
                          ></circle><path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          ></path></svg
                        >
                      {:else}
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          /></svg
                        >
                        Pay {amount}
                        {selectedCurrency} Now
                      {/if}
                    </button>

                    <p class="text-zinc-500 text-[11px]">
                      Instant — no scanning required
                    </p>
                  </div>
                {:else}
                  <div class="w-full space-y-3">
                    <div
                      class="p-4 bg-zinc-800/50 border border-white/5 rounded-xl"
                    >
                      <svg
                        class="w-10 h-10 text-zinc-600 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                        /></svg
                      >
                      <p class="text-zinc-400 text-sm font-medium">
                        No wallet connected
                      </p>
                      <p class="text-zinc-500 text-xs mt-1">
                        Connect a wallet above to pay directly from your browser
                      </p>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Close the grid -->
      </div>

      <!-- Powered by Solana -->
      <div class="mt-8 flex items-center justify-center gap-2">
        <span class="text-xs text-zinc-500">Powered by</span>
        <img src="/solana-pay/Color=White.svg" alt="Solana" class="h-4" />
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div
    class="absolute bottom-6 left-0 right-0 px-4 flex items-center justify-between"
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
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.4s ease-out;
  }
</style>
