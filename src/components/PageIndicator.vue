<script setup lang="ts">
defineProps<{ count: number; index: number; labels: string[] }>()
</script>

<template>
  <div class="indicator burn-in-shift" role="tablist" aria-label="Dashboards">
    <span
      v-for="i in count"
      :key="i"
      class="indicator__dot"
      :class="{ 'is-active': i - 1 === index }"
      role="tab"
      :aria-selected="i - 1 === index"
      :aria-label="labels[i - 1]"
    />
  </div>
</template>

<style scoped>
.indicator {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--u) * 2.4);
  display: flex;
  justify-content: center;
  gap: calc(var(--u) * 1.6);
  pointer-events: none;
}

.indicator__dot {
  width: calc(var(--u) * 1.4);
  height: calc(var(--u) * 1.4);
  border-radius: 50%;
  background: var(--text-3);
  opacity: 0.45;
  transition: opacity var(--page-transition), background-color var(--page-transition);
}

.indicator__dot.is-active {
  background: var(--text-2);
  opacity: 0.9;
}
</style>
