<script lang="ts">
  import { onMount } from "svelte";

  export let animation: "fountain" | "rain" | "spaceship" = "fountain";
  export let targetId: string = "";

  const iconFiles = [
    "/3dicons-dollar-dynamic-color.webp",
    "/3dicons-video-cam-dynamic-color.webp",
    "/3dicons-wallet-dynamic-color.webp",
    "/3dicons-shield-dynamic-color.webp",
    "/3dicons-camera-dynamic-color.webp",
    "/3dicons-credit-card-dynamic-color.webp",
    "/3dicons-ghost-dynamic-color.webp",
    "/3dicons-lab-dynamic-color.webp",
    "/3dicons-minecraft-dynamic-color.webp",
    "/3dicons-skull-dynamic-color.webp",
  ];

  let ready = false;
  let icons: Array<{
    src: string;
    left: string;
    top: string;
    size: string;
    delay: string;
    duration: string;
    opacity: string;
    rotation: string;
    rotationAmount?: string;
    startX?: string;
    startY?: string;
    endX?: string;
    endY?: string;
    vx?: number;
    vy?: number;
  }> = [];

  function getTargetPosition() {
    if (targetId && typeof document !== "undefined") {
      const target = document.getElementById(targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        return {
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.top + rect.height / 2}px`,
        };
      }
    }
    return { left: "50vw", top: "50vh" };
  }

  function createIcons(targetPos: { left: string; top: string }) {
    if (animation === "spaceship") {
      // Hyperspace mode - icons streak from circular area in center outward
      // Use evenly spaced angles with varying radii for more even distribution
      icons = Array.from({ length: 15 }, (_, i) => {
        // Evenly space angles across 360 degrees
        const angle = (i / 15) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        // Use concentric rings for more even spread: 15, 22, 29, 36 (4 rings)
        const ringIndex = i % 4;
        const radius = 15 + ringIndex * 7 + Math.random() * 5;
        const startX = `calc(50% + ${Math.cos(angle) * radius}vw)`;
        const startY = `calc(50% + ${Math.sin(angle) * radius}vh)`;
        // Direction for movement
        const vx = Math.cos(angle);
        const vy = Math.sin(angle);

        return {
          src: iconFiles[i % iconFiles.length],
          left: startX,
          top: startY,
          size: `${30 + Math.random() * 40}`,
          delay: `${Math.random() * 8}s`,
          duration: `${5 + Math.random() * 8}s`,
          opacity: `${0.05 + Math.random() * 0.08}`,
          rotation: `${(angle * 180) / Math.PI}`,
          rotationAmount: `${Math.random() > 0.5 ? 0 : 90 + Math.random() * 90}`,
          vx: vx,
          vy: vy,
        };
      });
    } else if (animation === "fountain") {
      icons = Array.from({ length: 20 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 30;
        const xSpread = Math.cos(angle) * distance;
        const ySpread = Math.sin(angle) * distance;

        return {
          src: iconFiles[i % iconFiles.length],
          left: targetPos.left,
          top: targetPos.top,
          size: `${40 + Math.random() * 30}`,
          delay: `${Math.random() * 15}s`,
          duration: `${20 + Math.random() * 15}s`,
          opacity: `${0.12 + Math.random() * 0.15}`,
          rotation: `${Math.random() * 360}`,
          startX: "",
          startY: "",
          endX: "",
          endY: "",
        };
      });
    } else {
      // Rain mode - evenly distributed across width
      icons = Array.from({ length: 10 }, (_, i) => ({
        src: iconFiles[i % iconFiles.length],
        left: `${(i / 10) * 100 + 5}%`,
        top: "-100px",
        size: `${30 + Math.random() * 40}`,
        delay: `${Math.random() * 10}s`,
        duration: `${15 + Math.random() * 10}s`,
        opacity: `${0.15 + Math.random() * 0.2}`,
        rotation: `${Math.random() * 360}`,
        rotationAmount: `${Math.random() > 0.5 ? 0 : 90 + Math.random() * 90}`,
        startX: "",
        startY: "",
        endX: "",
        endY: "",
        vx: 0,
        vy: 0,
      }));
    }
  }

  onMount(() => {
    // If no targetId, run immediately (no DOM measurement needed)
    if (!targetId || animation !== "fountain") {
      const targetPos = getTargetPosition();
      createIcons(targetPos);
      ready = true;
      return;
    }

    // Use ResizeObserver to measure the target element only AFTER the browser finishes layout
    let observer: ResizeObserver;

    // We wait for the next macrotask to ensure the DOM element exists
    setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        observer = new ResizeObserver(() => {
          // The browser is done with layout for this element, safe to measure
          const newPos = getTargetPosition();

          if (!ready) {
            // First time setup
            createIcons(newPos);
            ready = true;
          } else {
            // Update positions on resize
            icons = icons.map((icon) => ({
              ...icon,
              left: newPos.left,
              top: newPos.top,
            }));
          }
        });

        observer.observe(target);
      } else {
        // Fallback if target not found
        const targetPos = getTargetPosition();
        createIcons(targetPos);
        ready = true;
      }
    }, 0);

    return () => {
      if (observer) observer.disconnect();
    };
  });
</script>

{#if ready}
  <div class="floating-icons">
    {#each icons as icon}
      <img
        src={icon.src}
        alt=""
        class="{animation}-icon z-0"
        style="
        position: absolute;
        width: {icon.size}px;
        height: {icon.size}px;
        opacity: 0;
        animation-delay: {icon.delay};
        animation-duration: {icon.duration};
        --rotation: {icon.rotation}deg;
        --rotation-amount: {icon.rotationAmount}deg;
        {animation === 'fountain'
          ? `left: ${icon.left}; top: ${icon.top}; --x-spread: ${icon.startX}; --y-spread: ${icon.startY};`
          : animation === 'rain'
            ? `left: ${icon.left}; top: -100px;`
            : `left: 50%; top: 50%; --vx: ${icon.vx || 0}; --vy: ${icon.vy || 0};`}
      "
        loading="eager"
        decoding="async"
      />
    {/each}
  </div>
{/if}

<style>
  .floating-icons {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
    contain: strict;
  }

  @media (max-width: 1024px) {
    .floating-icons {
      display: none;
    }
  }

  .fountain-icon {
    animation: fountain ease-out infinite;
    will-change: transform, opacity;
  }

  .rain-icon {
    animation: rain linear infinite;
    top: -100px;
    will-change: transform, opacity;
  }

  .spaceship-icon {
    animation: spaceship ease-in-out infinite;
    transform-origin: center center;
    will-change: transform, opacity;
  }

  @keyframes fountain {
    0% {
      transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) scale(0.4);
      opacity: 0;
    }
    10% {
      opacity: var(--opacity, 0.3);
    }
    100% {
      transform: translate(
          calc(-50% + var(--x-spread, 0vw)),
          calc(-50% + var(--y-spread, 0vh))
        )
        rotate(calc(var(--rotation, 0deg) + var(--rotation-amount, 180deg)))
        scale(0.5);
      opacity: 0;
    }
  }

  @keyframes rain {
    0% {
      transform: translateY(0) rotate(var(--rotation, 0deg));
      opacity: 0;
    }
    10% {
      opacity: var(--opacity, 0.3);
    }
    90% {
      opacity: var(--opacity, 0.3);
    }
    100% {
      transform: translateY(100vh)
        rotate(calc(var(--rotation, 0deg) + var(--rotation-amount, 180deg)));
      opacity: 0;
    }
  }

  @keyframes spaceship {
    0% {
      transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) scale(0.1);
      opacity: 0;
    }
    5% {
      opacity: var(--opacity, 0.25);
    }
    100% {
      transform: translate(
          calc(-50% + var(--vx) * 80vw),
          calc(-50% + var(--vy) * 80vh)
        )
        rotate(calc(var(--rotation, 0deg) + var(--rotation-amount, 180deg)))
        scale(3);
      opacity: 0;
    }
  }
</style>
