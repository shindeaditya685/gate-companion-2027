import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = verifyToken(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const full = searchParams.get('full') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const conn = await connectToDatabase();
    if (!conn) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const prep = await conn.db.collection('prep-states').findOne(
      { userId: session.userId },
      { projection: { mocks: 1 } },
    );

    const summaries = (prep?.mocks || []).sort(
      (a: any, b: any) =>
        new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime()
    ).slice(0, limit);

    if (!full) {
      return NextResponse.json({ mocks: summaries });
    }

    const testIds = summaries.map((m: any) => m.id);
    const fullRecords = await conn.db.collection('mock-tests').find(
      { userId: session.userId, testId: { $in: testIds } },
      { sort: { completedAt: -1 }, limit },
    ).toArray();

    const fullMap = new Map(fullRecords.map((r: any) => [r.testId, r]));

    return NextResponse.json({
      mocks: summaries.map((s: any) => ({
        ...s,
        fullRecord: fullMap.get(s.id) || null,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
