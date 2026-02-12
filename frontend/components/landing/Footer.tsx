'use client'
import Link from 'next/link'
import { Badge } from '../ui/Badge'

export const Footer = () => {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-border/60 py-8 text-sm text-muted md:flex-row">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">Bhooter Bari</span>
        <Badge>Bhooter Bari</Badge>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/admin" className="hover:text-foreground">Admin</Link>
        <Link href="/create" className="hover:text-foreground">Create room</Link>
      </div>
      <span>Invite-only. Nothing stored beyond the timer.</span>
    </footer>
  )
}
