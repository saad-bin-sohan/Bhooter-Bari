'use client'
import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

export const useTheme = create<ThemeState>(set => ({
  mode: 'dark',
  setMode: mode => set({ mode }),
  toggle: () => set(state => ({ mode: state.mode === 'dark' ? 'light' : 'dark' }))
}))
