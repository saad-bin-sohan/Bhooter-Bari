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
    <div className={cn('inline-flex flex-wrap gap-1 rounded-xl border border-border/50 bg-surface-2 p-1', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-150',
            value === tab.id
              ? 'border border-border/60 bg-surface text-foreground shadow-xs'
              : 'text-muted hover:bg-surface-3 hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
