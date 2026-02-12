'use client'
import { useMemo } from 'react'
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
  const Icon = useMemo(() => iconMap[toast.variant || 'default'], [toast.variant])
  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 shadow-card',
        toast.variant === 'success' && 'border-success/40',
        toast.variant === 'warning' && 'border-warning/40',
        toast.variant === 'danger' && 'border-danger/40'
      )}
    >
      <span className="mt-0.5 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1">
        {toast.title && <p className="text-sm font-semibold text-foreground">{toast.title}</p>}
        <p className="text-sm text-muted">{toast.message}</p>
      </div>
      <button type="button" onClick={onDismiss} className="text-muted hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export const Toaster = () => {
  const toasts = useToast(state => state.toasts)
  const remove = useToast(state => state.remove)
  return (
    <div className="pointer-events-none fixed right-6 top-6 z-[60] flex w-[320px] flex-col gap-3">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto animate-fade-in">
          <Toast toast={toast} onDismiss={() => remove(toast.id)} />
        </div>
      ))}
    </div>
  )
}
