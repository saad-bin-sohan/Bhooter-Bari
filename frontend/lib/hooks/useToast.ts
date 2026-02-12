'use client'
import { create } from 'zustand'

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger'

export type ToastItem = {
  id: string
  title?: string
  message: string
  variant?: ToastVariant
  duration?: number
}

type ToastState = {
  toasts: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'> & { id?: string }) => string
  remove: (id: string) => void
  clear: () => void
}

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: toast => {
    const id = toast.id ?? makeId()
    const item: ToastItem = { id, variant: 'default', duration: 4200, ...toast }
    set(state => ({ toasts: [...state.toasts, item] }))
    if (item.duration && item.duration > 0) {
      setTimeout(() => {
        get().remove(id)
      }, item.duration)
    }
    return id
  },
  remove: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  clear: () => set({ toasts: [] })
}))
