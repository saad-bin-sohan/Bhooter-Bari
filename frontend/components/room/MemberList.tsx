'use client'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { avatarFromSeed } from '../../lib/avatar'

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

export const MemberList = ({ members, isCreator, memberSessionId, onMute, onKick }: Props) => {
  return (
    <div className="space-y-2">
      {members.map(member => {
        const avatarData = avatarFromSeed(member.avatarSeed)
        return (
          <div key={member.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface px-3 py-3 shadow-soft">
            <div className="flex items-center gap-3">
              <Avatar size="md" label={avatarData.icon} color={avatarData.color} online={member.online} />
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {member.nickname}
                  {member.isCreator && <Badge className="text-[10px]">Host</Badge>}
                  {member.isMuted && <Badge variant="warning" className="text-[10px]">Muted</Badge>}
                </div>
                <div className="text-xs text-muted">{member.online ? 'Online' : 'Offline'}</div>
              </div>
            </div>
            {isCreator && member.id !== memberSessionId && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onMute(member.id, !member.isMuted)}>
                  {member.isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onKick(member.id)}>Kick</Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
