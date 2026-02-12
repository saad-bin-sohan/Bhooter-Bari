'use client'
import { cn } from '../../lib/utils'

type Props = {
  names: string[]
  className?: string
}

export const TypingIndicator = ({ names, className }: Props) => {
  if (names.length === 0) return null
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted', className)}>
      <span className="flex gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary/70" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary/40" />
      </span>
      <span>{names.join(', ')} typing…</span>
    </div>
  )
}
