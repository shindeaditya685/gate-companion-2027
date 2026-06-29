import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) return NextResponse.json({ valid: false })

  const session = getSession(token)
  if (!session) return NextResponse.json({ valid: false })

  return NextResponse.json({ valid: true, user: session })
}

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ valid: false })

  const session = getSession(token)
  if (!session) return NextResponse.json({ valid: false })

  return NextResponse.json({ valid: true, user: session })
}
