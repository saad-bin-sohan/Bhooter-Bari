'use client'
import Link from 'next/link'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'
import { PanelRightOpen } from 'lucide-react'

type Props = {
  title: string
  subtitle: string
  typeLabel: string
  tags: string[]
  allowAttachments: boolean
  onToggleSidebar?: () => void
}

export const RoomHeader = ({ title, subtitle, typeLabel, tags, allowAttachments, onToggleSidebar }: Props) => {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <Badge>{typeLabel}</Badge>
            {tags.map(tag => (
              <Badge key={tag} className="text-[10px]">{tag}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/create" className="text-sm text-muted hover:text-foreground">New room</Link>
          <Badge variant={allowAttachments ? 'success' : 'danger'}>
            {allowAttachments ? 'Attachments on' : 'Attachments off'}
          </Badge>
          <ThemeToggle />
          {onToggleSidebar && (
            <Button variant="icon" size="icon" className="lg:hidden" onClick={onToggleSidebar} aria-label="Toggle sidebar">
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
