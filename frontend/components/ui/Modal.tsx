'use client'
import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './Button'

type Props = {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
}

export const Modal = ({ open, onClose, children, className }: Props) => {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative mx-4 w-full max-w-md rounded-2xl border border-border/70 bg-surface p-6 shadow-xl',
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
          >
            {onClose ? (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
