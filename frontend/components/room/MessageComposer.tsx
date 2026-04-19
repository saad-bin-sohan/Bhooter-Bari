'use client'
import { KeyboardEvent } from 'react'
import { Paperclip, SendHorizontal, X, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'

type ComposerMessage = {
  id: string
  plaintext?: string
  sender?: { nickname: string } | null
}

type ComposerMember = {
  id: string
  nickname: string
}

type MessageComposerProps = {
  input: string
  replyTo: ComposerMessage | null
  mentionCandidates: ComposerMember[]
  mentionQuery: string
  allowLinks: boolean
  allowAttachments: boolean
  panicButtonEnabled: boolean
  onInputChange: (val: string) => void
  onClearReply: () => void
  onInsertMention: (nickname: string) => void
  onSend: () => void
  onStartTyping: () => void
  onAttach: (file: File) => void
  onPanic: () => void
}

export const MessageComposer = ({
  input,
  replyTo,
  mentionCandidates,
  mentionQuery,
  allowLinks,
  allowAttachments,
  panicButtonEnabled,
  onInputChange,
  onClearReply,
  onInsertMention,
  onSend,
  onStartTyping,
  onAttach,
  onPanic
}: MessageComposerProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-border/50 bg-surface">
      {replyTo && (
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2">
          <div className="stripe flex-1 truncate text-xs text-muted">
            <span className="font-medium text-foreground">
              {replyTo.sender?.nickname ?? 'Unknown'}
            </span>
            {' — '}
            {replyTo.plaintext?.slice(0, 72) ?? ''}
          </div>
          <button
            type="button"
            onClick={onClearReply}
            className="flex-shrink-0 text-muted transition-colors hover:text-foreground"
            aria-label="Clear reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {mentionQuery && mentionCandidates.length > 0 && (
        <div className="border-b border-border/40 px-2 py-1">
          {mentionCandidates.map(member => (
            <button
              key={member.id}
              type="button"
              onClick={() => onInsertMention(member.nickname)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-surface-2"
            >
              <span className="cipher text-xs text-primary">@</span>
              {member.nickname}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-3">
        <label
          className={cn(
            'focus-ring flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground',
            !allowAttachments && 'pointer-events-none opacity-40'
          )}
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
          <input
            type="file"
            className="hidden"
            disabled={!allowAttachments}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onAttach(file)
            }}
          />
        </label>

        <input
          type="text"
          value={input}
          onChange={e => {
            onInputChange(e.target.value)
            onStartTyping()
          }}
          onKeyDown={handleKeyDown}
          placeholder={allowLinks ? 'Message…' : 'Links are disabled in this room'}
          disabled={!allowLinks}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50"
          autoComplete="off"
        />

        {panicButtonEnabled && (
          <button
            type="button"
            onClick={onPanic}
            className="focus-ring flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/8 px-2.5 text-xs font-medium text-danger transition-colors hover:bg-danger/15"
            aria-label="Panic — wipe your messages"
          >
            <Zap className="h-3.5 w-3.5" />
            Panic
          </button>
        )}

        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim()}
          className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/85 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Send message"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
