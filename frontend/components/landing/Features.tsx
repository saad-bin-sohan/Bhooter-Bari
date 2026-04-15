'use client'

import { motion } from 'framer-motion'
import { EyeOff, FileLock2, Lock, ShieldCheck, Users, Zap } from 'lucide-react'

const revealViewport = { once: true, margin: '-60px' }

const majorFeatures = [
  {
    icon: Lock,
    title: 'Privacy-first rooms',
    body: 'Invite-only access with encryption keys that live only in the URL fragment. The server orchestrates delivery but never stores readable content.'
  },
  {
    icon: Users,
    title: 'Real-time presence',
    body: 'Typing indicators, online status, reactions, and approvals update instantly. Every action is encrypted before it leaves your device.'
  }
]

const minorFeatures = [
  {
    icon: EyeOff,
    title: 'Ephemeral by design',
    body: 'Timers up to 60 minutes. Messages self-destruct. Rooms vanish without a trace.'
  },
  {
    icon: FileLock2,
    title: 'Encrypted attachments',
    body: 'Send up to 10MB. Files are encrypted client-side; the server stores only opaque ciphertext.'
  },
  {
    icon: Zap,
    title: 'Creator controls',
    body: 'Mute, kick, approval gates, panic wipes, and burn-after-read — all real-time.'
  },
  {
    icon: ShieldCheck,
    title: 'Zero-knowledge server',
    body: 'We never see your messages. Even in transit, only ciphertext reaches our infrastructure.'
  }
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: revealViewport,
  transition: { duration: 0.45, delay, ease: 'easeOut' as const }
})

const MajorFeatureRow = ({
  body,
  icon: Icon,
  index,
  title
}: (typeof majorFeatures)[number] & { index: number }) => (
  <motion.div className="py-8" {...fadeUp(index * 0.06)}>
    <Icon className="h-8 w-8 text-primary" />
    <h3 className="mb-1 mt-3 text-xl font-semibold text-foreground">{title}</h3>
    <p className="max-w-sm text-base leading-relaxed text-muted">{body}</p>
  </motion.div>
)

const MinorFeatureRow = ({
  body,
  icon: Icon,
  index,
  title
}: (typeof minorFeatures)[number] & { index: number }) => (
  <motion.div className="flex items-start gap-4 py-5" {...fadeUp(index * 0.06 + 0.12)}>
    <Icon className="h-5 w-5 flex-shrink-0 text-primary" />
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-sm text-muted">{body}</p>
    </div>
  </motion.div>
)

export const Features = () => {
  return (
    <section id="features">
      <motion.div {...fadeUp()}>
        <p className="stripe mb-3 text-sm font-medium text-muted">Why Bhooter Bari</p>
        <h2 className="font-display text-3xl text-foreground md:text-4xl">
          A secure place for quiet conversations.
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-x-16 gap-y-0 lg:grid-cols-[1fr_1fr]">
        <div className="divide-y divide-border/50">
          {majorFeatures.map((feature, index) => (
            <MajorFeatureRow key={feature.title} index={index} {...feature} />
          ))}
        </div>

        <div className="divide-y divide-border/50 lg:border-l lg:border-border/50 lg:pl-16">
          {minorFeatures.map((feature, index) => (
            <MinorFeatureRow key={feature.title} index={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
