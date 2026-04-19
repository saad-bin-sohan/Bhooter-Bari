'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { io, Socket } from 'socket.io-client'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Badge } from '../../../components/ui/Badge'
import { RoomHeader } from '../../../components/room/RoomHeader'
import { RoomSidebar } from '../../../components/room/RoomSidebar'
import { JoinModal } from '../../../components/room/JoinModal'
import { MessageComposer } from '../../../components/room/MessageComposer'
import { MessageBubble } from '../../../components/chat/MessageBubble'
import { TypingIndicator } from '../../../components/chat/TypingIndicator'
import { apiRequest } from '../../../lib/api'
import { avatarFromSeed, randomAvatar } from '../../../lib/avatar'
import { decryptFile, decryptText, encryptFile, encryptText, importRoomKey } from '../../../lib/crypto'
import { apiBase } from '../../../lib/config'
import { useToast } from '../../../lib/hooks/useToast'
import { useUiState } from '../../../lib/hooks/useUiState'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      pushToast({ title: 'File too large', message: 'Attachments are limited to 10 MB.', variant: 'warning' })
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="space-y-3 text-center">
        <p className="stripe mx-auto inline-block text-sm font-medium text-muted">
          Room unavailable
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          This room is gone.
        </h1>
        <p className="mx-auto max-w-sm text-base text-muted">
          This room has expired or been deleted. Rooms last at most 60 minutes and vanish without a trace.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button type="button" variant="primary" onClick={() => router.push('/')}>
          Back home
        </Button>
        <Link
          href="/create"
          className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Create a new room →
        </Link>
      </div>
    </div>
  )

  const avatar = avatarSeed ? avatarFromSeed(avatarSeed) : { icon: 'USER', color: '#6c7ae0' }
  void avatar

  return (
    <>
      <Modal open={joinOpen}>
        <JoinModal
          room={room}
          clock={clock}
          avatarSeed={avatarSeed}
          nickname={nickname}
          password={password}
          joinState={joinState}
          joinError={joinError}
          onNicknameChange={setNickname}
          onPasswordChange={setPassword}
          onShuffleAvatar={() => setAvatarSeed(randomAvatar())}
          onJoin={handleJoin}
        />
      </Modal>

      <Modal open={!!editMessage} onClose={() => setEditMessage(null)}>
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Edit message
          </h2>
          <Input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                saveEdit()
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="button" variant="primary" onClick={saveEdit}>
              Save changes
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditMessage(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <RoomHeader
          title={room?.name || 'Ghost room'}
          subtitle={`Expires in ${relativeTime(room?.expiresAt, clock)}`}
          typeLabel={room?.type === 'direct' ? '1-1' : 'Group'}
          tags={room?.tags || []}
          allowAttachments={!!room?.allowAttachments}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border/40 bg-surface/50 px-4 py-2">
              <Badge>End-to-end encrypted</Badge>
              {room?.requireApproval && (
                <Badge variant="warning">Approval required</Badge>
              )}
              {room?.burnAfterReadEnabled && (
                <Badge variant="accent">Burn after read</Badge>
              )}
              {room?.selfDestructModeEnabled && (
                <Badge variant="danger">Self-destruct</Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mx-auto max-w-2xl space-y-1.5">
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
                <div ref={messagesEndRef} />
              </div>
            </div>

            {room?.rules && (
              <div className="flex-shrink-0 border-t border-border/40 bg-surface/50 px-4 py-2">
                <p className="cipher whitespace-pre-wrap text-xs text-muted/80">
                  {room.rules}
                </p>
              </div>
            )}

            <MessageComposer
              input={input}
              replyTo={replyTo}
              mentionCandidates={mentionCandidates}
              mentionQuery={mentionQuery}
              allowLinks={allowLinks}
              allowAttachments={allowAttachments}
              panicButtonEnabled={!!room?.panicButtonEnabled}
              onInputChange={setInput}
              onClearReply={() => setReplyTo(null)}
              onInsertMention={insertMention}
              onSend={sendMessage}
              onStartTyping={startTyping}
              onAttach={handleAttachment}
              onPanic={panic}
            />
          </main>

          <aside className="hidden w-72 flex-shrink-0 border-l border-border/50 lg:flex lg:flex-col">
            <RoomSidebar
              members={members}
              isCreator={isCreator}
              memberSessionId={memberSessionId}
              allowAttachments={allowAttachments}
              allowLinks={allowLinks}
              room={room}
              timerMinutes={timerMinutes}
              pendingRequests={pendingRequests}
              reportReason={reportReason}
              onMute={muteMember}
              onKick={kickMember}
              onToggleSetting={toggleSetting}
              onUpdateTimer={updateTimer}
              onTimerChange={setTimerMinutes}
              onDeleteRoom={deleteRoom}
              onApprove={approveRequest}
              onDeny={denyRequest}
              onReportChange={setReportReason}
              onReport={submitReport}
            />
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col border-l border-border/60 bg-surface lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border/50 px-4">
                <span className="cipher text-sm font-medium text-muted">Room details</span>
                <Button
                  type="button"
                  variant="icon"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <RoomSidebar
                  members={members}
                  isCreator={isCreator}
                  memberSessionId={memberSessionId}
                  allowAttachments={allowAttachments}
                  allowLinks={allowLinks}
                  room={room}
                  timerMinutes={timerMinutes}
                  pendingRequests={pendingRequests}
                  reportReason={reportReason}
                  onMute={muteMember}
                  onKick={kickMember}
                  onToggleSetting={toggleSetting}
                  onUpdateTimer={updateTimer}
                  onTimerChange={setTimerMinutes}
                  onDeleteRoom={deleteRoom}
                  onApprove={approveRequest}
                  onDeny={denyRequest}
                  onReportChange={setReportReason}
                  onReport={submitReport}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
