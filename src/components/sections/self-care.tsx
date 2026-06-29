'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { HeartPulse, Plus, Trash2, Moon, Activity, AlertTriangle, Battery, Bed } from 'lucide-react';
import { usePrepStore } from '@/lib/store';
import { BURNOUT_SIGNS } from '@/lib/data';
import { useState, useMemo } from 'react';
import type { BurnoutLevel } from '@/lib/types';

const SEVERITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  green:  { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', label: 'Green' },
  yellow: { bg: 'bg-amber-100 dark:bg-amber-950',     text: 'text-amber-700 dark:text-amber-300',     label: 'Yellow' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-950',   text: 'text-orange-700 dark:text-orange-300',   label: 'Orange' },
  red:    { bg: 'bg-rose-100 dark:bg-rose-950',       text: 'text-rose-700 dark:text-rose-300',       label: 'Red' },
};

export function SelfCareView() {
  const { checkIns, addCheckIn, removeCheckIn } = usePrepStore();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [level, setLevel] = useState<BurnoutLevel>('green');
  const [sleep, setSleep] = useState('7.5');
  const [notes, setNotes] = useState('');

  const last7 = useMemo(() => checkIns.slice(-7), [checkIns]);
  const avgSleep = useMemo(() => {
    if (last7.length === 0) return null;
    return (last7.reduce((s, c) => s + c.sleepHours, 0) / last7.length).toFixed(1);
  }, [last7]);

  const handleAdd = () => {
    addCheckIn({
      date: new Date(date).toISOString(),
      level,
      sleepHours: parseFloat(sleep) || 0,
      notes: notes.trim() || undefined,
    });
    setNotes('');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-emerald-600" />
                Burnout Self-Care
              </CardTitle>
              <CardDescription className="mt-1">
                Burnout peaks in October and late December. Catch warning signs early &mdash; recover, don&rsquo;t push through.
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> Log Check-In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Weekly Self Check-In</DialogTitle>
                  <DialogDescription>Be honest. The data only helps if it&rsquo;s accurate.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-1">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>How are you feeling?</Label>
                    <Select value={level} onValueChange={(v) => setLevel(v as BurnoutLevel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Green &mdash; Energised, focused</SelectItem>
                        <SelectItem value="yellow">Yellow &mdash; Mild fatigue, some strain</SelectItem>
                        <SelectItem value="orange">Orange &mdash; Persistent fatigue, declining focus</SelectItem>
                        <SelectItem value="red">Red &mdash; Burnout symptoms, need recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Average sleep this week (hours/night)</Label>
                    <Input type="number" min="0" max="12" step="0.5" value={sleep} onChange={(e) => setSleep(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes (optional)</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What&rsquo;s working? What&rsquo;s not?" className="min-h-20" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd}>Save Check-In</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Vital signs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <Moon className="h-3.5 w-3.5" /> Avg Sleep (7d)
            </div>
            <div className={`text-3xl font-bold mt-1 ${avgSleep && parseFloat(avgSleep) >= 7 ? 'text-emerald-600' : avgSleep && parseFloat(avgSleep) >= 6 ? 'text-amber-600' : 'text-rose-600'}`}>
              {avgSleep ?? '—'}<span className="text-base text-slate-400">hr</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Target: 7-8 hr</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5" /> Check-Ins Logged
            </div>
            <div className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-50">
              {checkIns.length}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Weekly reflection</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <Battery className="h-3.5 w-3.5" /> Latest Status
            </div>
            <div className={`text-3xl font-bold mt-1 ${checkIns.length > 0 ? SEVERITY_COLORS[checkIns[checkIns.length - 1].level].text : 'text-slate-400'}`}>
              {checkIns.length > 0 ? SEVERITY_COLORS[checkIns[checkIns.length - 1].level].label : '—'}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Self-assessed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <Bed className="h-3.5 w-3.5" /> Red Flags (7d)
            </div>
            <div className={`text-3xl font-bold mt-1 ${last7.filter(c => c.level === 'red' || c.level === 'orange').length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {last7.filter(c => c.level === 'red' || c.level === 'orange').length}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Orange/Red check-ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning signs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Burnout Warning Signs &amp; Responses
          </CardTitle>
          <CardDescription>Read this every Sunday. Be honest with yourself.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {BURNOUT_SIGNS.map((sign, i) => (
            <div
              key={i}
              className={`flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-md ${SEVERITY_COLORS[sign.severity].bg}`}
            >
              <Badge className={`${SEVERITY_COLORS[sign.severity].text} ${SEVERITY_COLORS[sign.severity].bg} border-0 capitalize text-[10px] flex-shrink-0`}>
                {sign.severity}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{sign.sign}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  <span className="font-medium">Response:</span> {sign.response}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Check-in history */}
      {checkIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-In History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {[...checkIns].reverse().map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                      {new Date(c.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Badge className={`${SEVERITY_COLORS[c.level].text} ${SEVERITY_COLORS[c.level].bg} border-0 capitalize text-[10px]`}>
                      {c.level}
                    </Badge>
                    <span className="text-xs text-slate-500">· {c.sleepHours}h sleep</span>
                  </div>
                  {c.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">&ldquo;{c.notes}&rdquo;</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 flex-shrink-0" onClick={() => removeCheckIn(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recovery protocol */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-emerald-600" /> Recovery Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Sleep (non-negotiable)</p>
            <p className="text-xs">7-8 hours nightly. Sleep is when the brain consolidates learning. Cutting sleep to study produces net loss &mdash; sleep-deprived brain retains 40% less.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Exercise</p>
            <p className="text-xs">30 min moderate exercise, 5+ days/week. Increases prefrontal blood flow, regulates mood via endorphins, reduces cortisol. Regular exercisers score 3-5 marks higher.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Weekly Recovery</p>
            <p className="text-xs">Sunday afternoon off &mdash; no academic activity. Family, friends, hobbies, rest. This is recovery, not slacking. Brains that don&rsquo;t recover underperform.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
