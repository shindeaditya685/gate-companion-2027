'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight, Target } from 'lucide-react';
import { usePrepStore } from '@/lib/store';
import { PYQ_DISTRIBUTION } from '@/lib/data';
import type { PYQAttempt } from '@/lib/types';

const SUBJECT_IDS = Object.keys(PYQ_DISTRIBUTION);

export function PYQTrackerView() {
  const { subjects, pyqAttempts, addPYQAttempt, updatePYQAttempt, removePYQAttempt } = usePrepStore();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [selSubject, setSelSubject] = useState(SUBJECT_IDS[0]);
  const [selYear, setSelYear] = useState('2025');
  const [solved, setSolved] = useState('0');
  const [correct, setCorrect] = useState('0');
  const [wrong, setWrong] = useState('0');
  const [skipped, setSkipped] = useState('0');

  const subjectMap = useMemo(() => {
    const m = new Map(subjects.map((s) => [s.id, s]));
    return m;
  }, [subjects]);

  // Total PYQs available per subject
  const subjectTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const [sid, years] of Object.entries(PYQ_DISTRIBUTION)) {
      totals[sid] = years.reduce((sum, y) => sum + y.count, 0);
    }
    return totals;
  }, []);

  // PYQs solved per subject
  const subjectSolved = useMemo(() => {
    const solved: Record<string, number> = {};
    for (const sid of SUBJECT_IDS) {
      solved[sid] = pyqAttempts
        .filter((a) => a.subjectId === sid)
        .reduce((sum, a) => sum + a.solved, 0);
    }
    return solved;
  }, [pyqAttempts]);

  // PYQs correct per subject
  const subjectCorrect = useMemo(() => {
    const correct: Record<string, number> = {};
    for (const sid of SUBJECT_IDS) {
      correct[sid] = pyqAttempts
        .filter((a) => a.subjectId === sid)
        .reduce((sum, a) => sum + a.correct, 0);
    }
    return correct;
  }, [pyqAttempts]);

  const totalAvailable = Object.values(subjectTotals).reduce((a, b) => a + b, 0);
  const totalSolved = Object.values(subjectSolved).reduce((a, b) => a + b, 0);
  const overallPct = totalAvailable > 0 ? Math.round((totalSolved / totalAvailable) * 100) : 0;

  const handleAdd = () => {
    const s = parseInt(solved, 10);
    const c = parseInt(correct, 10);
    const w = parseInt(wrong, 10);
    const sk = parseInt(skipped, 10);
    if (isNaN(s) || s < 0) return;

    const year = parseInt(selYear, 10);
    const yearData = PYQ_DISTRIBUTION[selSubject]?.find((y) => y.year === year);
    const total = yearData?.count ?? 0;

    const existing = pyqAttempts.find((a) => a.subjectId === selSubject && a.year === year);
    if (existing) {
      updatePYQAttempt(existing.id, {
        solved: s,
        correct: c,
        wrong: w,
        skipped: sk,
        total,
        lastAttempted: new Date().toISOString(),
      });
    } else {
      addPYQAttempt({
        subjectId: selSubject,
        year,
        total,
        solved: s,
        correct: c,
        wrong: w,
        skipped: sk,
        lastAttempted: new Date().toISOString(),
      });
    }

    setOpen(false);
    setSolved('0');
    setCorrect('0');
    setWrong('0');
    setSkipped('0');
  };

  const handleEditExisting = (attempt: PYQAttempt) => {
    setSelSubject(attempt.subjectId);
    setSelYear(String(attempt.year));
    setSolved(String(attempt.solved));
    setCorrect(String(attempt.correct));
    setWrong(String(attempt.wrong));
    setSkipped(String(attempt.skipped));
    setOpen(true);
  };

  const yearsForSubject = (sid: string) => PYQ_DISTRIBUTION[sid] ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                PYQ Tracker
              </CardTitle>
              <CardDescription>
                Track solved previous year questions across all subjects
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Log PYQs
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log PYQ Attempt</DialogTitle>
                  <DialogDescription>Record how many questions you solved for a subject and year.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Subject</Label>
                      <Select value={selSubject} onValueChange={setSelSubject}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_IDS.map((sid) => {
                            const sub = subjectMap.get(sid);
                            return (
                              <SelectItem key={sid} value={sid}>
                                {sub?.shortName ?? sid}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Select value={selYear} onValueChange={setSelYear}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearsForSubject(selSubject).map((y) => (
                            <SelectItem key={y.year} value={String(y.year)}>
                              {y.year} ({y.count} Qs)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Solved (attempted)</Label>
                      <Input type="number" min="0" value={solved} onChange={(e) => setSolved(e.target.value)} />
                    </div>
                    <div>
                      <Label>Correct</Label>
                      <Input type="number" min="0" value={correct} onChange={(e) => setCorrect(e.target.value)} />
                    </div>
                    <div>
                      <Label>Wrong</Label>
                      <Input type="number" min="0" value={wrong} onChange={(e) => setWrong(e.target.value)} />
                    </div>
                    <div>
                      <Label>Skipped</Label>
                      <Input type="number" min="0" value={skipped} onChange={(e) => setSkipped(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Overall summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Overall PYQ Progress</span>
            <span className="text-sm font-semibold">{totalSolved} / {totalAvailable} ({overallPct}%)</span>
          </div>
          <Progress value={overallPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Per-subject breakdown */}
      <div className="space-y-3">
        {SUBJECT_IDS.map((sid) => {
          const sub = subjectMap.get(sid);
          if (!sub) return null;
          const totalQ = subjectTotals[sid] ?? 0;
          const solvedQ = subjectSolved[sid] ?? 0;
          const correctQ = subjectCorrect[sid] ?? 0;
          const pct = totalQ > 0 ? Math.round((solvedQ / totalQ) * 100) : 0;
          const isExpanded = expanded === sid;
          const years = yearsForSubject(sid);
          const subjectAttempts = pyqAttempts.filter((a) => a.subjectId === sid);
          const accuracy = solvedQ > 0 ? Math.round((correctQ / solvedQ) * 100) : 0;

          return (
            <Card key={sid} className="overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : sid)}
              >
                <div className="flex-shrink-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${sub.color}`}>{sub.shortName}</span>
                      <Badge variant="outline" className="text-[10px]">{sub.priority}</Badge>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {solvedQ}/{totalQ} · {accuracy}% acc
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-2">
                  {years.map((y) => {
                    const attempt = subjectAttempts.find((a) => a.year === y.year);
                    const yearSolved = attempt?.solved ?? 0;
                    const yearPct = Math.round((yearSolved / y.count) * 100);
                    return (
                      <div
                        key={y.year}
                        className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-md px-2 py-1.5"
                        onClick={() => {
                          if (attempt) handleEditExisting(attempt);
                          else {
                            setSelSubject(sid);
                            setSelYear(String(y.year));
                            setSolved('0');
                            setCorrect('0');
                            setWrong('0');
                            setSkipped('0');
                            setOpen(true);
                          }
                        }}
                      >
                        <span className="w-10 text-slate-500 dark:text-slate-400 font-mono text-xs">{y.year}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{yearSolved}/{y.count} solved</span>
                            {attempt && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {attempt.correct} correct · {attempt.wrong} wrong
                              </span>
                            )}
                          </div>
                          <Progress value={yearPct} className="h-1 mt-1" />
                        </div>
                        {attempt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => { e.stopPropagation(); removePYQAttempt(attempt.id); }}
                          >
                            <Trash2 className="h-3 w-3 text-slate-400" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
