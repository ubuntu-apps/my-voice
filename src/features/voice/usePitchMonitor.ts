import { useCallback, useEffect, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'
import {
  CLARITY_THRESHOLD,
  MAX_PITCH_HZ,
  MIN_DURATION_MS,
  MIN_PITCH_HZ,
  MIN_VALID_SAMPLES,
  MIN_VOLUME_DECIBELS,
  SMOOTHING_MIN_SAMPLES,
  SMOOTHING_WINDOW,
} from './constants'
import type { ReadingKind } from './types'

export type MicPermission = 'unknown' | 'granted' | 'denied' | 'prompt'
export type MonitorStatus = 'idle' | 'requesting' | 'recording' | 'error'

export interface RecordingResult {
  kind: ReadingKind
  frequencyHz: number
  durationMs: number
  validSampleCount: number
}

function getInitialExtreme(kind: ReadingKind): number {
  return kind === 'low' ? Number.POSITIVE_INFINITY : 0
}

function isValidExtreme(kind: ReadingKind, value: number): boolean {
  return kind === 'low' ? Number.isFinite(value) : value > 0
}

function updateExtreme(kind: ReadingKind, current: number, pitch: number): number {
  return kind === 'low' ? Math.min(current, pitch) : Math.max(current, pitch)
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function usePitchMonitor() {
  const [status, setStatus] = useState<MonitorStatus>('idle')
  const [permission, setPermission] = useState<MicPermission>('unknown')
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<ReadingKind>('low')
  const [currentHz, setCurrentHz] = useState<number | null>(null)
  const [sessionHz, setSessionHz] = useState<number | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const [validSampleCount, setValidSampleCount] = useState(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null)
  const bufferRef = useRef<Float32Array | null>(null)
  const frameRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const tickRef = useRef<() => void>(() => {})
  const kindRef = useRef<ReadingKind>('low')
  const extremeRef = useRef(getInitialExtreme('low'))
  const validCountRef = useRef(0)
  const recentPitchesRef = useRef<number[]>([])

  const cleanup = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    analyserRef.current?.disconnect()
    analyserRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    detectorRef.current = null
    bufferRef.current = null
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  useEffect(() => {
    if (!navigator.permissions?.query) return
    void navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setPermission(result.state as MicPermission)
        result.onchange = () => setPermission(result.state as MicPermission)
      })
      .catch(() => {
        // Some browsers do not expose microphone permission state.
      })
  }, [])

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const detector = detectorRef.current
    const buffer = bufferRef.current
    const context = audioContextRef.current
    if (!analyser || !detector || !buffer || !context) return

    analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>)
    const [pitch, clarity] = detector.findPitch(buffer as ArrayLike<number>, context.sampleRate)

    if (
      clarity >= CLARITY_THRESHOLD &&
      pitch > 0 &&
      pitch >= MIN_PITCH_HZ &&
      pitch <= MAX_PITCH_HZ
    ) {
      setCurrentHz(pitch)

      const window = recentPitchesRef.current
      window.push(pitch)
      if (window.length > SMOOTHING_WINDOW) window.shift()

      validCountRef.current += 1
      setValidSampleCount(validCountRef.current)

      // Only let a smoothed (median) value move the session extreme, so a single
      // octave error or noise spike cannot permanently set a false record.
      if (window.length >= SMOOTHING_MIN_SAMPLES) {
        const stable = median(window)
        extremeRef.current = updateExtreme(kindRef.current, extremeRef.current, stable)
        if (isValidExtreme(kindRef.current, extremeRef.current)) {
          setSessionHz(extremeRef.current)
        }
      }
    } else {
      setCurrentHz(null)
      // Reset the smoothing window on a dropout so a new sustained note is not
      // blended with the previous one.
      recentPitchesRef.current.length = 0
    }

    setDurationMs(Date.now() - startedAtRef.current)
    frameRef.current = requestAnimationFrame(() => tickRef.current())
  }, [])

  useEffect(() => {
    tickRef.current = tick
  }, [tick])

  const start = useCallback(
    async (nextKind: ReadingKind) => {
      if (status === 'recording' || status === 'requesting') return

      cleanup()
      setStatus('requesting')
      setError(null)
      setKind(nextKind)
      kindRef.current = nextKind
      extremeRef.current = getInitialExtreme(nextKind)
      validCountRef.current = 0
      recentPitchesRef.current = []
      setCurrentHz(null)
      setSessionHz(null)
      setDurationMs(0)
      setValidSampleCount(0)

      try {
        // Disable browser audio processing: echo cancellation and AGC apply
        // filtering/compression that distort sustained tones and can suppress
        // low frequencies, hurting pitch accuracy at the extremes of the range.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
        streamRef.current = stream
        setPermission('granted')

        const context = new AudioContext()
        await context.resume()
        audioContextRef.current = context

        const source = context.createMediaStreamSource(stream)
        const analyser = context.createAnalyser()
        analyser.fftSize = 2048
        source.connect(analyser)
        analyserRef.current = analyser

        const buffer = new Float32Array(
          new ArrayBuffer(analyser.fftSize * Float32Array.BYTES_PER_ELEMENT),
        )
        bufferRef.current = buffer
        const detector = PitchDetector.forFloat32Array(buffer.length)
        detector.clarityThreshold = CLARITY_THRESHOLD
        detector.minVolumeDecibels = MIN_VOLUME_DECIBELS
        detectorRef.current = detector

        startedAtRef.current = Date.now()
        setStatus('recording')
        frameRef.current = requestAnimationFrame(() => tickRef.current())
      } catch {
        setPermission('denied')
        setStatus('error')
        setError('Microphone access is required to detect pitch. Check browser permissions.')
        cleanup()
      }
    },
    [cleanup, status],
  )

  const stop = useCallback((): RecordingResult | null => {
    if (status !== 'recording') return null

    const elapsed = Date.now() - startedAtRef.current
    const samples = validCountRef.current
    const extreme = extremeRef.current
    const currentKind = kindRef.current

    cleanup()
    setStatus('idle')
    setCurrentHz(null)

    if (
      elapsed < MIN_DURATION_MS ||
      samples < MIN_VALID_SAMPLES ||
      !isValidExtreme(currentKind, extreme)
    ) {
      setError('Hold a steady note a little longer so the app can detect your pitch.')
      setSessionHz(null)
      setDurationMs(0)
      setValidSampleCount(0)
      return null
    }

    setError(null)
    return {
      kind: currentKind,
      frequencyHz: extreme,
      durationMs: elapsed,
      validSampleCount: samples,
    }
  }, [cleanup, status])

  const resetError = useCallback(() => setError(null), [])

  return {
    status,
    permission,
    error,
    kind,
    currentHz,
    sessionHz,
    durationMs,
    validSampleCount,
    start,
    stop,
    resetError,
  }
}
