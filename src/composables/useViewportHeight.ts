import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Exposes the real viewport height as --app-h. On Android the system and
 * browser bars change the available space and 100vh is not reliable
 * on all browsers.
 */
export function useViewportHeight(): void {
  // Synchronous update: resizes are rare and rAF does not fire while the page is hidden.
  const update = (): void => {
    const height = window.visualViewport?.height ?? window.innerHeight
    document.documentElement.style.setProperty('--app-h', `${Math.round(height)}px`)
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
    window.visualViewport?.removeEventListener('resize', update)
  })
}
