import { randomUUID, scryptSync, timingSafeEqual, createHmac } from 'crypto'

const SECRET = process.env.TOKEN_SECRET || 'default-secret'

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

export function createToken(userId: string, name: string, email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    userId, name, email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  })).toString('base64url')
  const signature = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

export function verifyToken(token: string): { userId: string; name: string; email: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, payload, signature] = parts
    const expected = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url')
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return { userId: data.userId, name: data.name, email: data.email }
  } catch {
    return null
  }
}
