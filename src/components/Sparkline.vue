<script setup lang="ts">
import { computed } from 'vue'
import { sparkline } from '../lib/sparkline.ts'

const props = defineProps<{ values: number[]; baseline: number; up: boolean }>()

const WIDTH = 100
const HEIGHT = 36
const geometry = computed(() => sparkline(props.values, props.baseline, WIDTH, HEIGHT, 2))
</script>

<template>
  <svg class="spark" :class="up ? 'is-up' : 'is-down'" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" aria-hidden="true">
    <template v-if="geometry">
      <line class="spark__base" x1="0" :y1="geometry.baselineY" :x2="WIDTH" :y2="geometry.baselineY" />
      <polyline class="spark__line" :points="geometry.points" />
    </template>
  </svg>
</template>

<style scoped>
.spark {
  display: block;
  overflow: visible;
}

.spark__base {
  stroke: var(--text-3);
  stroke-width: 1;
  stroke-dasharray: 2 3;
  vector-effect: non-scaling-stroke;
}

.spark__line {
  fill: none;
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.is-up .spark__line {
  stroke: var(--market-up);
}

.is-down .spark__line {
  stroke: var(--market-down);
}
</style>
