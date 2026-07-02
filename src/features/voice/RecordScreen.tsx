import { useEffect, useState } from 'react'
import { Mic, Square, ArrowDown, ArrowUp } from 'lucide-react'
import { Banner, BannerActionButton, Button, ScreenHeader, SegmentedControl } from '../../components/ui'
import type { ReadingKind } from './types'
import { formatFrequency, formatFrequencyWithNote, frequencyToNoteInfo } from './formatters'
import { CentsMeter } from './CentsMeter'
import type { usePitchMonitor } from './usePitchMonitor'
import type { useVoiceReadings } from './useVoiceReadings'

interface RecordScreenProps {
  monitor: ReturnType<typeof usePitchMonitor>
  readings: ReturnType<typeof useVoiceReadings>
}

const MODE_OPTIONS: { value: ReadingKind; label: string }[] = [
  { value: 'low', label: 'Low note' },
  { value: 'high', label: 'High note' },
]

export function RecordScreen({ monitor, readings }: RecordScreenProps) {
  const [mode, setMode] = useState<ReadingKind>('low')
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const isRecording = monitor.status === 'recording'
  const isBusy = monitor.status === 'requesting' || isRecording
  const micNeedsAccess = monitor.permission !== 'granted'

  useEffect(() => {
    if (!savedNotice) return
    const id = window.setTimeout(() => setSavedNotice(null), 3500)
    return () => window.clearTimeout(id)
  }, [savedNotice])

  const handleModeChange = (next: ReadingKind) => {
    if (isBusy) return
    monitor.resetError()
    setMode(next)
  }

  const handleToggleRecording = async () => {
    monitor.resetError()
    setSavedNotice(null)

    if (isRecording) {
      const result = monitor.stop()
      if (!result) return
      readings.addReading(result)
      const label = result.kind === 'low' ? 'Lowest' : 'Highest'
      setSavedNotice(`${label} note saved: ${formatFrequencyWithNote(result.frequencyHz)}`)
      return
    }

    await monitor.start(mode)
  }

  const instruction =
    mode === 'low'
      ? 'Sing or hum your lowest comfortable note and hold it steady.'
      : 'Sing or hum your highest comfortable note and hold it steady.'

  const sessionLabel = mode === 'low' ? 'Lowest so far' : 'Highest so far'

  const liveInfo = monitor.currentHz ? frequencyToNoteInfo(monitor.currentHz) : null

  return (
    <section className="screen">
      <ScreenHeader eyebrow="Vocal check-in" title="Record" />

      {(micNeedsAccess || monitor.status === 'requesting') && !isRecording && (
        <Banner
          icon={<Mic size={18} aria-hidden />}
          aria-label="Microphone permission"
          action={
            <BannerActionButton
              onClick={() => void monitor.requestMicAccess()}
              disabled={monitor.status === 'requesting'}
            >
              {monitor.status === 'requesting'
                ? 'Enabling…'
                : monitor.permission === 'denied'
                  ? 'Try again'
                  : 'Enable microphone'}
            </BannerActionButton>
          }
        >
          {monitor.permission === 'denied'
            ? 'Microphone access is blocked. Allow the mic for this site in your browser settings, then tap Try again.'
            : 'Microphone access is needed to measure your pitch. Tap Enable microphone and allow access when prompted.'}
        </Banner>
      )}

      {monitor.error && (
        <Banner
          icon={<Mic size={18} aria-hidden />}
          onDismiss={monitor.resetError}
          dismissLabel="Dismiss error"
        >
          {monitor.error}
        </Banner>
      )}

      {savedNotice && (
        <Banner icon={<Mic size={18} aria-hidden />} aria-label="Saved reading">
          {savedNotice}
        </Banner>
      )}

      <SegmentedControl
        label="Recording mode"
        value={mode}
        options={MODE_OPTIONS}
        onChange={handleModeChange}
      />

      <p className="record__hint">{instruction}</p>

      <div className={`pitch-panel${isRecording ? ' is-live' : ''}`}>
        <div className="pitch-panel__live">
          <span className="pitch-panel__label">Live pitch</span>
          {liveInfo && monitor.currentHz ? (
            <>
              <span className="pitch-panel__note">{liveInfo.note}</span>
              <span className="pitch-panel__hz">{formatFrequency(monitor.currentHz)}</span>
              <CentsMeter cents={liveInfo.cents} />
            </>
          ) : (
            <span className="pitch-panel__value">—</span>
          )}
        </div>

        <div className="pitch-panel__session">
          <span className="pitch-panel__label">{sessionLabel}</span>
          <span className="pitch-panel__value pitch-panel__value--accent">
            {monitor.sessionHz ? formatFrequencyWithNote(monitor.sessionHz) : '—'}
          </span>
        </div>

        {isRecording && (
          <p className="pitch-panel__meta">
            {Math.ceil(monitor.durationMs / 1000)}s · {monitor.validSampleCount} samples
          </p>
        )}
      </div>

      <div className="record__actions">
        <Button
          variant="primary"
          className={`record__btn${isRecording ? ' record__btn--stop' : ''}`}
          onClick={() => void handleToggleRecording()}
          disabled={monitor.status === 'requesting'}
        >
          {monitor.status === 'requesting' ? (
            'Starting…'
          ) : isRecording ? (
            <>
              <Square size={18} aria-hidden />
              Stop & save
            </>
          ) : (
            <>
              {mode === 'low' ? <ArrowDown size={18} aria-hidden /> : <ArrowUp size={18} aria-hidden />}
              Start {mode === 'low' ? 'low' : 'high'} note
            </>
          )}
        </Button>
      </div>

      <p className="record__footnote">
        Record your low and high notes in separate sessions. Only frequencies are saved — no audio
        is stored.
      </p>
    </section>
  )
}
