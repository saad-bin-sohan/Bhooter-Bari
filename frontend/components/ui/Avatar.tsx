'use client'
import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  color?: string
  online?: boolean
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base'
}

export const Avatar = ({ size = 'md', label, color, online, className, ...rest }: AvatarProps) => {
  return (
    <div className={cn('relative inline-flex items-center justify-center rounded-full font-semibold text-white', sizes[size], className)} style={{ background: color }} {...rest}>
      <span>{label}</span>
      {online !== undefined && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface',
            online ? 'bg-success' : 'bg-surface3'
          )}
        />
      )}
    </div>
  )
}
