/**
 * Place name from coordinates (OpenStreetMap Nominatim).
 * Nominatim policy: identifying User-Agent, max 1 request/s. Calls are
 * rare (position rounded to ~1 km, result cached permanently).
 */
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const TIMEOUT_MS = 8_000
const MAX_CACHE = 50

interface NominatimResponse {
  name?: string
  address?: Record<string, string | undefined>
}

/** Picks the most meaningful name for display: municipality, then locality, then province. */
export function placeName(data: NominatimResponse): string | null {
  const a = data.address ?? {}
  return a.city ?? a.town ?? a.village ?? a.municipality ?? a.hamlet ?? data.name ?? a.county ?? null
}

const cache = new Map<string, string | null>()
let lastRequestAt = 0

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`
  if (cache.has(key)) return cache.get(key) ?? null

  const wait = lastRequestAt + 1100 - Date.now()
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastRequestAt = Date.now()

  const url = new URL(REVERSE_URL)
  url.search = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    zoom: '10',
    'accept-language': 'it',
  }).toString()
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'clock-dashboard/1.0 (personal dashboard)' },
    })
    if (!response.ok) return null
    const name = placeName((await response.json()) as NominatimResponse)
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value ?? '')
    cache.set(key, name)
    return name
  } catch {
    // Temporary error: not cached, will be retried on the next request.
    return null
  }
}
