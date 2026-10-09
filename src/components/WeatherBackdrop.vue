<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherIconName } from '../lib/weatherCodes.ts'
import { buildScene, type Particle } from '../lib/weatherScene.ts'

/**
 * Animated background based on the weather. CSS only on transform/opacity (GPU
 * compositing, no layout), few particles and subtle tints on AMOLED black.
 * Paused when the dashboard is not visible; disabled with prefers-reduced-motion.
 */
const props = defineProps<{ icon: WeatherIconName | null; active: boolean }>()

const scene = computed(() => (props.icon ? buildScene(props.icon) : null))

const vars = (p: Particle): Record<string, string> => ({
  left: `${p.x}%`,
  top: `${p.y}%`,
  '--size': String(p.size),
  '--dur': `${p.duration}s`,
  '--delay': `${p.delay}s`,
  '--o': String(p.opacity),
  '--drift': String(p.drift),
})
</script>

<template>
  <div v-if="scene" class="backdrop" :class="{ 'is-paused': !active }" aria-hidden="true">
    <div v-if="scene.sun" class="sun" />
    <span v-for="(p, i) in scene.stars" :key="`s${i}`" class="star" :style="vars(p)" />
    <span v-for="(p, i) in scene.fog" :key="`f${i}`" class="fog" :style="vars(p)" />
    <span v-for="(p, i) in scene.clouds" :key="`c${i}`" class="cloud" :style="vars(p)" />
    <div v-if="scene.rain.length" class="rain" :class="{ 'is-heavy': scene.heavyRain }">
      <span v-for="(p, i) in scene.rain" :key="`r${i}`" class="drop" :style="vars(p)" />
    </div>
    <span v-for="(p, i) in scene.snow" :key="`n${i}`" class="flake" :style="vars(p)" />
    <div v-if="scene.glow" class="glow" />
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: var(--fx-opacity);
  transition: opacity 1s ease;
}

.backdrop.is-paused * {
  animation-play-state: paused;
}

/* Sun: small warm halo in the corner, very slow "breathing". */
.sun {
  position: absolute;
  top: calc(var(--u) * -30);
  right: calc(var(--u) * -22);
  width: calc(var(--u) * 80);
  height: calc(var(--u) * 80);
  border-radius: 50%;
  background: radial-gradient(circle closest-side, var(--fx-sun) 0%, transparent 100%);
  animation: breathe 14s ease-in-out infinite alternate;
}

/* Stars: tiny dots whose intensity varies slowly. */
.star {
  position: absolute;
  width: calc(var(--size) * 1px);
  height: calc(var(--size) * 1px);
  border-radius: 50%;
  background: var(--fx-star);
  opacity: 0.15;
  animation: twinkle var(--dur) ease-in-out var(--delay) infinite alternate;
}

/* Clouds: soft ellipses that drift across the screen over minutes. */
.cloud {
  position: absolute;
  left: 0 !important;
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size) * 0.42);
  border-radius: 50%;
  background: radial-gradient(ellipse closest-side, var(--fx-cloud) 0%, transparent 100%);
  opacity: var(--o);
  animation: drift var(--dur) linear var(--delay) infinite;
}

/* Fog: wide horizontal bands that sway. */
.fog {
  position: absolute;
  left: -30% !important;
  width: 160%;
  height: calc(var(--u) * var(--size));
  /* Faded in all directions: no hard edge. */
  background: radial-gradient(ellipse closest-side, var(--fx-fog) 0%, transparent 100%);
  opacity: var(--o);
  animation: sway var(--dur) ease-in-out var(--delay) infinite alternate;
}

/* Rain: thin, slightly slanted streaks. */
.rain {
  position: absolute;
  inset: -15% -10%;
  transform: rotate(10deg);
}

.drop {
  position: absolute;
  top: -12% !important;
  width: 1px;
  height: calc(var(--u) * var(--size));
  background: linear-gradient(to bottom, transparent, var(--fx-rain));
  opacity: var(--o);
  animation: fall var(--dur) linear var(--delay) infinite;
}

.rain.is-heavy .drop {
  width: 1.5px;
}

/* Snow: flakes that fall slowly, swaying. */
.flake {
  position: absolute;
  top: -4% !important;
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size));
  border-radius: 50%;
  background: var(--fx-snow);
  opacity: var(--o);
  animation: snowfall var(--dur) ease-in-out var(--delay) infinite;
}

/* Thunderstorm: faint, slow glow, never a strobe. */
.glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 70% at 30% 0%, var(--fx-glow) 0%, transparent 100%);
  opacity: 0;
  animation: glow 15s ease-in-out infinite;
}

@keyframes breathe {
  from { transform: scale(1); opacity: 0.75; }
  to { transform: scale(1.08); opacity: 1; }
}

@keyframes twinkle {
  from { opacity: 0.12; }
  to { opacity: var(--o); }
}

@keyframes drift {
  from { transform: translate3d(-100%, 0, 0); }
  to { transform: translate3d(100vw, 0, 0); }
}

@keyframes sway {
  from { transform: translate3d(-12%, 0, 0); }
  to { transform: translate3d(12%, 0, 0); }
}

@keyframes fall {
  to { transform: translate3d(0, calc(var(--app-h) * 1.35), 0); }
}

@keyframes snowfall {
  0% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(calc(var(--u) * var(--drift)), calc(var(--app-h) * 0.27), 0); }
  50% { transform: translate3d(0, calc(var(--app-h) * 0.54), 0); }
  75% { transform: translate3d(calc(var(--u) * var(--drift) * -1), calc(var(--app-h) * 0.81), 0); }
  100% { transform: translate3d(0, calc(var(--app-h) * 1.08), 0); }
}

@keyframes glow {
  0%, 84%, 100% { opacity: 0; }
  87% { opacity: 1; }
  90% { opacity: 0.4; }
  93% { opacity: 0.8; }
  97% { opacity: 0; }
}

/* Reduced motion: only static elements remain (sun, stars, still clouds). */
@media (prefers-reduced-motion: reduce) {
  .backdrop * {
    animation: none !important;
  }
  .drop,
  .flake,
  .glow,
  .fog {
    display: none;
  }
  .cloud {
    transform: translate3d(calc(var(--u) * var(--size) * 0.6), 0, 0);
  }
  .star {
    opacity: var(--o);
  }
}
</style>
