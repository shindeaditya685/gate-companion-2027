import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { testId, subject, questions, answers, score, timeTaken, completedAt } = body;

    if (!testId || !questions) {
      return NextResponse.json({ error: 'testId and questions required' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const mockEntry = {
      id: testId,
      date: completedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      completedAt: completedAt || new Date().toISOString(),
      name: subject ? `${subject} Mock` : 'Full-Length Mock',
      score: score?.total ? Math.round((score.correct / score.total) * 100) : 0,
      type: (subject ? 'subject' : 'full') as 'subject' | 'full',
      mistakes: {
        silly: 0,
        conceptual: 0,
        time: 0,
      },
    };

    const testRecord = {
      userId: session.userId,
      testId,
      subject: subject || null,
      questions,
      answers,
      score,
      timeTaken: timeTaken || 0,
      completedAt: completedAt || new Date().toISOString(),
      createdAt: new Date(),
    };

    const COLLECTION = 'prep-states';
    await conn.db.collection(COLLECTION).updateOne(
      { userId: session.userId },
      { $push: { mocks: mockEntry } as any, $set: { updatedAt: new Date() } },
      { upsert: true },
    );

    await conn.db.collection('mock-tests').insertOne(testRecord);

    return NextResponse.json({ success: true, mockEntry });
  } catch {
    return NextResponse.json({ error: 'Failed to save mock' }, { status: 500 });
  }
}
