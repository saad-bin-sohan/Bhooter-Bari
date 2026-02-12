'use client'
import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60'

const variants = {
  primary: 'bg-gradient-to-r from-primary to-primary-2 text-primary-foreground shadow-glow hover:shadow-card',
  secondary: 'bg-surface2 text-foreground border border-border shadow-soft hover:shadow-card',
  ghost: 'bg-transparent text-foreground hover:bg-surface2',
  outline: 'border border-border text-foreground hover:bg-surface2',
  danger: 'bg-danger text-danger-foreground shadow-soft hover:shadow-card',
  icon: 'bg-surface2 text-foreground hover:bg-surface3'
}

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
  icon: 'p-2.5'
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
