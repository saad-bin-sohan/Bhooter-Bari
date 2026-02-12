'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { Button } from '../../../components/ui/Button'
import { Toggle } from '../../../components/ui/Toggle'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { RoomHeader } from '../../../components/room/RoomHeader'
import { MemberList } from '../../../components/room/MemberList'
import { MessageBubble } from '../../../components/chat/MessageBubble'
import { TypingIndicator } from '../../../components/chat/TypingIndicator'
import { apiRequest } from '../../../lib/api'
import { avatarFromSeed, randomAvatar } from '../../../lib/avatar'
import { decryptFile, decryptText, encryptFile, encryptText, importRoomKey } from '../../../lib/crypto'
import { apiBase } from '../../../lib/config'
import { useToast } from '../../../lib/hooks/useToast'
import { useUiState } from '../../../lib/hooks/useUiState'
import { ArrowLeft, Link2, MessageCircleWarning } from 'lucide-react'

const relativeTime = (expiresAt?: string | Date, now?: number | null) => {
  if (!expiresAt || now == null) return ''
  const target = new Date(expiresAt).getTime()
  const diff = target - now
  if (diff <= 0) return 'Expired'
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

type RoomMeta = {
  id: string
  slug: string
  name: string | null
  type: string
  expiresAt: string
  rules?: string | null
  allowAttachments: boolean
  allowLinks: boolean
  requireApproval: boolean
  screenshotWarningEnabled: boolean
  selfDestructModeEnabled: boolean
  burnAfterReadEnabled: boolean
  panicButtonEnabled: boolean
  tags: string[]
  hasPassword: boolean
}

type MemberInfo = {
  id: string
  nickname: string
  avatarSeed: string
  isCreator: boolean
  isMuted: boolean
  online?: boolean
}

type AttachmentMeta = { id: string; filename: string; mimeType: string; sizeBytes: number; iv: string }

type Reaction = { id: string; emoji: string; memberSessionId: string; remove?: boolean }

type Message = {
  id: string
  roomId: string
  senderSessionId: string | null
  sender?: { id: string; nickname: string; avatarSeed: string; isCreator: boolean } | null
  ciphertext: string
  iv: string
  type: string
  createdAt: string
  updatedAt?: string
  isDeleted?: boolean
  threadParentId?: string | null
  selfDestructAt?: string | null
  burnAfterRead?: boolean
  attachments?: AttachmentMeta[]
  reactions?: Reaction[]
  plaintext?: string
}

type PendingJoin = { requestId: string; nickname: string; avatarSeed: string; requestedAt?: string }

type TypingState = { memberSessionId: string; state: 'start' | 'stop' }

export default function RoomPage() {
  const params = useParams()
  const slug = params?.slug as string
  const router = useRouter()
  const pushToast = useToast(state => state.push)
  const isSidebarOpen = useUiState(state => state.isSidebarOpen)
  const setSidebarOpen = useUiState(state => state.setSidebarOpen)
  const [room, setRoom] = useState<RoomMeta | null>(null)
  const [roomKey, setRoomKey] = useState<CryptoKey | null>(null)
  const [memberToken, setMemberToken] = useState<string | null>(null)
  const [memberSessionId, setMemberSessionId] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [joinOpen, setJoinOpen] = useState(true)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null)
  const [joinState, setJoinState] = useState<'idle' | 'pending' | 'joined'>('idle')
  const [joinError, setJoinError] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<MemberInfo[]>([])
  const [input, setInput] = useState('')
  const [pendingRequests, setPendingRequests] = useState<PendingJoin[]>([])
  const [typingIndicators, setTypingIndicators] = useState<Record<string, number>>({})
  const [allowLinks, setAllowLinks] = useState(true)
  const [allowAttachments, setAllowAttachments] = useState(true)
  const [expired, setExpired] = useState(false)
  const [editMessage, setEditMessage] = useState<Message | null>(null)
  const [editText, setEditText] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [timerMinutes, setTimerMinutes] = useState(15)
  const [clock, setClock] = useState<number | null>(null)
  const keyRef = useRef<CryptoKey | null>(null)
  const tokenRef = useRef<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingRef = useRef<NodeJS.Timeout | null>(null)
  const creatorSecretRef = useRef<string | null>(null)
  const seenRef = useRef<Set<string>>(new Set())
  const destructTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const loadKey = async () => {
      if (typeof window === 'undefined') return
      const hash = window.location.hash.replace('#', '')
      const hashKey = new URLSearchParams(hash).get('key')
      const stored = sessionStorage.getItem(`bb-key-${slug}`)
      const encoded = hashKey || stored
      if (encoded) {
        const key = await importRoomKey(encoded)
        keyRef.current = key
        setRoomKey(key)
      }
    }
    loadKey()
  }, [slug])

  useEffect(() => {
    setAvatarSeed(prev => prev ?? randomAvatar())
  }, [])

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await apiRequest<RoomMeta>(`/rooms/${slug}`)
        setRoom(data)
        setAllowAttachments(data.allowAttachments)
        setAllowLinks(data.allowLinks)
      } catch (e) {
        setExpired(true)
      }
    }
    fetchRoom()
  }, [slug])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedSession = sessionStorage.getItem(`bb-session-${slug}`)
    const storedCreator = sessionStorage.getItem(`bb-creator-${slug}`)
    if (storedCreator) creatorSecretRef.current = storedCreator
    if (storedSession && roomKey && room) {
      const parsed = JSON.parse(storedSession)
      setMemberToken(parsed.memberToken)
      tokenRef.current = parsed.memberToken
      setMemberSessionId(parsed.memberSessionId)
      setIsCreator(parsed.isCreator)
      setJoinOpen(false)
      connectSocket(parsed.memberToken, parsed.isCreator)
      fetchInitial(parsed.memberToken)
    }
  }, [roomKey, room, slug])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!room?.screenshotWarningEnabled) return
      if (e.key.toLowerCase().includes('printscreen')) {
        pushToast({ title: 'Screenshot detected', message: 'Screenshots are not safe here.', variant: 'warning' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [room?.screenshotWarningEnabled, pushToast])

  useEffect(() => {
    if (!room || !socketRef.current || !tokenRef.current) return
    messages.forEach(msg => {
      if (msg.id.startsWith('sys-')) return
      if (!seenRef.current.has(msg.id)) {
        seenRef.current.add(msg.id)
        socketRef.current?.emit('message_seen', { memberToken: tokenRef.current, messageId: msg.id })
      }
    })
    destructTimers.current.forEach((timeout, id) => {
      if (!messages.find(m => m.id === id)) {
        clearTimeout(timeout)
        destructTimers.current.delete(id)
      }
    })
    messages.forEach(msg => {
      if (!msg.selfDestructAt) return
      const ms = new Date(msg.selfDestructAt).getTime() - Date.now()
      if (ms <= 0) {
        setMessages(prev => prev.filter(m => m.id !== msg.id))
        return
      }
      if (!destructTimers.current.has(msg.id)) {
        const timeout = setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== msg.id))
          destructTimers.current.delete(msg.id)
        }, ms)
        destructTimers.current.set(msg.id, timeout)
      }
    })
  }, [messages, room])

  useEffect(() => {
    if (!room?.expiresAt) return
    const tick = () => {
      const now = Date.now()
      setClock(now)
      if (new Date(room.expiresAt).getTime() <= now) setExpired(true)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [room?.expiresAt])

  useEffect(() => {
    if (!room?.expiresAt) return
    const diff = Math.max(1, Math.round((new Date(room.expiresAt).getTime() - Date.now()) / 60000))
    setTimerMinutes(diff)
  }, [room?.expiresAt])

  useEffect(() => {
    const last = input.split(/\s/).pop()
    if (last && last.startsWith('@')) {
      setMentionQuery(last.slice(1))
    } else {
      setMentionQuery('')
    }
  }, [input])

  const addSystemMessage = (text: string) => {
    if (!room) return
    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random()}`,
        roomId: room.id,
        senderSessionId: null,
        ciphertext: '',
        iv: '',
        type: 'system',
        createdAt: new Date().toISOString(),
        plaintext: text
      }
    ])
  }

  const connectSocket = (token: string, creator: boolean) => {
    if (!room) return
    if (socketRef.current) return
    const socket = io(`${apiBase}/rooms`, { transports: ['websocket'] })
    socketRef.current = socket
    socket.on('connect', () => {
      socket.emit('join_room', { memberToken: token })
    })
    socket.on('joined', () => {
      setJoinState('joined')
      setJoinOpen(false)
    })
    socket.on('pending_join_request', payload => {
      if (!creator) return
      setPendingRequests(prev => [...prev, payload])
    })
    socket.on('join_request_denied', () => {
      setJoinState('idle')
      setPendingRequests([])
      setJoinError('Join request denied')
    })
    socket.on('join_request_approved', data => {
      setMemberToken(data.memberToken)
      tokenRef.current = data.memberToken
      setMemberSessionId(data.memberSessionId)
      setIsCreator(data.isCreator)
      sessionStorage.setItem(`bb-session-${slug}`, JSON.stringify({ memberToken: data.memberToken, memberSessionId: data.memberSessionId, isCreator: data.isCreator }))
      socket.emit('join_room', { memberToken: data.memberToken })
      fetchInitial(data.memberToken)
    })
    socket.on('message_created', async msg => {
      if (!keyRef.current) return
      const plaintext = await decryptText(keyRef.current, msg.ciphertext, msg.iv)
      setMessages(prev => [...prev, { ...msg, plaintext }])
    })
    socket.on('message_updated', async msg => {
      if (!keyRef.current) return
      const plaintext = await decryptText(keyRef.current, msg.ciphertext, msg.iv)
      setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, ciphertext: msg.ciphertext, iv: msg.iv, plaintext } : m)))
    })
    socket.on('message_deleted', msg => {
      setMessages(prev => prev.filter(m => m.id !== msg.id))
    })
    socket.on('reaction_updated', payload => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== payload.messageId) return m
          const reactions = m.reactions ? [...m.reactions] : []
          if (payload.remove) return { ...m, reactions: reactions.filter(r => r.id !== payload.id) }
          return { ...m, reactions: [...reactions, payload] }
        })
      )
    })
    socket.on('member_joined', member => {
      setMembers(prev => {
        const exists = prev.find(m => m.id === member.memberSessionId)
        const avatarSeedValue = member.avatarSeed || randomAvatar()
        const updated = exists
          ? prev.map(m => (m.id === member.memberSessionId ? { ...m, online: true } : m))
          : [...prev, { id: member.memberSessionId, nickname: member.nickname, avatarSeed: avatarSeedValue, isCreator: member.isCreator, isMuted: false, online: true }]
        return updated
      })
      addSystemMessage(`${member.nickname} joined`)
    })
    socket.on('member_left', member => {
      setMembers(prev => {
        const target = prev.find(m => m.id === member.memberSessionId)
        if (target) addSystemMessage(`${target.nickname} left`)
        return prev.map(m => (m.id === member.memberSessionId ? { ...m, online: false } : m))
      })
    })
    socket.on('member_muted', payload => {
      setMembers(prev => prev.map(m => (m.id === payload.memberSessionId ? { ...m, isMuted: payload.isMuted } : m)))
    })
    socket.on('member_kicked', payload => {
      if (payload.memberSessionId === memberSessionId) {
        setJoinError('You were removed from this room')
        setExpired(true)
      }
      setMembers(prev => {
        const target = prev.find(m => m.id === payload.memberSessionId)
        if (target) addSystemMessage(`${target.nickname} was removed`)
        return prev.filter(m => m.id !== payload.memberSessionId)
      })
    })
    socket.on('room_timer_updated', data => {
      setRoom(current => (current ? { ...current, expiresAt: data.expiresAt } : current))
    })
    socket.on('room_settings_updated', data => {
      if (data.allowAttachments !== undefined) setAllowAttachments(data.allowAttachments)
      if (data.allowLinks !== undefined) setAllowLinks(data.allowLinks)
      setRoom(current => (current ? { ...current, ...data } : current))
    })
    socket.on('room_deleted', () => setExpired(true))
    socket.on('panic_cleared_messages', payload => {
      setMessages(prev => prev.filter(m => m.senderSessionId !== payload.memberSessionId))
    })
    socket.on('typing', (payload: TypingState) => {
      if (payload.state === 'start') {
        setTypingIndicators(prev => ({ ...prev, [payload.memberSessionId]: Date.now() }))
      } else {
        setTypingIndicators(prev => {
          const copy = { ...prev }
          delete copy[payload.memberSessionId]
          return copy
        })
      }
    })
  }

  const fetchInitial = async (token: string) => {
    if (!room || !roomKey) return
    const msgs = await apiRequest<Message[]>(`/rooms/${room.id}/messages`, { token })
    const decrypted = await Promise.all(
      msgs.map(async m => ({ ...m, plaintext: await decryptText(roomKey, m.ciphertext, m.iv) }))
    )
    setMessages(decrypted)
    const memberList = await apiRequest<MemberInfo[]>(`/rooms/${room.id}/members`, { token })
    setMembers(memberList)
  }

  const handleJoin = async () => {
    if (!room) return
    if (!nickname.trim()) {
      setJoinError('Pick a nickname')
      return
    }
    setJoinError('')
    setJoinState('pending')
    try {
    const resolvedAvatarSeed = avatarSeed || randomAvatar()
    if (!avatarSeed) setAvatarSeed(resolvedAvatarSeed)
    const body: any = { nickname: nickname.trim(), avatarSeed: resolvedAvatarSeed }
      if (password) body.password = password
      if (creatorSecretRef.current) body.creatorSecret = creatorSecretRef.current
      const result = await apiRequest<any>(`/rooms/${room.id}/join`, { method: 'POST', body })
      if (result.status === 'pending') {
        if (!socketRef.current) {
          const socket = io(`${apiBase}/rooms`, { transports: ['websocket'] })
          socketRef.current = socket
          socket.on('join_request_approved', data => {
            setMemberToken(data.memberToken)
            tokenRef.current = data.memberToken
            setMemberSessionId(data.memberSessionId)
            setIsCreator(data.isCreator)
            sessionStorage.setItem(`bb-session-${slug}`, JSON.stringify({ memberToken: data.memberToken, memberSessionId: data.memberSessionId, isCreator: data.isCreator }))
            socket.disconnect()
            socketRef.current = null
            connectSocket(data.memberToken, data.isCreator)
            fetchInitial(data.memberToken)
          })
          socket.on('join_request_denied', () => {
            setJoinError('Request denied')
            setJoinState('idle')
          })
          socket.on('connect', () => socket.emit('await_approval', { roomId: room.id, requestId: result.requestId }))
        } else {
          socketRef.current.emit('await_approval', { roomId: room.id, requestId: result.requestId })
        }
      } else {
        setMemberToken(result.memberToken)
        tokenRef.current = result.memberToken
        setMemberSessionId(result.memberSessionId)
        setIsCreator(result.isCreator)
        sessionStorage.setItem(`bb-session-${slug}`, JSON.stringify({ memberToken: result.memberToken, memberSessionId: result.memberSessionId, isCreator: result.isCreator }))
        connectSocket(result.memberToken, result.isCreator)
        fetchInitial(result.memberToken)
        setJoinOpen(false)
        setJoinState('joined')
      }
    } catch (e: any) {
      setJoinState('idle')
      setJoinError(e.message || 'Unable to join')
    }
  }

  const sendMessage = async () => {
    if (!room || !roomKey || !input.trim() || !socketRef.current || !tokenRef.current) return
    const encrypted = await encryptText(roomKey, input.trim())
    socketRef.current.emit('send_message', {
      memberToken: tokenRef.current,
      roomId: room.id,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      threadParentId: replyTo?.id,
      type: 'text',
      burnAfterRead: room.burnAfterReadEnabled,
      selfDestructSeconds: room.selfDestructModeEnabled ? 30 : undefined
    })
    setInput('')
    setReplyTo(null)
    socketRef.current.emit('typing_stop', { roomId: room.id, memberToken: tokenRef.current })
  }

  const startTyping = () => {
    if (!socketRef.current || !room || !tokenRef.current) return
    socketRef.current.emit('typing_start', { roomId: room.id, memberToken: tokenRef.current })
    if (typingRef.current) clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { roomId: room.id, memberToken: tokenRef.current })
    }, 1400)
  }

  const handleAttachment = async (file: File) => {
    if (!room || !roomKey || !memberToken) return
    if (file.size > 10 * 1024 * 1024) {
      alert('Attachments up to 10MB only')
      return
    }
    const buffer = await file.arrayBuffer()
    const encryptedFile = await encryptFile(roomKey, buffer)
    const metadata = await encryptText(roomKey, JSON.stringify({ name: file.name, size: file.size }))
    const form = new FormData()
    form.append('file', new Blob([encryptedFile.ciphertext]))
    form.append('iv', encryptedFile.iv)
    form.append('messageCiphertext', metadata.ciphertext)
    form.append('messageIv', metadata.iv)
    form.append('burnAfterRead', room.burnAfterReadEnabled ? 'true' : 'false')
    form.append('selfDestructSeconds', room.selfDestructModeEnabled ? '30' : '0')
    const headers = { Authorization: `Bearer ${memberToken}` }
    await apiRequest(`/rooms/${room.id}/attachments`, { method: 'POST', formData: form, headers })
  }

  const downloadAttachment = async (attachment: AttachmentMeta) => {
    if (!room || !roomKey || !memberToken) return
    const data = await apiRequest<{ ciphertext: string; iv: string; filename: string; mimeType: string }>(
      `/rooms/${room.id}/attachments/${attachment.id}`,
      { token: memberToken }
    )
    const buffer = await decryptFile(roomKey, Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0)).buffer, data.iv)
    const blob = new Blob([buffer], { type: data.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = data.filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const toggleSetting = async (key: string, value: boolean) => {
    if (!room || !memberToken) return
    await apiRequest(`/rooms/${room.id}/settings`, { method: 'POST', body: { [key]: value }, token: memberToken })
    if (key === 'allowAttachments') setAllowAttachments(value)
    if (key === 'allowLinks') setAllowLinks(value)
    setRoom(current => (current ? { ...current, [key]: value } : current))
  }

  const approveRequest = async (requestId: string) => {
    if (!room || !memberToken) return
    await apiRequest(`/rooms/${room.id}/join-requests/${requestId}/approve`, { method: 'POST', token: memberToken })
    setPendingRequests(prev => prev.filter(p => p.requestId !== requestId))
  }

  const denyRequest = async (requestId: string) => {
    if (!room || !memberToken) return
    await apiRequest(`/rooms/${room.id}/join-requests/${requestId}/deny`, { method: 'POST', token: memberToken })
    setPendingRequests(prev => prev.filter(p => p.requestId !== requestId))
  }

  const deleteRoom = async () => {
    if (!room || !memberToken) return
    await apiRequest(`/rooms/${room.id}/delete`, { method: 'POST', token: memberToken })
    setExpired(true)
  }

  const panic = async () => {
    if (!room || !socketRef.current || !tokenRef.current) return
    socketRef.current.emit('panic', { roomId: room.id, memberToken: tokenRef.current })
  }

  const muteMember = async (targetId: string, mute: boolean) => {
    if (!socketRef.current || !tokenRef.current || !room) return
    socketRef.current.emit('mute_member', { memberToken: tokenRef.current, targetMemberSessionId: targetId, mute })
  }

  const kickMember = async (targetId: string) => {
    if (!socketRef.current || !tokenRef.current || !room) return
    socketRef.current.emit('kick_member', { memberToken: tokenRef.current, targetMemberSessionId: targetId })
  }

  const typingNames = useMemo(() => {
    const ids = Object.keys(typingIndicators)
    return members.filter(m => ids.includes(m.id)).map(m => m.nickname)
  }, [typingIndicators, members])

  const mentionCandidates = useMemo(
    () => members.filter(m => m.nickname.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5),
    [mentionQuery, members]
  )

  const addReaction = (messageId: string, emoji: string) => {
    if (!socketRef.current || !tokenRef.current) return
    socketRef.current.emit('add_reaction', { memberToken: tokenRef.current, messageId, emoji })
  }

  const beginEdit = (msg: Message) => {
    setEditMessage(msg)
    setEditText(msg.plaintext || '')
  }

  const saveEdit = async () => {
    if (!editMessage || !roomKey || !socketRef.current || !tokenRef.current) return
    const encrypted = await encryptText(roomKey, editText)
    socketRef.current.emit('edit_message', { memberToken: tokenRef.current, messageId: editMessage.id, ciphertext: encrypted.ciphertext, iv: encrypted.iv })
    setEditMessage(null)
    setEditText('')
  }

  const deleteMessage = (id: string) => {
    if (!socketRef.current || !tokenRef.current) return
    socketRef.current.emit('delete_message', { memberToken: tokenRef.current, messageId: id })
  }

  const insertMention = (nicknameValue: string) => {
    const parts = input.split(/\s/)
    parts[parts.length - 1] = `@${nicknameValue}`
    const next = `${parts.join(' ')} `
    setInput(next)
    setMentionQuery('')
  }

  const updateTimer = async () => {
    if (!room || !memberToken) return
    const data = await apiRequest<{ expiresAt: string }>(`/rooms/${room.id}/timer`, { method: 'POST', body: { newDurationMinutesRemaining: timerMinutes }, token: memberToken })
    setRoom(current => (current ? { ...current, expiresAt: data.expiresAt } : current))
  }

  const submitReport = async () => {
    if (!room || !reportReason.trim()) return
    await apiRequest(`/rooms/${room.id}/report`, { method: 'POST', body: { reason: reportReason } })
    setReportReason('')
  }

  if (expired) return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full space-y-4 text-center">
        <Badge variant="warning">Room expired</Badge>
        <h2 className="text-2xl font-semibold">Room unavailable</h2>
        <p className="text-muted">This room expired or was deleted.</p>
        <Button onClick={() => router.push('/')}>Go home</Button>
      </Card>
    </main>
  )

  const avatar = avatarSeed ? avatarFromSeed(avatarSeed) : { icon: 'USER', color: '#94a3b8' }

  const sidebarContent = (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Members</h3>
          <Badge>{members.filter(m => m.online).length} online</Badge>
        </div>
        <MemberList members={members} isCreator={isCreator} memberSessionId={memberSessionId} onMute={muteMember} onKick={kickMember} />
      </Card>
      {isCreator && (
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold">Room controls</h3>
          <Toggle label="Allow attachments" value={allowAttachments} onChange={val => toggleSetting('allowAttachments', val)} />
          <Toggle label="Allow links" value={allowLinks} onChange={val => toggleSetting('allowLinks', val)} />
          <Toggle label="Burn after read" value={!!room?.burnAfterReadEnabled} onChange={val => toggleSetting('burnAfterReadEnabled', val)} />
          <Toggle label="Self-destruct messages" value={!!room?.selfDestructModeEnabled} onChange={val => toggleSetting('selfDestructModeEnabled', val)} />
          <Toggle label="Panic button" value={!!room?.panicButtonEnabled} onChange={val => toggleSetting('panicButtonEnabled', val)} />
          <Toggle label="Screenshot warning" value={!!room?.screenshotWarningEnabled} onChange={val => toggleSetting('screenshotWarningEnabled', val)} />
          <Button variant="secondary" onClick={deleteRoom}>Delete room now</Button>
        </Card>
      )}
      {isCreator && (
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold">Timer</h3>
          <div className="flex items-center gap-3">
            <Input type="number" min={1} max={60} value={timerMinutes} onChange={e => setTimerMinutes(Number(e.target.value))} />
            <Button onClick={updateTimer}>Update</Button>
          </div>
        </Card>
      )}
      {isCreator && pendingRequests.length > 0 && (
        <Card className="space-y-2">
          <h3 className="text-lg font-semibold">Join requests</h3>
          {pendingRequests.map(r => (
            <div key={r.requestId} className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface px-3 py-3 shadow-soft">
              <div>
                <div className="text-sm font-semibold">{r.nickname}</div>
                <div className="text-xs text-muted">Awaiting approval</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => approveRequest(r.requestId)}>Approve</Button>
                <Button variant="ghost" size="sm" onClick={() => denyRequest(r.requestId)}>Deny</Button>
              </div>
            </div>
          ))}
        </Card>
      )}
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Report</h3>
        <Textarea
          className="min-h-[120px]"
          placeholder="Share concerns or abuse details"
          value={reportReason}
          onChange={e => setReportReason(e.target.value)}
        />
        <Button onClick={submitReport}>Report abuse</Button>
      </Card>
    </div>
  )

  return (
    <>
      <Modal open={joinOpen}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">Join room</h3>
              <p className="text-sm text-muted">{room?.name || 'Invite-only room'}</p>
            </div>
            <Badge>{room?.type === 'direct' ? '1-1' : 'Group'}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-surface2 px-3 py-3">
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-semibold text-white" style={{ background: avatar.color }}>
              {avatar.icon}
            </div>
            <div className="flex-1 space-y-2">
              <Input placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarSeed(randomAvatar())}>Shuffle avatar</Button>
                {room?.hasPassword && <Input placeholder="Room password" type="password" value={password} onChange={e => setPassword(e.target.value)} />}
              </div>
            </div>
          </div>
          {room?.screenshotWarningEnabled && (
            <div className="flex items-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
              <MessageCircleWarning className="h-4 w-4" />
              Screenshot safety is not guaranteed.
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">Expires in {relativeTime(room?.expiresAt, clock)}</div>
            <Button onClick={handleJoin} disabled={joinState === 'pending'}>
              {joinState === 'pending' ? 'Waiting...' : 'Join'}
            </Button>
          </div>
          {joinState === 'pending' && <div className="text-sm text-muted">Awaiting host approval if required.</div>}
          {joinError && <div className="rounded-2xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{joinError}</div>}
        </div>
      </Modal>

      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <RoomHeader
              title={room?.name || 'Ghost room'}
              subtitle={`Expires in ${relativeTime(room?.expiresAt, clock)}`}
              typeLabel={room?.type === 'direct' ? '1-1' : 'Group'}
              tags={room?.tags || []}
              allowAttachments={!!room?.allowAttachments}
              onToggleSidebar={() => setSidebarOpen(true)}
            />
            <Card variant="glass" className="space-y-3 text-sm text-muted">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>End-to-end encrypted</Badge>
                {room?.requireApproval && <Badge variant="warning">Approval required</Badge>}
                {room?.burnAfterReadEnabled && <Badge variant="accent">Burn after read</Badge>}
                {room?.selfDestructModeEnabled && <Badge variant="danger">Self-destruct</Badge>}
              </div>
              <p>
                Rooms expire within sixty minutes. Messages and attachments are hard-deleted at expiry or when the host deletes the room. Only nicknames and avatars are visible; IPs stay server-side for safety. Keep your key safe in the URL hash.
              </p>
            </Card>

            <Card className="h-[60vh] space-y-4 overflow-y-auto p-6">
              {messages.map(msg => {
                const mine = msg.senderSessionId === memberSessionId
                const parent = messages.find(m => m.id === msg.threadParentId)
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    mine={mine}
                    isCreator={isCreator}
                    parent={parent}
                    onReact={emoji => addReaction(msg.id, emoji)}
                    onReply={() => setReplyTo(msg)}
                    onEdit={() => beginEdit(msg)}
                    onDelete={() => deleteMessage(msg.id)}
                    onDownload={downloadAttachment}
                  />
                )
              })}
              <TypingIndicator names={typingNames} />
            </Card>

            <Card className="space-y-3 relative">
              {replyTo && (
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface2 px-3 py-2 text-xs text-muted">
                  <span>Replying to {replyTo.sender?.nickname || 'message'}: {replyTo.plaintext?.slice(0, 80)}</span>
                  <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Clear</Button>
                </div>
              )}
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={e => {
                      setInput(e.target.value)
                      startTyping()
                    }}
                    placeholder={allowLinks ? 'Type a message' : 'Links are disabled'}
                    disabled={!allowLinks}
                  />
                  {mentionQuery && mentionCandidates.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-border/60 bg-surface p-2 shadow-card">
                      {mentionCandidates.map(member => (
                        <button
                          key={member.id}
                          onClick={() => insertMention(member.nickname)}
                          className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-surface2 hover:text-foreground"
                        >
                          @{member.nickname}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={sendMessage}>Send</Button>
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-surface2 px-4 py-2 text-sm text-muted transition hover:text-foreground ${!allowAttachments ? 'pointer-events-none opacity-60' : ''}`}>
                    <Link2 className="h-4 w-4" /> Attach
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleAttachment(file)
                      }}
                      disabled={!allowAttachments}
                    />
                  </label>
                  {room?.panicButtonEnabled && <Button variant="danger" onClick={panic}>Panic</Button>}
                </div>
              </div>
            </Card>

            {room?.rules && (
              <Card>
                <p className="text-sm text-muted whitespace-pre-wrap">{room.rules}</p>
              </Card>
            )}
          </section>

          <aside className="hidden lg:block">{sidebarContent}</aside>
        </div>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto h-full w-full max-w-sm overflow-y-auto bg-surface p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Room details</h3>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <ArrowLeft className="h-4 w-4" /> Close
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      <Modal open={!!editMessage} onClose={() => setEditMessage(null)}>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Edit message</h3>
          <Input value={editText} onChange={e => setEditText(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={saveEdit}>Save</Button>
            <Button variant="ghost" onClick={() => setEditMessage(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
