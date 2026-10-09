import { describe, expect, it } from 'vitest'
import { clampPage, resolveSwipe } from '../../src/lib/swipe.ts'

const width = 640

describe('resolveSwipe', () => {
  it('a tap does not change the page', () => {
    expect(resolveSwipe({ dx: 3, dy: 2, durationMs: 90, width })).toBe(0)
  })
  it('swipe verso sinistra → pagina successiva', () => {
    expect(resolveSwipe({ dx: -200, dy: 10, durationMs: 300, width })).toBe(1)
  })
  it('swipe verso destra → pagina precedente', () => {
    expect(resolveSwipe({ dx: 200, dy: -10, durationMs: 300, width })).toBe(-1)
  })
  it('a short but fast flick changes the page', () => {
    expect(resolveSwipe({ dx: -60, dy: 0, durationMs: 80, width })).toBe(1)
  })
  it('a short, slow drag does not', () => {
    expect(resolveSwipe({ dx: -60, dy: 0, durationMs: 600, width })).toBe(0)
  })
  it('a mostly vertical gesture is ignored', () => {
    expect(resolveSwipe({ dx: -150, dy: 160, durationMs: 200, width })).toBe(0)
  })
})

describe('clampPage', () => {
  it('respects the bounds (non-cyclic navigation)', () => {
    expect(clampPage(-1, 2)).toBe(0)
    expect(clampPage(2, 2)).toBe(1)
    expect(clampPage(1, 2)).toBe(1)
  })
})
