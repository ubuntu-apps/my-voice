import { formatCents } from './formatters'

interface CentsMeterProps {
  cents: number
}

const IN_TUNE_CENTS = 5

export function CentsMeter({ cents }: CentsMeterProps) {
  const clamped = Math.max(-50, Math.min(50, cents))
  const percent = ((clamped + 50) / 100) * 100
  const inTune = Math.abs(cents) <= IN_TUNE_CENTS
  const direction = cents > IN_TUNE_CENTS ? 'sharp' : cents < -IN_TUNE_CENTS ? 'flat' : 'in tune'

  return (
    <div className={`cents-meter${inTune ? ' is-in-tune' : ''}`}>
      <div className="cents-meter__track" aria-hidden>
        <span className="cents-meter__center" />
        <span className="cents-meter__marker" style={{ left: `${percent}%` }} />
      </div>
      <div className="cents-meter__labels" aria-hidden>
        <span>flat</span>
        <span>sharp</span>
      </div>
      <span className="cents-meter__value" aria-label={`${Math.abs(cents)} cents ${direction}`}>
        {formatCents(cents)}
      </span>
    </div>
  )
}
