import { NextResponse } from 'next/server';
import { explainFormula } from '@/lib/groq';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    formula?: string;
    subject?: string;
  };

  const name = body.name?.trim();
  const formula = body.formula?.trim();
  const subject = body.subject?.trim();

  if (!name || !formula || !subject) {
    return NextResponse.json(
      { error: 'name, formula, and subject are required.' },
      { status: 400 }
    );
  }

  const explanation = await explainFormula(name, formula, subject);

  return NextResponse.json({ explanation });
}
