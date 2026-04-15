'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Footer } from '../components/landing/Footer'
import { Features } from '../components/landing/Features'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { LandingMusicControl } from '../components/landing/LandingMusicControl'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'

const revealViewport = { once: true, margin: '-60px' }

const testimonials = [
  {
    quote: '“Feels like the rare messaging tool that respects silence as much as conversation.”',
    attribution: 'A researcher sharing sensitive drafts'
  },
  {
    quote: '“We needed a room we could trust for an hour, not an account we had to keep forever.”',
    attribution: 'An organizer coordinating live response work'
  },
  {
    quote: '“Fast enough for live decisions, quiet enough that nobody leaves residue behind.”',
    attribution: 'A small team reviewing confidential material'
  }
]

function EncryptionCTA() {
  return (
    <motion.section
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 12 }}
      viewport={revealViewport}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="grid gap-10 lg:grid-cols-[1.1fr_auto_0.9fr] lg:items-stretch"
    >
      <div className="max-w-2xl space-y-5">
        <h2 className="font-display text-3xl font-semibold text-foreground">
          Encryption that lives in your browser.
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-muted">
          Keys are created locally and shared only through the invite link fragment. The backend
          coordinates room state, timing, and delivery, but readable content never leaves the
          people inside the room.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/create">
            <Button variant="primary" size="lg">
              Create a room
            </Button>
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Read the privacy model
          </Link>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="divider h-full w-px" />
      </div>

      <div className="space-y-5">
        {testimonials.map((item, index) => (
          <div key={item.attribution} className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground">{item.quote}</p>
            <p className="text-xs text-muted">- {item.attribution}</p>
            {index < testimonials.length - 1 ? <div className="divider" /> : null}
          </div>
        ))}
      </div>
    </motion.section>
  )
}

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <Logo />

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link href="/create">
              <Button variant="primary" size="sm">
                Create a room
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="pb-16">
        <Hero />

        <div className="mx-auto max-w-6xl space-y-24 px-6 py-24 md:px-10">
          <Features />
          <HowItWorks />
          <EncryptionCTA />
          <Footer />
        </div>
      </main>

      <LandingMusicControl />
    </>
  )
}
