'use client'
import Link from 'next/link'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ShieldCheck, Timer, Sparkles, ArrowRight } from 'lucide-react'

export const Hero = () => {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-surface px-6 py-12 shadow-card md:px-10">
      <div className="absolute inset-0 mesh opacity-70" />
      <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Badge variant="accent">Invite-only · Anonymous · Ephemeral</Badge>
          <h1 className="text-balance text-4xl font-semibold md:text-6xl">
            Bhooter Bari — private stories, no trace left behind.
          </h1>
          <p className="text-lg text-muted md:text-xl">
            A privacy-first chat space with end-to-end encryption, burn-after-read controls, and real-time moderation tools. Create a room in seconds and share the key only with people you trust.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/create?type=group">
              <Button size="lg">
                Create a group room <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/create?type=direct">
              <Button variant="secondary" size="lg">
                Create a 1-1 room
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              End-to-end encryption
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              1-60 minute timers
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Panic wipe & burn after read
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted">Live preview</p>
                <p className="text-lg font-semibold">Bhooter Bari Room</p>
              </div>
              <Badge>Encrypted</Badge>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-surface2 px-3 py-2 text-sm text-muted">
                System: Room expires in 14m 08s
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-2 px-4 py-3 text-sm text-primary-foreground shadow-glow">
                I just shared the link. The key never touches the server.
              </div>
              <div className="rounded-3xl bg-surface2 px-4 py-3 text-sm">
                Perfect. I can see the typing indicator already.
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-surface px-3 py-2 text-xs text-muted">
              Typing… encrypted locally
            </div>
          </Card>
          <Card variant="glass" className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Trust stack</p>
            <div className="flex flex-wrap gap-2">
              {['AES-GCM', 'Socket.io', 'No accounts', 'Invite keys'].map(item => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
