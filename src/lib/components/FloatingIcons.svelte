<script lang="ts">
  const icons = [
    { src: '/3dicons-dollar-dynamic-color.png', alt: '', classes: 'top-[8%] left-[5%] w-20 h-20', delay: '0s' },
    { src: '/3dicons-wallet-dynamic-color.png', alt: '', classes: 'top-[12%] right-[6%] w-20 h-20', delay: '1s' },
    { src: '/3dicons-shield-dynamic-color.png', alt: '', classes: 'bottom-[25%] left-[8%] w-18 h-18', delay: '2s' },
    { src: '/3dicons-video-cam-dynamic-color.png', alt: '', classes: 'bottom-[20%] right-[5%] w-20 h-20', delay: '1.5s' }
  ];
</script>

{#each icons as icon}
  <img
    src={icon.src}
    alt={icon.alt}
    class="absolute pointer-events-none overflow-hidden z-0 {icon.classes} opacity-40 float"
    style="animation-delay: {icon.delay};"
    loading="eager"
    decoding="async"
  />
{/each}

<style>
  .float {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
</style>
