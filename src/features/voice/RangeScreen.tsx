import { useMemo } from 'react'
import { AudioLines } from 'lucide-react'
import { EmptyState, ScreenHeader } from '../../components/ui'
import type { AppData } from './types'
import { dateKeyFromTimestamp, formatFrequencyWithNote, formatShortDayLabel } from './formatters'
import { getBestHigh, getBestLow, getRangeSpanHz } from './rangeStats'
import { MIN_PITCH_HZ, MAX_PITCH_HZ } from './constants'
import { RangeTrendChart } from './RangeTrendChart'

interface RangeScreenProps {
  data: AppData
  onRecord: () => void
}

export function RangeScreen({ data, onRecord }: RangeScreenProps) {
  const bestLow = useMemo(() => getBestLow(data.readings), [data.readings])
  const bestHigh = useMemo(() => getBestHigh(data.readings), [data.readings])

  const spanHz = bestLow && bestHigh ? getRangeSpanHz(bestLow.frequencyHz, bestHigh.frequencyHz) : null

  const lowPercent = bestLow
    ? ((bestLow.frequencyHz - MIN_PITCH_HZ) / (MAX_PITCH_HZ - MIN_PITCH_HZ)) * 100
    : null
  const highPercent = bestHigh
    ? ((bestHigh.frequencyHz - MIN_PITCH_HZ) / (MAX_PITCH_HZ - MIN_PITCH_HZ)) * 100
    : null

  if (!bestLow && !bestHigh) {
    return (
      <section className="screen">
        <ScreenHeader eyebrow="Your range" title="Range" />
        <EmptyState
          icon={AudioLines}
          message="Record a low note and a high note to see your vocal range here."
          action={{ label: 'Go record', onClick: onRecord }}
        />
      </section>
    )
  }

  return (
    <section className="screen">
      <ScreenHeader eyebrow="Your range" title="Range" />

      <div className="stats" aria-label="Personal bests">
        <div className="stat">
          <span className="stat__value">
            {bestLow ? formatFrequencyWithNote(bestLow.frequencyHz) : '—'}
          </span>
          <span className="stat__label">Lowest</span>
        </div>
        <div className="stat">
          <span className="stat__value stat__value--good">
            {bestHigh ? formatFrequencyWithNote(bestHigh.frequencyHz) : '—'}
          </span>
          <span className="stat__label">Highest</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {spanHz !== null ? `${spanHz.toFixed(0)} Hz` : '—'}
          </span>
          <span className="stat__label">Span</span>
        </div>
      </div>

      {lowPercent !== null && highPercent !== null && (
        <div className="range-bar" aria-label="Range visualization">
          <div className="range-bar__track">
            <div
              className="range-bar__fill"
              style={{
                left: `${Math.min(lowPercent, highPercent)}%`,
                width: `${Math.max(highPercent - lowPercent, 2)}%`,
              }}
            />
            <span
              className="range-bar__marker range-bar__marker--low"
              style={{ left: `${lowPercent}%` }}
              title={bestLow ? formatFrequencyWithNote(bestLow.frequencyHz) : undefined}
            />
            <span
              className="range-bar__marker range-bar__marker--high"
              style={{ left: `${highPercent}%` }}
              title={bestHigh ? formatFrequencyWithNote(bestHigh.frequencyHz) : undefined}
            />
          </div>
          <div className="range-bar__labels">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      )}

      <div className="range-details">
        {bestLow && (
          <article className="range-card">
            <h2>Best low</h2>
            <p className="range-card__value">{formatFrequencyWithNote(bestLow.frequencyHz)}</p>
            <p className="range-card__meta">
              {formatShortDayLabel(dateKeyFromTimestamp(bestLow.recordedAt))}
            </p>
          </article>
        )}
        {bestHigh && (
          <article className="range-card">
            <h2>Best high</h2>
            <p className="range-card__value">{formatFrequencyWithNote(bestHigh.frequencyHz)}</p>
            <p className="range-card__meta">
              {formatShortDayLabel(dateKeyFromTimestamp(bestHigh.recordedAt))}
            </p>
          </article>
        )}
      </div>

      {(!bestLow || !bestHigh) && (
        <p className="record__footnote">
          {!bestLow ? 'Record a low note to complete your range.' : 'Record a high note to complete your range.'}
        </p>
      )}

      <RangeTrendChart readings={data.readings} />
    </section>
  )
}
