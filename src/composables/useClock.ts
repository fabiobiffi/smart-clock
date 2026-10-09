import { onBeforeUnmount, onMounted, shallowRef, type Ref } from 'vue'

/**
 * Current time, updated at the start of every minute (the UI shows HH:MM).
 * The timer is realigned on every tick and when the page returns to the foreground, because
 * browsers throttle or suspend timers on background pages.
 * Funziona interamente offline.
 */
export function useClock(): Readonly<Ref<Date>> {
  const now = shallowRef(new Date())
  let timer: number | null = null

  function tick(): void {
    now.value = new Date()
    if (timer !== null) window.clearTimeout(timer)
    const msToNextMinute = 60_000 - (Date.now() % 60_000)
    timer = window.setTimeout(tick, msToNextMinute + 50)
  }

  function onVisible(): void {
    if (document.visibilityState === 'visible') tick()
  }

  onMounted(() => {
    tick()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', tick)
    window.addEventListener('focus', tick)
  })

  onBeforeUnmount(() => {
    if (timer !== null) window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('pageshow', tick)
    window.removeEventListener('focus', tick)
  })

  return now
}
