'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, Lock } from 'lucide-react'
import { Button } from '../ui/Button'

type InvitePanelProps = {
  invite: { url: string; slug: string }
  onCopy: () => void
  onEnter: () => void
  onCreateAnother: () => void
}

export const InvitePanel = ({
  invite,
  onCopy,
  onEnter,
  onCreateAnother
}: InvitePanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="panel space-y-4 p-5"
    >
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">Room created</p>
          <p className="text-xs text-muted">Share the link below with people you trust.</p>
        </div>
      </div>

      <div className="divider" />

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Invite link</p>
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-surface-2">
          <p className="cipher break-all p-3 pr-16 text-xs leading-relaxed text-muted">
            {invite.url}
          </p>
          <div className="absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-surface-2 via-surface-2/95 to-transparent pl-6 pr-3">
            <button
              type="button"
              onClick={onCopy}
              className="cipher text-xs font-medium text-primary transition-colors hover:text-primary/70"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="primary" className="w-full justify-center" onClick={onCopy}>
          Copy invite link
        </Button>
        <Button type="button" variant="secondary" className="w-full justify-center" onClick={onEnter}>
          Enter room now
        </Button>
      </div>

      <button
        type="button"
        onClick={onCreateAnother}
        className="w-full text-center text-xs text-muted transition-colors hover:text-foreground"
      >
        Create another room →
      </button>

      <div className="divider" />

      <div className="flex items-start gap-2 rounded-lg bg-surface-2 p-3">
        <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted" />
        <p className="text-xs leading-relaxed text-muted">
          The <span className="cipher text-foreground">#key</span> fragment never reaches the server. Keep the full URL intact - the fragment is the only decryption credential for this room.
        </p>
      </div>
    </motion.div>
  )
}
