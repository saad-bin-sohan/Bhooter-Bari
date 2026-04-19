'use client'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'
import { avatarFromSeed } from '../../lib/avatar'
import { Download } from 'lucide-react'

export type AttachmentMeta = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  iv: string
}

export type Reaction = {
  id: string
  emoji: string
  memberSessionId: string
  remove?: boolean
}

export type Message = {
  id: string
  senderSessionId: string | null
  sender?: { id: string; nickname: string; avatarSeed: string; isCreator: boolean } | null
  plaintext?: string
  type: string
  createdAt: string
  threadParentId?: string | null
  attachments?: AttachmentMeta[]
  reactions?: Reaction[]
}

type Props = {
  message: Message
  mine: boolean
  isCreator: boolean
  parent?: Message | null
  onReact: (emoji: string) => void
  onReply: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDownload?: (attachment: AttachmentMeta) => void
}

const QUICK_REACTIONS = ['👍', '😂', '❤️'] as const

export const MessageBubble = ({
  message,
  mine,
  isCreator,
  parent,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onDownload
}: Props) => {
  if (message.type === 'system') {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-border/40" />
        <span className="cipher flex-shrink-0 text-xs text-muted/70">
          {message.plaintext}
        </span>
        <div className="h-px flex-1 bg-border/40" />
      </div>
    )
  }

  const avatarData = message.sender?.avatarSeed
    ? avatarFromSeed(message.sender.avatarSeed)
    : { icon: 'USER', color: '#6c7ae0' }

  let displayText = message.plaintext
  if (message.type === 'attachment') {
    try {
      const meta = JSON.parse(message.plaintext || '{}')
      displayText = meta.name ? `${meta.name}` : 'Encrypted attachment'
    } catch {
      displayText = 'Encrypted attachment'
    }
  }

  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={cn('group flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
      {!mine && (
        <div className="flex-shrink-0 pt-1">
          <Avatar
            size="sm"
            label={avatarData.icon.slice(0, 2)}
            color={avatarData.color}
          />
        </div>
      )}

      <div className={cn('flex max-w-[72%] flex-col gap-1', mine ? 'items-end' : 'items-start')}>
        {!mine && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-xs font-medium text-foreground">
              {message.sender?.nickname ?? 'Unknown'}
            </span>
            {message.sender?.isCreator && (
              <Badge className="text-[10px]">Host</Badge>
            )}
            <span className="cipher text-xs text-muted/60">{timestamp}</span>
          </div>
        )}

        {parent && (
          <div className={cn(
            'flex max-w-full items-start gap-2 rounded-lg px-3 py-1.5',
            mine ? 'bg-primary/10' : 'bg-surface-2'
          )}>
            <div className="h-full w-0.5 flex-shrink-0 rounded-full bg-primary/40" />
            <p className="truncate text-xs text-muted">
              <span className="font-medium text-foreground">
                {parent.sender?.nickname ?? 'Unknown'}
              </span>
              {' — '}
              {(parent.plaintext ?? '').slice(0, 60)}
            </p>
          </div>
        )}

        <div
          className={cn(
            'max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            mine
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'rounded-bl-sm border border-border/60 bg-surface text-foreground'
          )}
        >
          {displayText && (
            <p className="whitespace-pre-wrap break-words">{displayText}</p>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className={cn('mt-2 space-y-1.5', displayText && 'mt-3')}>
              {message.attachments.map(att => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => onDownload?.(att)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                    mine
                      ? 'bg-primary-2/60 text-primary-foreground/80 hover:bg-primary-2/80'
                      : 'border border-border/50 bg-surface-2 text-muted hover:text-foreground'
                  )}
                >
                  <span className="cipher min-w-0 truncate">{att.filename}</span>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <span className="tabular-nums">{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                    <Download className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {message.reactions.map(reaction => (
                <span
                  key={reaction.id}
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-xs',
                    mine
                      ? 'border-primary-2/40 bg-primary-2/30'
                      : 'border-border/50 bg-surface-2'
                  )}
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}

          {mine && (
            <p className="mt-1 text-right">
              <span className="cipher text-xs text-primary-foreground/50">{timestamp}</span>
            </p>
          )}
        </div>

        <div className={cn(
          'flex items-center gap-1 opacity-0 transition-opacity duration-100 group-hover:opacity-100',
          mine ? 'flex-row-reverse' : 'flex-row'
        )}>
          {QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className="rounded-md px-1.5 py-0.5 text-sm transition-colors hover:bg-surface-2"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={onReply}
            className="rounded-md px-2 py-0.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Reply
          </button>
          {(mine || isCreator) && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md px-2 py-0.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Edit
            </button>
          )}
          {(mine || isCreator) && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md px-2 py-0.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-danger"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
