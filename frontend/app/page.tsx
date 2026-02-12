import Link from 'next/link'
import { Hero } from '../components/landing/Hero'
import { Features } from '../components/landing/Features'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Footer } from '../components/landing/Footer'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">G</div>
            <div>
              <p className="text-sm font-semibold">Bhooter Bari</p>
              <p className="text-xs text-muted">Bhooter Bari • Encrypted chat rooms</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/create">
              <Button variant="secondary" size="sm">Create room</Button>
            </Link>
            <Link href="/admin" className="text-sm text-muted hover:text-foreground">Admin</Link>
            <ThemeToggle />
          </div>
        </header>

        <Hero />
        <Features />
        <HowItWorks />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <Badge variant="success">Privacy check</Badge>
            <h3 className="text-2xl font-semibold">Encryption stays client-side.</h3>
            <p className="text-muted">
              Keys are generated in your browser and shared only through the invite link fragment. Bhooter Bari never sees readable content, even in transit.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/create?type=group">
                <Button>Start a private room</Button>
              </Link>
              <Link href="/privacy">
                <Button variant="ghost">Read privacy policy</Button>
              </Link>
            </div>
          </Card>
          <Card variant="glass" className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-muted">What people love</p>
            <div className="space-y-3 text-sm text-muted">
              <p>“Feels like Signal, but faster to spin up for groups.”</p>
              <p>“The timer and panic button make sensitive chats finally feel safe.”</p>
              <p>“We onboard new collaborators without exposing accounts.”</p>
            </div>
          </Card>
        </section>

        <Footer />
      </div>
    </main>
  )
}
