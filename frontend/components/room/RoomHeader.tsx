'use client'
import Link from 'next/link'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { PanelRightOpen } from 'lucide-react'
import { cn } from '../../lib/utils'

type Props = {
  title: string
  subtitle: string
  typeLabel: string
  tags: string[]
  allowAttachments: boolean
  onToggleSidebar?: () => void
}

export const RoomHeader = ({
  title,
  subtitle,
  typeLabel,
  tags,
  allowAttachments,
  onToggleSidebar
}: Props) => {
  void allowAttachments

  const isUrgent = subtitle.includes('Expired') ||
    (subtitle.match(/(\d+)m/) ? Number(subtitle.match(/(\d+)m/)?.[1]) < 5 : false)
  const isCritical = subtitle.includes('Expired') ||
    (subtitle.match(/(\d+)m/) ? Number(subtitle.match(/(\d+)m/)?.[1]) < 2 : false)

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-border/50 bg-surface px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link href="/" aria-label="Back to home">
          <Logo showWordmark={false} className="flex-shrink-0" />
        </Link>
        <div className="h-5 w-px bg-border/60" />
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
          <Badge>{typeLabel}</Badge>
          {tags.slice(0, 2).map(tag => (
            <Badge key={tag} className="hidden sm:inline-flex">{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="hidden flex-shrink-0 items-center md:flex">
        <span
          className={cn(
            'cipher text-sm font-medium tabular-nums transition-colors',
            isCritical ? 'text-danger' : isUrgent ? 'text-warning' : 'text-muted'
          )}
        >
          {subtitle}
        </span>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <Link
          href="/create"
          className="hidden text-xs text-muted transition-colors hover:text-foreground sm:block"
        >
          New room
        </Link>
        <ThemeToggle />
        {onToggleSidebar && (
          <Button
            type="button"
            variant="icon"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Open room details"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
