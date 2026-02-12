'use client'
import { cn } from '../../lib/utils'

type Props = {
  label: string
  value: boolean
  onChange: (val: boolean) => void
  description?: string
}

export const Toggle = ({ label, value, onChange, description }: Props) => {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between rounded-2xl border border-border/70 bg-surface px-4 py-3 text-left shadow-soft transition hover:shadow-card',
        value ? 'ring-1 ring-primary/30' : ''
      )}
      onClick={() => onChange(!value)}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <span
        className={cn(
          'relative h-6 w-12 rounded-full border border-border/70 transition',
          value ? 'bg-primary' : 'bg-surface3'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform',
            value ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  )
}
