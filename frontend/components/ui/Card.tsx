'use client'
import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'surface' | 'glass' | 'outline'
}

const variants = {
  surface: 'card-surface',
  glass: 'glass',
  outline: 'rounded-3xl border border-border/70 bg-transparent'
}

export const Card = ({ className, variant = 'surface', ...rest }: CardProps) => {
  return <div className={cn('p-6', variants[variant], className)} {...rest} />
}
