'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, Circle, Flag } from 'lucide-react';
import { PHASES } from '@/lib/data';
import { usePrepStore, getCurrentPhase } from '@/lib/store';

export function TimelineView() {
  const { startDate, gateDate } = usePrepStore();
  const currentPhase = getCurrentPhase(startDate, gateDate);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            8-Month Master Timeline
          </CardTitle>
          <CardDescription>
            Four phases from July 2026 to February 2027. Your current phase is auto-detected based on today's date.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Vertical timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-5 sm:left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-300 via-amber-300 to-rose-300" />

        <div className="space-y-6">
          {PHASES.map((phase) => {
            const isActive = phase.id === currentPhase;
            const isPast = phase.id < currentPhase;
            return (
              <div key={phase.id} className="relative pl-14 sm:pl-16">
                {/* Dot */}
                <div
                  className={`absolute left-0 top-1 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                    isActive
                      ? 'bg-emerald-600 ring-4 ring-emerald-200 dark:ring-emerald-900'
                      : isPast
                      ? 'bg-slate-400'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="h-5 w-5" /> : phase.id}
                </div>

                <Card
                  className={`transition-all ${
                    isActive
                      ? 'border-emerald-300 dark:border-emerald-800 shadow-md bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-950'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">
                            Phase {phase.id}: {phase.name}
                          </CardTitle>
                          {isActive && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Active
                            </Badge>
                          )}
                          {isPast && (
                            <Badge variant="secondary">Completed</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {phase.window} · {phase.weeklyHours} hrs/week
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-3 rounded-md bg-slate-50 dark:bg-slate-900/50 border-l-2 border-emerald-500">
                      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Flag className="h-3 w-3" /> Primary Goal
                      </p>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{phase.goal}</p>
                    </div>

                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-medium">
                      Milestones
                    </p>
                    <ul className="space-y-1.5">
                      {phase.milestones.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Circle className="h-3 w-3 mt-1 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{m}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam day strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exam Day: The 180-Minute Battle</CardTitle>
          <CardDescription>How to allocate your time during GATE CSE 2027</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Time Window</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Activity</th>
                  <th className="text-right py-2 font-medium text-slate-500 dark:text-slate-400">Target</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { w: '0:00 - 0:10 (10 min)', a: 'Read entire paper. Mark easy (E), medium (M), hard (H). Do not solve yet.', t: '—' },
                  { w: '0:10 - 0:25 (15 min)', a: 'Solve all 5 easy 1-mark aptitude + 5 easy 1-mark technical.', t: '~10 marks' },
                  { w: '0:25 - 1:25 (60 min)', a: 'Solve all easy + medium 1-mark and 2-mark technical. Skip >3 min questions.', t: '~30 marks' },
                  { w: '1:25 - 1:40 (15 min)', a: 'Break. Drink water. Stretch. Re-read skipped questions.', t: '—' },
                  { w: '1:40 - 2:40 (60 min)', a: 'Attempt remaining medium + hard. Mind negative marking.', t: '~15 marks' },
                  { w: '2:40 - 3:00 (20 min)', a: 'Final pass: review all for silly mistakes. Verify NAT.', t: 'Save 2-3' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-900">
                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
                      {r.w}
                    </td>
                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{r.a}</td>
                    <td className="py-2 text-right text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                      {r.t}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
