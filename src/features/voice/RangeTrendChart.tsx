import { useMemo } from 'react'
import type { VoiceReading } from './types'
import { dateKeyFromTimestamp, formatShortDayLabel } from './formatters'

interface RangeTrendChartProps {
  readings: VoiceReading[]
}

interface DayPoint {
  date: string
  low: number | null
  high: number | null
}

const W = 320
const H = 180
const PAD_L = 40
const PAD_R = 12
const PAD_T = 12
const PAD_B = 24
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B

export function RangeTrendChart({ readings }: RangeTrendChartProps) {
  const points = useMemo<DayPoint[]>(() => {
    const byDate = new Map<string, { low: number | null; high: number | null }>()
    for (const r of readings) {
      const key = dateKeyFromTimestamp(r.recordedAt)
      const entry = byDate.get(key) ?? { low: null, high: null }
      if (r.kind === 'low') {
        entry.low = entry.low === null ? r.frequencyHz : Math.min(entry.low, r.frequencyHz)
      } else {
        entry.high = entry.high === null ? r.frequencyHz : Math.max(entry.high, r.frequencyHz)
      }
      byDate.set(key, entry)
    }
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, v]) => ({ date, low: v.low, high: v.high }))
  }, [readings])

  const scale = useMemo(() => {
    const freqs = points.flatMap((p) => [p.low, p.high]).filter((x): x is number => x !== null)
    if (freqs.length === 0) return null
    const logMin = Math.log2(Math.min(...freqs))
    const logMax = Math.log2(Math.max(...freqs))
    const pad = (logMax - logMin) * 0.12 || 0.5
    const lo = logMin - pad
    const hi = logMax + pad
    return { lo, hi }
  }, [points])

  if (points.length < 2 || !scale) return null

  const n = points.length
  const xAt = (i: number) => (n === 1 ? PAD_L + PLOT_W / 2 : PAD_L + (i / (n - 1)) * PLOT_W)
  const yAt = (hz: number) =>
    PAD_T + (1 - (Math.log2(hz) - scale.lo) / (scale.hi - scale.lo)) * PLOT_H

  const lowLine = points
    .map((p, i) => (p.low !== null ? `${xAt(i)},${yAt(p.low)}` : null))
    .filter((x): x is string => x !== null)
    .join(' ')

  const highLine = points
    .map((p, i) => (p.high !== null ? `${xAt(i)},${yAt(p.high)}` : null))
    .filter((x): x is string => x !== null)
    .join(' ')

  const yTicks = [0, 0.5, 1].map((t) => {
    const logVal = scale.lo + t * (scale.hi - scale.lo)
    const hz = Math.round(2 ** logVal)
    return { hz, y: PAD_T + (1 - t) * PLOT_H }
  })

  return (
    <section className="trend" aria-label="Vocal range trend over time">
      <h2 className="trend__title">Trend over time</h2>
      <svg
        className="trend__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Line chart of your lowest and highest notes by day"
        preserveAspectRatio="none"
      >
        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              className="trend__gridline"
              x1={PAD_L}
              y1={tick.y}
              x2={W - PAD_R}
              y2={tick.y}
            />
            <text className="trend__axis-label" x={PAD_L - 6} y={tick.y + 3} textAnchor="end">
              {tick.hz}
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          p.low !== null && p.high !== null ? (
            <line
              key={`band-${p.date}`}
              className="trend__band"
              x1={xAt(i)}
              y1={yAt(p.low)}
              x2={xAt(i)}
              y2={yAt(p.high)}
            />
          ) : null,
        )}

        {highLine && <polyline className="trend__line trend__line--high" points={highLine} />}
        {lowLine && <polyline className="trend__line trend__line--low" points={lowLine} />}

        {points.map((p, i) => (
          <g key={`dots-${p.date}`}>
            {p.high !== null && (
              <circle className="trend__dot trend__dot--high" cx={xAt(i)} cy={yAt(p.high)} r={3} />
            )}
            {p.low !== null && (
              <circle className="trend__dot trend__dot--low" cx={xAt(i)} cy={yAt(p.low)} r={3} />
            )}
          </g>
        ))}

        <text className="trend__axis-label" x={PAD_L} y={H - 8} textAnchor="start">
          {formatShortDayLabel(points[0].date)}
        </text>
        <text className="trend__axis-label" x={W - PAD_R} y={H - 8} textAnchor="end">
          {formatShortDayLabel(points[n - 1].date)}
        </text>
      </svg>

      <div className="trend__legend">
        <span className="trend__legend-item">
          <span className="trend__swatch trend__swatch--low" /> Lowest
        </span>
        <span className="trend__legend-item">
          <span className="trend__swatch trend__swatch--high" /> Highest
        </span>
      </div>
    </section>
  )
}
