'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileBarChart, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePrepStore, recentMockAverage } from '@/lib/store';
import { scoreToRank } from '@/lib/data';
import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import type { MockEntry } from '@/lib/types';

const TYPE_OPTIONS = [
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'subject', label: 'Subject-wise' },
  { value: 'full', label: 'Full-length' },
];

export function MockTrackerView() {
  const { mocks, addMock, removeMock } = usePrepStore();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [type, setType] = useState<MockEntry['type']>('full');
  const [silly, setSilly] = useState('0');
  const [conceptual, setConceptual] = useState('0');
  const [timeMistakes, setTimeMistakes] = useState('0');
  const [notes, setNotes] = useState('');

  const recentAvg = recentMockAverage(mocks, 5);
  const trend = useMemo(() => {
    if (mocks.length < 2) return null;
    const last = mocks[mocks.length - 1].score;
    const prev = mocks[mocks.length - 2].score;
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'flat';
  }, [mocks]);

  // Aggregate mistake stats
  const mistakeStats = useMemo(() => {
    if (mocks.length === 0) return { silly: 0, conceptual: 0, time: 0, total: 0 };
    const sum = mocks.reduce((acc, m) => ({
      silly: acc.silly + m.mistakes.silly,
      conceptual: acc.conceptual + m.mistakes.conceptual,
      time: acc.time + m.mistakes.time,
      total: acc.total + m.mistakes.silly + m.mistakes.conceptual + m.mistakes.time,
    }), { silly: 0, conceptual: 0, time: 0, total: 0 });
    return sum;
  }, [mocks]);

  const chartData = mocks.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    score: m.score,
    name: m.name,
  }));

  const handleAdd = () => {
    const s = parseInt(score, 10);
    if (isNaN(s) || s < 0 || s > 100) return;
    addMock({
      date: new Date(date).toISOString(),
      name: name.trim() || `Mock ${mocks.length + 1}`,
      score: s,
      type,
      mistakes: {
        silly: parseInt(silly, 10) || 0,
        conceptual: parseInt(conceptual, 10) || 0,
        time: parseInt(timeMistakes, 10) || 0,
      },
      notes: notes.trim() || undefined,
    });
    // reset
    setName(''); setScore(''); setSilly('0'); setConceptual('0'); setTimeMistakes('0'); setNotes('');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-emerald-600" />
                Mock Test Tracker
              </CardTitle>
              <CardDescription className="mt-1">
                Log every mock. Track the trend. Categorise every mistake.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {recentAvg ?? '—'}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Last 5 Avg</div>
              </div>
              {trend && (
                <div className="text-center">
                  <div className={`text-xl font-bold flex items-center ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-400'}`}>
                    {trend === 'up' ? <TrendingUp className="h-5 w-5" /> : trend === 'down' ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Trend</div>
                </div>
              )}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" /> Log Mock
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Log Mock Test</DialogTitle>
                    <DialogDescription>Record score and mistake breakdown for analysis.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-1 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Score (/100)</Label>
                        <Input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 42" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mock Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Made Easy Mock #5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select value={type} onValueChange={(v) => setType(v as MockEntry['type'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mistake Breakdown</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] text-rose-600 uppercase tracking-wider mb-1">Silly</p>
                          <Input type="number" min="0" value={silly} onChange={(e) => setSilly(e.target.value)} className="h-9" />
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-600 uppercase tracking-wider mb-1">Conceptual</p>
                          <Input type="number" min="0" value={conceptual} onChange={(e) => setConceptual(e.target.value)} className="h-9" />
                        </div>
                        <div>
                          <p className="text-[10px] text-violet-600 uppercase tracking-wider mb-1">Time</p>
                          <Input type="number" min="0" value={timeMistakes} onChange={(e) => setTimeMistakes(e.target.value)} className="h-9" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes (optional)</Label>
                      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Pipeline numericals took too long" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={!score || parseInt(score, 10) > 100}>Save Mock</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chart */}
      {mocks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Trend</CardTitle>
            <CardDescription>
              {recentAvg !== null && (
                <>Last 5-mock average: <span className="font-semibold text-slate-900 dark:text-slate-50">{recentAvg}/100</span> &middot; Estimated rank: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{scoreToRank(recentAvg).rank}</span></>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => [`${v}/100`, 'Score']}
                />
                <ReferenceLine y={60} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target (60)', position: 'right', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={32} stroke="#f43f5e" strokeDasharray="5 5" label={{ value: 'GATE 2026 baseline', position: 'right', fill: '#f43f5e', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <FileBarChart className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No mocks logged yet.</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Take your diagnostic mock in August 2026 to set a baseline. Your GATE 2026 score (~25-32) is the starting point.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mistake analysis */}
      {mocks.length > 0 && mistakeStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mistake Pattern Analysis</CardTitle>
            <CardDescription>Aggregate of all logged mistakes. Address the dominant category first.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Silly Mistakes', count: mistakeStats.silly, container: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900', num: 'text-rose-600 dark:text-rose-400', desc: 'Calculation/reading errors under pressure' },
                { label: 'Conceptual Gaps', count: mistakeStats.conceptual, container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900', num: 'text-amber-600 dark:text-amber-400', desc: 'Did not know how to approach' },
                { label: 'Time Pressure', count: mistakeStats.time, container: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900', num: 'text-violet-600 dark:text-violet-400', desc: 'Could have solved, ran out of time' },
              ].map((m) => {
                const pct = mistakeStats.total === 0 ? 0 : Math.round((m.count / mistakeStats.total) * 100);
                return (
                  <div key={m.label} className={`p-4 rounded-lg border ${m.container}`}>
                    <div className={`text-3xl font-bold ${m.num}`}>
                      {m.count}
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">{m.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{pct}% of total</div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-snug">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mock history */}
      {mocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mock History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {[...mocks].reverse().map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-slate-50">{m.name}</span>
                    <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                    <Badge variant={m.score >= 60 ? 'default' : m.score >= 45 ? 'secondary' : 'destructive'} className="text-[10px]">
                      {scoreToRank(m.score).rank}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {m.notes && <span className="ml-2">· {m.notes}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${m.score >= 60 ? 'text-emerald-600' : m.score >= 45 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {m.score}
                  </div>
                  <div className="text-[10px] text-slate-400">/100</div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500" onClick={() => removeMock(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
