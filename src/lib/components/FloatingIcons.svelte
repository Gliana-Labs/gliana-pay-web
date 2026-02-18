<script lang="ts">
  import { onMount } from 'svelte';

  const iconFiles = [
    '/3dicons-dollar-dynamic-color.png',
    '/3dicons-video-cam-dynamic-color.png',
    '/3dicons-wallet-dynamic-color.png',
    '/3dicons-shield-dynamic-color.png'
  ];

  // Generate 12 random falling icons
  let icons: Array<{
    src: string;
    left: string;
    size: string;
    delay: string;
    duration: string;
    opacity: string;
  }> = [];

  onMount(() => {
    icons = Array.from({ length: 12 }, (_, i) => ({
      src: iconFiles[i % iconFiles.length],
      left: `${Math.random() * 100}%`,
      size: `${24 + Math.random() * 32}`, // 24-56px random
      delay: `${Math.random() * 5}s`,
      duration: `${4 + Math.random() * 4}s`, // 4-8s
      opacity: `${0.15 + Math.random() * 0.25}` // 0.15-0.4
    }));
  });
</script>

{#each icons as icon}
  <img
    src={icon.src}
    alt=""
    class="absolute pointer-events-none z-0 rain-icon"
    style="
      left: {icon.left};
      width: {icon.size}px;
      height: {icon.size}px;
      opacity: {icon.opacity};
      animation-delay: {icon.delay};
      animation-duration: {icon.duration};
    "
    loading="eager"
    decoding="async"
  />
{/each}

<style>
  .rain-icon {
    top: -100px;
    animation: rain linear infinite;
  }

  @keyframes rain {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: var(--opacity, 0.3);
    }
    90% {
      opacity: var(--opacity, 0.3);
    }
    100% {
      transform: translateY(120vh) rotate(360deg);
      opacity: 0;
    }
  }
</style>
