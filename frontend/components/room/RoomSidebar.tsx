'use client'
import { Textarea } from '../ui/Textarea'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { TimerSlider } from '../ui/TimerSlider'
import { MemberList } from './MemberList'

type RoomSettings = {
  burnAfterReadEnabled: boolean
  selfDestructModeEnabled: boolean
  panicButtonEnabled: boolean
  screenshotWarningEnabled: boolean
}

type MemberInfo = {
  id: string
  nickname: string
  avatarSeed: string
  isCreator: boolean
  isMuted: boolean
  online?: boolean
}

type PendingJoin = {
  requestId: string
  nickname: string
  avatarSeed: string
  requestedAt?: string
}

type RoomSidebarProps = {
  members: MemberInfo[]
  isCreator: boolean
  memberSessionId: string | null
  allowAttachments: boolean
  allowLinks: boolean
  room: RoomSettings | null
  timerMinutes: number
  pendingRequests: PendingJoin[]
  reportReason: string
  onMute: (id: string, mute: boolean) => void
  onKick: (id: string) => void
  onToggleSetting: (key: string, value: boolean) => void
  onUpdateTimer: () => void
  onTimerChange: (val: number) => void
  onDeleteRoom: () => void
  onApprove: (requestId: string) => void
  onDeny: (requestId: string) => void
  onReportChange: (val: string) => void
  onReport: () => void
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="cipher mb-3 text-xs font-medium text-muted/80">{children}</p>
  )
}

export const RoomSidebar = ({
  members,
  isCreator,
  memberSessionId,
  allowAttachments,
  allowLinks,
  room,
  timerMinutes,
  pendingRequests,
  reportReason,
  onMute,
  onKick,
  onToggleSetting,
  onUpdateTimer,
  onTimerChange,
  onDeleteRoom,
  onApprove,
  onDeny,
  onReportChange,
  onReport
}: RoomSidebarProps) => {
  const onlineCount = members.filter(m => m.online).length

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-0 divide-y divide-border/50 px-4 py-4">
        <div className="pb-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Members</SectionLabel>
            <span className="cipher text-xs text-muted">{onlineCount} online</span>
          </div>
          <MemberList
            members={members}
            isCreator={isCreator}
            memberSessionId={memberSessionId}
            onMute={onMute}
            onKick={onKick}
          />
        </div>

        {isCreator && (
          <div className="py-5">
            <SectionLabel>Settings</SectionLabel>
            <div className="space-y-2">
              <Toggle
                label="Allow attachments"
                description="Members can send encrypted files"
                value={allowAttachments}
                onChange={val => onToggleSetting('allowAttachments', val)}
              />
              <Toggle
                label="Allow links"
                description="URL sharing in messages"
                value={allowLinks}
                onChange={val => onToggleSetting('allowLinks', val)}
              />
              <Toggle
                label="Burn after reading"
                description="Messages disappear once viewed by all"
                value={!!room?.burnAfterReadEnabled}
                onChange={val => onToggleSetting('burnAfterReadEnabled', val)}
              />
              <Toggle
                label="Self-destruct (30s)"
                description="Each message deletes itself after 30 seconds"
                value={!!room?.selfDestructModeEnabled}
                onChange={val => onToggleSetting('selfDestructModeEnabled', val)}
              />
              <Toggle
                label="Panic button"
                description="Members can wipe their own messages instantly"
                value={!!room?.panicButtonEnabled}
                onChange={val => onToggleSetting('panicButtonEnabled', val)}
              />
              <Toggle
                label="Screenshot warning"
                description="Detects screenshot key presses"
                value={!!room?.screenshotWarningEnabled}
                onChange={val => onToggleSetting('screenshotWarningEnabled', val)}
              />
            </div>
          </div>
        )}

        {isCreator && (
          <div className="py-5">
            <SectionLabel>Extend timer</SectionLabel>
            <TimerSlider value={timerMinutes} onChange={onTimerChange} />
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onUpdateTimer}
              >
                Update timer
              </Button>
            </div>
          </div>
        )}

        {isCreator && pendingRequests.length > 0 && (
          <div className="py-5">
            <SectionLabel>Awaiting approval</SectionLabel>
            <div className="space-y-2">
              {pendingRequests.map(r => (
                <div
                  key={r.requestId}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.nickname}</p>
                    <p className="cipher text-xs text-muted">Wants to join</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onApprove(r.requestId)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeny(r.requestId)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCreator && (
          <div className="py-5">
            <SectionLabel>Danger zone</SectionLabel>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onDeleteRoom}
            >
              Delete room now
            </Button>
          </div>
        )}

        <div className="py-5">
          <SectionLabel>Report abuse</SectionLabel>
          <Textarea
            className="min-h-[88px] text-xs"
            placeholder="Describe the issue or paste offending content"
            value={reportReason}
            onChange={e => onReportChange(e.target.value)}
          />
          <div className="mt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onReport}
              disabled={!reportReason.trim()}
            >
              Submit report
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
