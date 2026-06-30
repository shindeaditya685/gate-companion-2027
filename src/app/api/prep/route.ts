import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

const COLLECTION = 'prep-states';

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = verifyToken(token)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conn = await connectToDatabase();
    if (!conn) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const doc = await conn.db.collection(COLLECTION).findOne({ userId: session.userId });
    if (!doc) return NextResponse.json({ data: null });

    return NextResponse.json({
      data: {
        startDate: doc.startDate,
        gateDate: doc.gateDate,
        subjects: doc.subjects,
        srItems: doc.srItems ?? [],
        pyqAttempts: doc.pyqAttempts ?? [],
        mocks: doc.mocks ?? [],
        checkIns: doc.checkIns ?? [],
        cheatSheetItems: doc.cheatSheetItems ?? [],
        studySessions: doc.studySessions ?? [],
        todoItems: doc.todoItems ?? [],
        timerRunning: doc.timerRunning ?? false,
        timerStartTime: doc.timerStartTime ?? 0,
        timerElapsed: doc.timerElapsed ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getToken(req)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = verifyToken(token)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conn = await connectToDatabase();
    if (!conn) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const body = await req.json();
    const { startDate, gateDate, subjects, srItems, pyqAttempts, mocks, checkIns, cheatSheetItems, studySessions, todoItems, timerRunning, timerStartTime, timerElapsed } = body;

    const payload = {
      userId: session.userId,
      startDate, gateDate,
      subjects,
      srItems: srItems ?? [],
      pyqAttempts: pyqAttempts ?? [],
      mocks: mocks ?? [],
      checkIns: checkIns ?? [],
      cheatSheetItems: cheatSheetItems ?? [],
      studySessions: studySessions ?? [],
      todoItems: todoItems ?? [],
      timerRunning: timerRunning ?? false,
      timerStartTime: timerStartTime ?? 0,
      timerElapsed: timerElapsed ?? 0,
      updatedAt: new Date(),
    };

    await conn.db.collection(COLLECTION).updateOne(
      { userId: session.userId },
      { $set: payload },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
