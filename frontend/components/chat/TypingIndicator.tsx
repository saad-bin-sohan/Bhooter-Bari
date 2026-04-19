'use client'
import { cn } from '../../lib/utils'

type Props = {
  names: string[]
  className?: string
}

const formatNames = (names: string[]): string => {
  if (names.length === 0) return ''
  if (names.length === 1) return `${names[0]} is typing`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`
  return `${names[0]} and ${names.length - 1} others are typing`
}

export const TypingIndicator = ({ names, className }: Props) => {
  if (names.length === 0) return null

  return (
    <div className={cn('flex items-center gap-2 px-1 py-1', className)}>
      <div className="flex items-center gap-0.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted/70 animate-pulse-dot"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted/70 animate-pulse-dot"
          style={{ animationDelay: '160ms' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted/70 animate-pulse-dot"
          style={{ animationDelay: '320ms' }}
        />
      </div>
      <span className="text-xs text-muted">{formatNames(names)}</span>
    </div>
  )
}
