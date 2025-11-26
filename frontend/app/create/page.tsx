'use client'
import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Toggle } from '../../components/Toggle'
import { Button } from '../../components/Button'
import { apiRequest } from '../../lib/api'
import { generateRoomKey } from '../../lib/crypto'

const defaultDuration = 15

export default function CreateRoomPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const presetType = searchParams.get('type') === 'direct' ? 'direct' : searchParams.get('type') === 'group' ? 'group' : 'group'
  const [type, setType] = useState<'direct' | 'group'>(presetType)
  const [name, setName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number>(defaultDuration)
  const [password, setPassword] = useState('')
  const [allowAttachments, setAllowAttachments] = useState(true)
  const [allowLinks, setAllowLinks] = useState(true)
  const [requireApproval, setRequireApproval] = useState(false)
  const [selfDestructModeEnabled, setSelfDestructModeEnabled] = useState(false)
  const [burnAfterReadEnabled, setBurnAfterReadEnabled] = useState(false)
  const [panicButtonEnabled, setPanicButtonEnabled] = useState(false)
  const [screenshotWarningEnabled, setScreenshotWarningEnabled] = useState(false)
  const [tags, setTags] = useState('')
  const [rules, setRules] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<{ url: string; slug: string } | null>(null)

  const tagList = useMemo(() => tags.split(',').map(t => t.trim()).filter(Boolean), [tags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body = {
        type,
        name: name || undefined,
        durationMinutes,
        password: password || undefined,
        allowAttachments,
        allowLinks,
        requireApproval,
        selfDestructModeEnabled,
        burnAfterReadEnabled,
        panicButtonEnabled,
        screenshotWarningEnabled,
        tags: tagList,
        rules: rules || undefined
      }
      const room = await apiRequest<{ id: string; slug: string; creatorSecret: string }>(`/rooms`, { method: 'POST', body })
      const { key, encoded } = await generateRoomKey()
      sessionStorage.setItem(`bb-key-${room.slug}`, encoded)
      sessionStorage.setItem(`bb-creator-${room.slug}`, room.creatorSecret)
      const base = window.location.origin
      const url = `${base}/r/${room.slug}#key=${encoded}`
      setInvite({ url, slug: room.slug })
    } catch (err: any) {
      setError(err.message || 'Unable to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-6 md:px-10 py-10 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6b7280]">Create an anonymous room</p>
          <h1 className="text-4xl font-bold">New room</h1>
        </div>
        <Button variant="ghost" onClick={() => router.push('/')}>Back home</Button>
      </div>
      <Card className="space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('group')}
              className={`rounded-xl p-4 shadow-neu transition ${type === 'group' ? 'bg-gradient-to-br from-[#6c7ae0] to-[#8ea2ff] text-white' : 'bg-[#f4f5f7]'}`}
            >
              Group chat
            </button>
            <button
              type="button"
              onClick={() => setType('direct')}
              className={`rounded-xl p-4 shadow-neu transition ${type === 'direct' ? 'bg-gradient-to-br from-[#6c7ae0] to-[#8ea2ff] text-white' : 'bg-[#f4f5f7]'}`}
            >
              1-1 chat
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#6b7280]">Room name (optional)</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Safety circle" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#6b7280]">Duration: {durationMinutes} minutes</label>
              <input
                type="range"
                min={1}
                max={60}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full accent-[#6c7ae0]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#6b7280]">Password (optional)</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Protect with password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#6b7280]">Tags</label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="privacy, friends" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm text-[#6b7280]">Room rules</label>
              <textarea
                className="w-full rounded-xl px-4 py-3 bg-[#f4f5f7] shadow-neuInset focus:outline-none focus:ring-2 focus:ring-[#6c7ae0] min-h-[100px]"
                value={rules}
                onChange={e => setRules(e.target.value)}
                placeholder="Share boundaries or topics"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle label="Allow attachments" value={allowAttachments} onChange={setAllowAttachments} />
            <Toggle label="Allow links" value={allowLinks} onChange={setAllowLinks} />
            <Toggle label="Require join approval" value={requireApproval} onChange={setRequireApproval} />
            <Toggle label="Self-destruct messages" value={selfDestructModeEnabled} onChange={setSelfDestructModeEnabled} />
            <Toggle label="Burn after reading" value={burnAfterReadEnabled} onChange={setBurnAfterReadEnabled} />
            <Toggle label="Per-user panic button" value={panicButtonEnabled} onChange={setPanicButtonEnabled} />
            <Toggle label="Screenshot warning" value={screenshotWarningEnabled} onChange={setScreenshotWarningEnabled} />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-4 items-center">
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create room'}</Button>
            <span className="text-sm text-[#6b7280]">A secret key will live only in your browser</span>
          </div>
        </form>
      </Card>
      {invite && (
        <Card className="space-y-4 animate-float">
          <h3 className="text-2xl font-bold">Room created</h3>
          <p className="text-[#4b5563]">Share this invite link. The encryption key stays after the hash.</p>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <input
              readOnly
              value={invite.url}
              className="flex-1 rounded-xl px-4 py-3 bg-[#f4f5f7] shadow-neuInset"
              onFocus={e => e.currentTarget.select()}
            />
            <Button type="button" onClick={() => navigator.clipboard.writeText(invite.url)}>Copy link</Button>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={() => router.push(`/r/${invite.slug}${window.location.hash || ''}`)}>Enter room now</Button>
            <Button variant="ghost" onClick={() => router.refresh()}>Create another</Button>
          </div>
        </Card>
      )}
    </main>
  )
}
