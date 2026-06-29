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
import { Repeat, Plus, Trash2, Check, Clock, CalendarCheck, AlertCircle } from 'lucide-react';
import { usePrepStore, dueSRCount } from '@/lib/store';
import { SEED_SUBJECTS } from '@/lib/data';
import { useState, useMemo } from 'react';

const REVIEW_DAYS: { key: 'reviewDay1' | 'reviewDay3' | 'reviewDay7' | 'reviewDay21' | 'reviewDay60'; label: string; day: number }[] = [
  { key: 'reviewDay1', label: 'Day 1', day: 1 },
  { key: 'reviewDay3', label: 'Day 3', day: 3 },
  { key: 'reviewDay7', label: 'Day 7', day: 7 },
  { key: 'reviewDay21', label: 'Day 21', day: 21 },
  { key: 'reviewDay60', label: 'Day 60', day: 60 },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function dueStatus(due: string, done: boolean): 'done' | 'due' | 'upcoming' {
  if (done) return 'done';
  if (new Date(due) <= new Date()) return 'due';
  return 'upcoming';
}

export function SpacedRepetitionView() {
  const { srItems, addSRItem, markSRReviewDone, removeSRItem } = usePrepStore();
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(SEED_SUBJECTS[0].id);
  const [chapter, setChapter] = useState('');
  const [learnedDate, setLearnedDate] = useState(new Date().toISOString().slice(0, 10));

  const dueToday = dueSRCount(srItems);

  // Sort: due today first, then by next due date
  const sortedItems = useMemo(() => {
    return [...srItems].sort((a, b) => {
      const aNextDue = REVIEW_DAYS.find((r) => !a[r.key]?.done)?.key;
      const bNextDue = REVIEW_DAYS.find((r) => !b[r.key]?.done)?.key;
      if (!aNextDue && !bNextDue) return 0;
      if (!aNextDue) return 1;
      if (!bNextDue) return -1;
      return new Date(a[aNextDue]!.due).getTime() - new Date(b[bNextDue]!.due).getTime();
    });
  }, [srItems]);

  const handleAdd = () => {
    if (!chapter.trim()) return;
    addSRItem({
      subjectId,
      chapter: chapter.trim(),
      learnedDate: new Date(learnedDate).toISOString(),
    });
    setChapter('');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Repeat className="h-5 w-5 text-emerald-600" />
                Spaced Repetition Tracker
              </CardTitle>
              <CardDescription className="mt-1">
                Schedule chapters on the 1-3-7-21-60 day cycle. Each review locks in retention.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{dueToday}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Due Today</div>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" /> Add Chapter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Chapter to Spaced Repetition</DialogTitle>
                    <DialogDescription>
                      Reviews will auto-schedule for days 1, 3, 7, 21, and 60 from the learned date.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Select value={subjectId} onValueChange={setSubjectId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEED_SUBJECTS.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Chapter / Topic</Label>
                      <Input
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        placeholder="e.g. Linear Algebra - Eigenvalues"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date Learned</Label>
                      <Input
                        type="date"
                        value={learnedDate}
                        onChange={(e) => setLearnedDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={!chapter.trim()}>Schedule Reviews</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Empty state */}
      {sortedItems.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <Repeat className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No chapters tracked yet.</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Add a chapter you just learned to auto-schedule 5 reviews on the 1-3-7-21-60 cycle.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const subject = SEED_SUBJECTS.find((s) => s.id === item.subjectId);
            const nextDue = REVIEW_DAYS.find((r) => !item[r.key]?.done);
            const allDone = !nextDue;
            return (
              <Card key={item.id} className={dueToday > 0 && nextDue && dueStatus(item[nextDue.key]!.due, false) === 'due' ? 'border-amber-300 dark:border-amber-800' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50">{item.chapter}</h3>
                        {subject && (
                          <Badge variant="outline" className={`text-[10px] ${subject.color}`}>
                            {subject.shortName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Learned on {fmtDate(item.learnedDate)}
                        {nextDue && (
                          <span className="ml-2">
                            · Next review: <span className={`font-medium ${dueStatus(item[nextDue.key]!.due, false) === 'due' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                              {fmtDate(item[nextDue.key]!.due)} ({nextDue.label})
                            </span>
                          </span>
                        )}
                        {allDone && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">· All reviews complete!</span>
                        )}
                      </p>

                      {/* Review pills */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {REVIEW_DAYS.map((r) => {
                          const review = item[r.key];
                          if (!review) return null;
                          const status = dueStatus(review.due, review.done);
                          return (
                            <button
                              key={r.key}
                              onClick={() => !review.done && markSRReviewDone(item.id, r.key)}
                              disabled={review.done}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                                status === 'done'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 cursor-default'
                                  : status === 'due'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 cursor-pointer'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                              }`}
                              title={review.done ? 'Done' : status === 'due' ? 'Click to mark done' : `Due ${fmtDate(review.due)}`}
                            >
                              {status === 'done' ? <Check className="h-3 w-3" /> : status === 'due' ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {r.label}
                              <span className="opacity-70">· {fmtDate(review.due)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                      onClick={() => removeSRItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Explanation card */}
      <Card className="bg-slate-50 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-emerald-600" /> Why Spaced Repetition?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
          <p>
            Without spaced revision, you forget approximately 60% of what you studied within three weeks.
            A student who completes Engineering Math in July and never revisits it until January is effectively
            re-learning the subject from scratch.
          </p>
          <p>
            The 1-3-7-21-60 day cycle drives retention from ~40% to 85%+ over a 60-day window. Each amber pill
            above is a click-to-complete review &mdash; tap it the moment you finish the review session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
