import { describe, expect, it } from 'vitest'
import { buildScene, SCENE_NAMES } from '../../src/lib/weatherScene.ts'

describe('buildScene', () => {
  it('no scene for unknown conditions', () => {
    expect(buildScene('unknown')).toBeNull()
  })

  it('every known condition produces a consistent scene', () => {
    expect(buildScene('clear-day')?.sun).toBe(true)
    expect(buildScene('clear-night')?.stars.length).toBeGreaterThan(0)
    expect(buildScene('rain')?.rain.length).toBeGreaterThan(buildScene('drizzle')?.rain.length ?? 0)
    expect(buildScene('snow')?.snow.length).toBeGreaterThan(0)
    expect(buildScene('thunder')?.glow).toBe(true)
    expect(buildScene('fog')?.fog.length).toBeGreaterThan(0)
    expect(buildScene('clear-night')?.moon).toBe(true)
    expect(buildScene('clear-day')?.motes.length).toBeGreaterThan(0)
    expect(buildScene('rain')?.splashes.length).toBeGreaterThan(0)
  })

  it('is deterministic (no jumps between renders)', () => {
    expect(buildScene('rain')).toEqual(buildScene('rain'))
  })

  it('limited number of animated elements and values within bounds', () => {
    for (const name of SCENE_NAMES) {
      const s = buildScene(name)
      expect(s).not.toBeNull()
      if (!s) continue
      const all = [...s.stars, ...s.motes, ...s.clouds, ...s.fog, ...s.rain, ...s.splashes, ...s.snow]
      expect(all.length).toBeLessThanOrEqual(45)
      for (const p of all) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(100)
        expect(p.duration).toBeGreaterThan(0)
        expect(p.delay).toBeLessThanOrEqual(0)
        expect(p.delay).toBeGreaterThanOrEqual(-p.duration)
      }
    }
  })
})
