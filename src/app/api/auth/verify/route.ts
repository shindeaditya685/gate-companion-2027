import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })

  const user = verifyToken(token)
  if (!user) return NextResponse.json({ valid: false })

  return NextResponse.json({ valid: true, user })
}

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ valid: false })

  const user = verifyToken(token)
  if (!user) return NextResponse.json({ valid: false })

  return NextResponse.json({ valid: true, user })
}
