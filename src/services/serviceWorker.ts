/**
 * Registers the service worker (production only). When a new version is
 * installed, the page reloads by itself: useful for a display that
 * stays open for days without interaction.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  const hadController = navigator.serviceWorker.controller !== null
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        // Periodic update check (every 6 hours) for very long sessions.
        window.setInterval(() => void registration.update().catch(() => undefined), 6 * 60 * 60_000)
      },
      (error: unknown) => console.warn('[sw] registration failed', error),
    )
  })
}
