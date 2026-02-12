'use client'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Lock, Users, Zap, EyeOff, FileLock2, Sparkles } from 'lucide-react'

const features = [
  {
    title: 'Privacy-first rooms',
    body: 'Invite-only rooms with keys stored only in the URL hash and session storage.',
    icon: Lock
  },
  {
    title: 'Real-time presence',
    body: 'Typing indicators, online status, and reactions update instantly for every member.',
    icon: Users
  },
  {
    title: 'Ephemeral by design',
    body: 'Room timers up to 60 minutes, burn-after-read, and self-destruct messages.',
    icon: EyeOff
  },
  {
    title: 'Encrypted attachments',
    body: 'Send up to 10MB with client-side encryption and safe previews.',
    icon: FileLock2
  },
  {
    title: 'Moderation controls',
    body: 'Mute, kick, join approvals, and panic wipes for clean rooms.',
    icon: Zap
  },
  {
    title: 'Human design',
    body: 'A calm, elegant interface built for focus and trust.',
    icon: Sparkles
  }
]

export const Features = () => {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Badge variant="accent">Why Bhooter Bari</Badge>
          <h2 className="text-3xl font-semibold md:text-4xl">A secure place for quiet conversations.</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map(feature => (
          <Card key={feature.title} className="space-y-3">
            <feature.icon className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="text-sm text-muted">{feature.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
