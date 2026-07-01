'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sun, Bookmark, BookmarkCheck, History, CheckCircle, XCircle,
  Flame, Calendar, Trophy, ArrowLeft, RotateCcw, Clock, ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePrepStore } from '@/lib/store';
import type { DailyQuestion, DailyTest } from '@/lib/types';

const API_BASE = '/api/daily-questions/generate';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hoursUntilMidnight(): { hours: number; minutes: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.ceil((diff % 3600000) / 60000),
  };
}

function formatTime(h: number, m: number): string {
  if (h <= 0 && m <= 0) return 'any moment';
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(' ') || '0m';
}

function getDayNumber(calendar: Record<string, 'done' | 'missed'>): number {
  return Object.keys(calendar).length + 1;
}

export function DailyQuestions() {
  const { dailyChallenge, setDailyTest, submitDailyTest, toggleBookmark, subjects } = usePrepStore();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [view, setView] = useState<'test' | 'results' | 'history' | 'bookmarks' | 'review'>('test');
  const [reviewTest, setReviewTest] = useState<DailyTest | null>(null);
  const [expandedQs, setExpandedQs] = useState<Set<string>>(new Set());

  const today = todayKey();
  const current = dailyChallenge.current;
  const isToday = current?.date === today;
  const isSubmitted = isToday && current?.submitted;
  const dayNumber = getDayNumber(dailyChallenge.calendar);

  const { hours, minutes } = useMemo(() => hoursUntilMidnight(), []);

  const weakSubjects = subjects
    .filter((s) => s.status === 'weak')
    .map((s) => s.name);

  const generateQuestions = useCallback(async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weakSubjects }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      if (!data.questions?.length) throw new Error('No questions returned');

      const test: DailyTest = {
        date: today,
        dayNumber,
        questions: data.questions,
        answers: {},
        submitted: false,
        score: { correct: 0, total: data.questions.length, gaCorrect: 0, gaTotal: 0, techCorrect: 0, techTotal: 0 },
        bookmarked: [],
      };
      setDailyTest(test);
      setAnswers({});
      setView('test');
    } catch {
      setError('Could not load questions. Pull down to retry.');
    } finally {
      setGenerating(false);
    }
  }, [today, dayNumber, weakSubjects, setDailyTest]);

  useEffect(() => {
    if (isToday) {
      setView(isSubmitted ? 'results' : 'test');
      const saved = current?.answers || {};
      setAnswers(Object.fromEntries(Object.entries(saved).filter(([_, v]) => v !== undefined)) as Record<string, number>);
    } else if (!loading && !generating && !error) {
      generateQuestions();
    }
  }, []);

  const handleSubmit = () => {
    if (!current) return;
    submitDailyTest(answers);
    setView('results');
  };

  const handleToggleBookmark = (qid: string) => {
    toggleBookmark(qid);
  };

  const toggleExpanded = (qid: string) => {
    setExpandedQs((prev) => {
      const next = new Set(prev);
      next.has(qid) ? next.delete(qid) : next.add(qid);
      return next;
    });
  };

  const currentQuestions = isToday ? current!.questions : [];
  const currentGa = currentQuestions.filter((q) => q.section === 'ga');
  const currentTech = currentQuestions.filter((q) => q.section === 'tech');

  const historyList = dailyChallenge.history;

  const allBookmarked = useMemo(() => {
    const qs: { question: DailyQuestion; testDate: string; dayNum: number }[] = [];
    for (const test of dailyChallenge.history) {
      for (const q of test.questions) {
        if (test.bookmarked.includes(q.id)) {
          qs.push({ question: q, testDate: test.date, dayNum: test.dayNumber });
        }
      }
    }
    if (current && current.bookmarked.length > 0) {
      for (const q of current.questions) {
        if (current.bookmarked.includes(q.id)) {
          qs.push({ question: q, testDate: current.date, dayNum: current.dayNumber });
        }
      }
    }
    return qs;
  }, [dailyChallenge, current]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            Daily Challenge
            <span className="text-sm font-normal text-slate-400">Day #{dayNumber}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dailyChallenge.streak > 0 && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
              <Flame className="h-4 w-4 text-amber-500" />
              {dailyChallenge.streak} day streak
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={generateQuestions} disabled={generating}>
            <RotateCcw className={cn('h-4 w-4 mr-1', generating && 'animate-spin')} />
            New Test
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 pb-0.5">
        <TabBtn active={view === 'test' || view === 'results'} onClick={() => setView(isSubmitted ? 'results' : 'test')}>
          <Trophy className="h-4 w-4" />
          {isSubmitted ? 'Results' : 'Test'}
        </TabBtn>
        <TabBtn active={view === 'history'} onClick={() => setView('history')}>
          <History className="h-4 w-4" />
          History
          {historyList.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{historyList.length}</Badge>}
        </TabBtn>
        <TabBtn active={view === 'bookmarks'} onClick={() => setView('bookmarks')}>
          <Bookmark className="h-4 w-4" />
          Bookmarks
          {allBookmarked.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{allBookmarked.length}</Badge>}
        </TabBtn>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-300">{error}</CardContent>
        </Card>
      )}

      {/* Generating */}
      {generating && (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p>Generating 10 GATE-level questions...</p>
            <p className="text-xs mt-1 text-slate-400">Using AI for fresh questions every day</p>
          </CardContent>
        </Card>
      )}

      {/* ──────── REVIEW (viewing a past test) ──────── */}
      {view === 'review' && reviewTest && (
        <PastTestReview
          test={reviewTest}
          expandedQs={expandedQs}
          onToggleExpanded={toggleExpanded}
          onBookmark={handleToggleBookmark}
          onBack={() => { setView('history'); setReviewTest(null); }}
        />
      )}

      {/* ──────── TEST VIEW ──────── */}
      {view === 'test' && !generating && !isSubmitted && currentQuestions.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <Clock className="h-4 w-4" />
            Answer all 10 questions and submit. Next test in {formatTime(hours, minutes)}.
          </div>
          <QuestionGroup
            title="General Aptitude"
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            description="Verbal · Numerical · Reasoning · Data Interpretation"
            questions={currentGa}
            answers={answers}
            setAnswers={setAnswers}
            submitted={false}
            showResults={false}
            expandedQs={expandedQs}
            onToggleExpanded={toggleExpanded}
            bookmarked={current?.bookmarked || []}
            onBookmark={handleToggleBookmark}
          />
          <QuestionGroup
            title="Technical"
            icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
            description="Core CSE subjects · GATE difficulty"
            questions={currentTech}
            answers={answers}
            setAnswers={setAnswers}
            submitted={false}
            showResults={false}
            expandedQs={expandedQs}
            onToggleExpanded={toggleExpanded}
            bookmarked={current?.bookmarked || []}
            onBookmark={handleToggleBookmark}
          />
          <div className="flex gap-3 items-center pt-2">
            <Button onClick={handleSubmit} disabled={Object.keys(answers).length === 0} size="lg">
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Submit Answers ({Object.keys(answers).length}/{currentQuestions.length})
            </Button>
            {Object.keys(answers).length < currentQuestions.length && (
              <span className="text-xs text-slate-400">
                Answer all 10 to submit
              </span>
            )}
          </div>
        </>
      )}

      {/* ──────── RESULTS VIEW ──────── */}
      {view === 'results' && isSubmitted && current && (
        <ResultsView
          test={current}
          expandedQs={expandedQs}
          onToggleExpanded={toggleExpanded}
          onBookmark={handleToggleBookmark}
          hours={hours}
          minutes={minutes}
        />
      )}

      {/* ──────── HISTORY VIEW ──────── */}
      {view === 'history' && !generating && (
        <HistoryView
          history={historyList}
          onSelect={(test) => { setReviewTest(test); setView('review'); }}
        />
      )}

      {/* ──────── BOOKMARKS VIEW ──────── */}
      {view === 'bookmarks' && !generating && (
        <BookmarksView
          bookmarks={allBookmarked}
          expandedQs={expandedQs}
          onToggleExpanded={toggleExpanded}
          onBookmark={handleToggleBookmark}
        />
      )}

      {/* Empty */}
      {!generating && !error && view === 'test' && !isSubmitted && currentQuestions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>No questions loaded. Tap &quot;New Test&quot; to begin.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 -mb-[1px]',
        active
          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600',
      )}
    >
      {children}
    </button>
  );
}

function QuestionGroup({
  title, icon, description, questions, answers, setAnswers,
  submitted, showResults, expandedQs, onToggleExpanded, bookmarked, onBookmark,
}: {
  title: string; icon: React.ReactNode; description: string;
  questions: DailyQuestion[];
  answers: Record<string, number>;
  setAnswers?: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
  submitted: boolean; showResults: boolean;
  expandedQs: Set<string>; onToggleExpanded: (id: string) => void;
  bookmarked: string[]; onBookmark: (id: string) => void;
}) {
  if (questions.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          {showResults && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {questions.filter((q) => answers[q.id] === q.correct).length}/{questions.length}
            </Badge>
          )}
          {!showResults && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {questions.length} questions
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={i}
            answers={answers}
            setAnswers={setAnswers}
            submitted={submitted}
            showResults={showResults}
            expanded={expandedQs.has(q.id)}
            onToggleExpanded={() => onToggleExpanded(q.id)}
            bookmarked={bookmarked.includes(q.id)}
            onBookmark={() => onBookmark(q.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function QuestionCard({
  q, index, answers, setAnswers, submitted, showResults,
  expanded, onToggleExpanded, bookmarked, onBookmark,
}: {
  q: DailyQuestion; index: number;
  answers: Record<string, number>;
  setAnswers?: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
  submitted: boolean; showResults: boolean;
  expanded: boolean; onToggleExpanded: () => void;
  bookmarked: boolean; onBookmark: () => void;
}) {
  const selectedAnswer = answers[q.id];
  const isCorrect = showResults && selectedAnswer === q.correct;
  const isWrong = showResults && selectedAnswer !== undefined && selectedAnswer !== q.correct;

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-colors',
      showResults && isCorrect && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/10',
      showResults && isWrong && 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/10',
      !showResults && 'border-slate-200 dark:border-slate-700',
    )}>
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {/* Question text */}
          <p className="text-sm text-slate-900 dark:text-slate-100 mb-2.5 leading-relaxed">
            {q.question}
          </p>

          {/* Subject badge for tech */}
          {q.section === 'tech' && q.subject && (
            <Badge variant="outline" className="mb-2 text-[10px] text-slate-500">
              {q.subject}
            </Badge>
          )}

          {/* Options */}
          {q.options && (
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const optIsCorrect = showResults && oi === q.correct;
                const optIsWrong = showResults && selectedAnswer === oi && oi !== q.correct;
                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && setAnswers?.((prev) => ({ ...prev, [q.id]: oi }))}
                    disabled={submitted}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-all',
                      selectedAnswer === oi && !showResults && 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/20',
                      selectedAnswer !== oi && !showResults && 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                      optIsCorrect && 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/20',
                      optIsWrong && 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/20',
                      submitted && 'cursor-default',
                    )}
                  >
                    <span className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0',
                      selectedAnswer === oi && !showResults && 'border-emerald-500 bg-emerald-500 text-white',
                      selectedAnswer !== oi && !showResults && 'border-slate-300 dark:border-slate-600',
                      optIsCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                      optIsWrong && 'border-red-500 bg-red-500 text-white',
                    )}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {optIsCorrect && <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />}
                    {optIsWrong && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action row: bookmark + explanation */}
          {(showResults || submitted) && (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={onBookmark}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors"
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button
                onClick={onToggleExpanded}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                {expanded ? 'Hide explanation' : 'Show explanation'}
              </button>
            </div>
          )}

          {showResults && expanded && (
            <div className="mt-2 rounded-md bg-slate-50 dark:bg-slate-900/50 p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation:</span>
              <br />
              {q.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── RESULTS VIEW ─── */
function ResultsView({
  test, expandedQs, onToggleExpanded, onBookmark, hours, minutes,
}: {
  test: DailyTest; expandedQs: Set<string>;
  onToggleExpanded: (id: string) => void; onBookmark: (id: string) => void;
  hours: number; minutes: number;
}) {
  const { score } = test;
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const gaQuestions = test.questions.filter((q) => q.section === 'ga');
  const techQuestions = test.questions.filter((q) => q.section === 'tech');

  return (
    <>
      {/* Score hero */}
      <Card className="bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/40 dark:to-amber-950/40 border-emerald-200 dark:border-emerald-900">
        <CardContent className="p-6 text-center">
          <Trophy className="h-10 w-10 mx-auto text-amber-500 mb-2" />
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            {score.correct}<span className="text-lg text-slate-400">/{score.total}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {pct}% correct
          </p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <div>
              <span className="font-semibold text-amber-600 dark:text-amber-400">GA</span>{' '}
              {score.gaCorrect}/{score.gaTotal}
            </div>
            <div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tech</span>{' '}
              {score.techCorrect}/{score.techTotal}
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            Next test in {formatTime(hours, minutes)}
          </div>
        </CardContent>
      </Card>

      {/* GA Results */}
      <QuestionGroup
        title="General Aptitude"
        icon={<Trophy className="h-4 w-4 text-amber-500" />}
        description=""
        questions={gaQuestions}
        answers={test.answers as Record<string, number>}
        submitted
        showResults
        expandedQs={expandedQs}
        onToggleExpanded={onToggleExpanded}
        bookmarked={test.bookmarked}
        onBookmark={onBookmark}
      />

      {/* Tech Results */}
      <QuestionGroup
        title="Technical"
        icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
        description=""
        questions={techQuestions}
        answers={test.answers as Record<string, number>}
        submitted
        showResults
        expandedQs={expandedQs}
        onToggleExpanded={onToggleExpanded}
        bookmarked={test.bookmarked}
        onBookmark={onBookmark}
      />
    </>
  );
}

/* ─── PAST TEST REVIEW ─── */
function PastTestReview({
  test, expandedQs, onToggleExpanded, onBookmark, onBack,
}: {
  test: DailyTest; expandedQs: Set<string>;
  onToggleExpanded: (id: string) => void; onBookmark: (id: string) => void;
  onBack: () => void;
}) {
  const gaQ = test.questions.filter((q) => q.section === 'ga');
  const techQ = test.questions.filter((q) => q.section === 'tech');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Day #{test.dayNumber} — {test.date}
          </div>
          <div className="text-xs text-slate-500">
            Score: {test.score.correct}/{test.score.total} · GA {test.score.gaCorrect}/{test.score.gaTotal} · Tech {test.score.techCorrect}/{test.score.techTotal}
          </div>
        </div>
      </div>

      <QuestionGroup
        title="General Aptitude"
        icon={<Trophy className="h-4 w-4 text-amber-500" />}
        description=""
        questions={gaQ}
        answers={test.answers as Record<string, number>}
        submitted
        showResults
        expandedQs={expandedQs}
        onToggleExpanded={onToggleExpanded}
        bookmarked={test.bookmarked}
        onBookmark={onBookmark}
      />
      <QuestionGroup
        title="Technical"
        icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
        description=""
        questions={techQ}
        answers={test.answers as Record<string, number>}
        submitted
        showResults
        expandedQs={expandedQs}
        onToggleExpanded={onToggleExpanded}
        bookmarked={test.bookmarked}
        onBookmark={onBookmark}
      />
    </div>
  );
}

/* ─── HISTORY VIEW ─── */
function HistoryView({
  history, onSelect,
}: {
  history: DailyTest[];
  onSelect: (test: DailyTest) => void;
}) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p>No past tests yet. Complete today&apos;s challenge to see your history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((test) => {
        const pct = test.score.total > 0 ? Math.round((test.score.correct / test.score.total) * 100) : 0;
        return (
          <button
            key={test.date}
            onClick={() => onSelect(test)}
            className="w-full flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Day #{test.dayNumber}
              </div>
              <div className="text-xs text-slate-500">
                {test.date}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  {test.score.correct}/{test.score.total}
                </div>
                <div className="text-xs text-slate-500">
                  GA {test.score.gaCorrect}/{test.score.gaTotal} · Tech {test.score.techCorrect}/{test.score.techTotal}
                </div>
              </div>
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                pct >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                pct >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
              )}>
                {pct}%
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── BOOKMARKS VIEW ─── */
function BookmarksView({
  bookmarks, expandedQs, onToggleExpanded, onBookmark,
}: {
  bookmarks: { question: DailyQuestion; testDate: string; dayNum: number }[];
  expandedQs: Set<string>; onToggleExpanded: (id: string) => void; onBookmark: (id: string) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          <Bookmark className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p>No bookmarked questions. After submitting, bookmark questions you want to review later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map(({ question: q, testDate, dayNum }) => (
        <div key={`${testDate}-${q.id}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px]">
              Day #{dayNum}
            </Badge>
            <span className="text-[10px] text-slate-400">{testDate}</span>
            {q.section === 'tech' && q.subject && (
              <Badge variant="secondary" className="text-[10px]">{q.subject}</Badge>
            )}
            <Badge className={cn(
              'text-[10px]',
              q.section === 'ga' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
            )}>
              {q.section.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-slate-900 dark:text-slate-100 mb-2">{q.question}</p>
          {q.options && (
            <div className="space-y-1 mb-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className={cn(
                  'text-xs px-2 py-1 rounded',
                  oi === q.correct ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'text-slate-500',
                )}>
                  {String.fromCharCode(65 + oi)}. {opt} {oi === q.correct && <CheckCircle className="h-3 w-3 inline text-emerald-500" />}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBookmark(q.id)}
              className="text-xs flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors"
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
              Bookmarked
            </button>
            <button
              onClick={() => onToggleExpanded(q.id)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {expandedQs.has(q.id) ? 'Hide explanation' : 'Show explanation'}
            </button>
          </div>
          {expandedQs.has(q.id) && (
            <div className="mt-2 rounded-md bg-slate-50 dark:bg-slate-900/50 p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-slate-700">
              {q.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
