'use client'
import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'dot'
  color?: 'success' | 'warning' | 'danger' | 'muted'
}

const variants = {
  default: 'border border-border/50 bg-surface-2 text-muted',
  success: 'border border-success/25 bg-success/12 text-success',
  warning: 'border border-warning/25 bg-warning/12 text-warning-foreground',
  danger: 'border border-danger/25 bg-danger/12 text-danger',
  accent: 'border border-accent/25 bg-accent/12 text-accent'
}

const dotColors = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-muted'
}

export const Badge = ({
  className,
  variant = 'default',
  color = 'muted',
  children,
  ...rest
}: BadgeProps) => {
  if (variant === 'dot') {
    return (
      <div
        aria-hidden="true"
        className={cn('inline-flex h-2 w-2 rounded-full', dotColors[color], className)}
        {...rest}
      />
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
