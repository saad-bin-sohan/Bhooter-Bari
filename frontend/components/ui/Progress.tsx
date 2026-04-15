'use client'
import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Props = HTMLAttributes<HTMLDivElement> & {
  value: number
}

export const Progress = ({ value, className, ...rest }: Props) => {
  return (
    <div
      className={cn('h-1.5 w-full rounded-full bg-surface-3', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.max(0, value))}
      {...rest}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
