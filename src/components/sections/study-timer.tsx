'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Play, Square, RotateCcw, Clock, Trash2, SkipForward, Settings,
} from 'lucide-react';
import { usePrepStore, todayStudyMinutes, weekStudyMinutes } from '@/lib/store';

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_CONFIG = {
  focus: { label: 'Focus', color: 'text-amber-400', stroke: '#fbbf24', track: 'rgba(251,191,36,0.12)', icon: '●' },
  shortBreak: { label: 'Short Break', color: 'text-emerald-400', stroke: '#34d399', track: 'rgba(52,211,153,0.12)', icon: '◐' },
  longBreak: { label: 'Long Break', color: 'text-sky-400', stroke: '#38bdf8', track: 'rgba(56,189,248,0.12)', icon: '◑' },
};

const DEFAULT_DURATIONS = { focus: 25, shortBreak: 5, longBreak: 15 };

const CIRCLES = { r: 130, cx: 160, cy: 160 };
const CIRCUMFERENCE = 2 * Math.PI * CIRCLES.r;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function StudyTimer() {
  const {
    subjects, studySessions, addStudySession, removeStudySession,
    timerRunning, timerStartTime, timerElapsed, setTimerState,
  } = usePrepStore();
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id ?? '');
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logMinutes, setLogMinutes] = useState(DEFAULT_DURATIONS.focus);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const totalTime = durations[mode] * 60;
  const progress = 1 - timeLeft / totalTime;

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

  const totalPomodoros = studySessions.filter((s) => s.durationMinutes >= durations.focus * 0.7).length;

  const recentSessions = useMemo(() => {
    return [...studySessions].reverse().slice(0, 20);
  }, [studySessions]);

  const selectedName = subjects.find((s) => s.id === selectedSubject)?.name ?? '';

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
    setMode(newMode);
    setTimeLeft(durations[newMode] * 60);
  }, [durations]);

  const completeTimer = useCallback((currentMode: PomodoroMode, currentCount: number, currentDurations: typeof durations, currentSubject: string) => {
    if (currentMode === 'focus') {
      const newCount = currentCount + 1;
      setPomodoroCount(newCount);

      const minutes = currentDurations.focus;
      const subject = subjects.find((s) => s.id === currentSubject);
      if (subject) {
        addStudySession({
          subjectId: subject.id,
          subjectName: subject.name,
          date: new Date().toISOString(),
          durationMinutes: minutes,
        });
      }

      const nextMode: PomodoroMode = newCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      setIsRunning(false);
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
      setMode(nextMode);
      setTimeLeft(currentDurations[nextMode] * 60);
    } else {
      setIsRunning(false);
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
      setMode('focus');
      setTimeLeft(currentDurations.focus * 60);
    }
  }, [subjects, addStudySession]);

  const completeRef = useRef(completeTimer);
  completeRef.current = completeTimer;

  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      completeRef.current(mode, pomodoroCount, durations, selectedSubject);
    }
  }, [timeLeft, isRunning, mode, pomodoroCount, durations, selectedSubject]);

  const startTimer = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
  }, [isRunning]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
  }, [durations, mode]);

  const skipTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(0);
  }, []);

  const manualLog = useCallback(() => {
    const subject = subjects.find((s) => s.id === selectedSubject);
    if (!subject || logMinutes < 1) return;
    addStudySession({
      subjectId: subject.id,
      subjectName: subject.name,
      date: new Date().toISOString(),
      durationMinutes: logMinutes,
    });
    setShowLogForm(false);
  }, [selectedSubject, subjects, addStudySession, logMinutes]);

  useEffect(() => { setLogMinutes(durations.focus); }, [durations.focus]);

  useEffect(() => {
    if (!isRunning) { clearInterval(intervalRef.current); intervalRef.current = undefined; return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => { clearInterval(intervalRef.current); };
  }, [isRunning]);

  // Ring glow intensity based on remaining time
  const glowIntensity = timeLeft <= 30 && timeLeft > 0 ? 0.6 + (1 - timeLeft / 30) * 0.4 : 0.15;
  const modeColor = MODE_CONFIG[mode];
  const isLastTen = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="space-y-6">
      {/* Today / Week stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Today</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatDuration(todayMin)}</p>
        </div>
        <div className="rounded-xl border border-sky-200/60 bg-sky-50/70 px-4 py-3 dark:border-sky-900/50 dark:bg-sky-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">This Week</p>
            <span className="text-[10px] font-medium text-slate-500">{Math.round((weekMin / weekGoalMin) * 100)}%</span>
          </div>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-sky-700 dark:text-sky-300">{formatDuration(weekMin)}</p>
          <Progress value={Math.min(100, (weekMin / weekGoalMin) * 100)} className="mt-2 h-1" />
        </div>
      </div>

      {/* Pomodoro timer instrument */}
      <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-6 shadow-2xl shadow-slate-900/50 dark:from-slate-950 dark:to-slate-900">
        {/* Mode tabs */}
        <div className="mx-auto mb-4 flex w-fit gap-1 rounded-lg bg-slate-800/60 p-0.5">
          {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { if (!isRunning) switchMode(m); }}
              disabled={isRunning}
              className={cn(
                'rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all',
                mode === m
                  ? `${MODE_CONFIG[m].color} bg-slate-700/80 shadow-sm`
                  : 'text-slate-500 hover:text-slate-300',
                isRunning && 'cursor-not-allowed opacity-50',
              )}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>

        <div className="mx-auto flex max-w-md flex-col items-center gap-5">
          {/* Circular countdown */}
          <div className="relative flex items-center justify-center">
            <svg width={320} height={320} className="-rotate-90">
              {/* Track ring */}
              <circle
                cx={CIRCLES.cx} cy={CIRCLES.cy} r={CIRCLES.r}
                fill="none"
                stroke="rgb(30 41 59)"
                strokeWidth="6"
              />
              {/* Progress ring */}
              <circle
                cx={CIRCLES.cx} cy={CIRCLES.cy} r={CIRCLES.r}
                fill="none"
                stroke={modeColor.stroke}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                style={{
                  transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
                  filter: `drop-shadow(0 0 ${12 + glowIntensity * 20}px ${modeColor.stroke}40)`,
                }}
              />
              {/* Inner glow ring */}
              <circle
                cx={CIRCLES.cx} cy={CIRCLES.cy} r={CIRCLES.r - 8}
                fill="none"
                stroke={modeColor.stroke}
                strokeWidth="1.5"
                strokeOpacity={0.08 + glowIntensity * 0.12}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke-opacity 0.3s ease' }}
              />
            </svg>

            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                'font-mono text-6xl font-bold tracking-[0.12em] tabular-nums sm:text-7xl',
                MODE_CONFIG[mode].color,
                isLastTen && 'animate-pulse',
              )}>
                {formatCountdown(timeLeft)}
              </span>
              <span className={cn(
                'mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                modeColor.color + '/70',
              )}>
                {mode === 'focus' ? selectedName || 'Focus' : MODE_CONFIG[mode].label}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                disabled={!selectedSubject && mode === 'focus'}
                className="h-11 w-11 rounded-full bg-amber-500 p-0 shadow-lg shadow-amber-500/30 hover:bg-amber-400 disabled:opacity-40"
              >
                <Play className="h-5 w-5 fill-white text-white ml-0.5" />
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                variant="secondary"
                className="h-11 w-11 rounded-full bg-slate-700 p-0 shadow-lg hover:bg-slate-600"
              >
                <Square className="h-4 w-4 text-slate-200" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={resetTimer}
              disabled={timeLeft === durations[mode] * 60 && !isRunning}
              className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-300"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTimer}
              className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-300"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Subject selector + settings toggle */}
          <div className="flex w-full items-center justify-center gap-3">
            <div className="w-44">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-8 border-slate-600 bg-slate-800/50 text-xs text-slate-300 hover:border-slate-500 focus:ring-amber-500">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-[11px] text-slate-500">
              <span className="font-semibold text-amber-400">{pomodoroCount}</span> / 4 pomodoros
            </span>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="h-7 w-7 rounded-full text-slate-500 hover:text-slate-300">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="w-full space-y-3 rounded-lg bg-slate-800/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Timer Durations (min)</p>
              <div className="grid grid-cols-3 gap-4">
                {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
                  <div key={m} className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">{MODE_CONFIG[m].label}</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={durations[m]}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
                          setDurations((prev) => ({ ...prev, [m]: v }));
                        }}
                        className="w-full rounded-md border border-slate-600 bg-slate-900/80 px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Running indicator */}
          {isRunning && (
            <div className="flex items-center gap-2">
              <span className={cn('h-1.5 w-1.5 animate-pulse rounded-full', mode === 'focus' ? 'bg-amber-400' : 'bg-emerald-400')} />
              <span className={cn('text-[10px] font-medium uppercase tracking-widest', modeColor.color + '/70')}>
                {mode === 'focus' ? selectedName : MODE_CONFIG[mode].label}
              </span>
            </div>
          )}

          {/* Manual log (only when idle) */}
          {!isRunning && (
            <div className="w-full">
              {!showLogForm ? (
                <button
                  onClick={() => { setShowLogForm(true); setLogMinutes(durations.focus); }}
                  className="mx-auto flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Clock className="h-3 w-3" /> Log Time Manually
                </button>
              ) : (
                <div className="mx-auto flex max-w-xs items-center gap-2 rounded-lg bg-slate-800/50 p-2.5">
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
                    className="w-16 rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-center text-sm font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-slate-400">min for</span>
                  <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[100px]">{selectedName || 'No subject'}</span>
                  <Button size="sm" onClick={manualLog} disabled={!selectedSubject || logMinutes < 1} className="h-7 rounded-md bg-amber-600 px-2.5 text-[10px] font-semibold hover:bg-amber-500">
                    Log
                  </Button>
                  <button onClick={() => setShowLogForm(false)} className="text-slate-500 hover:text-slate-300 text-xs px-1">✕</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pomodoro streak summary */}
      <div className="flex items-center justify-center gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Today</p>
          <p className="text-lg font-bold text-amber-500 dark:text-amber-400">{totalPomodoros}</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Cycle</p>
          <p className="text-lg font-bold text-slate-600 dark:text-slate-400">{pomodoroCount}/4</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Mode</p>
          <p className={cn('text-lg font-bold', modeColor.color)}>{MODE_CONFIG[mode].label}</p>
        </div>
      </div>

      {/* Session Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            <Clock className="h-4 w-4 text-amber-500" />
            Session Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Clock className="h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-slate-500">No sessions logged yet</p>
              <p className="text-xs text-slate-400">Complete a focus session to log it automatically</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSessions.map((s) => (
                <div key={s.id} className="group flex items-center justify-between px-1 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-md border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider dark:border-slate-700"
                    >
                      {s.subjectName}
                    </Badge>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                      {formatDuration(s.durationMinutes)}
                    </span>
                    <button
                      onClick={() => removeStudySession(s.id)}
                      className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
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
            <Clock className="h-4 w-4 text-amber-500" />
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
                    <span className={`w-20 shrink-0 text-xs font-semibold ${s.color}`}>{s.shortName}</span>
                    <div className="flex-1"><Progress value={pct} className="h-1.5" /></div>
                    <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-slate-500">{formatDuration(mins)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">Complete a focus session to see your time distribution</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
