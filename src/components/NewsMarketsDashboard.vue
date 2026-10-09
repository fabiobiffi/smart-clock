<script setup lang="ts">
import type { NewsState, StocksState } from '../composables/useNewsAndMarkets.ts'
import MarketsPanel from './MarketsPanel.vue'
import NewsPanel from './NewsPanel.vue'

defineProps<{ now: Date; news: NewsState; stocks: StocksState }>()
</script>

<template>
  <div class="news-markets burn-in-shift">
    <NewsPanel :news="news" :now="now" />
    <MarketsPanel :stocks="stocks" :now="now" />
  </div>
</template>

<style scoped>
.news-markets {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  column-gap: calc(var(--gutter) * 1.2);
  height: 100%;
  padding: calc(var(--gutter) * 0.8) var(--gutter) calc(var(--gutter) * 1.4);
}

/* Headers and empty states shared by the two panels. */
.news-markets :deep(.panel-head) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: calc(var(--u) * 2);
  padding-bottom: calc(var(--u) * 2);
  min-width: 0;
}

.news-markets :deep(.panel-head__title) {
  font-size: calc(var(--u) * 5.4);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.news-markets :deep(.panel-head__sub) {
  margin-left: calc(var(--u) * 1);
  font-size: calc(var(--u) * 3.6);
  font-weight: 500;
  color: var(--text-3);
}

.news-markets :deep(.panel-head__status) {
  min-width: 0;
  font-size: calc(var(--u) * 3.4);
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-markets :deep(.panel-head__status.is-warning) {
  color: var(--status-degraded);
}

.news-markets :deep(.panel-empty) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--u) * 4.2);
  color: var(--text-2);
}
</style>
