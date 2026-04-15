'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { EyeOff, ShieldCheck, Timer } from 'lucide-react'
import { Button } from '../ui/Button'

export const Hero = () => {
  return (
    <section className="px-6 pb-10 pt-16 md:px-10 md:pb-14 md:pt-20 lg:pb-16 lg:pt-24">
      <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl space-y-7">
          <motion.p
            className="stripe text-sm text-muted font-mono"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            Invite-only · Encrypted · Ephemeral
          </motion.p>

          <motion.h1
            className="text-balance font-display text-5xl font-bold text-foreground md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="block">Private rooms.</span>
            <span className="block text-accent">No trace left.</span>
          </motion.h1>

          <motion.p
            className="max-w-md text-lg text-muted"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            A privacy-first chat space with end-to-end encryption and automatic expiry. Create a
            room in seconds.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <Link href="/create">
              <Button variant="primary" size="lg">
                Create a room
              </Button>
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
            >
              How it works →
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-x-6 gap-y-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              End-to-end encrypted
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Timer className="h-3.5 w-3.5 text-primary" />
              Rooms expire in ≤60 min
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <EyeOff className="h-3.5 w-3.5 text-primary" />
              No accounts, no logs
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hidden lg:flex lg:flex-col lg:justify-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
        >
          <div className="space-y-3 px-4">
            <div className="flex justify-center">
              <span className="cipher rounded-md bg-surface-2 px-3 py-1 text-xs text-muted">
                Room expires in 14m 08s
              </span>
            </div>

            <div className="flex max-w-xs items-end gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-mono text-primary">
                G
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-surface px-4 py-2.5 text-sm text-foreground shadow-xs">
                I just shared the link.
              </div>
            </div>

            <div className="ml-auto flex max-w-xs justify-end">
              <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                The key never touches the server.
              </div>
            </div>

            <div className="flex items-center gap-2 pl-9">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted" />
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted [animation-delay:200ms]" />
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted [animation-delay:400ms]" />
              </div>
              <span className="text-xs text-muted">typing…</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 pl-1">
              {['AES-GCM', 'Socket.io', 'No accounts', 'Invite keys'].map(item => (
                <span
                  key={item}
                  className="cipher rounded-md border border-border/50 bg-surface-2 px-2 py-0.5 text-xs text-muted"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
