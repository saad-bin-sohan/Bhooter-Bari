'use client'
import { cn } from '../../lib/utils'

type TimerSliderProps = {
  value: number
  onChange: (val: number) => void
}

const PRESETS = [5, 15, 30, 60] as const

export const TimerSlider = ({ value, onChange }: TimerSliderProps) => {
  const percent = ((value - 1) / 59) * 100

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-surface p-4">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-4xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        <span className="text-base text-muted">
          {value === 1 ? 'minute' : 'minutes'}
        </span>
      </div>

      <div className="flex gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              'rounded-lg border px-3 py-1 font-mono text-xs transition-colors duration-150',
              value === preset
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/50 bg-transparent text-muted hover:border-border hover:text-foreground'
            )}
          >
            {preset}m
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <input
          type="range"
          min={1}
          max={60}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none"
          aria-label="Room timer duration"
          style={{
            accentColor: 'hsl(var(--primary))',
            height: '4px',
            borderRadius: '2px',
            background: `linear-gradient(to right, hsl(var(--primary)) ${percent}%, hsl(var(--surface-3)) ${percent}%)`
          }}
        />
        <div className="flex justify-between">
          <span className="font-mono text-xs text-muted">1 min</span>
          <span className="font-mono text-xs text-muted">60 min</span>
        </div>
      </div>
    </div>
  )
}
