import type { WeatherIconName } from './weatherCodes.ts'

/** Element of an animated scene. Coordinates in % of the container, times in seconds. */
export interface Particle {
  x: number
  y: number
  size: number
  duration: number
  /** Negative delay: particles start already spread out, with no initial "wave". */
  delay: number
  opacity: number
  /** Horizontal sway (flakes) in --u units. */
  drift: number
}

export interface SceneLayers {
  sun: boolean
  stars: Particle[]
  clouds: Particle[]
  fog: Particle[]
  rain: Particle[]
  /** Heavy rain: longer, faster drops. */
  heavyRain: boolean
  snow: Particle[]
  /** Slow, faint glow (not a strobing flash). */
  glow: boolean
}

export const SCENE_NAMES = [
  'clear-day',
  'clear-night',
  'partly-day',
  'partly-night',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'snow',
  'thunder',
] as const satisfies readonly WeatherIconName[]

/** Deterministic PRNG (mulberry32): the same scene is always identical. */
function random(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seedOf = (name: string): number => [...name].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)

interface Range {
  x?: [number, number]
  y?: [number, number]
  size: [number, number]
  duration: [number, number]
  opacity: [number, number]
  drift?: [number, number]
}

function particles(count: number, range: Range, rnd: () => number): Particle[] {
  const pick = ([min, max]: [number, number]): number => min + (max - min) * rnd()
  return Array.from({ length: count }, (_, i) => {
    const duration = pick(range.duration)
    return {
      // Layered distribution to avoid gaps and clumps.
      x: range.x ? pick(range.x) : ((i + rnd()) / count) * 100,
      y: range.y ? pick(range.y) : 0,
      size: pick(range.size),
      duration,
      delay: -duration * rnd(),
      opacity: pick(range.opacity),
      drift: range.drift ? pick(range.drift) : 0,
    }
  })
}

/** Builds the animated layers for the weather icon; null if there is no scene. */
export function buildScene(icon: WeatherIconName): SceneLayers | null {
  if (icon === 'unknown') return null
  const rnd = random(seedOf(icon))
  const scene: SceneLayers = { sun: false, stars: [], clouds: [], fog: [], rain: [], heavyRain: false, snow: [], glow: false }

  const stars = (count: number) =>
    particles(count, { x: [2, 98], y: [3, 72], size: [1, 2.2], duration: [3, 7], opacity: [0.35, 0.85] }, rnd)
  const clouds = (count: number, opacity: [number, number]) =>
    particles(count, { y: [-8, 45], size: [55, 95], duration: [140, 220], opacity }, rnd)
  const rain = (count: number, heavy: boolean) =>
    particles(count, { size: heavy ? [7, 11] : [4, 7], duration: heavy ? [0.7, 1] : [1.1, 1.6], opacity: [0.35, 0.8] }, rnd)

  switch (icon) {
    case 'clear-day':
      scene.sun = true
      break
    case 'clear-night':
      scene.stars = stars(26)
      break
    case 'partly-day':
      scene.sun = true
      scene.clouds = clouds(3, [0.6, 0.9])
      break
    case 'partly-night':
      scene.stars = stars(16)
      scene.clouds = clouds(3, [0.6, 0.9])
      break
    case 'cloudy':
      scene.clouds = clouds(5, [0.7, 1])
      break
    case 'fog':
      scene.fog = particles(3, { y: [15, 70], size: [18, 30], duration: [50, 80], opacity: [0.6, 1] }, rnd)
      break
    case 'drizzle':
      scene.clouds = clouds(3, [0.6, 0.9])
      scene.rain = rain(18, false)
      break
    case 'rain':
      scene.clouds = clouds(3, [0.7, 1])
      scene.rain = rain(34, true)
      scene.heavyRain = true
      break
    case 'snow':
      scene.clouds = clouds(2, [0.5, 0.8])
      scene.snow = particles(28, { size: [0.8, 2], duration: [10, 18], opacity: [0.4, 0.9], drift: [2, 6] }, rnd)
      break
    case 'thunder':
      scene.clouds = clouds(4, [0.8, 1])
      scene.rain = rain(34, true)
      scene.heavyRain = true
      scene.glow = true
      break
  }
  return scene
}
