'use client'
import { ReactNode } from 'react'
import clsx from 'clsx'

type Props = {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
}

export const Modal = ({ open, onClose, children, className }: Props) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={clsx('relative z-10 neu-surface p-6 max-w-lg w-full', className)}>{children}</div>
    </div>
  )
}
