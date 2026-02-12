'use client'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { avatarFromSeed } from '../../lib/avatar'

export type AttachmentMeta = { id: string; filename: string; mimeType: string; sizeBytes: number; iv: string }
export type Reaction = { id: string; emoji: string; memberSessionId: string; remove?: boolean }

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
      <div className="flex justify-center">
        <span className="rounded-full bg-surface2 px-3 py-1 text-xs text-muted">{message.plaintext}</span>
      </div>
    )
  }

  const avatarData = message.sender?.avatarSeed ? avatarFromSeed(message.sender.avatarSeed) : { icon: 'USER', color: '#94a3b8' }
  let displayText = message.plaintext

  if (message.type === 'attachment') {
    try {
      const meta = JSON.parse(message.plaintext || '{}')
      displayText = meta.name ? `Encrypted file: ${meta.name}` : 'Encrypted attachment'
    } catch (e) {
      displayText = 'Encrypted attachment'
    }
  }

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('group max-w-2xl w-full', mine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-3xl border border-border/60 px-4 py-3 shadow-soft',
            mine
              ? 'ml-auto bg-gradient-to-br from-primary/90 to-primary-2/90 text-primary-foreground'
              : 'bg-surface'
          )}
        >
          <div className={cn('flex items-center gap-2 text-xs', mine ? 'text-primary-foreground/80' : 'text-muted')}>
            <Avatar size="sm" label={avatarData.icon} color={avatarData.color} />
            <span className="font-semibold">{message.sender?.nickname || 'System'}</span>
            {message.sender?.isCreator && <Badge className="text-[10px]">Host</Badge>}
            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {parent && (
            <div className="mt-2 rounded-2xl bg-surface2/70 px-3 py-2 text-xs text-muted">
              Replying to {parent.sender?.nickname || 'message'}: {(parent.plaintext || '').slice(0, 80)}
            </div>
          )}
          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{displayText}</div>
          {message.attachments?.length ? (
            <div className="mt-3 space-y-2">
              {message.attachments.map(att => (
                <button
                  key={att.id}
                  onClick={() => onDownload?.(att)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-surface2 px-3 py-2 text-xs text-muted transition hover:text-foreground"
                >
                  <span>{att.filename}</span>
                  <span>{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                </button>
              ))}
            </div>
          ) : null}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.reactions.map(reaction => (
                <span key={reaction.id} className="rounded-full bg-surface2 px-2 py-1 text-xs">
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={cn('mt-2 flex flex-wrap gap-2 opacity-0 transition group-hover:opacity-100', mine ? 'justify-end' : 'justify-start')}>
          {['👍', '😂', '❤️'].map(emoji => (
            <Button key={emoji} variant="ghost" size="sm" onClick={() => onReact(emoji)}>
              {emoji}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={onReply}>Reply</Button>
          {(mine || isCreator) && onEdit && <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>}
          {(mine || isCreator) && onDelete && <Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button>}
        </div>
      </div>
    </div>
  )
}
