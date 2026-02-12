'use client'
import { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = ({ className, ...rest }: TextareaProps) => {
  return (
    <textarea
      className={cn(
        'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-inset placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      {...rest}
    />
  )
}
