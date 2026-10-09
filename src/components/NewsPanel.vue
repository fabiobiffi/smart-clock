<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { APP_CONFIG } from '../config/app.ts'
import { formatTimestamp } from '../lib/format.ts'
import type { NewsState } from '../composables/useNewsAndMarkets.ts'

const props = defineProps<{ news: NewsState; now: Date }>()

const items = computed(() => props.news.items)

/*
 * Finger-scrollable list (native scroll). After a period without
 * interaction it returns to the top, so the display always shows the latest news.
 */
const list = ref<HTMLElement | null>(null)
const atStart = ref(true)
const atEnd = ref(false)
let resetTimer: number | null = null

function updateEdge(): void {
  const el = list.value
  if (!el) return
  atStart.value = el.scrollTop <= 2
  atEnd.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
}

function scheduleReset(): void {
  if (resetTimer !== null) window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    resetTimer = null
    // Animated scrolling does not advance on a hidden page: in that case (or with
    // reduced motion) jump back to the top instantly.
    const animate =
      document.visibilityState === 'visible' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.value?.scrollTo({ top: 0, behavior: animate ? 'smooth' : 'auto' })
  }, APP_CONFIG.newsScrollResetMs)
}

function onScroll(): void {
  updateEdge()
  if ((list.value?.scrollTop ?? 0) > 0) scheduleReset()
}

// New news: recompute whether there is more to scroll.
watch(items, () => requestAnimationFrame(updateEdge), { flush: 'post' })

onBeforeUnmount(() => {
  if (resetTimer !== null) window.clearTimeout(resetTimer)
})

const status = computed(() => {
  const n = props.news
  if (n.problem === 'offline') return 'Offline · not updated'
  if (n.stale && n.fetchedAt) return `Not updated · ${formatTimestamp(n.fetchedAt, props.now)}`
  return n.fetchedAt ? `Updated ${formatTimestamp(n.fetchedAt, props.now)}` : ''
})
</script>

<template>
  <section class="news" aria-label="Latest news">
    <header class="panel-head">
      <h2 class="panel-head__title">{{ news.source }} <span class="panel-head__sub">Latest news</span></h2>
      <p class="panel-head__status" :class="{ 'is-warning': news.stale || news.problem }">{{ status }}</p>
    </header>

    <ol
      v-if="items.length"
      ref="list"
      class="news__list"
      :class="{ 'is-stale': news.stale, 'is-at-start': atStart, 'is-at-end': atEnd }"
      @scroll.passive="onScroll"
    >
      <li v-for="item in items" :key="item.link" class="news__item">
        <time class="news__time tabular" :datetime="item.publishedAt ?? undefined">{{ formatTimestamp(item.publishedAt, now) }}</time>
        <p class="news__title">{{ item.title }}</p>
      </li>
    </ol>
    <p v-else class="panel-empty">{{ news.loading ? 'Loading news…' : 'News unavailable' }}</p>
  </section>
</template>

<style scoped>
.news {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.news__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  /* Edge fades only where there is more to scroll. */
  --fade-top: 14%;
  --fade-bottom: 18%;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 var(--fade-top), #000 calc(100% - var(--fade-bottom)), transparent 100%);
}

.news__list.is-at-start {
  --fade-top: 0%;
}

.news__list::-webkit-scrollbar {
  display: none;
}

.news__list.is-at-end {
  --fade-bottom: 0%;
}

.news__list.is-stale {
  opacity: 0.6;
}

.news__item {
  display: grid;
  grid-template-columns: calc(var(--u) * 10) minmax(0, 1fr);
  align-items: baseline;
  gap: calc(var(--u) * 2);
  padding: calc(var(--u) * 1.8) 0;
}

.news__item + .news__item {
  border-top: 1px solid var(--surface-2);
}

.news__time {
  font-size: calc(var(--u) * 3.4);
  color: var(--accent);
}

.news__title {
  font-size: calc(var(--u) * 4.4);
  line-height: 1.25;
  color: var(--text);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
