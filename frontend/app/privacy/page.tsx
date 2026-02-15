import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <Badge variant="accent">Privacy policy</Badge>
            <h1 className="text-3xl font-semibold md:text-4xl">How we protect your rooms</h1>
          </div>
          <ThemeToggle />
        </header>

        <Card className="space-y-4 text-sm text-muted">
          <p>Bhooter Bari rooms are invite-only and end-to-end encrypted. The server never sees plaintext messages or attachments.</p>
          <p>Rooms expire within sixty minutes and are hard-deleted with their messages, attachments, member sessions, and kicks. Aggregate analytics counters may remain after deletion.</p>
          <p>IP addresses are stored server-side only for rate limiting, abuse reports, and per-room kick enforcement. They are not exposed to clients.</p>
        </Card>
      </div>
    </main>
  )
}
