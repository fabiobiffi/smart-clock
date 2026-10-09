/**
 * Remote source refreshed periodically, keeping the last valid data.
 * On error the previous data stays available (the client decides whether
 * it is stale) and the retry happens sooner than the normal interval.
 */
export interface PolledState<T> {
  data: T | null
  fetchedAt: string | null
  error: string | null
}

export function describeFetchError(error: unknown): string {
  if (error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'AbortError') {
    return error.message === 'fetch failed' ? 'Provider unreachable' : error.message
  }
  return 'Provider unreachable'
}

export function createPolledSource<T>(fetcher: () => Promise<T>, refreshMs: number, retryMs = 2 * 60_000) {
  let state: PolledState<T> = { data: null, fetchedAt: null, error: null }
  let timer: ReturnType<typeof setTimeout> | null = null
  let stopped = true

  async function refresh(): Promise<void> {
    try {
      state = { data: await fetcher(), fetchedAt: new Date().toISOString(), error: null }
    } catch (error) {
      state = { ...state, error: describeFetchError(error) }
    }
  }

  function loop(): void {
    void refresh().finally(() => {
      if (stopped) return
      timer = setTimeout(loop, state.error ? Math.min(refreshMs, retryMs) : refreshMs)
    })
  }

  return {
    start(): void {
      if (!stopped) return
      stopped = false
      loop()
    },
    stop(): void {
      stopped = true
      if (timer) clearTimeout(timer)
    },
    getState: (): PolledState<T> => state,
  }
}
