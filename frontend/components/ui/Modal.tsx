'use client'
import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Props = {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
}

export const Modal = ({ open, onClose, children, className }: Props) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-xl rounded-3xl border border-border/60 bg-surface p-6 shadow-card', className)}>
        {children}
      </div>
    </div>
  )
}
