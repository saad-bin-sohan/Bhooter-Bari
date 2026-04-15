'use client'
import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const base =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60'

const variants = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/85',
  secondary: 'border border-border bg-surface-2 text-foreground hover:bg-surface-3',
  ghost: 'bg-transparent text-foreground hover:bg-surface-2',
  outline: 'border border-border bg-transparent text-foreground hover:bg-surface-2',
  danger: 'bg-danger text-danger-foreground hover:bg-danger/85',
  icon: 'rounded-lg bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground',
  accent: 'bg-accent text-accent-foreground hover:bg-accent/85'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  icon: 'p-2'
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps) => {
  const actualSize = variant === 'icon' ? 'icon' : size
  return (
    <button
      className={cn(base, variants[variant], sizes[actualSize], className)}
      {...rest}
    />
  )
}
