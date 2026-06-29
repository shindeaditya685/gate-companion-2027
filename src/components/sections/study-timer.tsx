'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Play, Square, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { usePrepStore, todayStudyMinutes, weekStudyMinutes } from '@/lib/store';

function formatDisplay(seconds: number): [string, string, string] & { h: string; m: string; s: string } {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const result = [h, m, s] as [string, string, string] & { h: string; m: string; s: string };
  result.h = h;
  result.m = m;
  result.s = s;
  return result;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function StudyTimer() {
  const { subjects, studySessions, addStudySession, removeStudySession } = usePrepStore();
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startTimeRef = useRef(0);

  const todayMin = todayStudyMinutes(studySessions);
  const weekMin = weekStudyMinutes(studySessions);
  const weekGoalMin = 30 * 60;

  const subjectTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of studySessions) {
      map[s.subjectName] = (map[s.subjectName] ?? 0) + s.durationMinutes;
    }
    return map;
  }, [studySessions]);

  const [dh, dm, ds] = formatDisplay(elapsed);

  const startTimer = useCallback(() => {
    if (running) return;
    startTimeRef.current = Date.now() - elapsed * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    setRunning(true);
  }, [running, elapsed]);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
    setRunning(false);
  }, []);

  const stopAndLog = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
    setRunning(false);

    const minutes = Math.max(1, Math.round(elapsed / 60));
    const subject = subjects.find((s) => s.id === selectedSubject);
    if (!subject) return;

    addStudySession({
      subjectId: subject.id,
      subjectName: subject.name,
      date: new Date().toISOString(),
      durationMinutes: minutes,
    });

    setElapsed(0);
  }, [elapsed, selectedSubject, subjects, addStudySession]);

  const resetTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
    setRunning(false);
    setElapsed(0);
  }, []);

  const recentSessions = useMemo(() => {
    return [...studySessions].reverse().slice(0, 20);
  }, [studySessions]);

  const selectedName = subjects.find((s) => s.id === selectedSubject)?.name ?? '';

  return (
    <div className="space-y-6">
      {/* Today / Week mini stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Today
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatDuration(todayMin)}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200/60 bg-sky-50/70 px-4 py-3 dark:border-sky-900/50 dark:bg-sky-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              This Week
            </p>
            <span className="text-[10px] font-medium text-slate-500">
              {Math.round((weekMin / weekGoalMin) * 100)}%
            </span>
          </div>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-sky-700 dark:text-sky-300">
            {formatDuration(weekMin)}
          </p>
          <Progress
            value={Math.min(100, (weekMin / weekGoalMin) * 100)}
            className="mt-2 h-1"
          />
        </div>
      </div>

      {/* Timer instrument panel */}
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-8 shadow-2xl shadow-slate-900/50 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto flex max-w-md flex-col items-center gap-6">
          {/* Digit display */}
          <div
            className="flex items-baseline font-mono text-6xl font-bold tracking-[0.15em] tabular-nums text-emerald-400 select-none sm:text-7xl"
            style={{ textShadow: '0 0 40px rgba(52,211,153,0.15), 0 0 80px rgba(52,211,153,0.05)' }}
          >
            <span>{dh}</span>
            <span
              className={[
                'mx-1 inline-block w-[0.35em] text-center transition-opacity duration-200',
                running ? 'animate-colon-blink' : 'opacity-100',
              ].join(' ')}
            >
              :
            </span>
            <span>{dm}</span>
            <span
              className={[
                'mx-1 inline-block w-[0.35em] text-center transition-opacity duration-200',
                running ? 'animate-colon-blink' : 'opacity-100',
              ].join(' ')}
            >
              :
            </span>
            <span>{ds}</span>
          </div>

          {/* Subject + controls row */}
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="w-full sm:w-48">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="border-slate-600 bg-slate-800/50 text-slate-200 hover:border-slate-500 focus:ring-emerald-500">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {!running ? (
                <Button
                  onClick={startTimer}
                  disabled={!selectedSubject}
                  className="h-10 gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-40"
                >
                  <Play className="h-4 w-4 fill-white" /> Start
                </Button>
              ) : (
                <Button
                  onClick={stopTimer}
                  variant="secondary"
                  className="h-10 gap-1.5 rounded-xl bg-slate-700 px-5 text-sm font-semibold text-slate-200 shadow-lg hover:bg-slate-600"
                >
                  <Square className="h-4 w-4" /> Pause
                </Button>
              )}
              <Button
                variant="outline"
                onClick={stopAndLog}
                disabled={elapsed < 10}
                className="h-10 gap-1.5 rounded-xl border-amber-600/50 bg-amber-600/10 px-5 text-sm font-semibold text-amber-500 shadow-lg shadow-amber-600/10 hover:bg-amber-600/20 hover:text-amber-400 disabled:opacity-40"
              >
                <Square className="h-4 w-4" /> Log
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetTimer}
                disabled={elapsed === 0}
                className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-300"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Running indicator */}
          {running && (
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-400/70">
                {selectedName}
              </span>
            </div>
          )}
          {!running && elapsed > 0 && elapsed < 10 && (
            <p className="text-[11px] text-slate-500">Log requires at least 10 seconds</p>
          )}
        </div>
      </div>

      {/* Session Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            <Clock className="h-4 w-4 text-emerald-600" />
            Session Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Clock className="h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-slate-500">No sessions logged yet</p>
              <p className="text-xs text-slate-400">Start the timer and log your first study session</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center justify-between px-1 py-2.5 text-sm"
                  >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-md border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider dark:border-slate-700"
                    >
                      {s.subjectName}
                    </Badge>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(s.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                      {formatDuration(s.durationMinutes)}
                    </span>
                    <button
                      onClick={() => removeStudySession(s.id)}
                      className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100 hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-subject breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            <Clock className="h-4 w-4 text-emerald-600" />
            Time Per Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.some((s) => (subjectTotals[s.name] ?? 0) > 0) ? (
            <div className="space-y-2">
              {subjects.map((s) => {
                const mins = subjectTotals[s.name] ?? 0;
                const pct = weekMin > 0 ? Math.round((mins / weekMin) * 100) : 0;
                if (mins === 0) return null;
                return (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    <span className={`w-20 shrink-0 text-xs font-semibold ${s.color}`}>
                      {s.shortName}
                    </span>
                    <div className="flex-1">
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-slate-500">
                      {formatDuration(mins)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">
              Log a session to see your time distribution
            </p>
          )}
        </CardContent>
      </Card>

      <style>{`
        @keyframes colon-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        .animate-colon-blink {
          animation: colon-blink 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
