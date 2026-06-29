'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Play, Pause, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { usePrepStore, todayStudyMinutes, weekStudyMinutes } from '@/lib/store';

export function StudyTimer() {
  const { subjects, studySessions, addStudySession, removeStudySession } = usePrepStore();
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startTimeRef = useRef(0);

  const todayMin = todayStudyMinutes(studySessions);
  const weekMin = weekStudyMinutes(studySessions);
  const weekGoalMin = 30 * 60; // 30 hrs/week target

  const subjectSessions = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of studySessions) {
      map[s.subjectName] = (map[s.subjectName] ?? 0) + s.durationMinutes;
    }
    return map;
  }, [studySessions]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const startTimer = useCallback(() => {
    if (running) return;
    startTimeRef.current = Date.now() - elapsed * 1000;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    setRunning(true);
  }, [running, elapsed]);

  const pauseTimer = useCallback(() => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-emerald-600" />
            Study Timer
          </CardTitle>
          <CardDescription>
            Track focused study sessions by subject. Logged sessions appear below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Today / Week stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border bg-emerald-50 p-4 dark:bg-emerald-950/20">
              <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Today</p>
              <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{formatTime(todayMin * 60)}</p>
            </div>
            <div className="rounded-md border bg-sky-50 p-4 dark:bg-sky-950/20">
              <p className="text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300">This Week</p>
              <p className="mt-1 text-3xl font-bold text-sky-700 dark:text-sky-300">{formatTime(weekMin * 60)}</p>
              <Progress value={Math.min(100, (weekMin / weekGoalMin) * 100)} className="mt-2 h-1.5" />
              <p className="mt-1 text-[11px] text-slate-500">
                {Math.round((weekMin / weekGoalMin) * 100)}% of 30hr goal
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {/* Timer display */}
            <div className="text-6xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {formatTime(elapsed)}
            </div>

            {/* Subject selector */}
            <div className="w-full max-w-xs">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
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

            {/* Controls */}
            <div className="flex gap-3">
              {!running ? (
                <Button onClick={startTimer} disabled={!selectedSubject}>
                  <Play className="h-5 w-5 mr-1.5" /> Start
                </Button>
              ) : (
                <Button variant="secondary" onClick={pauseTimer}>
                  <Pause className="h-5 w-5 mr-1.5" /> Pause
                </Button>
              )}
              <Button
                variant="outline"
                onClick={stopAndLog}
                disabled={elapsed < 10}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" /> Stop & Log
              </Button>
              <Button variant="ghost" size="icon" onClick={resetTimer} disabled={running && elapsed === 0}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {elapsed > 0 && elapsed < 10 && (
              <p className="text-xs text-slate-400">Minimum 10 seconds to log a session</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No study sessions logged yet. Start the timer above!</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {s.subjectName}
                    </Badge>
                    <span className="text-slate-500 text-xs">
                      {new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {Math.floor(s.durationMinutes / 60)}h {s.durationMinutes % 60}m
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-rose-600"
                      onClick={() => removeStudySession(s.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-subject breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            Time Per Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subjects.map((s) => {
              const mins = subjectSessions[s.name] ?? 0;
              const pct = weekMin > 0 ? Math.round((mins / weekMin) * 100) : 0;
              return (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className={`w-24 font-medium ${s.color}`}>{s.shortName}</span>
                  <div className="flex-1">
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <span className="w-20 text-right font-mono text-xs text-slate-500">
                    {Math.floor(mins / 60)}h {mins % 60}m
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
