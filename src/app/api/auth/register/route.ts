import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const conn = await connectToDatabase()
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await conn.db.collection('users').findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const result = await conn.db.collection('users').insertOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      createdAt: new Date(),
    })

    const token = createSession(result.insertedId.toString(), name.trim(), normalizedEmail)

    return NextResponse.json({
      token,
      user: { id: result.insertedId.toString(), name: name.trim(), email: normalizedEmail },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Registration failed' }, { status: 500 })
  }
}
