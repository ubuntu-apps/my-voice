import type { VoiceReading } from './types'

export function getBestLow(readings: VoiceReading[]): VoiceReading | null {
  const lows = readings.filter((r) => r.kind === 'low')
  if (lows.length === 0) return null
  return lows.reduce((best, r) => (r.frequencyHz < best.frequencyHz ? r : best))
}

export function getBestHigh(readings: VoiceReading[]): VoiceReading | null {
  const highs = readings.filter((r) => r.kind === 'high')
  if (highs.length === 0) return null
  return highs.reduce((best, r) => (r.frequencyHz > best.frequencyHz ? r : best))
}

export function getRangeSpanHz(low: number, high: number): number {
  return Math.max(0, high - low)
}
