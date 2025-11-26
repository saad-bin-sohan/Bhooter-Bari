import dotenv from 'dotenv'

dotenv.config()

const num = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  if (Number.isFinite(parsed)) return parsed
  return fallback
}

export const config = {
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.FRONTEND_ORIGIN || '*',
  adminUsername: process.env.ADMIN_PANEL_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PANEL_PASSWORD || 'password',
  adminSecret: process.env.ADMIN_SESSION_SECRET || 'change-me',
  memberTokenSecret: process.env.MEMBER_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET || 'change-me',
  roomCreationLimit: num(process.env.ROOM_CREATION_HOURLY_LIMIT, 3)
}
