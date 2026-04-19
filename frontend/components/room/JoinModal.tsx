'use client'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { avatarFromSeed } from '../../lib/avatar'
import { MessageCircleWarning, RefreshCw } from 'lucide-react'

type RoomMeta = {
  name: string | null
  type: string
  expiresAt: string
  hasPassword: boolean
  screenshotWarningEnabled: boolean
}

type JoinModalProps = {
  room: RoomMeta | null
  clock: number | null
  avatarSeed: string | null
  nickname: string
  password: string
  joinState: 'idle' | 'pending' | 'joined'
  joinError: string
  onNicknameChange: (val: string) => void
  onPasswordChange: (val: string) => void
  onShuffleAvatar: () => void
  onJoin: () => void
}

const relativeTime = (expiresAt?: string | null, now?: number | null) => {
  if (!expiresAt || now == null) return ''
  const diff = new Date(expiresAt).getTime() - now
  if (diff <= 0) return 'Expired'
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

export const JoinModal = ({
  room,
  clock,
  avatarSeed,
  nickname,
  password,
  joinState,
  joinError,
  onNicknameChange,
  onPasswordChange,
  onShuffleAvatar,
  onJoin
}: JoinModalProps) => {
  const avatarData = avatarSeed
    ? avatarFromSeed(avatarSeed)
    : { icon: 'USER', color: '#6c7ae0' }

  const timeLeft = relativeTime(room?.expiresAt, clock)
  const isPending = joinState === 'pending'

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">
          {room?.name || 'Join room'}
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="cipher text-xs text-muted">
            {room?.type === 'direct' ? '1-1 room' : 'Group room'}
          </span>
          {timeLeft && (
            <>
              <span className="text-border">·</span>
              <span className="cipher text-xs text-muted">Expires in {timeLeft}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full font-mono text-lg font-semibold text-white"
            style={{ background: avatarData.color }}
          >
            {avatarData.icon.slice(0, 2)}
          </div>
          <button
            type="button"
            onClick={onShuffleAvatar}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:text-foreground"
            aria-label="Shuffle avatar"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        <div className="w-full space-y-1.5">
          <label htmlFor="join-nickname" className="text-xs font-medium text-muted">
            Your nickname in this room
          </label>
          <Input
            id="join-nickname"
            value={nickname}
            onChange={e => onNicknameChange(e.target.value)}
            placeholder="Choose a nickname"
            autoComplete="off"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') onJoin()
            }}
          />
        </div>

        {room?.hasPassword && (
          <div className="w-full space-y-1.5">
            <label htmlFor="join-password" className="text-xs font-medium text-muted">
              Room password
            </label>
            <Input
              id="join-password"
              type="password"
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              placeholder="Enter the room passphrase"
              onKeyDown={e => {
                if (e.key === 'Enter') onJoin()
              }}
            />
          </div>
        )}
      </div>

      {room?.screenshotWarningEnabled && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/8 px-3 py-2.5">
          <MessageCircleWarning className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
          <p className="text-xs leading-relaxed text-warning-foreground">
            Screenshot detection is active in this room. Screenshots are not safe here.
          </p>
        </div>
      )}

      {joinError && (
        <div className="rounded-xl border border-danger/30 bg-danger/8 px-3 py-2.5 text-sm text-danger">
          {joinError}
        </div>
      )}

      {isPending && !joinError && (
        <p className="text-center text-xs text-muted">
          Waiting for the host to approve your request…
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        className="w-full justify-center"
        onClick={onJoin}
        disabled={isPending}
      >
        {isPending ? 'Waiting for approval…' : 'Join room'}
      </Button>
    </div>
  )
}
