'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/hooks/useTheme'
import { Button } from './Button'

export const ThemeToggle = ({ className }: { className?: string }) => {
  const mode = useTheme(state => state.mode)
  const toggle = useTheme(state => state.toggle)
  return (
    <Button variant="icon" size="icon" className={className} onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
      {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
