'use client'

import { motion } from 'framer-motion'

const revealViewport = { once: true, margin: '-60px' }

const steps = [
  {
    title: 'Create a room',
    body: 'Pick group or 1-1, set a timer from 1 to 60 minutes, and configure your privacy controls.'
  },
  {
    title: 'Share the invite key',
    body: 'The invite link contains the encryption key fragment after the hash — it never reaches the server.'
  },
  {
    title: 'Chat with confidence',
    body: 'Messages, files, reactions, and approvals are encrypted before sending. Everything disappears when the timer ends.'
  }
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: revealViewport,
  transition: { duration: 0.45, delay, ease: 'easeOut' as const }
})

const TimelineStep = ({
  body,
  index,
  title
}: (typeof steps)[number] & { index: number }) => (
  <motion.div className="relative flex gap-6 pb-10 last:pb-0" {...fadeUp(index * 0.06 + 0.06)}>
    <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border/80 bg-surface">
      <span className="cipher text-xs font-semibold text-primary">0{index + 1}</span>
    </div>

    <div className="pt-0.5">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  </motion.div>
)

export const HowItWorks = () => {
  return (
    <section id="how-it-works">
      <div className="flex flex-col lg:flex-row lg:gap-24">
        <motion.div className="mb-12 flex-shrink-0 lg:mb-0 lg:w-72" {...fadeUp()}>
          <p className="stripe mb-3 text-sm font-medium text-muted">How it works</p>
          <h2 className="font-display text-3xl text-foreground md:text-4xl">
            Designed to disappear gracefully.
          </h2>
          <p className="mt-4 text-base text-muted">
            Every interaction is encrypted locally. The server sees only ciphertext.
          </p>
        </motion.div>

        <div className="relative flex-1">
          <div className="absolute bottom-2 left-4 top-2 w-px bg-border/60" />

          <div>
            {steps.map((step, index) => (
              <TimelineStep key={step.title} index={index} {...step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
