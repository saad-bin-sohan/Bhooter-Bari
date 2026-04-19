'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { Logo } from '../../components/ui/Logo'
import { TimerSlider } from '../../components/ui/TimerSlider'
import { PrivacyGroup } from '../../components/create/PrivacyGroup'
import { InvitePanel } from '../../components/create/InvitePanel'
import { apiRequest } from '../../lib/api'
import { generateRoomKey } from '../../lib/crypto'
import { useToast } from '../../lib/hooks/useToast'

const defaultDuration = 15

type RoomSummaryProps = {
  type: 'group' | 'direct'
  durationMinutes: number
  requireApproval: boolean
  allowAttachments: boolean
  allowLinks: boolean
  selfDestructModeEnabled: boolean
  burnAfterReadEnabled: boolean
  panicButtonEnabled: boolean
  screenshotWarningEnabled: boolean
  tagList: string[]
}

function RoomSummary({
  type,
  durationMinutes,
  requireApproval,
  allowAttachments,
  allowLinks,
  selfDestructModeEnabled,
  burnAfterReadEnabled,
  panicButtonEnabled,
  screenshotWarningEnabled,
  tagList
}: RoomSummaryProps) {
  const controls = [
    { label: 'End-to-end encrypted', active: true, always: true },
    { label: 'Allow attachments', active: allowAttachments },
    { label: 'Allow links', active: allowLinks },
    { label: 'Approval required', active: requireApproval },
    { label: 'Self-destruct (30s)', active: selfDestructModeEnabled },
    { label: 'Burn after read', active: burnAfterReadEnabled },
    { label: 'Panic button', active: panicButtonEnabled },
    { label: 'Screenshot warning', active: screenshotWarningEnabled }
  ]

  return (
    <div className="panel space-y-4 p-5">
      <p className="text-xs font-medium text-muted">Room preview</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Type</span>
          <span className="text-sm font-medium text-foreground">
            {type === 'group' ? 'Group' : '1-1'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Duration</span>
          <span className="font-mono text-sm font-medium text-foreground">
            {durationMinutes} min
          </span>
        </div>
      </div>

      <div className="divider" />

      <div className="space-y-2">
        {controls.map(({ label, active, always }) => (
          <div key={label} className="flex items-center justify-between">
            <span className={`text-xs ${active ? 'text-foreground' : 'text-muted/60'}`}>
              {label}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="dot"
                color={active ? 'success' : 'muted'}
              />
              <span className={`text-xs font-mono ${active ? 'text-success' : 'text-muted/60'}`}>
                {always ? 'always' : active ? 'on' : 'off'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {tagList.length > 0 ? (
        <>
          <div className="divider" />
          <div className="space-y-1.5">
            <p className="text-xs text-muted">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tagList.map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

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

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5 md:px-10">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              aria-label="Back home"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Set up your room
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure privacy controls, then share the invite link.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          <Card className="p-0">
            <form onSubmit={handleSubmit} className="divide-y divide-border/50">
              <div className="space-y-3 px-5 py-5">
                <p className="text-xs font-medium text-muted">Room type</p>
                <Tabs
                  tabs={[
                    { id: 'group', label: 'Group room' },
                    { id: 'direct', label: '1-1 room' }
                  ]}
                  value={type}
                  onChange={value => setType(value as 'group' | 'direct')}
                />
                <p className="text-xs text-muted">
                  {type === 'group'
                    ? 'Multiple members. Creator controls who joins.'
                    : 'Two participants only. Invite link is single-use.'}
                </p>
              </div>

              <div className="space-y-4 px-5 py-5">
                <p className="text-xs font-medium text-muted">Room identity</p>

                <div className="space-y-1.5">
                  <label htmlFor="room-name" className="text-sm font-medium text-foreground">
                    Room name
                    <span className="ml-1 text-xs font-normal text-muted">(optional)</span>
                  </label>
                  <Input
                    id="room-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Safety circle"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Room timer
                  </label>
                  <TimerSlider value={durationMinutes} onChange={setDurationMinutes} />
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <p className="text-xs font-medium text-muted">Access</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="room-password" className="text-sm font-medium text-foreground">
                      Room password
                      <span className="ml-1 text-xs font-normal text-muted">(optional)</span>
                    </label>
                    <Input
                      id="room-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Shared passphrase"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="room-tags" className="text-sm font-medium text-foreground">
                      Tags
                      <span className="ml-1 text-xs font-normal text-muted">(comma-separated)</span>
                    </label>
                    <Input
                      id="room-tags"
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      placeholder="e.g. privacy, friends"
                      autoComplete="off"
                    />
                    {tagList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagList.map(tag => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 px-5 py-5">
                <label htmlFor="room-rules" className="text-sm font-medium text-foreground">
                  Room rules
                  <span className="ml-1 text-xs font-normal text-muted">(optional)</span>
                </label>
                <Textarea
                  id="room-rules"
                  className="min-h-[96px]"
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  placeholder="Share boundaries, topics, or guidelines for this room"
                />
              </div>

              <div className="space-y-5 px-5 py-5">
                <p className="text-xs font-medium text-muted">Privacy controls</p>

                <PrivacyGroup label="Content" first>
                  <Toggle
                    label="Allow attachments"
                    description="Members can send encrypted files up to 10 MB"
                    value={allowAttachments}
                    onChange={setAllowAttachments}
                  />
                  <Toggle
                    label="Allow links"
                    description="URL sharing in messages"
                    value={allowLinks}
                    onChange={setAllowLinks}
                  />
                </PrivacyGroup>

                <PrivacyGroup label="Access">
                  <Toggle
                    label="Require join approval"
                    description="New members wait for your approval before entering"
                    value={requireApproval}
                    onChange={setRequireApproval}
                  />
                </PrivacyGroup>

                <PrivacyGroup label="Message lifecycle">
                  <Toggle
                    label="Self-destruct messages"
                    description="Each message auto-deletes 30 seconds after sending"
                    value={selfDestructModeEnabled}
                    onChange={setSelfDestructModeEnabled}
                  />
                  <Toggle
                    label="Burn after reading"
                    description="Messages disappear once all members have viewed them"
                    value={burnAfterReadEnabled}
                    onChange={setBurnAfterReadEnabled}
                  />
                  <Toggle
                    label="Per-user panic button"
                    description="Members can instantly wipe their own messages at any time"
                    value={panicButtonEnabled}
                    onChange={setPanicButtonEnabled}
                  />
                  <Toggle
                    label="Screenshot warning"
                    description="Detects screenshot keyboard shortcuts and warns the room"
                    value={screenshotWarningEnabled}
                    onChange={setScreenshotWarningEnabled}
                  />
                </PrivacyGroup>
              </div>

              <div className="px-5 py-5">
                {error ? (
                  <div className="mb-4 rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create room'}
                  </Button>
                  <p className="text-xs text-muted">
                    An encryption key will be generated in your browser and embedded in the invite link.
                  </p>
                </div>
              </div>
            </form>
          </Card>

          <aside className="lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              {invite ? (
                <motion.div
                  key="invite"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <InvitePanel
                    invite={invite}
                    onCopy={handleCopy}
                    onEnter={() => router.push(`/r/${invite.slug}${window.location.hash || ''}`)}
                    onCreateAnother={() => router.refresh()}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <RoomSummary
                    type={type}
                    durationMinutes={durationMinutes}
                    requireApproval={requireApproval}
                    allowAttachments={allowAttachments}
                    allowLinks={allowLinks}
                    selfDestructModeEnabled={selfDestructModeEnabled}
                    burnAfterReadEnabled={burnAfterReadEnabled}
                    panicButtonEnabled={panicButtonEnabled}
                    screenshotWarningEnabled={screenshotWarningEnabled}
                    tagList={tagList}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </main>
    </>
  )
}
