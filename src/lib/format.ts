const LOCALE = 'en-GB'

const pad = (n: number): string => String(n).padStart(2, '0')

/** Time in 24h format "HH:MM", independent of browser settings. */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' })
const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
const shortDayFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const fullDayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/** "Friday" */
export function formatWeekday(date: Date): string {
  return weekdayFormat.format(date)
}

/** "9 October 2026" */
export function formatDate(date: Date): string {
  return dateFormat.format(date)
}

function parse(iso: string | null): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "14:37" if today, otherwise "8 Oct 14:37". */
export function formatTimestamp(iso: string | null, now: Date): string {
  const date = parse(iso)
  if (!date) return '—'
  const time = formatTime(date)
  return date.toDateString() === now.toDateString() ? time : `${shortDayFormat.format(date)} ${time}`
}

/** Full date and time: "Fri 9 Oct 2026, 14:37:05". */
export function formatDateTime(iso: string | null): string {
  const date = parse(iso)
  if (!date) return '—'
  return `${fullDayFormat.format(date).replace(/,/g, '')}, ${formatTime(date)}:${pad(date.getSeconds())}`
}

export function formatTemperature(value: number | null): string {
  if (value === null) return '—'
  const rounded = Math.round(value)
  return `${rounded === 0 ? 0 : rounded}°`
}

export function formatLatency(ms: number | null): string {
  if (ms === null) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`
}
