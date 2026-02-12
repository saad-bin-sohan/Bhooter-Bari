'use client'
import { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = ({ className, children, ...rest }: SelectProps) => {
  return (
    <select
      className={cn(
        'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  )
}
