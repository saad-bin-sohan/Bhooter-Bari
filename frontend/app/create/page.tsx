'use client'
import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { Progress } from '../../components/ui/Progress'
import { apiRequest } from '../../lib/api'
import { generateRoomKey } from '../../lib/crypto'
import { useToast } from '../../lib/hooks/useToast'
import { ArrowLeft, Link2 } from 'lucide-react'

const defaultDuration = 15

export default function CreateRoomPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pushToast = useToast(state => state.push)
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
      const { encoded } = await generateRoomKey()
      sessionStorage.setItem(`bb-key-${room.slug}`, encoded)
      sessionStorage.setItem(`bb-creator-${room.slug}`, room.creatorSecret)
      const base = window.location.origin
      const url = `${base}/r/${room.slug}#key=${encoded}`
      setInvite({ url, slug: room.slug })
      pushToast({ title: 'Room created', message: 'Your invite link is ready to share.', variant: 'success' })
    } catch (err: any) {
      setError(err.message || 'Unable to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!invite) return
    await navigator.clipboard.writeText(invite.url)
    pushToast({ title: 'Invite copied', message: 'Share the link with people you trust.', variant: 'success' })
  }

  const stepsProgress = Math.min(100, Math.round(((name ? 1 : 0) + (password ? 1 : 0) + (rules ? 1 : 0) + (tags ? 1 : 0)) / 4) * 100)

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Create an anonymous room</p>
            <h1 className="text-3xl font-semibold md:text-4xl">Room setup</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}
              aria-label="Back home">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Room type</p>
              <Tabs
                tabs={[
                  { id: 'group', label: 'Group room' },
                  { id: 'direct', label: '1-1 room' }
                ]}
                value={type}
                onChange={value => setType(value as 'group' | 'direct')}
              />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted">Room name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Safety circle" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted">Timer</label>
                  <div className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Duration</span>
                      <span className="font-semibold text-foreground">{durationMinutes} minutes</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={60}
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="mt-3 w-full accent-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted">Password (optional)</label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Protect with password" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted">Tags</label>
                  <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="privacy, friends" />
                  <div className="flex flex-wrap gap-2">
                    {tagList.map(tag => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted">Room rules</label>
                  <Textarea
                    className="min-h-[120px]"
                    value={rules}
                    onChange={e => setRules(e.target.value)}
                    placeholder="Share boundaries or topics"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-muted">Privacy controls</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Toggle label="Allow attachments" value={allowAttachments} onChange={setAllowAttachments} />
                  <Toggle label="Allow links" value={allowLinks} onChange={setAllowLinks} />
                  <Toggle label="Require join approval" value={requireApproval} onChange={setRequireApproval} />
                  <Toggle label="Self-destruct messages" value={selfDestructModeEnabled} onChange={setSelfDestructModeEnabled} />
                  <Toggle label="Burn after reading" value={burnAfterReadEnabled} onChange={setBurnAfterReadEnabled} />
                  <Toggle label="Per-user panic button" value={panicButtonEnabled} onChange={setPanicButtonEnabled} />
                  <Toggle label="Screenshot warning" value={screenshotWarningEnabled} onChange={setScreenshotWarningEnabled} />
                </div>
              </div>

              {error && <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create room'}</Button>
                <span className="text-sm text-muted">A secret key will live only in your browser.</span>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card variant="glass" className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Setup progress</p>
              <Progress value={stepsProgress} />
              <div className="space-y-2 text-sm text-muted">
                <p>Room type: <span className="font-semibold text-foreground">{type === 'group' ? 'Group' : '1-1'}</span></p>
                <p>Timer: <span className="font-semibold text-foreground">{durationMinutes} minutes</span></p>
                <p>Approval: <span className="font-semibold text-foreground">{requireApproval ? 'Required' : 'Open'}</span></p>
                <p>Burn after read: <span className="font-semibold text-foreground">{burnAfterReadEnabled ? 'Enabled' : 'Off'}</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                {allowAttachments && <Badge variant="success">Attachments on</Badge>}
                {allowLinks && <Badge>Links on</Badge>}
                {selfDestructModeEnabled && <Badge variant="warning">Self-destruct</Badge>}
              </div>
            </Card>

            {invite && (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-muted">Invite link</p>
                    <h3 className="text-xl font-semibold">Room created</h3>
                  </div>
                  <Badge variant="success">Ready</Badge>
                </div>
                <p className="text-sm text-muted">Share this invite link. The encryption key lives after the hash.</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-surface2 px-3 py-2 text-xs text-muted">
                    <Link2 className="h-4 w-4" />
                    <span className="truncate">{invite.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleCopy}>Copy link</Button>
                    <Button variant="secondary" type="button" onClick={() => router.push(`/r/${invite.slug}${window.location.hash || ''}`)}>
                      Enter room now
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => router.refresh()}>
                      Create another
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
