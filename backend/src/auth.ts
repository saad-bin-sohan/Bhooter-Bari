import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { config } from './config'

type MemberTokenPayload = {
  roomId: string
  memberSessionId: string
  isCreator: boolean
}

type AdminTokenPayload = {
  role: string
}

export const signMemberToken = (payload: MemberTokenPayload) => {
  return jwt.sign(payload, config.memberTokenSecret, { expiresIn: '2h' })
}

export const verifyMemberToken = (token: string) => {
  try {
    return jwt.verify(token, config.memberTokenSecret) as MemberTokenPayload
  } catch (e) {
    return null
  }
}

export const signAdminToken = () => jwt.sign({ role: 'admin' }, config.adminSecret, { expiresIn: '12h' })

export const verifyAdminToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, config.adminSecret) as AdminTokenPayload
    if (decoded.role !== 'admin') return null
    return decoded
  } catch (e) {
    return null
  }
}

export const safeCompare = (a: string, b: string) => {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}
