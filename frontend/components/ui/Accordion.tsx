'use client'
import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type AccordionItem = {
  id: string
  title: string
  content: ReactNode
}

type Props = {
  items: AccordionItem[]
  className?: string
}

export const Accordion = ({ items, className }: Props) => {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map(item => (
        <details key={item.id} className="group rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-sm transition-all duration-150">
          <summary className="cursor-pointer list-none font-semibold text-foreground">
            <span>{item.title}</span>
          </summary>
          <div className="mt-2 text-sm text-muted">{item.content}</div>
        </details>
      ))}
    </div>
  )
}
