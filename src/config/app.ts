import type { DashboardDefinition } from '../types.ts'

/** Client configuration. The monitored services are defined in server/config.ts. */
export const APP_CONFIG = {
  locale: 'en-GB',
  dashboards: [
    { id: 'clock', label: 'Clock and weather' },
    { id: 'services', label: 'Service status' },
    { id: 'markets', label: 'News and markets' },
  ] satisfies DashboardDefinition[],
  healthPollMs: 30_000,
  weatherPollMs: 5 * 60_000,
  requestTimeoutMs: 8_000,
  /** A manual check waits for the server probe (10 s timeout + connectivity check). */
  manualCheckTimeoutMs: 20_000,
  /** Minimum spinner duration, so that a quick check stays perceptible. */
  manualCheckMinSpinnerMs: 600,
  /** A check older than N monitor intervals is considered stale. */
  healthStaleIntervals: 3,
  /** The monitor is considered unreachable after N failed/missed polls. */
  healthPollStaleIntervals: 3,
  /** A "service back online" alert disappears after this time. */
  recoveryToastMs: 20_000,
  /** Alert sound volume (0–1), during the day and in the night window. */
  alertVolume: { day: 0.14, night: 0.05 },
  weatherStaleAfterMs: 60 * 60_000,
  /** How often to re-read the device location (geolocation). */
  geolocationRefreshMs: 6 * 60 * 60_000,
  newsPollMs: 5 * 60_000,
  newsStaleAfterMs: 45 * 60_000,
  /** After this much time without interaction, the news list scrolls back to the top. */
  newsScrollResetMs: 60_000,
  stocksPollMs: 2 * 60_000,
  stocksStaleAfterMs: 20 * 60_000,
  /** Visual night mode (does not change hardware brightness). */
  night: { startHour: 22, endHour: 7 },
  /** Anti burn-in shift: every N minutes, within ±maxOffsetPx. */
  burnIn: { everyMinutes: 3, maxOffsetPx: 6 },
} as const
