'use client'
import { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'ghost'
}

const base =
  'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-inset placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const variants = {
  default: 'bg-surface',
  ghost: 'bg-transparent border-border/50'
}

export const Input = ({ className, variant = 'default', ...rest }: InputProps) => {
  return <input className={cn(base, variants[variant], className)} {...rest} />
}
