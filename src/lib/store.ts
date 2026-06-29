'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Subject, SubjectStatus, SpacedRepetitionItem, MockEntry,
  BurnoutCheckIn, PYQAttempt, PrepState, CheatSheetItem, StudySession,
} from './types';
import { SEED_SUBJECTS, PHASES, SEED_CHEAT_SHEET_V2 } from './data';

function makeDueDates(learnedDate: string) {
  const d = new Date(learnedDate);
  const addDays = (n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString();
  };
  return {
    reviewDay1: { due: addDays(1), done: false },
    reviewDay3: { due: addDays(3), done: false },
    reviewDay7: { due: addDays(7), done: false },
    reviewDay21: { due: addDays(21), done: false },
    reviewDay60: { due: addDays(60), done: false },
  };
}

function mergeCheatSheetItems(existingItems: CheatSheetItem[] = []): CheatSheetItem[] {
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  const seedIds = new Set(SEED_CHEAT_SHEET_V2.map((item) => item.id));

  const upgradedSeeds = SEED_CHEAT_SHEET_V2.map((seedItem) => {
    const existing = existingById.get(seedItem.id);
    if (!existing) return seedItem;

    return {
      ...seedItem,
      mastered: existing.mastered ?? seedItem.mastered,
      notes: existing.notes ?? seedItem.notes,
      aiExplanation: existing.aiExplanation ?? seedItem.aiExplanation,
      isUserAdded: existing.isUserAdded ?? seedItem.isUserAdded,
    };
  });

  const userItems = existingItems.filter((item) => item.isUserAdded || !seedIds.has(item.id));

  return [...upgradedSeeds, ...userItems];
}

const INITIAL_STATE = {
  startDate: '2026-07-01',
  gateDate: '2027-02-06',
  subjects: SEED_SUBJECTS,
  srItems: [] as SpacedRepetitionItem[],
  pyqAttempts: [] as PYQAttempt[],
  mocks: [] as MockEntry[],
  checkIns: [] as BurnoutCheckIn[],
  cheatSheetItems: SEED_CHEAT_SHEET_V2,
  studySessions: [] as StudySession[],
};

export const usePrepStore = create<PrepState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setSubjectStatus: (subjectId, status) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === subjectId ? { ...sub, status } : sub
          ),
        })),

      toggleTopic: (subjectId, topicId) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  mustMasterTopics: sub.mustMasterTopics.map((t) =>
                    t.id === topicId ? { ...t, completed: !t.completed } : t
                  ),
                }
              : sub
          ),
        })),

      addSRItem: (item) =>
        set((s) => ({
          srItems: [
            ...s.srItems,
            {
              ...item,
              id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              ...makeDueDates(item.learnedDate),
            },
          ],
        })),

      markSRReviewDone: (itemId, reviewKey) =>
        set((s) => ({
          srItems: s.srItems.map((it) =>
            it.id === itemId && it[reviewKey]
              ? {
                  ...it,
                  [reviewKey]: { ...it[reviewKey]!, done: true },
                }
              : it
          ),
        })),

      removeSRItem: (itemId) =>
        set((s) => ({
          srItems: s.srItems.filter((it) => it.id !== itemId),
        })),

      addMock: (mock) =>
        set((s) => ({
          mocks: [
            ...s.mocks,
            {
              ...mock,
              id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            },
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        })),

      removeMock: (id) =>
        set((s) => ({
          mocks: s.mocks.filter((m) => m.id !== id),
        })),

      addCheckIn: (ci) =>
        set((s) => ({
          checkIns: [
            ...s.checkIns,
            {
              ...ci,
              id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            },
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        })),

      removeCheckIn: (id) =>
        set((s) => ({
          checkIns: s.checkIns.filter((c) => c.id !== id),
        })),

      addPYQAttempt: (attempt) =>
        set((s) => ({
          pyqAttempts: [
            ...s.pyqAttempts,
            {
              ...attempt,
              id: `pyq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            },
          ],
        })),

      updatePYQAttempt: (id, data) =>
        set((s) => ({
          pyqAttempts: s.pyqAttempts.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        })),

      removePYQAttempt: (id) =>
        set((s) => ({
          pyqAttempts: s.pyqAttempts.filter((a) => a.id !== id),
        })),

      toggleCheatSheetMastered: (id) =>
        set((s) => ({
          cheatSheetItems: s.cheatSheetItems.map((item) =>
            item.id === id ? { ...item, mastered: !item.mastered } : item
          ),
        })),

      updateCheatSheetNotes: (id, notes) =>
        set((s) => ({
          cheatSheetItems: s.cheatSheetItems.map((item) =>
            item.id === id ? { ...item, notes } : item
          ),
        })),

      updateCheatSheetAIExplanation: (id, aiExplanation) =>
        set((s) => ({
          cheatSheetItems: s.cheatSheetItems.map((item) =>
            item.id === id ? { ...item, aiExplanation } : item
          ),
        })),

      addCheatSheetItem: (item) =>
        set((s) => ({
          cheatSheetItems: [
            ...s.cheatSheetItems,
            {
              ...item,
              id: `cs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              isUserAdded: true,
              mastered: false,
            },
          ],
        })),

      removeCheatSheetItem: (id) =>
        set((s) => ({
          cheatSheetItems: s.cheatSheetItems.filter((item) => item.id !== id),
        })),

      updateCheatSheetItem: (id, data) =>
        set((s) => ({
          cheatSheetItems: s.cheatSheetItems.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        })),

      addStudySession: (session) =>
        set((s) => ({
          studySessions: [
            ...s.studySessions,
            {
              ...session,
              id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            },
          ],
        })),

      removeStudySession: (id) =>
        set((s) => ({
          studySessions: s.studySessions.filter((ss) => ss.id !== id),
        })),

      resetAll: () => set({ ...INITIAL_STATE, subjects: SEED_SUBJECTS, cheatSheetItems: SEED_CHEAT_SHEET_V2 }),

      loadFromMongo: (data) =>
        set({
          startDate: data.startDate,
          gateDate: data.gateDate,
          subjects: data.subjects,
          srItems: data.srItems,
          pyqAttempts: data.pyqAttempts,
          mocks: data.mocks,
          checkIns: data.checkIns,
          cheatSheetItems: mergeCheatSheetItems(data.cheatSheetItems ?? []),
          studySessions: data.studySessions ?? [],
        }),
    }),
    {
      name: 'gate-prep-store-v1',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<PrepState>;
        return {
          ...state,
          cheatSheetItems: mergeCheatSheetItems(state.cheatSheetItems ?? []),
        };
      },
    }
  )
);

export function subjectCompletion(subject: Subject): number {
  if (subject.mustMasterTopics.length === 0) return 0;
  const done = subject.mustMasterTopics.filter((t) => t.completed).length;
  return Math.round((done / subject.mustMasterTopics.length) * 100);
}

export function overallCompletion(subjects: Subject[]): number {
  if (subjects.length === 0) return 0;
  const total = subjects.reduce((sum, s) => sum + s.mustMasterTopics.length, 0);
  const done = subjects.reduce(
    (sum, s) => sum + s.mustMasterTopics.filter((t) => t.completed).length,
    0
  );
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function dueSRCount(items: SpacedRepetitionItem[]): number {
  const now = new Date();
  return items.filter((it) =>
    Object.entries(it).some(([k, v]) => {
      if (!k.startsWith('reviewDay')) return false;
      const r = v as { due: string; done: boolean } | undefined;
      if (!r || r.done) return false;
      return new Date(r.due) <= now;
    })
  ).length;
}

export function getCurrentPhase(startDate: string, gateDate: string): number {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (today < startDate) return 1;
  if (today > gateDate) return 4;

  for (const phase of PHASES) {
    if (today >= phase.from && today <= phase.to) return phase.id;
  }
  return 4;
}

export function recentMockAverage(mocks: MockEntry[], n = 5): number | null {
  if (mocks.length === 0) return null;
  const recent = mocks.slice(-n);
  return Math.round(recent.reduce((s, m) => s + m.score, 0) / recent.length);
}

export function cheatSheetProgress(items: CheatSheetItem[]): { total: number; mastered: number; pct: number } {
  const total = items.length;
  const mastered = items.filter((i) => i.mastered).length;
  return { total, mastered, pct: total > 0 ? Math.round((mastered / total) * 100) : 0 };
}

export function todayStudyMinutes(sessions: StudySession[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function weekStudyMinutes(sessions: StudySession[]): number {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();
  return sessions
    .filter((s) => s.date >= weekAgoStr)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}
