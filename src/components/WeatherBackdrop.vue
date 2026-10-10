<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherIconName } from '../lib/weatherCodes.ts'
import { buildScene, type Particle } from '../lib/weatherScene.ts'

/**
 * Animated background based on the weather. CSS only on transform/opacity (GPU
 * compositing, no layout, no blur filters), few particles and subtle tints on
 * AMOLED black. Paused when the dashboard is not visible; disabled with
 * prefers-reduced-motion. A change of scene cross-fades.
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
  <Transition name="scene" appear>
    <div v-if="scene" :key="icon ?? ''" class="backdrop" :class="{ 'is-paused': !active }" aria-hidden="true">
      <div class="sky" />
      <template v-if="scene.sun">
        <div class="rays" />
        <div class="sun" />
      </template>
      <div v-if="scene.moon" class="moon" />
      <span v-for="(p, i) in scene.stars" :key="`s${i}`" class="star" :style="vars(p)" />
      <span v-if="scene.shootingStar" class="shooting-star" />
      <span v-for="(p, i) in scene.motes" :key="`m${i}`" class="mote" :style="vars(p)" />
      <span v-for="(p, i) in scene.fog" :key="`f${i}`" class="fog" :style="vars(p)" />
      <span v-for="(p, i) in scene.clouds" :key="`c${i}`" class="cloud" :style="vars(p)" />
      <div v-if="scene.rain.length" class="rain" :class="{ 'is-heavy': scene.heavyRain }">
        <span v-for="(p, i) in scene.rain" :key="`r${i}`" class="drop" :style="vars(p)" />
      </div>
      <span v-for="(p, i) in scene.splashes" :key="`p${i}`" class="splash" :style="vars(p)" />
      <span v-for="(p, i) in scene.snow" :key="`n${i}`" class="flake" :style="vars(p)" />
      <template v-if="scene.glow">
        <div class="glow" />
        <svg class="bolt" viewBox="0 0 40 120" preserveAspectRatio="none">
          <path d="M26 0 20 22l6 6-12 26 7 5-13 36 5 3-7 22M20 22l-9 10M14 54l-8 5" />
        </svg>
      </template>
    </div>
  </Transition>
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

/* Scene change: slow cross-fade between the old and new weather. */
.scene-enter-active,
.scene-leave-active {
  transition: opacity 2.4s ease;
}

.scene-leave-active {
  position: absolute;
}

.scene-enter-from,
.scene-leave-to {
  opacity: 0;
}

/* Sky: static tint fading to pure black. */
.sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 90% 70% at 75% -10%, var(--scene-sky) 0%, transparent 100%),
    linear-gradient(to bottom, var(--scene-sky) 0%, transparent 55%);
}

/* Sun: warm halo in the corner, very slow "breathing". */
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

/* Sun rays: faint light shafts that rotate over minutes. */
.rays {
  position: absolute;
  top: calc(var(--u) * -80);
  right: calc(var(--u) * -80);
  width: calc(var(--u) * 180);
  height: calc(var(--u) * 180);
  border-radius: 50%;
  background: repeating-conic-gradient(from 0deg, var(--fx-ray) 0deg 6deg, transparent 6deg 22deg);
  -webkit-mask-image: radial-gradient(circle closest-side, #000 15%, transparent 100%);
  mask-image: radial-gradient(circle closest-side, #000 15%, transparent 100%);
  animation: spin 240s linear infinite;
}

/* Moon: cool halo, dimmer than the sun. */
.moon {
  position: absolute;
  top: calc(var(--u) * -26);
  right: calc(var(--u) * -18);
  width: calc(var(--u) * 70);
  height: calc(var(--u) * 70);
  border-radius: 50%;
  background: radial-gradient(circle closest-side, var(--fx-moon) 0%, transparent 100%);
  animation: breathe 18s ease-in-out infinite alternate;
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

/* Shooting star: a short streak crossing the sky about twice a minute. */
.shooting-star {
  position: absolute;
  top: 8%;
  left: 20%;
  width: calc(var(--u) * 22);
  height: 1px;
  background: linear-gradient(to right, transparent, var(--fx-star));
  opacity: 0;
  transform-origin: right center;
  animation: shoot 26s ease-in 4s infinite;
}

/* Light motes: specks of warm light slowly rising and swaying. */
.mote {
  position: absolute;
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size));
  border-radius: 50%;
  background: radial-gradient(circle closest-side, var(--fx-mote), transparent);
  opacity: 0;
  animation: rise var(--dur) ease-in-out var(--delay) infinite;
}

/* Clouds: three soft puffs per cloud, drifting across the screen over minutes. */
.cloud {
  position: absolute;
  left: 0 !important;
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size) * 0.5);
  background:
    radial-gradient(ellipse 34% 48% at 30% 60%, var(--fx-cloud) 0%, transparent 100%),
    radial-gradient(ellipse 30% 56% at 55% 42%, var(--fx-cloud) 0%, transparent 100%),
    radial-gradient(ellipse 36% 44% at 74% 64%, var(--fx-cloud) 0%, transparent 100%);
  opacity: var(--o);
  animation: drift var(--dur) linear var(--delay) infinite;
}

/* Fog: wide horizontal bands that sway at different speeds. */
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

/* Splashes: flat rings that widen and fade near the bottom edge. */
.splash {
  position: absolute;
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size) * 0.3);
  border: 1px solid var(--fx-rain);
  border-radius: 50%;
  opacity: 0;
  animation: splash var(--dur) ease-out var(--delay) infinite;
}

/* Snow: soft flakes that fall slowly, swaying. */
.flake {
  position: absolute;
  top: -4% !important;
  width: calc(var(--u) * var(--size));
  height: calc(var(--u) * var(--size));
  border-radius: 50%;
  background: radial-gradient(circle closest-side, var(--fx-snow) 55%, transparent 100%);
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

/* Dim bolt in the distance, in sync with the glow. */
.bolt {
  position: absolute;
  top: 0;
  left: 6%;
  width: calc(var(--u) * 8);
  height: calc(var(--u) * 30);
  fill: none;
  stroke: var(--fx-bolt);
  stroke-width: 1.2;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  opacity: 0;
  animation: glow 15s ease-in-out infinite;
}

@keyframes breathe {
  from { transform: scale(1); opacity: 0.75; }
  to { transform: scale(1.08); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes twinkle {
  from { opacity: 0.12; }
  to { opacity: var(--o); }
}

@keyframes shoot {
  0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(18deg) scaleX(0.2); }
  2% { opacity: 0.8; }
  5% { opacity: 0; transform: translate3d(calc(var(--u) * 60), calc(var(--u) * 20), 0) rotate(18deg) scaleX(1); }
  100% { opacity: 0; transform: translate3d(calc(var(--u) * 60), calc(var(--u) * 20), 0) rotate(18deg) scaleX(1); }
}

@keyframes rise {
  0% { opacity: 0; transform: translate3d(0, 0, 0); }
  20% { opacity: var(--o); }
  50% { transform: translate3d(calc(var(--u) * var(--drift)), calc(var(--app-h) * -0.25), 0); }
  80% { opacity: var(--o); }
  100% { opacity: 0; transform: translate3d(0, calc(var(--app-h) * -0.5), 0); }
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

@keyframes splash {
  0% { opacity: 0; transform: scale(0.2); }
  10% { opacity: var(--o); }
  60%, 100% { opacity: 0; transform: scale(1); }
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

/* Reduced motion: only static elements remain (sky, sun, moon, stars, still clouds). */
@media (prefers-reduced-motion: reduce) {
  .backdrop * {
    animation: none !important;
  }
  .drop,
  .splash,
  .flake,
  .mote,
  .shooting-star,
  .glow,
  .bolt,
  .fog {
    display: none;
  }
  .cloud {
    transform: translate3d(calc(var(--u) * var(--size) * 0.6), 0, 0);
  }
  .star {
    opacity: var(--o);
  }
  .scene-enter-active,
  .scene-leave-active {
    transition: none;
  }
}
</style>
