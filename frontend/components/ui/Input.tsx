'use client'
import { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'ghost'
  error?: boolean
}

const base =
  'w-full rounded-xl border border-border/70 bg-surface-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors duration-150 focus:border-primary/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20'

const variants = {
  default: 'bg-surface-2',
  ghost: 'border-border/50 bg-transparent'
}

export const Input = ({
  className,
  variant = 'default',
  error = false,
  ...rest
}: InputProps) => {
  return (
    <input
      className={cn(
        base,
        variants[variant],
        error && 'border-danger/60 focus:border-danger/60 focus:ring-danger/20',
        className
      )}
      {...rest}
    />
  )
}
