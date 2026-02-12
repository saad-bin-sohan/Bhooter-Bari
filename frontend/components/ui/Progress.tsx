'use client'
import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Props = HTMLAttributes<HTMLDivElement> & {
  value: number
}

export const Progress = ({ value, className, ...rest }: Props) => {
  return (
    <div className={cn('h-2 w-full rounded-full bg-surface3', className)} {...rest}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-2 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
