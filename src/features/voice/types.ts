export type ReadingKind = 'low' | 'high'

export interface VoiceReading {
  id: string
  kind: ReadingKind
  /** Extreme frequency detected for this session (Hz). */
  frequencyHz: number
  recordedAt: number
  durationMs: number
  validSampleCount: number
}

export interface AppData {
  readings: VoiceReading[]
}
