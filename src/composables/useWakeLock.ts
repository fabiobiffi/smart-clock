import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export type WakeLockState = 'unsupported' | 'active' | 'released' | 'denied'

/**
 * Screen Wake Lock: keeps the screen on ONLY while the page is visible.
 * The browser revokes the lock when the page goes to the background; it is
 * requested again when the page returns to the foreground and on the first touch (some
 * browsers grant it only after an interaction). Requires HTTPS.
 */
export function useWakeLock(): Readonly<Ref<WakeLockState>> {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator && window.isSecureContext
  const state = ref<WakeLockState>(supported ? 'released' : 'unsupported')
  let sentinel: WakeLockSentinel | null = null
  let requesting = false

  async function acquire(): Promise<void> {
    if (!supported || requesting || sentinel || document.visibilityState !== 'visible') return
    requesting = true
    try {
      sentinel = await navigator.wakeLock.request('screen')
      state.value = 'active'
      sentinel.addEventListener('release', () => {
        sentinel = null
        state.value = 'released'
      })
    } catch {
      state.value = 'denied'
    } finally {
      requesting = false
    }
  }

  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') void acquire()
  }
  const onPointer = (): void => void acquire()

  onMounted(() => {
    if (!supported) return
    void acquire()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pointerdown', onPointer, { passive: true })
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pointerdown', onPointer)
    void sentinel?.release()
    sentinel = null
  })

  return state
}
