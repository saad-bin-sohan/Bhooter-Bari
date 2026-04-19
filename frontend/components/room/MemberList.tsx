'use client'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { avatarFromSeed } from '../../lib/avatar'
import { cn } from '../../lib/utils'

export type MemberInfo = {
  id: string
  nickname: string
  avatarSeed: string
  isCreator: boolean
  isMuted: boolean
  online?: boolean
}

type Props = {
  members: MemberInfo[]
  isCreator: boolean
  memberSessionId: string | null
  onMute: (id: string, mute: boolean) => void
  onKick: (id: string) => void
}

export const MemberList = ({
  members,
  isCreator,
  memberSessionId,
  onMute,
  onKick
}: Props) => {
  if (members.length === 0) {
    return (
      <p className="cipher text-xs text-muted">No members yet.</p>
    )
  }

  return (
    <div className="space-y-1">
      {members.map(member => {
        const avatarData = avatarFromSeed(member.avatarSeed)
        const isSelf = member.id === memberSessionId
        const canModerate = isCreator && !isSelf

        return (
          <div
            key={member.id}
            className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar
                size="sm"
                label={avatarData.icon.slice(0, 2)}
                color={avatarData.color}
                online={member.online}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'truncate text-sm',
                    isSelf ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                  )}>
                    {member.nickname}
                    {isSelf && <span className="ml-1 text-xs font-normal text-muted">(you)</span>}
                  </span>
                  {member.isCreator && (
                    <Badge variant="default" className="text-[10px]">Host</Badge>
                  )}
                  {member.isMuted && (
                    <Badge variant="warning" className="text-[10px]">Muted</Badge>
                  )}
                </div>
                <p className="cipher text-xs text-muted/70">
                  {member.online ? 'Online' : 'Away'}
                </p>
              </div>
            </div>

            {canModerate && (
              <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onMute(member.id, !member.isMuted)}
                >
                  {member.isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onKick(member.id)}
                >
                  Kick
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
