import { describe, expect, it } from 'vitest'
import { burnInOffset, isNightHour } from '../../src/lib/burnIn.ts'
import { formatDate, formatDateTime, formatLatency, formatTemperature, formatTime, formatTimestamp, formatWeekday } from '../../src/lib/format.ts'
import { isOlderThan } from '../../src/lib/staleness.ts'
import { describeWeather } from '../../src/lib/weatherCodes.ts'

describe('formattazione', () => {
  const d = new Date(2026, 9, 9, 7, 5)
  it('24h time with leading zeros', () => {
    expect(formatTime(d)).toBe('07:05')
    expect(formatTime(new Date(2026, 9, 9, 23, 59))).toBe('23:59')
  })
  it('date in English', () => {
    expect(formatWeekday(d)).toBe('Friday')
    expect(formatDate(d)).toBe('9 October 2026')
  })
  it('full date and time of the last check', () => {
    expect(formatDateTime(new Date(2026, 9, 9, 12, 42, 5).toISOString())).toBe('Fri 9 Oct 2026, 12:42:05')
    expect(formatDateTime(null)).toBe('—')
  })
  it('timestamp: time only if today', () => {
    expect(formatTimestamp(new Date(2026, 9, 9, 6, 30).toISOString(), d)).toBe('06:30')
    expect(formatTimestamp(null, d)).toBe('—')
  })
  it('temperatures and latencies', () => {
    expect(formatTemperature(-0.4)).toBe('0°')
    expect(formatTemperature(18.6)).toBe('19°')
    expect(formatTemperature(null)).toBe('—')
    expect(formatLatency(92)).toBe('92 ms')
    expect(formatLatency(1530)).toBe('1.5 s')
  })
})

describe('obsolescenza', () => {
  const now = new Date('2026-10-09T10:00:00Z')
  it('recent data is not stale, old or missing data is', () => {
    expect(isOlderThan('2026-10-09T09:59:30Z', now, 90_000)).toBe(false)
    expect(isOlderThan('2026-10-09T09:58:00Z', now, 90_000)).toBe(true)
    expect(isOlderThan(null, now, 90_000)).toBe(true)
  })
})

describe('display', () => {
  it('night window spanning midnight', () => {
    expect(isNightHour(23, 22, 7)).toBe(true)
    expect(isNightHour(3, 22, 7)).toBe(true)
    expect(isNightHour(7, 22, 7)).toBe(false)
    expect(isNightHour(12, 22, 7)).toBe(false)
  })
  it('the anti burn-in shift stays within limits and changes over time', () => {
    const a = burnInOffset(new Date(2026, 9, 9, 10, 0), 3, 6)
    const b = burnInOffset(new Date(2026, 9, 9, 10, 3), 3, 6)
    expect(a).not.toEqual(b)
    for (let m = 0; m < 1440; m++) {
      const o = burnInOffset(new Date(2026, 9, 9, 0, m), 3, 6)
      expect(Math.abs(o.x)).toBeLessThanOrEqual(6)
      expect(Math.abs(o.y)).toBeLessThanOrEqual(6)
    }
  })
  it('codici meteo', () => {
    expect(describeWeather(0, false)).toEqual({ label: 'Clear', icon: 'clear-night' })
    expect(describeWeather(1234, true).icon).toBe('unknown')
  })
})
