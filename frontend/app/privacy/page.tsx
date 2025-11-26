import { Card } from '../../components/Card'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 md:px-10 py-10 max-w-3xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold">Privacy</h1>
      <Card className="space-y-4">
        <p className="text-[#4b5563]">Bhooter Bari rooms are invite-only and end-to-end encrypted. The server never sees plaintext messages or attachments.</p>
        <p className="text-[#4b5563]">Rooms expire within sixty minutes and are hard-deleted with their messages, attachments, member sessions, and kicks. Analytics counters stay for admin metrics.</p>
        <p className="text-[#4b5563]">IP addresses are stored server-side only for rate limiting, abuse reports, and per-room kick enforcement. They are not exposed to clients.</p>
      </Card>
    </main>
  )
}
