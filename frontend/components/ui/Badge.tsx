'use client'
import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent'
}

const variants = {
  default: 'bg-surface2 text-muted border border-border/60',
  success: 'bg-success/15 text-success border border-success/30',
  warning: 'bg-warning/15 text-warning-foreground border border-warning/30',
  danger: 'bg-danger/15 text-danger border border-danger/30',
  accent: 'bg-accent/15 text-accent border border-accent/30'
}

export const Badge = ({ className, variant = 'default', ...rest }: BadgeProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
      {...rest}
    />
  )
}
