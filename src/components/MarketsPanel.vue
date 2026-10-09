<script setup lang="ts">
import { computed } from 'vue'
import type { MarketState, StockQuote } from '../../shared/types.ts'
import { formatTimestamp } from '../lib/format.ts'
import type { StocksState } from '../composables/useNewsAndMarkets.ts'
import Sparkline from './Sparkline.vue'

const props = defineProps<{ stocks: StocksState; now: Date }>()

const STATE_LABELS: Record<MarketState, string> = {
  open: 'Market open',
  pre: 'Pre-market',
  post: 'After hours',
  closed: 'Market closed',
}

const marketLabel = computed(() => {
  const first = props.stocks.quotes[0]
  return first ? STATE_LABELS[first.marketState] : ''
})

const status = computed(() => {
  const s = props.stocks
  if (s.problem === 'offline') return 'Offline · not updated'
  if (s.stale && s.fetchedAt) return `Not updated · ${formatTimestamp(s.fetchedAt, props.now)}`
  const first = s.quotes[0]
  return first ? `${marketLabel.value} · ${formatTimestamp(first.marketTime, props.now)}` : ''
})

const priceFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatChange(q: StockQuote): string {
  const sign = q.changePercent > 0 ? '+' : q.changePercent < 0 ? '−' : ''
  return `${sign}${Math.abs(q.changePercent).toFixed(2)}%`
}

function arrow(q: StockQuote): string {
  return q.changePercent > 0 ? '▲' : q.changePercent < 0 ? '▼' : '■'
}
</script>

<template>
  <section class="markets" aria-label="Markets">
    <header class="panel-head">
      <h2 class="panel-head__title">Markets <span class="panel-head__sub">USD</span></h2>
      <p class="panel-head__status" :class="{ 'is-warning': stocks.stale || stocks.problem }">{{ status }}</p>
    </header>

    <ul v-if="stocks.quotes.length" class="markets__list" :class="{ 'is-stale': stocks.stale }">
      <li v-for="q in stocks.quotes" :key="q.symbol" class="quote" :class="q.changePercent >= 0 ? 'is-up' : 'is-down'">
        <div class="quote__name">
          <span class="quote__company">{{ q.name }}</span>
          <span class="quote__symbol">{{ q.symbol }}</span>
        </div>
        <Sparkline class="quote__spark" :values="q.series" :baseline="q.previousClose" :up="q.changePercent >= 0" />
        <div class="quote__numbers tabular">
          <span class="quote__price">{{ priceFormat.format(q.price) }}</span>
          <span class="quote__change"><span aria-hidden="true">{{ arrow(q) }}</span> {{ formatChange(q) }}</span>
        </div>
      </li>
    </ul>
    <p v-else class="panel-empty">{{ stocks.loading ? 'Loading quotes…' : 'Quotes unavailable' }}</p>
  </section>
</template>

<style scoped>
.markets {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.markets__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
}

.markets__list.is-stale {
  opacity: 0.6;
}

.quote {
  display: grid;
  grid-template-columns: minmax(0, 1fr) calc(var(--u) * 16) calc(var(--u) * 20);
  align-items: center;
  gap: calc(var(--u) * 2.4);
  min-height: 0;
}

.quote + .quote {
  border-top: 1px solid var(--surface-2);
}

.quote__name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quote__company {
  font-size: calc(var(--u) * 4.4);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quote__symbol {
  font-size: calc(var(--u) * 3);
  letter-spacing: 0.06em;
  color: var(--text-3);
}

.quote__spark {
  width: 100%;
  height: calc(var(--u) * 7);
}

.quote__numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.quote__price {
  font-size: calc(var(--u) * 4.4);
  color: var(--text);
}

.quote__change {
  font-size: calc(var(--u) * 3.4);
  font-weight: 600;
}

.is-up .quote__change {
  color: var(--market-up);
}

.is-down .quote__change {
  color: var(--market-down);
}
</style>
