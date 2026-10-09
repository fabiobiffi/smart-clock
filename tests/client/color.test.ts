import { describe, expect, it } from 'vitest'
import { cardBackground, contrastRatio, hexToRgba, mixWithBlack, relativeLuminance } from '../../src/lib/color.ts'

const BRAND_COLORS = ['#ce332a', '#5f599b', '#f7f7f6', '#fedb03', '#3b82f6', '#fb910d']

describe('brand colors', () => {
  it('hexToRgba e mixWithBlack', () => {
    expect(hexToRgba('#ce332a', 0.2)).toBe('rgba(206, 51, 42, 0.2)')
    expect(mixWithBlack('#ffffff', 0.5)).toBe('#808080')
    expect(mixWithBlack('#ff0000', 0)).toBe('#000000')
  })

  it('luminanza agli estremi', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1)
  })

  it('every card background is dark and guarantees high contrast with white text', () => {
    for (const color of BRAND_COLORS) {
      const bg = cardBackground(color)
      expect(relativeLuminance(bg)).toBeLessThanOrEqual(0.05)
      expect(contrastRatio('#ffffff', bg)).toBeGreaterThanOrEqual(10)
    }
  })

  it('i marchi restano distinguibili tra loro', () => {
    const backgrounds = new Set(BRAND_COLORS.map((c) => cardBackground(c)))
    expect(backgrounds.size).toBe(BRAND_COLORS.length)
  })
})
