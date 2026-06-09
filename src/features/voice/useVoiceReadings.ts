import { useCallback, useEffect, useState } from 'react'
import type { AppData, ReadingKind, VoiceReading } from './types'
import { createId, loadData, saveData } from './storage'

export interface ReadingInput {
  kind: ReadingKind
  frequencyHz: number
  durationMs: number
  validSampleCount: number
}

export function useVoiceReadings() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'my-voice:data:v1') {
        setData(loadData())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addReading = useCallback((input: ReadingInput) => {
    const reading: VoiceReading = {
      id: createId(),
      kind: input.kind,
      frequencyHz: input.frequencyHz,
      recordedAt: Date.now(),
      durationMs: input.durationMs,
      validSampleCount: input.validSampleCount,
    }
    setData((prev) => ({
      readings: [reading, ...prev.readings],
    }))
    return reading
  }, [])

  const deleteReading = useCallback((id: string) => {
    setData((prev) => ({
      readings: prev.readings.filter((r) => r.id !== id),
    }))
  }, [])

  return { data, addReading, deleteReading }
}
