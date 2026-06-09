const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export interface NoteInfo {
  /** Nearest note name with octave, e.g. "A4". */
  note: string
  /** Signed offset from the nearest note in cents, in the range [-50, 50]. */
  cents: number
  /** Nearest MIDI note number. */
  midi: number
}

export function frequencyToNoteInfo(hz: number): NoteInfo {
  const midiFloat = 12 * Math.log2(hz / 440) + 69
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return { note: `${name}${octave}`, cents, midi }
}

export function frequencyToNote(hz: number): string {
  return frequencyToNoteInfo(hz).note
}

export function formatCents(cents: number): string {
  if (cents === 0) return '±0¢'
  return `${cents > 0 ? '+' : '-'}${Math.abs(cents)}¢`
}

export function formatFrequency(hz: number): string {
  return `${hz.toFixed(1)} Hz`
}

export function formatFrequencyWithNote(hz: number): string {
  return `${formatFrequency(hz)} (${frequencyToNote(hz)})`
}

export function formatShortDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRecordedTime(recordedAt: number): string {
  return new Date(recordedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function dateKeyFromTimestamp(recordedAt: number): string {
  const date = new Date(recordedAt)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
