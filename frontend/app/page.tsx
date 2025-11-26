import Link from 'next/link'
import { Badge } from '../components/Badge'

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 md:px-10 py-10 flex flex-col gap-12">
      <div className="flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-6">
          <Badge className="w-fit">Invite-only. Anonymous. Ephemeral.</Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">Bhooter Bari</h1>
          <p className="text-lg md:text-xl text-[#4b5563] max-w-2xl">
            Anonymous group and 1-1 rooms with end-to-end encryption, invite-only access, and self-destruct timers up to sixty minutes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/create?type=group"
              className="rounded-2xl px-6 py-4 bg-gradient-to-br from-[#6c7ae0] to-[#8ea2ff] text-white font-semibold shadow-neu transition hover:shadow-neuLg"
            >
              Create a group chat
            </Link>
            <Link
              href="/create?type=direct"
              className="rounded-2xl px-6 py-4 bg-[#f4f5f7] shadow-neu font-semibold text-[#0f172a] transition hover:shadow-neuLg"
            >
              Create a 1-1 chat
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Rooms disappear within 60 minutes.", "Messages and attachments are hard-deleted.", "No accounts. Pick a nickname and go."].map(item => (
              <div key={item} className="neu-surface p-4 text-sm text-[#4b5563] leading-relaxed">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="neu-surface p-8 space-y-6 animate-float">
            <h3 className="text-2xl font-bold">Private by default</h3>
            <div className="space-y-4 text-[#4b5563]">
              <p>Encrypted messages and attachments stay opaque to the server.</p>
              <p>Invite links carry the key fragment so only people you trust can read.</p>
              <p>Burn-after-read, panic wipes, and screenshot warnings keep rooms calm.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Badge>End-to-end encrypted</Badge>
              <Badge>Invite-only</Badge>
              <Badge>Ephemeral</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Real-time everything', body: 'Messages, approvals, typing, reactions, and room controls stay in sync through WebSockets.' },
          { title: 'Rich yet mindful', body: 'Attachments up to 10 MB, mentions, reactions, and replies without exposing identity or device data.' },
          { title: 'Creator controls', body: 'Approve joins, mute or kick, adjust timers, toggle links and attachments, or delete the room instantly.' }
        ].map(card => (
          <div key={card.title} className="neu-surface p-6 space-y-3">
            <h4 className="text-xl font-semibold">{card.title}</h4>
            <p className="text-[#4b5563] leading-relaxed">{card.body}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[#6b7280] text-sm">
        <div className="flex gap-4">
          <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link>
          <Link href="/admin" className="underline-offset-4 hover:underline">Admin</Link>
          <Link href="/create" className="underline-offset-4 hover:underline">FAQ</Link>
        </div>
        <span>Invite-only. Nothing stored beyond the timer.</span>
      </div>
    </main>
  )
}
