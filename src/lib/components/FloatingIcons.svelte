<script lang="ts">
  import { onMount } from 'svelte';

  export let animation: 'fountain' | 'rain' = 'fountain';
  export let targetId: string = '';

  const iconFiles = [
    '/3dicons-dollar-dynamic-color.png',
    '/3dicons-video-cam-dynamic-color.png',
    '/3dicons-wallet-dynamic-color.png',
    '/3dicons-shield-dynamic-color.png',
    '/3dicons-camera-dynamic-color.png',
    '/3dicons-credit-card-dynamic-color.png',
    '/3dicons-ghost-dynamic-color.png',
    '/3dicons-lab-dynamic-color.png',
    '/3dicons-minecraft-dynamic-color.png',
    '/3dicons-skull-dynamic-color.png'
  ];

  let ready = false;
  let icons: Array<{
    src: string;
    left: string;
    size: string;
    delay: string;
    duration: string;
    opacity: string;
    rotation: string;
  }> = [];

  function getTargetPosition() {
    if (targetId && typeof document !== 'undefined') {
      const target = document.getElementById(targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        return {
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.top + rect.height / 2}px`
        };
      }
    }
    return { left: '50vw', top: '50vh' };
  }

  function createIcons(targetPos: { left: string; top: string }) {
    if (animation === 'fountain') {
      icons = Array.from({ length: 25 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 30;
        const xSpread = Math.cos(angle) * distance;
        const ySpread = Math.sin(angle) * distance;

        return {
          src: iconFiles[i % iconFiles.length],
          left: targetPos.left,
          top: targetPos.top,
          size: `${80 + Math.random() * 45}`,
          delay: `${Math.random() * 15}s`,
          duration: `${20 + Math.random() * 15}s`,
          opacity: `${0.12 + Math.random() * 0.15}`,
          xSpread: xSpread,
          ySpread: ySpread,
          rotation: `${Math.random() * 360}`
        };
      });
    } else {
      icons = Array.from({ length: 10 }, (_, i) => ({
        src: iconFiles[i % iconFiles.length],
        left: `${Math.random() * 100}%`,
        size: `${30 + Math.random() * 40}`,
        delay: `${Math.random() * 10}s`,
        duration: `${15 + Math.random() * 10}s`,
        opacity: `${0.15 + Math.random() * 0.2}`,
        rotation: `${Math.random() * 360}`
      }));
    }
  }

  onMount(() => {
    const targetPos = getTargetPosition();
    createIcons(targetPos);
    ready = true;

    // Update position on resize
    const handleResize = () => {
      if (animation === 'fountain' && targetId) {
        const newPos = getTargetPosition();
        icons = icons.map(icon => ({
          ...icon,
          left: newPos.left,
          top: newPos.top
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        {animation === 'fountain'
          ? `left: ${icon.left}; top: ${icon.top}; --x-spread: ${icon.xSpread}vw; --y-spread: ${icon.ySpread}vh;`
          : `left: ${icon.left}; top: -100px;`}
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
  }

  @media (max-width: 1024px) {
    .floating-icons {
      display: none;
    }
  }

  .fountain-icon {
    animation: fountain ease-out infinite;
  }

  .rain-icon {
    animation: rain linear infinite;
    top: -100px;
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
      transform: translate(calc(-50% + var(--x-spread, 0vw)), calc(-50% + var(--y-spread, 0vh))) rotate(calc(var(--rotation, 0deg) + 360deg)) scale(0.5);
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
      transform: translateY(100vh) rotate(calc(var(--rotation, 0deg) + 360deg));
      opacity: 0;
    }
  }
</style>
