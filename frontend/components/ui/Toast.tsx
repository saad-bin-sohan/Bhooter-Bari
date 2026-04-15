'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useToast, ToastItem } from '../../lib/hooks/useToast'
import { cn } from '../../lib/utils'

const iconMap = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle
}

export const Toast = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) => {
  const Icon = iconMap[toast.variant || 'default']
  return (
    <motion.div
      className={cn(
        'panel pointer-events-auto w-full max-w-sm rounded-xl border-l-2 p-4 shadow-lg',
        toast.variant === 'success' && 'border-l-success',
        toast.variant === 'warning' && 'border-l-warning',
        toast.variant === 'danger' && 'border-l-danger',
        (!toast.variant || toast.variant === 'default') && 'border-l-primary'
      )}
      initial={{ opacity: 0, x: 16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <span
        className={cn(
          'mt-0.5',
          toast.variant === 'success' && 'text-success',
          toast.variant === 'warning' && 'text-warning',
          toast.variant === 'danger' && 'text-danger',
          (!toast.variant || toast.variant === 'default') && 'text-primary'
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1">
        {toast.title && <p className="text-sm font-semibold text-foreground">{toast.title}</p>}
        <p className="mt-0.5 text-xs text-muted">{toast.message}</p>
      </div>
      <button type="button" onClick={onDismiss} className="text-muted transition-colors hover:text-foreground" aria-label="Dismiss toast">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export const Toaster = () => {
  const toasts = useToast(state => state.toasts)
  const remove = useToast(state => state.remove)
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={() => remove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
