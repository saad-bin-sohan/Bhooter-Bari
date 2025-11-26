import express, { Request, Response, NextFunction } from 'express'
import http from 'http'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import { Server, Socket } from 'socket.io'
import { config } from './config'
import { prisma } from './prisma'
import { generateSlug, todayKey, randomId } from './utils'
import { signMemberToken, verifyMemberToken, signAdminToken, verifyAdminToken, safeCompare } from './auth'
import { RoomType, MessageType } from '@prisma/client'

type PendingJoin = {
  id: string
  roomId: string
  nickname: string
  avatarSeed: string
  ip: string
  isCreator: boolean
  requestedAt: Date
}

type ActiveSession = {
  memberSessionId: string
  roomId: string
  nickname: string
  avatarSeed: string
  isCreator: boolean
  socketIds: Set<string>
}

type MemberAuthRequest = Request & { member?: ActiveSession }

type AdminAuthRequest = Request & { admin?: boolean }

const app = express()
app.set('trust proxy', 1)
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const roomCreationLog = new Map<string, number[]>()
const pendingJoins = new Map<string, Map<string, PendingJoin>>()
const pendingSockets = new Map<string, Socket>()
const activeSessions = new Map<string, Map<string, ActiveSession>>()

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: config.corsOrigin === '*' ? true : config.corsOrigin, credentials: true } })
const roomsNamespace = io.of('/rooms')

const getIp = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded)) return forwarded[0]
  return req.ip
}

const ensureRoomActive = async (roomId: string) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) return null
  if (room.deletedAt) return null
  if (room.expiresAt.getTime() <= Date.now()) return null
  return room
}

const ensureRoomActiveBySlug = async (slug: string) => {
  const room = await prisma.room.findUnique({ where: { slug } })
  if (!room) return null
  if (room.deletedAt) return null
  if (room.expiresAt.getTime() <= Date.now()) return null
  return room
}

const requireMember = async (req: MemberAuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'unauthorized' })
  const token = auth.replace('Bearer ', '')
  const decoded = verifyMemberToken(token)
  if (!decoded) return res.status(401).json({ error: 'unauthorized' })
  const room = await ensureRoomActive(decoded.roomId)
  if (!room) return res.status(410).json({ error: 'room_expired' })
  const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
  if (!session || session.isKicked) return res.status(403).json({ error: 'forbidden' })
  req.member = {
    memberSessionId: session.id,
    roomId: session.roomId,
    nickname: session.nickname,
    avatarSeed: session.avatarSeed,
    isCreator: session.isCreator,
    socketIds: new Set()
  }
  next()
}

const requireAdmin = (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies['admin_token'] || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null)
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  const decoded = verifyAdminToken(token)
  if (!decoded) return res.status(401).json({ error: 'unauthorized' })
  req.admin = true
  next()
}

const touchAnalytics = async () => {
  const today = todayKey()
  await prisma.analyticsDaily.upsert({
    where: { date: today },
    create: { date: today },
    update: {}
  })
}

const incrementRoomsCreated = async () => {
  const today = todayKey()
  await prisma.analyticsDaily.upsert({
    where: { date: today },
    create: { date: today, roomsCreated: 1 },
    update: { roomsCreated: { increment: 1 } }
  })
}

const incrementMessagesSent = async () => {
  const today = todayKey()
  await prisma.analyticsDaily.upsert({
    where: { date: today },
    create: { date: today, messagesSent: 1 },
    update: { messagesSent: { increment: 1 } }
  })
}

const incrementAbuseReports = async () => {
  const today = todayKey()
  await prisma.analyticsDaily.upsert({
    where: { date: today },
    create: { date: today, abuseReportsCount: 1 },
    update: { abuseReportsCount: { increment: 1 } }
  })
}

touchAnalytics()

app.post('/rooms', async (req, res) => {
  const ip = getIp(req)
  const now = Date.now()
  const history = roomCreationLog.get(ip) || []
  const recent = history.filter(t => now - t < 60 * 60 * 1000)
  if (recent.length >= config.roomCreationLimit) return res.status(429).json({ error: 'rate_limited' })
  const {
    type,
    name,
    durationMinutes,
    password,
    allowAttachments = true,
    allowLinks = true,
    requireApproval = false,
    selfDestructModeEnabled = false,
    burnAfterReadEnabled = false,
    panicButtonEnabled = false,
    screenshotWarningEnabled = false,
    tags = [],
    rules
  } = req.body
  if (type !== 'direct' && type !== 'group') return res.status(400).json({ error: 'invalid_type' })
  const duration = Number(durationMinutes)
  if (!Number.isInteger(duration) || duration < 1 || duration > 60) return res.status(400).json({ error: 'invalid_duration' })
  const expiresAt = new Date(Date.now() + duration * 60 * 1000)
  let slug = generateSlug()
  let attempts = 0
  while (await prisma.room.findUnique({ where: { slug } })) {
    slug = generateSlug()
    attempts += 1
    if (attempts > 5) break
  }
  const creatorSecretRaw = randomId(12)
  const creatorSecret = await bcrypt.hash(creatorSecretRaw, 10)
  const passwordHash = password ? await bcrypt.hash(password, 10) : null
  const room = await prisma.room.create({
    data: {
      slug,
      type: type === 'direct' ? RoomType.direct : RoomType.group,
      name: name || null,
      expiresAt,
      passwordHash,
      allowAttachments,
      allowLinks,
      requireApproval,
      selfDestructModeEnabled,
      burnAfterReadEnabled,
      panicButtonEnabled,
      screenshotWarningEnabled,
      tags,
      creatorIp: ip,
      creatorSecret,
      rules: rules || null
    }
  })
  roomCreationLog.set(ip, [...recent, now])
  await incrementRoomsCreated()
  res.json({
    id: room.id,
    slug: room.slug,
    name: room.name,
    type: room.type,
    expiresAt: room.expiresAt,
    allowAttachments: room.allowAttachments,
    allowLinks: room.allowLinks,
    requireApproval: room.requireApproval,
    screenshotWarningEnabled: room.screenshotWarningEnabled,
    selfDestructModeEnabled: room.selfDestructModeEnabled,
    burnAfterReadEnabled: room.burnAfterReadEnabled,
    panicButtonEnabled: room.panicButtonEnabled,
    tags: room.tags,
    rules: room.rules,
    creatorSecret: creatorSecretRaw
  })
})

app.get('/rooms/:slug', async (req, res) => {
  const room = await ensureRoomActiveBySlug(req.params.slug)
  if (!room) return res.status(404).json({ error: 'not_found' })
  res.json({
    id: room.id,
    slug: room.slug,
    name: room.name,
    type: room.type,
    expiresAt: room.expiresAt,
    rules: room.rules,
    allowAttachments: room.allowAttachments,
    allowLinks: room.allowLinks,
    requireApproval: room.requireApproval,
    screenshotWarningEnabled: room.screenshotWarningEnabled,
    selfDestructModeEnabled: room.selfDestructModeEnabled,
    burnAfterReadEnabled: room.burnAfterReadEnabled,
    panicButtonEnabled: room.panicButtonEnabled,
    tags: room.tags,
    hasPassword: !!room.passwordHash
  })
})

app.post('/rooms/:id/join', async (req, res) => {
  const { nickname, avatarSeed, password, creatorSecret } = req.body
  const ip = getIp(req)
  const room = await ensureRoomActive(req.params.id)
  if (!room) return res.status(410).json({ error: 'room_expired' })
  const kicked = await prisma.kickedIp.findFirst({ where: { roomId: room.id, ipAddress: ip } })
  if (kicked) return res.status(403).json({ error: 'kicked' })
  if (!nickname || !avatarSeed) return res.status(400).json({ error: 'missing_fields' })
  if (room.passwordHash) {
    const ok = password && (await bcrypt.compare(password, room.passwordHash))
    if (!ok) return res.status(401).json({ error: 'invalid_password' })
  }
  const isCreator = creatorSecret ? await bcrypt.compare(creatorSecret, room.creatorSecret) : false
  if (room.requireApproval) {
    const requestId = randomId(12)
    const pending: PendingJoin = {
      id: requestId,
      roomId: room.id,
      nickname,
      avatarSeed,
      ip,
      isCreator,
      requestedAt: new Date()
    }
    if (!pendingJoins.has(room.id)) pendingJoins.set(room.id, new Map())
    pendingJoins.get(room.id)!.set(requestId, pending)
    const roomActive = activeSessions.get(room.id)
    if (roomActive) {
      roomActive.forEach(session => {
        if (session.isCreator) {
          session.socketIds.forEach(socketId => {
            roomsNamespace.to(socketId).emit('pending_join_request', { requestId, nickname, avatarSeed, requestedAt: pending.requestedAt })
          })
        }
      })
    }
    return res.json({ status: 'pending', requestId })
  }
  const memberSession = await prisma.memberSession.create({
    data: {
      roomId: room.id,
      nickname,
      avatarSeed,
      ipAddress: ip,
      isCreator
    }
  })
  const memberToken = signMemberToken({ roomId: room.id, memberSessionId: memberSession.id, isCreator })
  res.json({ status: 'joined', memberToken, roomId: room.id, memberSessionId: memberSession.id, isCreator })
})

app.post('/rooms/:id/join-requests/:requestId/approve', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member?.isCreator) return res.status(403).json({ error: 'forbidden' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const pendingRoom = pendingJoins.get(req.params.id)
  if (!pendingRoom) return res.status(404).json({ error: 'not_found' })
  const pending = pendingRoom.get(req.params.requestId)
  if (!pending) return res.status(404).json({ error: 'not_found' })
  const memberSession = await prisma.memberSession.create({
    data: {
      roomId: pending.roomId,
      nickname: pending.nickname,
      avatarSeed: pending.avatarSeed,
      ipAddress: pending.ip,
      isCreator: pending.isCreator
    }
  })
  pendingRoom.delete(req.params.requestId)
  const memberToken = signMemberToken({ roomId: pending.roomId, memberSessionId: memberSession.id, isCreator: pending.isCreator })
  const pendingSocket = pendingSockets.get(pending.id)
  if (pendingSocket) {
    pendingSocket.emit('join_request_approved', { memberToken, roomId: pending.roomId, memberSessionId: memberSession.id, isCreator: pending.isCreator })
    pendingSockets.delete(pending.id)
  }
  res.json({ memberSessionId: memberSession.id })
})

app.post('/rooms/:id/join-requests/:requestId/deny', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member?.isCreator) return res.status(403).json({ error: 'forbidden' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const pendingRoom = pendingJoins.get(req.params.id)
  if (!pendingRoom) return res.status(404).json({ error: 'not_found' })
  const pending = pendingRoom.get(req.params.requestId)
  if (!pending) return res.status(404).json({ error: 'not_found' })
  pendingRoom.delete(req.params.requestId)
  const pendingSocket = pendingSockets.get(pending.id)
  if (pendingSocket) {
    pendingSocket.emit('join_request_denied', {})
    pendingSockets.delete(pending.id)
  }
  res.json({ status: 'denied' })
})

app.get('/rooms/:id/messages', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member) return res.status(401).json({ error: 'unauthorized' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const messages = await prisma.message.findMany({
    where: { roomId: req.params.id },
    include: { senderSession: true, attachments: true, reactions: true },
    orderBy: { createdAt: 'asc' }
  })
  res.json(messages.map(m => ({
    id: m.id,
    roomId: m.roomId,
    senderSessionId: m.senderSessionId,
    sender: m.senderSession ? { nickname: m.senderSession.nickname, avatarSeed: m.senderSession.avatarSeed, isCreator: m.senderSession.isCreator, id: m.senderSession.id } : null,
    ciphertext: m.ciphertext,
    iv: m.iv,
    type: m.type,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    isDeleted: m.isDeleted,
    threadParentId: m.threadParentId,
    selfDestructAt: m.selfDestructAt,
    burnAfterRead: m.burnAfterRead,
    attachments: m.attachments.map(a => ({ id: a.id, filename: a.filename, mimeType: a.mimeType, sizeBytes: a.sizeBytes, iv: a.iv })),
    reactions: m.reactions.map(r => ({ id: r.id, emoji: r.emoji, memberSessionId: r.memberSessionId }))
  })))
})

app.get('/rooms/:id/members', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member) return res.status(401).json({ error: 'unauthorized' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const list = await prisma.memberSession.findMany({ where: { roomId: req.params.id, isKicked: false }, orderBy: { joinedAt: 'asc' } })
  const onlineMap = activeSessions.get(req.params.id)
  res.json(list.map(m => ({ id: m.id, nickname: m.nickname, avatarSeed: m.avatarSeed, isCreator: m.isCreator, isMuted: m.isMuted, online: onlineMap ? onlineMap.has(m.id) : false })))
})

app.post('/rooms/:id/report', async (req, res) => {
  const room = await ensureRoomActive(req.params.id)
  if (!room) return res.status(410).json({ error: 'room_expired' })
  const { reason, targetMemberSessionId } = req.body
  const ip = getIp(req)
  if (!reason) return res.status(400).json({ error: 'missing_reason' })
  await prisma.abuseReport.create({ data: { roomId: room.id, reporterIp: ip, targetMemberSessionId: targetMemberSessionId || null, reason } })
  await incrementAbuseReports()
  res.json({ status: 'ok' })
})

app.post('/rooms/:id/timer', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member?.isCreator) return res.status(403).json({ error: 'forbidden' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const { newDurationMinutesRemaining } = req.body
  const room = await ensureRoomActive(req.params.id)
  if (!room) return res.status(410).json({ error: 'room_expired' })
  const minutes = Number(newDurationMinutesRemaining)
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) return res.status(400).json({ error: 'invalid_duration' })
  const maxExpiry = new Date(room.createdAt.getTime() + 60 * 60 * 1000)
  let newExpiry = new Date(Date.now() + minutes * 60 * 1000)
  if (newExpiry > maxExpiry) newExpiry = maxExpiry
  await prisma.room.update({ where: { id: room.id }, data: { expiresAt: newExpiry } })
  roomsNamespace.to(room.id).emit('room_timer_updated', { roomId: room.id, expiresAt: newExpiry })
  res.json({ expiresAt: newExpiry })
})

app.post('/rooms/:id/delete', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member?.isCreator) return res.status(403).json({ error: 'forbidden' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const room = await prisma.room.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  roomsNamespace.to(room.id).emit('room_deleted', { roomId: room.id })
  res.json({ status: 'deleted' })
})

app.post('/rooms/:id/settings', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member?.isCreator) return res.status(403).json({ error: 'forbidden' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const allowedKeys = ['allowAttachments','allowLinks','selfDestructModeEnabled','burnAfterReadEnabled','panicButtonEnabled','screenshotWarningEnabled','rules','tags'] as const
  const data: any = {}
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) data[key] = req.body[key]
  }
  const room = await prisma.room.update({ where: { id: req.params.id }, data })
  roomsNamespace.to(room.id).emit('room_settings_updated', data)
  res.json({ room })
})

app.post('/rooms/:id/attachments', requireMember, upload.single('file'), async (req: MemberAuthRequest, res) => {
  if (!req.member) return res.status(401).json({ error: 'unauthorized' })
  const room = await ensureRoomActive(req.params.id)
  if (!room) return res.status(410).json({ error: 'room_expired' })
  if (room.id !== req.member.roomId) return res.status(403).json({ error: 'forbidden' })
  if (!room.allowAttachments) return res.status(403).json({ error: 'attachments_disabled' })
  const file = req.file
  if (!file) return res.status(400).json({ error: 'missing_file' })
  const { iv, messageCiphertext, messageIv, threadParentId, burnAfterRead, selfDestructSeconds } = req.body
  if (!iv || !messageCiphertext || !messageIv) return res.status(400).json({ error: 'missing_fields' })
  const now = new Date()
  const selfDestructAt = selfDestructSeconds ? new Date(now.getTime() + Number(selfDestructSeconds) * 1000) : null
  const burnTargetIds = activeSessions.get(room.id)?.keys() ? Array.from(activeSessions.get(room.id)!.keys()) : []
  const message = await prisma.message.create({
    data: {
      roomId: room.id,
      senderSessionId: req.member.memberSessionId,
      ciphertext: messageCiphertext,
      iv: messageIv,
      type: MessageType.attachment,
      threadParentId: threadParentId || null,
      selfDestructAt,
      burnAfterRead: !!burnAfterRead,
      burnReadTargetSessionIds: burnTargetIds
    }
  })
  const attachment = await prisma.attachment.create({
    data: {
      roomId: room.id,
      messageId: message.id,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      iv,
      ciphertext: file.buffer
    }
  })
  await incrementMessagesSent()
  roomsNamespace.to(room.id).emit('message_created', {
    id: message.id,
    roomId: room.id,
    senderSessionId: req.member.memberSessionId,
    sender: { id: req.member.memberSessionId, nickname: req.member.nickname, avatarSeed: req.member.avatarSeed, isCreator: req.member.isCreator },
    ciphertext: message.ciphertext,
    iv: message.iv,
    type: message.type,
    createdAt: message.createdAt,
    threadParentId: message.threadParentId,
    selfDestructAt: message.selfDestructAt,
    burnAfterRead: message.burnAfterRead,
    attachments: [{ id: attachment.id, filename: attachment.filename, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes, iv: attachment.iv }]
  })
  res.json({ id: message.id })
})

app.get('/rooms/:id/attachments/:attachmentId', requireMember, async (req: MemberAuthRequest, res) => {
  if (!req.member) return res.status(401).json({ error: 'unauthorized' })
  if (req.member.roomId !== req.params.id) return res.status(403).json({ error: 'forbidden' })
  const attachment = await prisma.attachment.findUnique({ where: { id: req.params.attachmentId } })
  if (!attachment || attachment.roomId !== req.params.id) return res.status(404).json({ error: 'not_found' })
  res.json({
    id: attachment.id,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    iv: attachment.iv,
    ciphertext: attachment.ciphertext.toString('base64')
  })
})

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body
  if (!safeCompare(username || '', config.adminUsername) || !safeCompare(password || '', config.adminPassword)) return res.status(401).json({ error: 'invalid_credentials' })
  const token = signAdminToken()
  res.cookie('admin_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  res.json({ token })
})

app.post('/admin/logout', requireAdmin, (req, res) => {
  res.clearCookie('admin_token')
  res.json({ status: 'ok' })
})

app.get('/admin/metrics', requireAdmin, async (req, res) => {
  const today = todayKey()
  const todayMetrics = await prisma.analyticsDaily.findUnique({ where: { date: today } })
  const lastWeek = await prisma.analyticsDaily.findMany({ orderBy: { date: 'desc' }, take: 7 })
  const totals = await prisma.analyticsDaily.aggregate({ _sum: { messagesSent: true, roomsCreated: true, totalRoomLifetimeSeconds: true, abuseReportsCount: true } })
  const averageLifetime = totals._sum.roomsCreated && totals._sum.roomsCreated > 0 && totals._sum.totalRoomLifetimeSeconds ? Number(totals._sum.totalRoomLifetimeSeconds) / totals._sum.roomsCreated : 0
  res.json({
    today: {
      roomsCreated: todayMetrics?.roomsCreated || 0,
      messagesSent: todayMetrics?.messagesSent || 0,
      abuseReportsCount: todayMetrics?.abuseReportsCount || 0
    },
    totals: {
      roomsCreated: totals._sum.roomsCreated || 0,
      messagesSent: totals._sum.messagesSent || 0,
      abuseReportsCount: totals._sum.abuseReportsCount || 0,
      averageRoomLifetimeSeconds: averageLifetime
    },
    history: lastWeek.reverse()
  })
})

const recordDisconnect = async (roomId: string, memberSessionId: string) => {
  await prisma.memberSession.update({ where: { id: memberSessionId }, data: { leftAt: new Date() } })
}

roomsNamespace.on('connection', socket => {
  socket.on('await_approval', ({ roomId, requestId }) => {
    const pendingRoom = pendingJoins.get(roomId)
    if (!pendingRoom) return
    const pending = pendingRoom.get(requestId)
    if (!pending) return
    pendingSockets.set(requestId, socket)
  })

  socket.on('join_room', async ({ memberToken }) => {
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) {
      socket.emit('error', 'unauthorized')
      return
    }
    const room = await ensureRoomActive(decoded.roomId)
    if (!room) {
      socket.emit('room_deleted', { roomId: decoded.roomId })
      return
    }
    const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
    if (!session || session.isKicked) {
      socket.emit('error', 'forbidden')
      return
    }
    socket.join(room.id)
    if (!activeSessions.has(room.id)) activeSessions.set(room.id, new Map())
    const roomMap = activeSessions.get(room.id)!
    let active = roomMap.get(session.id)
    if (!active) {
      active = { memberSessionId: session.id, roomId: room.id, nickname: session.nickname, avatarSeed: session.avatarSeed, isCreator: session.isCreator, socketIds: new Set() }
      roomMap.set(session.id, active)
      roomsNamespace.to(room.id).emit('member_joined', { memberSessionId: session.id, nickname: session.nickname, avatarSeed: session.avatarSeed, isCreator: session.isCreator })
    }
    active.socketIds.add(socket.id)
    socket.data.memberSessionId = session.id
    socket.data.roomId = room.id
    socket.data.isCreator = session.isCreator
    socket.emit('joined', { roomId: room.id, memberSessionId: session.id })
    if (session.isCreator) {
      const roomPending = pendingJoins.get(room.id)
      if (roomPending) {
        roomPending.forEach(pending => {
          socket.emit('pending_join_request', { requestId: pending.id, nickname: pending.nickname, avatarSeed: pending.avatarSeed, requestedAt: pending.requestedAt })
        })
      }
    }
  })

  socket.on('send_message', async payload => {
    const { memberToken, roomId, ciphertext, iv, type, threadParentId, burnAfterRead, selfDestructSeconds } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded || decoded.roomId !== roomId) return
    const room = await ensureRoomActive(roomId)
    if (!room) return
    const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
    if (!session || session.isKicked || session.isMuted) return
    const now = new Date()
    const selfDestructAt = selfDestructSeconds ? new Date(now.getTime() + Number(selfDestructSeconds) * 1000) : null
    const burnTargetIds = activeSessions.get(room.id)?.keys() ? Array.from(activeSessions.get(room.id)!.keys()) : []
    const message = await prisma.message.create({
      data: {
        roomId,
        senderSessionId: session.id,
        ciphertext,
        iv,
        type: type === 'system' ? MessageType.system : MessageType.text,
        threadParentId: threadParentId || null,
        selfDestructAt,
        burnAfterRead: !!burnAfterRead,
        burnReadTargetSessionIds: burnTargetIds
      }
    })
    await incrementMessagesSent()
    roomsNamespace.to(room.id).emit('message_created', {
      id: message.id,
      roomId: room.id,
      senderSessionId: session.id,
      sender: { id: session.id, nickname: session.nickname, avatarSeed: session.avatarSeed, isCreator: session.isCreator },
      ciphertext: message.ciphertext,
      iv: message.iv,
      type: message.type,
      createdAt: message.createdAt,
      threadParentId: message.threadParentId,
      selfDestructAt: message.selfDestructAt,
      burnAfterRead: message.burnAfterRead
    })
  })

  socket.on('edit_message', async payload => {
    const { memberToken, messageId, ciphertext, iv } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message) return
    const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
    if (!session) return
    const room = await ensureRoomActive(message.roomId)
    if (!room) return
    if (message.senderSessionId !== session.id && !session.isCreator) return
    const updated = await prisma.message.update({ where: { id: messageId }, data: { ciphertext, iv } })
    roomsNamespace.to(message.roomId).emit('message_updated', { id: updated.id, ciphertext: updated.ciphertext, iv: updated.iv })
  })

  socket.on('delete_message', async payload => {
    const { memberToken, messageId } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message) return
    const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
    if (!session) return
    const room = await ensureRoomActive(message.roomId)
    if (!room) return
    if (message.senderSessionId !== session.id && !session.isCreator) return
    await prisma.message.delete({ where: { id: messageId } })
    roomsNamespace.to(message.roomId).emit('message_deleted', { id: messageId })
  })

  socket.on('add_reaction', async payload => {
    const { memberToken, messageId, emoji } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const room = await prisma.room.findFirst({ where: { messages: { some: { id: messageId } }, id: decoded.roomId } })
    if (!room) return
    const reaction = await prisma.messageReaction.create({ data: { messageId, memberSessionId: decoded.memberSessionId, emoji } })
    roomsNamespace.to(room.id).emit('reaction_updated', { messageId, emoji, memberSessionId: decoded.memberSessionId, id: reaction.id })
  })

  socket.on('remove_reaction', async payload => {
    const { memberToken, reactionId } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const reaction = await prisma.messageReaction.findUnique({ where: { id: reactionId } })
    if (!reaction) return
    const message = await prisma.message.findUnique({ where: { id: reaction.messageId } })
    if (!message || message.roomId !== decoded.roomId) return
    await prisma.messageReaction.delete({ where: { id: reactionId } })
    roomsNamespace.to(message.roomId).emit('reaction_updated', { messageId: message.id, remove: true, id: reactionId })
  })

  socket.on('typing_start', payload => {
    const { roomId, memberToken } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded || decoded.roomId !== roomId) return
    roomsNamespace.to(roomId).emit('typing', { memberSessionId: decoded.memberSessionId, state: 'start' })
  })

  socket.on('typing_stop', payload => {
    const { roomId, memberToken } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded || decoded.roomId !== roomId) return
    roomsNamespace.to(roomId).emit('typing', { memberSessionId: decoded.memberSessionId, state: 'stop' })
  })

  socket.on('message_seen', async payload => {
    const { memberToken, messageId } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message) return
    if (message.roomId !== decoded.roomId) return
    await prisma.messageReadReceipt.upsert({
      where: { messageId_memberSessionId: { messageId, memberSessionId: decoded.memberSessionId } },
      create: { messageId, memberSessionId: decoded.memberSessionId },
      update: {}
    }).catch(async () => {
      const existing = await prisma.messageReadReceipt.findFirst({ where: { messageId, memberSessionId: decoded.memberSessionId } })
      if (!existing) await prisma.messageReadReceipt.create({ data: { messageId, memberSessionId: decoded.memberSessionId } })
    })
    if (message.burnAfterRead && message.burnReadTargetSessionIds.length > 0) {
      const receipts = await prisma.messageReadReceipt.findMany({ where: { messageId } })
      const seenIds = new Set(receipts.map(r => r.memberSessionId))
      const allSeen = message.burnReadTargetSessionIds.every(id => seenIds.has(id))
      if (allSeen) {
        await prisma.message.delete({ where: { id: messageId } })
        roomsNamespace.to(message.roomId).emit('message_deleted', { id: messageId })
      }
    }
  })

  socket.on('panic', async payload => {
    const { memberToken, roomId } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded || decoded.roomId !== roomId) return
    const room = await ensureRoomActive(roomId)
    if (!room || !room.panicButtonEnabled) return
    await prisma.message.deleteMany({ where: { roomId, senderSessionId: decoded.memberSessionId } })
    roomsNamespace.to(roomId).emit('panic_cleared_messages', { memberSessionId: decoded.memberSessionId })
  })

  socket.on('mute_member', async payload => {
    const { memberToken, targetMemberSessionId, mute } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
    if (!session || !session.isCreator) return
    const target = await prisma.memberSession.findUnique({ where: { id: targetMemberSessionId } })
    if (!target || target.roomId !== session.roomId) return
    await prisma.memberSession.update({ where: { id: target.id }, data: { isMuted: !!mute } })
    roomsNamespace.to(session.roomId).emit('member_muted', { memberSessionId: target.id, isMuted: !!mute })
  })

  socket.on('kick_member', async payload => {
    const { memberToken, targetMemberSessionId } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
    if (!session || !session.isCreator) return
    const target = await prisma.memberSession.findUnique({ where: { id: targetMemberSessionId } })
    if (!target || target.roomId !== session.roomId) return
    await prisma.kickedIp.create({ data: { roomId: session.roomId, ipAddress: target.ipAddress } })
    await prisma.memberSession.update({ where: { id: target.id }, data: { isKicked: true, leftAt: new Date() } })
    roomsNamespace.to(session.roomId).emit('member_kicked', { memberSessionId: target.id })
    const roomMap = activeSessions.get(session.roomId)
    if (roomMap) {
      const activeTarget = roomMap.get(target.id)
      if (activeTarget) {
        activeTarget.socketIds.forEach(id => roomsNamespace.sockets.get(id)?.disconnect(true))
        roomMap.delete(target.id)
      }
    }
  })

  socket.on('update_links', async payload => {
    const { memberToken, allowLinks } = payload
    const decoded = verifyMemberToken(memberToken)
    if (!decoded) return
    const session = await prisma.memberSession.findUnique({ where: { id: decoded.memberSessionId } })
    if (!session || !session.isCreator) return
    await prisma.room.update({ where: { id: session.roomId }, data: { allowLinks } })
    roomsNamespace.to(session.roomId).emit('room_settings_updated', { allowLinks })
  })

  socket.on('disconnect', async () => {
    pendingSockets.forEach((pendingSocket, id) => {
      if (pendingSocket.id === socket.id) pendingSockets.delete(id)
    })
    const { memberSessionId, roomId } = socket.data
    if (!memberSessionId || !roomId) return
    const roomMap = activeSessions.get(roomId)
    if (!roomMap) return
    const session = roomMap.get(memberSessionId)
    if (!session) return
    session.socketIds.delete(socket.id)
    if (session.socketIds.size === 0) {
      roomMap.delete(memberSessionId)
      roomsNamespace.to(roomId).emit('member_left', { memberSessionId })
      await recordDisconnect(roomId, memberSessionId)
    }
  })
})

const cleanupExpiredRooms = async () => {
  const rooms = await prisma.room.findMany({ where: { OR: [{ expiresAt: { lte: new Date() } }, { deletedAt: { not: null } }] } })
  for (const room of rooms) {
    roomsNamespace.to(room.id).emit('room_deleted', { roomId: room.id })
    const lifetimeSeconds = Math.max(0, Math.floor(((room.deletedAt || room.expiresAt || new Date()) as Date).getTime() - room.createdAt.getTime()) / 1000)
    await prisma.analyticsDaily.upsert({
      where: { date: todayKey() },
      create: { date: todayKey(), totalRoomLifetimeSeconds: BigInt(lifetimeSeconds) },
      update: { totalRoomLifetimeSeconds: { increment: BigInt(lifetimeSeconds) } }
    })
    await prisma.messageReaction.deleteMany({ where: { message: { roomId: room.id } } })
    await prisma.messageReadReceipt.deleteMany({ where: { message: { roomId: room.id } } })
    await prisma.attachment.deleteMany({ where: { roomId: room.id } })
    await prisma.message.deleteMany({ where: { roomId: room.id } })
    await prisma.memberSession.deleteMany({ where: { roomId: room.id } })
    await prisma.kickedIp.deleteMany({ where: { roomId: room.id } })
    await prisma.abuseReport.deleteMany({ where: { roomId: room.id } })
    await prisma.room.delete({ where: { id: room.id } })
    activeSessions.delete(room.id)
    const pendingRoom = pendingJoins.get(room.id)
    if (pendingRoom) {
      pendingRoom.forEach((pending, id) => {
        const socket = pendingSockets.get(id)
        if (socket) socket.disconnect(true)
        pendingSockets.delete(id)
      })
    }
    pendingJoins.delete(room.id)
  }
  const destructMessages = await prisma.message.findMany({ where: { selfDestructAt: { lte: new Date() } } })
  for (const msg of destructMessages) {
    await prisma.messageReaction.deleteMany({ where: { messageId: msg.id } })
    await prisma.attachment.deleteMany({ where: { messageId: msg.id } })
    await prisma.message.delete({ where: { id: msg.id } })
    roomsNamespace.to(msg.roomId).emit('message_deleted', { id: msg.id })
  }
}

setInterval(cleanupExpiredRooms, 60 * 1000)

const port = config.port
server.listen(port, () => {
  console.log(`Server running on ${port}`)
})
