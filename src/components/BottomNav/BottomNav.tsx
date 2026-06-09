import { Mic, AudioLines, History } from 'lucide-react'

export type Tab = 'record' | 'range' | 'history'

const TABS: { id: Tab; label: string; Icon: typeof Mic }[] = [
  { id: 'record', label: 'Record', Icon: Mic },
  { id: 'range', label: 'Range', Icon: AudioLines },
  { id: 'history', label: 'History', Icon: History },
]

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item${active === id ? ' is-active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={22} strokeWidth={2.2} aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
