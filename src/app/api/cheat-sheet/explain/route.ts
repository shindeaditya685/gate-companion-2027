import { NextRequest, NextResponse } from 'next/server'
import { explainFormula } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { name, formula, subject } = await req.json()

    if (!name || !formula) {
      return NextResponse.json({ error: 'name and formula required' }, { status: 400 })
    }

    const explanation = await explainFormula(name, formula, subject || '')
    return NextResponse.json({ explanation })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 })
  }
}
