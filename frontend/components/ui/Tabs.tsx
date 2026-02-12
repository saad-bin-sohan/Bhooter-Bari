'use client'
import { cn } from '../../lib/utils'

type Tab = { id: string; label: string; description?: string }

type Props = {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export const Tabs = ({ tabs, value, onChange, className }: Props) => {
  return (
    <div className={cn('flex flex-wrap gap-2 rounded-full bg-surface2 p-1', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition',
            value === tab.id ? 'bg-surface text-foreground shadow-soft' : 'text-muted hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
