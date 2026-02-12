'use client'
import { Card } from '../ui/Card'
import { Progress } from '../ui/Progress'

const steps = [
  {
    title: 'Create a room',
    body: 'Pick group or 1-1, set timer, and enable the privacy controls you need.'
  },
  {
    title: 'Share the invite key',
    body: 'Invite link carries the encryption key fragment, never stored on the server.'
  },
  {
    title: 'Chat with confidence',
    body: 'Messages, files, reactions, and approvals stay in sync and encrypted.'
  }
]

export const HowItWorks = () => {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-muted">How it works</p>
        <h2 className="text-3xl font-semibold md:text-4xl">Designed to disappear gracefully.</h2>
        <p className="text-lg text-muted">
          Every interaction is encrypted locally. The server orchestrates real-time delivery, but never stores readable content.
        </p>
        <Progress value={78} />
        <p className="text-xs text-muted">Encryption handshake integrity: 78% of room lifetime elapsed.</p>
      </div>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.title} className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
              0{index + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted">{step.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
