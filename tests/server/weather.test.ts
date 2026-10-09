import { describe, expect, it } from 'vitest'
import { parseOpenMeteo } from '../../server/weather.ts'

describe('parseOpenMeteo', () => {
  it('converts the response and reconstructs the UTC time', () => {
    const c = parseOpenMeteo({
      current: { time: '2026-10-09T12:00', temperature_2m: 18.4, weather_code: 2, is_day: 1 },
      daily: { temperature_2m_min: [11.2], temperature_2m_max: [21.7] },
      utc_offset_seconds: 7200,
    })
    expect(c).toEqual({
      temperatureC: 18.4,
      weatherCode: 2,
      isDay: true,
      minC: 11.2,
      maxC: 21.7,
      observedAt: '2026-10-09T10:00:00.000Z',
    })
  })

  it('does not invent data if essential fields are missing', () => {
    expect(parseOpenMeteo({ current: { weather_code: 1 } })).toBeNull()
    expect(parseOpenMeteo({})).toBeNull()
  })
})

import { parseCoordinates } from '../../server/weather.ts'
import { placeName } from '../../server/geocode.ts'

describe('parseCoordinates', () => {
  it('rounds to ~1 km and discards invalid values', () => {
    expect(parseCoordinates('45.62898', '9.44485')).toEqual({ latitude: 45.63, longitude: 9.44 })
    expect(parseCoordinates(null, '9')).toBeNull()
    expect(parseCoordinates('abc', '9')).toBeNull()
    expect(parseCoordinates('91', '9')).toBeNull()
    expect(parseCoordinates('', '')).toBeNull()
  })
})

describe('placeName', () => {
  it('prefers the municipality', () => {
    expect(placeName({ address: { city: 'Mezzago', county: 'Monza e Brianza' } })).toBe('Mezzago')
    expect(placeName({ address: { village: 'Bellusco' } })).toBe('Bellusco')
    expect(placeName({ address: {} })).toBeNull()
  })
})
