'use client'
import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type CardElement = 'div' | 'article' | 'section' | 'aside'

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement
  variant?: 'surface' | 'panel' | 'glass' | 'outline' | 'flat'
}

const variants = {
  surface: 'panel',
  panel: 'panel',
  glass: 'glass rounded-xl',
  outline: 'rounded-xl border border-border/60 bg-transparent',
  flat: 'rounded-xl'
}

export const Card = ({
  as = 'div',
  className,
  variant = 'surface',
  ...rest
}: CardProps) => {
  const Component = as
  return <Component className={cn('p-5', variants[variant], className)} {...rest} />
}
