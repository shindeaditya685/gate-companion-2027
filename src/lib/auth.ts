import { randomUUID, scryptSync, timingSafeEqual } from 'crypto'

const SECRET = process.env.TOKEN_SECRET || 'default-secret'

const globalForSessions = globalThis as unknown as {
  _sessions?: Map<string, { userId: string; name: string; email: string }>
}

function getSessions() {
  if (!globalForSessions._sessions) globalForSessions._sessions = new Map()
  return globalForSessions._sessions
}

export function hashPassword(password: string): string {
  const salt = randomUUID().slice(0, 16)
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const derived = scryptSync(password, salt, 64).toString('hex')
  try {
    return timingSafeEqual(Buffer.from(derived), Buffer.from(hash))
  } catch {
    return false
  }
}

export function createSession(userId: string, name: string, email: string): string {
  const token = randomUUID() + '-' + randomUUID()
  getSessions().set(token, { userId, name, email })
  return token
}

export function getSession(token: string): { userId: string; name: string; email: string } | null {
  return getSessions().get(token) ?? null
}

export function deleteSession(token: string) {
  getSessions().delete(token)
}
