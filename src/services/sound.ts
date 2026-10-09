/**
 * Alert sounds synthesized with Web Audio (no audio files).
 *
 * Browsers allow audio only after an interaction with the page:
 * the AudioContext is unlocked on the first touch/key press. Until that happens,
 * playChime() returns false and the UI flags it.
 */
type ChimeKind = 'alert' | 'recovery'

/** Note (Hz): two descending tones for the alert, ascending for the recovery. */
const NOTES: Record<ChimeKind, number[]> = {
  alert: [659.25, 523.25],
  recovery: [523.25, 783.99],
}

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (context) return context
  const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  context = new Ctor()
  return context
}

export function isAudioReady(): boolean {
  return context?.state === 'running'
}

/** To be called inside an interaction handler (pointerdown/keydown). */
export async function unlockAudio(): Promise<boolean> {
  const ctx = getContext()
  if (!ctx) return false
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return false
    }
  }
  return ctx.state === 'running'
}

/** Short soft chime (sine waves with a gentle envelope). */
export function playChime(kind: ChimeKind, volume: number): boolean {
  const ctx = getContext()
  if (!ctx || ctx.state !== 'running' || volume <= 0) return false
  const start = ctx.currentTime + 0.02
  NOTES[kind].forEach((frequency, i) => {
    const at = start + i * 0.22
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(volume, at + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9)
    osc.connect(gain).connect(ctx.destination)
    osc.start(at)
    osc.stop(at + 0.95)
  })
  return true
}
