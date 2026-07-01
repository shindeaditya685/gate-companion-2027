'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Brain, Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight,
  Send, BarChart3, BookOpen, ChevronLeft, HelpCircle,
  History, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MockQ {
  id: string;
  type: 'mcq' | 'nat' | 'msq';
  section: 'ga' | 'tech';
  subject?: string;
  marks?: number;
  question: string;
  options?: string[];
  correct: number | number[] | string;
  explanation: string;
}

interface MockHistoryEntry {
  id: string;
  date: string;
  name: string;
  score: number;
  type: 'subject' | 'full';
  mistakes: { silly: number; conceptual: number; time: number };
  fullRecord?: {
    questions: MockQ[];
    answers: Record<string, any>;
    score: { correct: number; total: number; gaCorrect: number; gaTotal: number; techCorrect: number; techTotal: number };
    timeTaken: number;
    subject: string | null;
  } | null;
}

interface MockTabState {
  tab: 'new' | 'history';
  phase: 'config' | 'test' | 'results';
}

const API_BASE = '/api/mock-test/generate';
const SUBMIT_API = '/api/mock-test/submit';
const HISTORY_API = '/api/mock-test/history';

const SUBJECTS = [
  { value: '', label: 'All Subjects (Full Mock)' },
  { value: 'Data Structures', label: 'Data Structures' },
  { value: 'Algorithms', label: 'Algorithms' },
  { value: 'Computer Organization', label: 'Computer Organization' },
  { value: 'Operating Systems', label: 'Operating Systems' },
  { value: 'Computer Networks', label: 'Computer Networks' },
  { value: 'DBMS', label: 'DBMS' },
  { value: 'Theory of Computation', label: 'Theory of Computation' },
  { value: 'Compiler Design', label: 'Compiler Design' },
  { value: 'Digital Logic', label: 'Digital Logic' },
  { value: 'Discrete Mathematics', label: 'Discrete Mathematics' },
  { value: 'General Aptitude', label: 'General Aptitude' },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  mcq: { label: 'MCQ', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  nat: { label: 'NAT', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  msq: { label: 'MSQ', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function isCorrect(q: MockQ, answer: any): boolean {
  if (answer === undefined || answer === null) return false;
  if (q.type === 'mcq') return answer === q.correct;
  if (q.type === 'nat') return String(answer).trim() === String(q.correct).trim();
  if (q.type === 'msq') {
    if (!Array.isArray(answer) || !Array.isArray(q.correct)) return false;
    if (answer.length !== q.correct.length) return false;
    const a = [...answer].sort();
    const b = [...q.correct].sort();
    return a.every((v, i) => v === b[i]);
  }
  return false;
}

function isAnswered(q: MockQ, answers: Record<string, any>): boolean {
  const a = answers[q.id];
  if (a === undefined || a === null) return false;
  if (q.type === 'nat') return String(a).trim() !== '';
  if (q.type === 'msq') return Array.isArray(a) && a.length > 0;
  return true;
}

export function MockTest() {
  const [tab, setTab] = useState<MockTabState>({ tab: 'new', phase: 'config' });
  const [subject, setSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<MockQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, gaCorrect: 0, gaTotal: 0, techCorrect: 0, techTotal: 0 });
  const [expandedQs, setExpandedQs] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [mockHistory, setMockHistory] = useState<MockHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedMocks, setExpandedMocks] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (tab.phase === 'test' && !submitted) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tab.phase, submitted]);

  const generateTest = useCallback(async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject || undefined, count: questionCount }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.questions?.length) throw new Error('empty response');
      setQuestions(data.questions);
      setAnswers({});
      setCurrentIndex(0);
      setElapsed(0);
      setSubmitted(false);
      setTab({ tab: 'new', phase: 'test' });
    } catch (e) {
      setError(`Could not generate test (${e instanceof Error ? e.message : 'unknown'}). Try again.`);
    } finally {
      setGenerating(false);
    }
  }, [subject, questionCount]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoadingHistory(false); return; }
    try {
      const res = await fetch(HISTORY_API + '?full=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMockHistory(data.mocks || []);
    } catch {
      setMockHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (tab.tab === 'history') loadHistory();
  }, [tab.tab, loadHistory]);

  const handleMCQ = (qid: string, oi: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: oi }));
  };

  const handleMSQ = (qid: string, oi: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const current: number[] = prev[qid] || [];
      const next = current.includes(oi) ? current.filter((v) => v !== oi) : [...current, oi];
      return { ...prev, [qid]: next };
    });
  };

  const handleNAT = (qid: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = () => {
    let gaCorrect = 0;
    let gaTotal = 0;
    let techCorrect = 0;
    let techTotal = 0;
    for (const q of questions) {
      if (q.section === 'ga') { gaTotal++; if (isCorrect(q, answers[q.id])) gaCorrect++; }
      else { techTotal++; if (isCorrect(q, answers[q.id])) techCorrect++; }
    }
    setScore({
      correct: gaCorrect + techCorrect,
      total: questions.length,
      gaCorrect, gaTotal, techCorrect, techTotal,
    });
    setSubmitted(true);
    setTab({ tab: 'new', phase: 'results' });
    if (timerRef.current) clearInterval(timerRef.current);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      const testId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      fetch(SUBMIT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          testId,
          subject: subject || null,
          questions,
          answers,
          score: {
            correct: gaCorrect + techCorrect,
            total: questions.length,
            gaCorrect, gaTotal, techCorrect, techTotal,
          },
          timeTaken: elapsed,
          completedAt: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedQs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const retake = (entry: MockHistoryEntry) => {
    const subj = entry.fullRecord?.subject || entry.name.replace(' Mock', '') || '';
    const found = SUBJECTS.find((s) => s.label.startsWith(subj) || s.value === subj);
    setSubject(found?.value || '');
    setQuestionCount(entry.fullRecord?.questions.length || 10);
    setTab({ tab: 'new', phase: 'config' });
  };

  const answeredCount = questions.filter((q) => isAnswered(q, answers)).length;

  // ─── TAB HEADER ───
  const tabHeader = (
    <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button
        onClick={() => setTab({ tab: 'new', phase: 'config' })}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
          tab.tab === 'new' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
        )}
      >
        <Brain className="h-3.5 w-3.5 inline mr-1" /> New Test
      </button>
      <button
        onClick={() => setTab({ tab: 'history', phase: 'config' })}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
          tab.tab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
        )}
      >
        <History className="h-3.5 w-3.5 inline mr-1" /> History
      </button>
    </div>
  );

  // ─── HISTORY ───
  if (tab.tab === 'history') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <History className="h-5 w-5 text-purple-500" />
            Mock Test History
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setTab({ tab: 'new', phase: 'config' })}>
            <Brain className="h-4 w-4 mr-1" /> New Test
          </Button>
        </div>

        <div className="flex gap-1 mb-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
          <button onClick={() => setTab({ tab: 'new', phase: 'config' })}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <Brain className="h-3.5 w-3.5 inline mr-1" /> New Test
          </button>
          <button onClick={() => setTab({ tab: 'history', phase: 'config' })}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm">
            <History className="h-3.5 w-3.5 inline mr-1" /> History
          </button>
        </div>

        {loadingHistory ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading history...</p>
        ) : mockHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No mock tests yet.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setTab({ tab: 'new', phase: 'config' })}>
              Take your first mock test
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary stats */}
            <Card>
              <CardContent className="p-4 flex items-center justify-around text-center text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Tests</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{mockHistory.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Avg Score</p>
                  <p className="text-lg font-bold text-purple-600">
                    {Math.round(mockHistory.reduce((s, m) => s + m.score, 0) / mockHistory.length)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Best</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {Math.max(...mockHistory.map((m) => m.score))}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {mockHistory.map((entry) => {
              const expanded = expandedMocks.has(entry.id);
              return (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{entry.name}</p>
                        <p className="text-xs text-slate-400">{entry.date} · {timeAgo(entry.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          entry.score >= 60 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                          entry.score >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                        )}>
                          {entry.score}%
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => retake(entry)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setExpandedMocks((prev) => {
                            const next = new Set(prev);
                            next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id);
                            return next;
                          });
                        }}>
                          <BookOpen className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {entry.fullRecord && expanded && (
                      <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>Score: <b>{entry.fullRecord.score.correct}/{entry.fullRecord.score.total}</b></span>
                          <span>GA: <b>{entry.fullRecord.score.gaCorrect}/{entry.fullRecord.score.gaTotal}</b></span>
                          <span>Tech: <b>{entry.fullRecord.score.techCorrect}/{entry.fullRecord.score.techTotal}</b></span>
                          {entry.fullRecord.timeTaken > 0 && (
                            <span><Clock className="h-3 w-3 inline" /> {formatTime(entry.fullRecord.timeTaken)}</span>
                          )}
                        </div>
                        {entry.fullRecord.questions.map((q, qi) => (
                          <QReviewCard
                            key={q.id}
                            q={q} index={qi}
                            answer={entry.fullRecord!.answers[q.id]}
                            expanded={expandedQs.has(`h-${entry.id}-${q.id}`)}
                            onToggle={() => toggleExpanded(`h-${entry.id}-${q.id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── CONFIG ───
  if (tab.phase === 'config') {
    return (
      <div className="space-y-6">
        {tabHeader}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Mock Test Generator
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generates MCQ, NAT, and MSQ questions at GATE PYQ difficulty. Falls back across 4 AI models, then to static questions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configure Your Test</CardTitle>
            <CardDescription>Choose subject and number of questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Subject</Label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Number of Questions</Label>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{questionCount}</span>
              </div>
              <Slider
                value={[questionCount]}
                onValueChange={([v]) => setQuestionCount(v)}
                min={5}
                max={65}
                step={5}
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Quick (5)</span>
                <span>Full (65)</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <Button onClick={generateTest} disabled={generating} className="w-full" size="lg">
              {generating ? (
                <>Generating with AI...</>
              ) : (
                <><Brain className="h-4 w-4 mr-1.5" /> Generate Mock Test</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
            <p className="flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-blue-500" /> <b>MCQ</b> — Single correct answer. Negative marking applies.</p>
            <p className="flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-emerald-500" /> <b>NAT</b> — Type the numeric answer. No negative marking.</p>
            <p className="flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-purple-500" /> <b>MSQ</b> — Select all correct options. No negative marking.</p>
            <p className="flex items-center gap-1.5"><History className="h-4 w-4" /> Past tests saved to <b>History</b> tab for review and retake.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── RESULTS ───
  if (tab.phase === 'results') {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const gaQs = questions.filter((q) => q.section === 'ga');
    const techQs = questions.filter((q) => q.section === 'tech');

    return (
      <div className="space-y-6">
        {tabHeader}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-200 dark:border-purple-900">
          <CardContent className="p-6 text-center">
            <Brain className="h-10 w-10 mx-auto text-purple-500 mb-2" />
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              {score.correct}<span className="text-lg text-slate-400">/{score.total}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{pct}% correct</p>
            <div className="flex justify-center gap-4 mt-3 text-sm">
              <div><span className="font-semibold text-amber-600">GA</span> {score.gaCorrect}/{score.gaTotal}</div>
              <div><span className="font-semibold text-purple-600">Tech</span> {score.techCorrect}/{score.techTotal}</div>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" /> {formatTime(elapsed)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, i) => (
              <QReviewCard
                key={q.id}
                q={q} index={i}
                answer={answers[q.id]}
                expanded={expandedQs.has(q.id)}
                onToggle={() => toggleExpanded(q.id)}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab({ tab: 'new', phase: 'config' })}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> New Mock Test
          </Button>
          <Button variant="outline" onClick={() => setTab({ tab: 'history', phase: 'config' })}>
            <History className="h-4 w-4 mr-1.5" /> View History
          </Button>
        </div>
      </div>
    );
  }

  // ─── TEST ───
  return (
    <div className="space-y-4">
      {tabHeader}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            if (confirm('End this test? Progress will be lost.')) { setTab({ tab: 'new', phase: 'config' }); if (timerRef.current) clearInterval(timerRef.current); }
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            {formatTime(elapsed)}
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {answeredCount}/{questions.length} answered
        </Badge>
      </div>

      {/* Question palette */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const ans = isAnswered(q, answers);
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'h-7 w-7 rounded text-[11px] font-semibold transition-colors',
                currentIndex === i && 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900',
                ans ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Current question */}
      {currentQ && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="outline" className="text-[10px]">Q{currentIndex + 1}</Badge>
              <Badge className={cn('text-[10px]', TYPE_BADGE[currentQ.type]?.color || '')}>
                {currentQ.type?.toUpperCase() || '?'}
              </Badge>
              {currentQ.marks && (
                <Badge variant="outline" className="text-[10px]">{currentQ.marks} mark{currentQ.marks > 1 ? 's' : ''}</Badge>
              )}
              {currentQ.section === 'tech' && currentQ.subject && (
                <Badge variant="secondary" className="text-[10px]">{currentQ.subject}</Badge>
              )}
              <Badge className={cn(
                'text-[10px]',
                currentQ.section === 'ga' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
              )}>
                {currentQ.section.toUpperCase()}
              </Badge>
            </div>

            <p className="text-sm text-slate-900 dark:text-slate-100 mb-4 leading-relaxed">
              {currentQ.question}
            </p>

            {/* MCQ */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-1.5">
                {currentQ.options.map((opt, oi) => {
                  const selected = answers[currentQ.id] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => handleMCQ(currentQ.id, oi)}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-all',
                        selected
                          ? 'border-purple-500 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/20'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                      )}
                    >
                      <span className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0',
                        selected ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300 dark:border-slate-600',
                      )}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* NAT */}
            {currentQ.type === 'nat' && (
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Enter your numeric answer:</Label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleNAT(currentQ.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* MSQ */}
            {currentQ.type === 'msq' && currentQ.options && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Select all that apply:</p>
                <div className="space-y-1.5">
                  {currentQ.options.map((opt, oi) => {
                    const selected: number[] = answers[currentQ.id] || [];
                    const isSel = selected.includes(oi);
                    return (
                      <button
                        key={oi}
                        onClick={() => handleMSQ(currentQ.id, oi)}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-all',
                          isSel
                            ? 'border-purple-500 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/20'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                        )}
                      >
                        <span className={cn(
                          'h-5 w-5 rounded border-2 flex items-center justify-center text-[10px] font-bold shrink-0',
                          isSel ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300 dark:border-slate-600',
                        )}>
                          {isSel ? '✓' : String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant={answeredCount === questions.length ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
          }}
        >
          {currentIndex < questions.length - 1 ? (
            <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
          ) : (
            <><Send className="h-4 w-4 mr-1" /> Submit</>
          )}
        </Button>
      </div>

      {answeredCount > 0 && (
        <div className="text-center pt-2">
          <Button onClick={handleSubmit} variant="secondary">
            <Send className="h-4 w-4 mr-1.5" />
            Submit Test ({answeredCount}/{questions.length} answered)
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── REVIEW CARD ─── */
function QReviewCard({
  q, index, answer, expanded, onToggle,
}: {
  q: MockQ; index: number; answer: any;
  expanded: boolean; onToggle: () => void;
}) {
  const correct = isCorrect(q, answer);
  const wrong = !correct && isAnswered(q, { [q.id]: answer });

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-colors',
      correct && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/10',
      wrong && 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/10',
      !correct && !wrong && 'border-slate-200 dark:border-slate-700',
    )}>
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={cn('text-[10px]', TYPE_BADGE[q.type]?.color)}>{q.type?.toUpperCase()}</Badge>
            {q.section === 'tech' && q.subject && <Badge variant="outline" className="text-[10px]">{q.subject}</Badge>}
          </div>

          <p className="text-sm text-slate-900 dark:text-slate-100 mb-2">{q.question}</p>

          {/* MCQ review */}
          {q.type === 'mcq' && q.options && (
            <div className="space-y-1">
              {q.options.map((opt, oi) => (
                <div key={oi} className={cn(
                  'text-xs px-2 py-1 rounded flex items-center gap-2',
                  oi === q.correct && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
                  answer === oi && oi !== q.correct && 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
                  answer !== oi && oi !== q.correct && 'text-slate-500',
                )}>
                  <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                  {oi === q.correct && <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />}
                  {answer === oi && oi !== q.correct && <XCircle className="h-3 w-3 shrink-0 text-red-500" />}
                </div>
              ))}
            </div>
          )}

          {/* NAT review */}
          {q.type === 'nat' && (
            <div className="text-xs space-y-1">
              <div className={cn(
                'px-2 py-1 rounded flex items-center gap-2',
                correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
              )}>
                <span>Your answer: <b>{answer ?? '(not answered)'}</b></span>
                {correct ? <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" /> : <XCircle className="h-3 w-3 shrink-0 text-red-500" />}
              </div>
              <div className="px-2 py-1 text-slate-500">
                Correct answer: <b>{String(q.correct)}</b>
              </div>
            </div>
          )}

          {/* MSQ review */}
          {q.type === 'msq' && q.options && (
            <div className="space-y-1">
              {q.options.map((opt, oi) => {
                const isCorrectOpt = Array.isArray(q.correct) && q.correct.includes(oi);
                const selected = Array.isArray(answer) && answer.includes(oi);
                const isWrongOpt = selected && !isCorrectOpt;
                const isMissed = !selected && isCorrectOpt;
                return (
                  <div key={oi} className={cn(
                    'text-xs px-2 py-1 rounded flex items-center gap-2',
                    isCorrectOpt && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
                    isWrongOpt && 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
                    isMissed && 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
                    !isCorrectOpt && !isWrongOpt && !isMissed && 'text-slate-500',
                  )}>
                    <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                    {isCorrectOpt && <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />}
                    {isWrongOpt && <XCircle className="h-3 w-3 shrink-0 text-red-500" />}
                    {isMissed && <span className="text-[10px] text-amber-600">(missed)</span>}
                  </div>
                );
              })}
              {wrong && (
                <p className="text-[10px] text-red-600 mt-1">Incorrect selection. Correct options: {Array.isArray(q.correct) ? q.correct.map((i: number) => String.fromCharCode(65 + i)).join(', ') : ''}</p>
              )}
              {correct && (
                <p className="text-[10px] text-emerald-600 mt-1">All correct options selected</p>
              )}
            </div>
          )}

          <button onClick={onToggle} className="mt-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            {expanded ? 'Hide explanation' : 'Show explanation'}
          </button>
          {expanded && (
            <div className="mt-2 rounded-md bg-slate-50 dark:bg-slate-900/50 p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-slate-700">
              {q.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
