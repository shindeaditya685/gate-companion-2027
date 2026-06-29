import { NextRequest, NextResponse } from 'next/server'
import { draftCheatSheetItem } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { topic, subject, difficulty } = await req.json()

    if (!topic || !subject) {
      return NextResponse.json({ error: 'topic and subject required' }, { status: 400 })
    }

    const item = await draftCheatSheetItem({ topic, subject, difficulty: difficulty || 'frequent' })
    return NextResponse.json({ item })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'AI draft unavailable' }, { status: 500 })
  }
}
