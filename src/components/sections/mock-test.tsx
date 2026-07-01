'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Brain, Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight,
  Send, BarChart3, BookOpen, AlertTriangle, ChevronLeft, Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MockQ {
  id: string;
  section: 'ga' | 'tech';
  subject?: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

type Phase = 'config' | 'test' | 'results';

const API_BASE = '/api/mock-test/generate';
const SUBMIT_API = '/api/mock-test/submit';

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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function MockTest() {
  const [phase, setPhase] = useState<Phase>('config');
  const [subject, setSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<MockQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, gaCorrect: 0, gaTotal: 0, techCorrect: 0, techTotal: 0 });
  const [expandedQs, setExpandedQs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (phase === 'test' && !submitted) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, submitted]);

  const generateTest = useCallback(async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject || undefined, count: questionCount }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      if (!data.questions?.length) throw new Error('No questions');
      setQuestions(data.questions);
      setAnswers({});
      setCurrentIndex(0);
      setElapsed(0);
      setSubmitted(false);
      setPhase('test');
    } catch {
      setError('Could not generate test. Try again.');
    } finally {
      setGenerating(false);
    }
  }, [subject, questionCount]);

  const handleAnswer = (qid: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: optionIndex }));
  };

  const handleSubmit = () => {
    let gaCorrect = 0;
    let gaTotal = 0;
    let techCorrect = 0;
    let techTotal = 0;
    for (const q of questions) {
      if (q.section === 'ga') {
        gaTotal++;
        if (answers[q.id] === q.correct) gaCorrect++;
      } else {
        techTotal++;
        if (answers[q.id] === q.correct) techCorrect++;
      }
    }
    setScore({
      correct: gaCorrect + techCorrect,
      total: questions.length,
      gaCorrect,
      gaTotal,
      techCorrect,
      techTotal,
    });
    setSubmitted(true);
    setPhase('results');
    if (timerRef.current) clearInterval(timerRef.current);

    // Save to MongoDB (fire-and-forget)
    const token = localStorage.getItem('auth_token');
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

  const answeredCount = Object.keys(answers).length;

  // Config screen
  if (phase === 'config') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Mock Test Generator
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Powered by DeepSeek V4 Pro via NVIDIA — generates GATE-level questions on demand.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configure Your Test</CardTitle>
            <CardDescription>Choose subject and number of questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject */}
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

            {/* Question count */}
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

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <Button
              onClick={generateTest}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>Generating with AI...</>
              ) : (
                <><Brain className="h-4 w-4 mr-1.5" /> Generate Mock Test</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <p className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Full-length (65 Q) is timed at 3 hours. Shorter tests are untimed.</p>
            <p className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Results are saved to your mock history automatically.</p>
            <p className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Each question includes a detailed explanation after submission.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (phase === 'results') {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const gaQs = questions.filter((q) => q.section === 'ga');
    const techQs = questions.filter((q) => q.section === 'tech');

    return (
      <div className="space-y-6">
        {/* Score hero */}
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

        {/* Question review */}
        {gaQs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">General Aptitude</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gaQs.map((q, i) => (
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
        )}

        {techQs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Technical</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {techQs.map((q, i) => (
                <QReviewCard
                  key={q.id}
                  q={q} index={gaQs.length + i}
                  answer={answers[q.id]}
                  expanded={expandedQs.has(q.id)}
                  onToggle={() => toggleExpanded(q.id)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => setPhase('config')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> New Mock Test
        </Button>
      </div>
    );
  }

  // Test screen
  return (
    <div className="space-y-4">
      {/* Header: timer + progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            if (confirm('End this test? Your progress will be lost.')) setPhase('config');
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
          const isAnswered = answers[q.id] !== undefined;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'h-7 w-7 rounded text-[11px] font-semibold transition-colors',
                currentIndex === i && 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900',
                isAnswered ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
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
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">Q{currentIndex + 1}</Badge>
              {currentQ.section === 'tech' && currentQ.subject && (
                <Badge variant="secondary" className="text-[10px]">{currentQ.subject}</Badge>
              )}
              <Badge className={cn(
                'text-[10px]',
                currentQ.section === 'ga' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
              )}>
                {currentQ.section.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-slate-900 dark:text-slate-100 mb-3 leading-relaxed">
              {currentQ.question}
            </p>
            <div className="space-y-1.5">
              {currentQ.options.map((opt, oi) => {
                const selected = answers[currentQ.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(currentQ.id, oi)}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-all',
                      selected
                        ? 'border-purple-500 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                    )}
                  >
                    <span className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0',
                      selected
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-slate-300 dark:border-slate-600',
                    )}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {answeredCount < questions.length && (
          <span className="text-xs text-slate-400">
            {questions.length - answeredCount} unanswered
          </span>
        )}
        <Button
          variant={answeredCount === questions.length ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (currentIndex < questions.length - 1) {
              setCurrentIndex((i) => i + 1);
            } else if (answeredCount === questions.length) {
              handleSubmit();
            }
          }}
        >
          {currentIndex < questions.length - 1 ? (
            <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
          ) : (
            <><Send className="h-4 w-4 mr-1" /> Submit</>
          )}
        </Button>
      </div>

      {/* Submit button (always visible) */}
      {answeredCount > 0 && (
        <div className="text-center pt-2">
          <Button onClick={handleSubmit} disabled={answeredCount === 0} variant="secondary">
            <Send className="h-4 w-4 mr-1.5" />
            Submit Test ({answeredCount}/{questions.length} answered)
          </Button>
        </div>
      )}
    </div>
  );
}

function QReviewCard({
  q, index, answer, expanded, onToggle,
}: {
  q: MockQ; index: number; answer: number | undefined;
  expanded: boolean; onToggle: () => void;
}) {
  const isCorrect = answer === q.correct;
  const isWrong = answer !== undefined && answer !== q.correct;

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-colors',
      isCorrect && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/10',
      isWrong && 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/10',
      !isCorrect && !isWrong && 'border-slate-200 dark:border-slate-700',
    )}>
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {q.section === 'tech' && q.subject && (
              <Badge variant="outline" className="text-[10px]">{q.subject}</Badge>
            )}
          </div>
          <p className="text-sm text-slate-900 dark:text-slate-100 mb-2">{q.question}</p>
          <div className="space-y-1">
            {q.options.map((opt, oi) => {
              const optCorrect = oi === q.correct;
              const optWrong = answer === oi && oi !== q.correct;
              return (
                <div key={oi} className={cn(
                  'text-xs px-2 py-1 rounded flex items-center gap-2',
                  optCorrect && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
                  optWrong && 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
                  !optCorrect && !optWrong && 'text-slate-500',
                )}>
                  <span>{String.fromCharCode(65 + oi)}. {opt}</span>
                  {optCorrect && <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />}
                  {optWrong && <XCircle className="h-3 w-3 shrink-0 text-red-500" />}
                </div>
              );
            })}
          </div>
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
