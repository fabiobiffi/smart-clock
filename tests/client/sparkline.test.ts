import { describe, expect, it } from 'vitest'
import { sparkline } from '../../src/lib/sparkline.ts'

describe('sparkline', () => {
  it('servono almeno due punti', () => {
    expect(sparkline([1], 1, 100, 20)).toBeNull()
  })

  it('scales the values into the box, including the reference line', () => {
    const g = sparkline([10, 20], 0, 100, 20, 0)
    expect(g?.points).toBe('0.0,10.0 100.0,0.0')
    expect(g?.baselineY).toBe(20)
  })

  it('flat series without division by zero', () => {
    const g = sparkline([5, 5, 5], 5, 60, 10)
    expect(g?.points.split(' ')).toHaveLength(3)
    expect(g?.points).not.toContain('NaN')
  })
})
