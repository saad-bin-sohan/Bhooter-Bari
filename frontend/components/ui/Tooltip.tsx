'use client'
import { ReactNode, useState } from 'react'
import { cn } from '../../lib/utils'

type Props = {
  label: string
  children: ReactNode
  className?: string
}

export const Tooltip = ({ label, children, className }: Props) => {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          className={cn(
            'absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-card',
            className
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
