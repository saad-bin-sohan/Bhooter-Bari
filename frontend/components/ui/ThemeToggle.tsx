'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/hooks/useTheme'
import { Button } from './Button'

export const ThemeToggle = ({ className }: { className?: string }) => {
  const mode = useTheme(state => state.mode)
  const toggle = useTheme(state => state.toggle)
  return (
    <Button variant="ghost" size="icon" className={className} onClick={toggle} aria-label="Toggle theme">
      {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
