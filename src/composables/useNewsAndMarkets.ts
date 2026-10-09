import { computed, reactive, type Ref } from 'vue'
import { APP_CONFIG } from '../config/app.ts'
import { isOlderThan } from '../lib/staleness.ts'
import { fetchNewsReport, fetchStocksReport, isNewsReport, isStocksReport } from '../services/api.ts'
import { useRemoteReport } from './useRemoteReport.ts'

/** News (RSS) from the server; the last valid list stays visible if the feed does not respond. */
export function useNews(now: Readonly<Ref<Date>>) {
  const { report, problem, loading } = useRemoteReport({
    key: 'news-report',
    pollMs: APP_CONFIG.newsPollMs,
    fetch: fetchNewsReport,
    isValid: isNewsReport,
    accept: (next, previous) => next.items.length > 0 || !previous?.items.length,
  })

  return reactive({
    source: computed(() => report.value?.source ?? 'News'),
    items: computed(() => report.value?.items ?? []),
    fetchedAt: computed(() => report.value?.fetchedAt ?? null),
    stale: computed(() => isOlderThan(report.value?.fetchedAt ?? null, now.value, APP_CONFIG.newsStaleAfterMs)),
    problem,
    loading,
  })
}

/** Quotes from the server; prices are never made up, and the last known data is marked as stale. */
export function useStocks(now: Readonly<Ref<Date>>) {
  const { report, problem, loading } = useRemoteReport({
    key: 'stocks-report',
    pollMs: APP_CONFIG.stocksPollMs,
    fetch: fetchStocksReport,
    isValid: isStocksReport,
    accept: (next, previous) => next.quotes.length > 0 || !previous?.quotes.length,
  })

  return reactive({
    quotes: computed(() => report.value?.quotes ?? []),
    fetchedAt: computed(() => report.value?.fetchedAt ?? null),
    providerError: computed(() => report.value?.error ?? null),
    stale: computed(() => isOlderThan(report.value?.fetchedAt ?? null, now.value, APP_CONFIG.stocksStaleAfterMs)),
    problem,
    loading,
  })
}

export type NewsState = ReturnType<typeof useNews>
export type StocksState = ReturnType<typeof useStocks>
