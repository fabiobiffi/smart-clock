import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import { APP_CONFIG } from '../config/app.ts'
import { schedule } from '../core/scheduler.ts'
import { loadJson, saveJson } from '../services/storage.ts'

export interface Coordinates {
  latitude: number
  longitude: number
}

export type GeolocationStatus = 'unsupported' | 'pending' | 'granted' | 'denied' | 'error'

const CACHE_KEY = 'geolocation'

function isCoordinates(value: unknown): value is Coordinates {
  const v = value as Partial<Coordinates> | null
  return !!v && typeof v.latitude === 'number' && typeof v.longitude === 'number'
}

/** ~1 km: enough for the weather, without sharing the precise location. */
const round = (value: number): number => Math.round(value * 100) / 100

/**
 * Approximate device location for the weather.
 * Requires HTTPS and the user's permission (asked once by the browser).
 * If unavailable or denied, coords stays null and the default location is used.
 */
export function useGeolocation(): { coords: ShallowRef<Coordinates | null>; status: Ref<GeolocationStatus> } {
  const supported = 'geolocation' in navigator && window.isSecureContext
  const coords = shallowRef<Coordinates | null>(supported ? loadJson(CACHE_KEY, isCoordinates) : null)
  const status = ref<GeolocationStatus>(supported ? 'pending' : 'unsupported')
  let unschedule: (() => void) | null = null

  function locate(): Promise<void> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = { latitude: round(position.coords.latitude), longitude: round(position.coords.longitude) }
          const current = coords.value
          if (!current || current.latitude !== next.latitude || current.longitude !== next.longitude) {
            coords.value = next
            saveJson(CACHE_KEY, next)
          }
          status.value = 'granted'
          resolve()
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            // Permission revoked: the last saved location is no longer used.
            status.value = 'denied'
            coords.value = null
          } else {
            status.value = 'error'
          }
          resolve()
        },
        { enableHighAccuracy: false, timeout: 20_000, maximumAge: APP_CONFIG.geolocationRefreshMs },
      )
    })
  }

  onMounted(() => {
    if (supported) unschedule = schedule('geolocation', APP_CONFIG.geolocationRefreshMs, locate)
  })
  onBeforeUnmount(() => unschedule?.())

  return { coords, status }
}
