<script setup lang="ts">
import type { WeatherIconName } from '../lib/weatherCodes.ts'

defineProps<{ name: WeatherIconName }>()

const CLOUD = 'M14 28h20a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 14 28Z'
</script>

<template>
  <svg
    class="wi"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Sun -->
    <g v-if="name === 'clear-day'">
      <path class="wi-rays" d="M24 6v4M24 38v4M6 24h4M38 24h4M11.3 11.3l2.8 2.8M33.9 33.9l2.8 2.8M11.3 36.7l2.8-2.8M33.9 14.1l2.8-2.8" />
      <circle class="wi-core" cx="24" cy="24" r="8" />
    </g>
    <!-- Moon -->
    <g v-else-if="name === 'clear-night'">
      <path class="wi-moon" d="M33 30.5A12.5 12.5 0 0 1 19.5 13a12.5 12.5 0 1 0 13.5 17.5Z" />
      <path class="wi-twinkle" d="M36 10v4M34 12h4" stroke-width="1.5" />
      <path class="wi-twinkle wi-twinkle--late" d="M40 20v2M39 21h2" stroke-width="1.5" />
    </g>
    <!-- Sun + cloud -->
    <g v-else-if="name === 'partly-day'">
      <g class="wi-peek">
        <path d="M17 8v3M8.5 11.5l2 2M5 20h3M27 11.5l-2 2" />
        <path d="M11.5 22a7 7 0 0 1 12-6.5" />
      </g>
      <path class="wi-float" d="M16 38h18a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 16 38Z" />
    </g>
    <!-- Moon + cloud -->
    <g v-else-if="name === 'partly-night'">
      <path class="wi-peek" d="M22 13a7.5 7.5 0 0 1-9.5-7A8 8 0 1 0 22 17" />
      <path class="wi-float" d="M16 38h18a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 16 38Z" />
    </g>
    <!-- Cloud -->
    <g v-else-if="name === 'cloudy'">
      <path class="wi-float wi-float--slow" d="M30 18a7 7 0 0 0-11-3" opacity="0.5" />
      <path class="wi-float" d="M14 36h20a8 8 0 0 0 0-16 10 10 0 0 0-19.4 2.8A6.6 6.6 0 0 0 14 36Z" />
    </g>
    <!-- Fog -->
    <g v-else-if="name === 'fog'">
      <path d="M14 26h20a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 14 26Z" />
      <path class="wi-haze" d="M8 32h32" />
      <path class="wi-haze wi-haze--late" d="M12 38h24" />
    </g>
    <!-- Drizzle / rain -->
    <g v-else-if="name === 'drizzle' || name === 'rain'">
      <path class="wi-float" :d="CLOUD" />
      <template v-if="name === 'drizzle'">
        <path class="wi-drop" d="M18 34v2" />
        <path class="wi-drop wi-d2" d="M26 34v2" />
        <path class="wi-drop wi-d3" d="M22 34v2" />
        <path class="wi-drop wi-d4" d="M30 34v2" />
      </template>
      <template v-else>
        <path class="wi-drop" d="M18 33l-2 6" />
        <path class="wi-drop wi-d2" d="M25 33l-2 6" />
        <path class="wi-drop wi-d3" d="M32 33l-2 6" />
      </template>
    </g>
    <!-- Snow -->
    <g v-else-if="name === 'snow'">
      <path class="wi-float" :d="CLOUD" />
      <g stroke-width="3">
        <path class="wi-flake" d="M18 34v.01" />
        <path class="wi-flake wi-d2" d="M24 34v.01" />
        <path class="wi-flake wi-d3" d="M30 34v.01" />
        <path class="wi-flake wi-d4" d="M21 34v.01" />
      </g>
    </g>
    <!-- Thunderstorm -->
    <g v-else-if="name === 'thunder'">
      <path class="wi-float" :d="CLOUD" />
      <path class="wi-bolt" d="M25 30l-4 7h6l-4 7" />
    </g>
    <!-- Unknown -->
    <g v-else>
      <circle cx="24" cy="24" r="14" />
      <path d="M20 20a4 4 0 1 1 5.5 3.7c-1 .4-1.5 1.3-1.5 2.3M24 31v.01" />
    </g>
  </svg>
</template>

<style scoped>
/* Gentle, looping micro-animations: transform/opacity only. */
.wi * {
  transform-box: fill-box;
  transform-origin: center;
}

.wi-rays {
  transform-box: view-box;
  animation: wi-spin 40s linear infinite;
}

.wi-core {
  animation: wi-pulse 5s ease-in-out infinite alternate;
}

.wi-moon {
  animation: wi-rock 9s ease-in-out infinite alternate;
}

.wi-twinkle {
  animation: wi-twinkle 3.2s ease-in-out infinite alternate;
}

.wi-twinkle--late {
  animation-delay: -1.6s;
}

.wi-peek {
  animation: wi-peek 7s ease-in-out infinite alternate;
}

.wi-float {
  animation: wi-float 6s ease-in-out infinite alternate;
}

.wi-float--slow {
  animation-duration: 9s;
  animation-direction: alternate-reverse;
}

.wi-haze {
  animation: wi-haze 6s ease-in-out infinite alternate;
}

.wi-haze--late {
  animation-delay: -3s;
}

.wi-drop {
  animation: wi-drop 1.4s linear infinite;
}

.wi-flake {
  animation: wi-flake 3.6s linear infinite;
}

.wi-d2 { animation-delay: -0.35s; }
.wi-d3 { animation-delay: -0.7s; }
.wi-d4 { animation-delay: -1.05s; }

.wi-flake.wi-d2 { animation-delay: -0.9s; }
.wi-flake.wi-d3 { animation-delay: -1.8s; }
.wi-flake.wi-d4 { animation-delay: -2.7s; }

.wi-bolt {
  animation: wi-bolt 5s ease-in-out infinite;
}

@keyframes wi-spin {
  to { transform: rotate(360deg); }
}

@keyframes wi-pulse {
  from { transform: scale(0.94); }
  to { transform: scale(1.04); }
}

@keyframes wi-rock {
  from { transform: rotate(-6deg); }
  to { transform: rotate(6deg); }
}

@keyframes wi-twinkle {
  from { opacity: 0.2; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes wi-peek {
  from { transform: translate(0, 1px); opacity: 0.75; }
  to { transform: translate(-1.5px, -1px); opacity: 1; }
}

@keyframes wi-float {
  from { transform: translate(-1px, 0); }
  to { transform: translate(1.5px, -1px); }
}

@keyframes wi-haze {
  from { transform: translateX(-2.5px); opacity: 0.5; }
  to { transform: translateX(2.5px); opacity: 1; }
}

@keyframes wi-drop {
  0% { transform: translate(0, -3px); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(-1px, 6px); opacity: 0; }
}

@keyframes wi-flake {
  0% { transform: translate(0, -2px); opacity: 0; }
  20% { opacity: 1; }
  50% { transform: translate(1.5px, 4px); }
  100% { transform: translate(-1px, 11px); opacity: 0; }
}

@keyframes wi-bolt {
  0%, 70%, 100% { opacity: 1; }
  78% { opacity: 0.35; }
  86% { opacity: 0.9; }
}

@media (prefers-reduced-motion: reduce) {
  .wi * {
    animation: none !important;
  }
}
</style>
