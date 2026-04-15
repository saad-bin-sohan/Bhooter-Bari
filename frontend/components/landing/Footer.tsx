import Link from 'next/link'
import { Logo } from '../ui/Logo'

export const Footer = () => (
  <footer className="flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-8 text-sm text-muted sm:flex-row sm:items-center">
    <Logo showWordmark={true} />

    <nav className="flex gap-6">
      <Link href="/privacy" className="transition-colors hover:text-foreground">
        Privacy
      </Link>
      <Link href="/create" className="transition-colors hover:text-foreground">
        Create room
      </Link>
    </nav>

    <p className="text-xs">Invite-only. Nothing stored beyond the timer.</p>
  </footer>
)
