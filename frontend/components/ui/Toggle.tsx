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
        'focus-ring flex w-full items-center justify-between gap-4 rounded-xl border border-border/60 bg-surface px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2'
      )}
      onClick={() => onChange(!value)}
    >
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <span
        className={cn(
          'relative h-6 w-10 rounded-full border border-border transition-all duration-200',
          value ? 'border-transparent bg-primary' : 'bg-surface-3'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-200',
            value ? 'translate-x-[18px]' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  )
}
