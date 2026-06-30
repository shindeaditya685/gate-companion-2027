export type Priority = 'P0' | 'P1' | 'P2';
export type SubjectStatus = 'weak' | 'moderate' | 'solid';
export type Phase = 1 | 2 | 3 | 4;
export type MistakeCategory = 'silly' | 'conceptual' | 'time';
export type BurnoutLevel = 'green' | 'yellow' | 'orange' | 'red';
export type CheatSheetDifficulty = 'must-know' | 'frequent' | 'tricky';

export interface SubjectTopic {
  id: string;
  name: string;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  priority: Priority;
  status: SubjectStatus;
  weightage: string;
  targetMarks: string;
  resource: string;
  mustMasterTopics: SubjectTopic[];
  color: string;
}

export interface PhaseInfo {
  id: Phase;
  name: string;
  window: string;
  from: string;
  to: string;
  goal: string;
  weeklyHours: number;
  milestones: string[];
}

export interface SpacedRepetitionItem {
  id: string;
  subjectId: string;
  chapter: string;
  learnedDate: string;
  reviewDay1?: { due: string; done: boolean };
  reviewDay3?: { due: string; done: boolean };
  reviewDay7?: { due: string; done: boolean };
  reviewDay21?: { due: string; done: boolean };
  reviewDay60?: { due: string; done: boolean };
  notes?: string;
}

export interface PYQAttempt {
  id: string;
  subjectId: string;
  year: number;
  total: number;
  solved: number;
  correct: number;
  wrong: number;
  skipped: number;
  lastAttempted: string;
  notes?: string;
}

export interface MockEntry {
  id: string;
  date: string;
  name: string;
  score: number;
  type: 'subject' | 'full' | 'diagnostic';
  mistakes: {
    silly: number;
    conceptual: number;
    time: number;
  };
  notes?: string;
}

export interface BurnoutCheckIn {
  id: string;
  date: string;
  level: BurnoutLevel;
  sleepHours: number;
  notes?: string;
}

export interface CheatSheetItem {
  id: string;
  name: string;
  formula: string;
  subject: string;
  notes?: string;
  mastered: boolean;
  code?: string;
  example?: string;
  difficulty?: CheatSheetDifficulty;
  tags?: string[];
  isUserAdded?: boolean;
  aiExplanation?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  durationMinutes: number;
}

export interface TodoItem {
  id: string;
  date: string;
  text: string;
  done: boolean;
  subjectId?: string;
  order: number;
  createdAt: string;
}

export type PrepSnapshot = {
  startDate: string;
  gateDate: string;
  subjects: Subject[];
  srItems: SpacedRepetitionItem[];
  pyqAttempts: PYQAttempt[];
  mocks: MockEntry[];
  checkIns: BurnoutCheckIn[];
  cheatSheetItems: CheatSheetItem[];
  studySessions: StudySession[];
  timerRunning: boolean;
  timerStartTime: number;
  timerElapsed: number;
  todoItems: TodoItem[];
};

export interface PrepState {
  startDate: string;
  gateDate: string;
  subjects: Subject[];
  srItems: SpacedRepetitionItem[];
  pyqAttempts: PYQAttempt[];
  mocks: MockEntry[];
  checkIns: BurnoutCheckIn[];
  cheatSheetItems: CheatSheetItem[];
  studySessions: StudySession[];
  timerRunning: boolean;
  timerStartTime: number;
  timerElapsed: number;
  todoItems: TodoItem[];
  setSubjectStatus: (subjectId: string, status: SubjectStatus) => void;
  toggleTopic: (subjectId: string, topicId: string) => void;
  addSRItem: (item: Omit<SpacedRepetitionItem, 'id'>) => void;
  markSRReviewDone: (itemId: string, reviewKey: 'reviewDay1' | 'reviewDay3' | 'reviewDay7' | 'reviewDay21' | 'reviewDay60') => void;
  removeSRItem: (itemId: string) => void;
  addMock: (mock: Omit<MockEntry, 'id'>) => void;
  removeMock: (id: string) => void;
  addCheckIn: (ci: Omit<BurnoutCheckIn, 'id'>) => void;
  removeCheckIn: (id: string) => void;
  addPYQAttempt: (attempt: Omit<PYQAttempt, 'id'>) => void;
  updatePYQAttempt: (id: string, data: Partial<PYQAttempt>) => void;
  removePYQAttempt: (id: string) => void;
  toggleCheatSheetMastered: (id: string) => void;
  updateCheatSheetNotes: (id: string, notes: string) => void;
  updateCheatSheetAIExplanation: (id: string, explanation: string) => void;
  addCheatSheetItem: (item: Omit<CheatSheetItem, 'id'>) => void;
  removeCheatSheetItem: (id: string) => void;
  updateCheatSheetItem: (id: string, data: Partial<CheatSheetItem>) => void;
  addStudySession: (session: Omit<StudySession, 'id'>) => void;
  removeStudySession: (id: string) => void;
  setTimerState: (running: boolean, startTime: number, elapsed: number) => void;
  addTodo: (todo: Omit<TodoItem, 'id'>) => void;
  toggleTodo: (id: string) => void;
  updateTodoText: (id: string, text: string) => void;
  removeTodo: (id: string) => void;
  reorderTodos: (ids: string[]) => void;
  resetAll: () => void;
  loadFromMongo: (data: PrepSnapshot) => void;
}
