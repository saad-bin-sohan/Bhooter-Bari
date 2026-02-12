'use client'
import { ReactNode, useEffect } from 'react'
import { useTheme } from '../../lib/hooks/useTheme'

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const mode = useTheme(state => state.mode)
  const setMode = useTheme(state => state.setMode)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('bb-theme')
    if (stored === 'light' || stored === 'dark') {
      setMode(stored)
      return
    }
    setMode('dark')
  }, [setMode])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', mode === 'dark')
    window.localStorage.setItem('bb-theme', mode)
  }, [mode])

  return <>{children}</>
}
