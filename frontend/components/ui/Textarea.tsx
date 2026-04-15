'use client'
import { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean
}

export const Textarea = ({ className, error = false, ...rest }: TextareaProps) => {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-border/70 bg-surface-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors duration-150 focus:border-primary/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20',
        error && 'border-danger/60 focus:border-danger/60 focus:ring-danger/20',
        className
      )}
      {...rest}
    />
  )
}
