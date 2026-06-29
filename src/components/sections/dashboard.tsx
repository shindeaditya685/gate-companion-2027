'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, TrendingUp, Flame, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { usePrepStore, overallCompletion, dueSRCount, recentMockAverage, getCurrentPhase } from '@/lib/store';
import { PHASES, scoreToRank } from '@/lib/data';
import { useMemo } from 'react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { subjects, srItems, mocks, gateDate, startDate } = usePrepStore();
  const currentPhase = getCurrentPhase(startDate, gateDate);

  const completion = overallCompletion(subjects);
  const dueToday = dueSRCount(srItems);
  const lastMock = mocks.length > 0 ? mocks[mocks.length - 1] : null;
  const recentAvg = recentMockAverage(mocks, 5);

  // Days to GATE
  const daysToGate = useMemo(() => {
    const ms = new Date(gateDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [gateDate]);

  // Days since start
  const daysSinceStart = useMemo(() => {
    const ms = Date.now() - new Date(startDate).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }, [startDate]);

  const phase = PHASES.find((p) => p.id === currentPhase)!;

  // Weak subjects count
  const weakCount = subjects.filter((s) => s.status === 'weak').length;
  const p0Subjects = subjects.filter((s) => s.priority === 'P0');

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-950">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <Calendar className="h-3.5 w-3.5" /> Days to GATE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
              {daysToGate}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              on {new Date(gateDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Overall Mastery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              {completion}<span className="text-lg text-slate-400">%</span>
            </div>
            <Progress value={completion} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Recent Mock Avg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              {recentAvg ?? '—'}<span className="text-lg text-slate-400">/100</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {recentAvg !== null && `~ ${scoreToRank(recentAvg).rank}`}
            </p>
          </CardContent>
        </Card>

        <Card className={dueToday > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Due Today (Spaced Rep.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${dueToday > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-50'}`}>
              {dueToday}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {dueToday > 0 ? 'Reviews pending' : 'All caught up!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current phase banner */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardDescription className="text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider text-[11px]">
                Current Phase · Day {daysSinceStart} of journey
              </CardDescription>
              <CardTitle className="text-2xl mt-1">
                Phase {phase.id}: {phase.name}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                {phase.window} · {phase.weeklyHours} hrs/week · {phase.goal}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => onNavigate('timeline')}
            >
              View Full Timeline
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 mt-1">
            {phase.milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two-column lower section */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* P0 subjects focus */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>P0 Critical Subjects</span>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('subjects')}>
                Manage <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardTitle>
            <CardDescription>
              These subjects decide your rank. {weakCount} of {subjects.length} subjects currently marked weak.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {p0Subjects.map((s) => {
              const done = s.mustMasterTopics.filter((t) => t.completed).length;
              const total = s.mustMasterTopics.length;
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={s.status === 'weak' ? 'destructive' : s.status === 'moderate' ? 'secondary' : 'default'}
                        className="text-[10px] uppercase"
                      >
                        {s.status}
                      </Badge>
                      <span className={`font-semibold ${s.color}`}>{pct}%</span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {done}/{total} topics · Target {s.targetMarks} marks · Weightage {s.weightage}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Last mock + last burnout */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Latest Mock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastMock ? (
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {lastMock.score}<span className="text-sm text-slate-400">/100</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {lastMock.name} · {new Date(lastMock.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {scoreToRank(lastMock.score).rank}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No mock logged yet. Take your diagnostic mock in August to set a baseline.
                </p>
              )}
              <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => onNavigate('mocks')}>
                Log Mock
              </Button>
            </CardContent>
          </Card>

          {dueToday > 0 && (
            <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Spaced Repetition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  You have <span className="font-bold text-amber-700 dark:text-amber-400">{dueToday}</span> review{dueToday > 1 ? 's' : ''} due today.
                </p>
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => onNavigate('spaced')}>
                  Review Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Exam day strategy reminder */}
      <Card className="bg-slate-50 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Today&rsquo;s Discipline
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-center font-bold">1</span>
            <p className="text-slate-700 dark:text-slate-300">Morning 2hr block on the hardest subject first.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-center font-bold">2</span>
            <p className="text-slate-700 dark:text-slate-300">Evening 2hr PYQ block on the same subject.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-center font-bold">3</span>
            <p className="text-slate-700 dark:text-slate-300">1.5hr revision of last week&rsquo;s topics + aptitude.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-center font-bold">4</span>
            <p className="text-slate-700 dark:text-slate-300">7-8 hours of sleep. Non-negotiable.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
