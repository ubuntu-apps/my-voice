import type { AppData, ReadingKind, VoiceReading } from './types'

const STORAGE_KEY = 'my-voice:data:v1'

export const emptyData: AppData = {
  readings: [],
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData
    const parsed = JSON.parse(raw) as Partial<AppData>
    const validKinds: ReadingKind[] = ['low', 'high']
    const readings = Array.isArray(parsed.readings)
      ? (parsed.readings as Partial<VoiceReading>[])
          .filter(
            (r) =>
              typeof r.id === 'string' &&
              validKinds.includes(r.kind as ReadingKind) &&
              typeof r.frequencyHz === 'number' &&
              typeof r.recordedAt === 'number',
          )
          .map((r) => ({
            id: r.id!,
            kind: r.kind as ReadingKind,
            frequencyHz: r.frequencyHz!,
            recordedAt: r.recordedAt!,
            durationMs: typeof r.durationMs === 'number' ? r.durationMs : 0,
            validSampleCount:
              typeof r.validSampleCount === 'number' ? r.validSampleCount : 0,
          }))
      : []
    return { readings }
  } catch {
    return emptyData
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage may be unavailable (private mode / quota).
  }
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
