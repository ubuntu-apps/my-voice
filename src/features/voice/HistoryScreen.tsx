import { useMemo } from 'react'
import { ArrowDown, ArrowUp, History as HistoryIcon, Trash2 } from 'lucide-react'
import { EmptyState, IconButton, ScreenHeader } from '../../components/ui'
import type { AppData, VoiceReading } from './types'
import {
  dateKeyFromTimestamp,
  formatFrequencyWithNote,
  formatRecordedTime,
  formatShortDayLabel,
} from './formatters'

interface HistoryScreenProps {
  data: AppData
  onDelete: (id: string) => void
  onRecord: () => void
}

interface DayGroup {
  date: string
  label: string
  readings: VoiceReading[]
}

export function HistoryScreen({ data, onDelete, onRecord }: HistoryScreenProps) {
  const groups = useMemo<DayGroup[]>(() => {
    const byDate = new Map<string, VoiceReading[]>()
    for (const reading of data.readings) {
      const date = dateKeyFromTimestamp(reading.recordedAt)
      const list = byDate.get(date) ?? []
      list.push(reading)
      byDate.set(date, list)
    }
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, readings]) => ({
        date,
        label: formatShortDayLabel(date),
        readings: readings.sort((a, b) => b.recordedAt - a.recordedAt),
      }))
  }, [data.readings])

  const stats = useMemo(() => {
    const lowCount = data.readings.filter((r) => r.kind === 'low').length
    const highCount = data.readings.filter((r) => r.kind === 'high').length
    return { lowCount, highCount, total: data.readings.length }
  }, [data.readings])

  if (data.readings.length === 0) {
    return (
      <section className="screen">
        <ScreenHeader eyebrow="Your log" title="History" />
        <EmptyState
          icon={HistoryIcon}
          message="No readings yet. Record your low and high notes to build a history."
          action={{ label: 'Go record', onClick: onRecord }}
        />
      </section>
    )
  }

  return (
    <section className="screen">
      <ScreenHeader eyebrow="Your log" title="History" />

      <div className="stats" aria-label="Reading summary">
        <div className="stat">
          <span className="stat__value">{stats.total}</span>
          <span className="stat__label">Total</span>
        </div>
        <div className="stat">
          <span className="stat__value">{stats.lowCount}</span>
          <span className="stat__label">Low</span>
        </div>
        <div className="stat">
          <span className="stat__value stat__value--good">{stats.highCount}</span>
          <span className="stat__label">High</span>
        </div>
      </div>

      <div className="history">
        {groups.map((group) => (
          <div key={group.date} className="history__day">
            <h2 className="history__date">{group.label}</h2>
            <ul className="history__list">
              {group.readings.map((reading) => (
                <li
                  key={reading.id}
                  className={`history__item is-${reading.kind}`}
                >
                  <span className="history__icon">
                    {reading.kind === 'low' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                  </span>
                  <span className="history__name">
                    {reading.kind === 'low' ? 'Low note' : 'High note'}
                  </span>
                  <span className="history__freq">{formatFrequencyWithNote(reading.frequencyHz)}</span>
                  <span className="history__time">{formatRecordedTime(reading.recordedAt)}</span>
                  <IconButton
                    label={`Delete ${reading.kind} reading`}
                    onClick={() => onDelete(reading.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
