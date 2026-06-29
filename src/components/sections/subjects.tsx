'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, ChevronDown, ChevronRight, Library } from 'lucide-react';
import { usePrepStore, subjectCompletion, overallCompletion } from '@/lib/store';
import { useState } from 'react';
import type { SubjectStatus } from '@/lib/types';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS: { value: SubjectStatus; label: string; color: string }[] = [
  { value: 'weak', label: 'Weak', color: 'text-rose-600' },
  { value: 'moderate', label: 'Moderate', color: 'text-amber-600' },
  { value: 'solid', label: 'Solid', color: 'text-emerald-600' },
];

const PRIORITY_BADGE: Record<string, string> = {
  P0: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  P1: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  P2: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function SubjectsView() {
  const { subjects, toggleTopic, setSubjectStatus } = usePrepStore();
  const overall = overallCompletion(subjects);

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Library className="h-5 w-5 text-emerald-600" />
                Subject Mastery Tracker
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {subjects.length} subjects · {subjects.reduce((s, x) => s + x.mustMasterTopics.length, 0)} must-master topics
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{overall}%</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall mastery</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subjects accordion */}
      <Accordion type="multiple" className="space-y-3">
        {subjects.map((s) => {
          const completion = subjectCompletion(s);
          const doneCount = s.mustMasterTopics.filter((t) => t.completed).length;
          return (
            <AccordionItem
              key={s.id}
              value={s.id}
              className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <div className="flex items-center gap-3 flex-1 pr-4 text-left">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${s.color}`}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-50">{s.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${PRIORITY_BADGE[s.priority]}`}>
                        {s.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Weightage {s.weightage}</span>
                      <span>·</span>
                      <span>Target {s.targetMarks} marks</span>
                      <span>·</span>
                      <span>{doneCount}/{s.mustMasterTopics.length} topics</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block w-24">
                    <div className={`text-lg font-bold ${s.color}`}>{completion}%</div>
                    <Progress value={completion} className="h-1" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-0">
                <div className="space-y-4 mt-3 border-t border-slate-100 dark:border-slate-900 pt-4">
                  {/* Status setter + resource */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                        Self-Assessed Status
                      </label>
                      <Select
                        value={s.status}
                        onValueChange={(v) => setSubjectStatus(s.id, v as SubjectStatus)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className={opt.color}>{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                        Recommended Resource
                      </label>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {s.resource}
                      </p>
                    </div>
                  </div>

                  {/* Topic checklist */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mb-2">
                      Must-Master Topics
                    </p>
                    <div className="space-y-1.5">
                      {s.mustMasterTopics.map((t) => (
                        <label
                          key={t.id}
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={t.completed}
                            onCheckedChange={() => toggleTopic(s.id, t.id)}
                            className="mt-0.5"
                          />
                          <span className={`text-sm flex-1 ${t.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}`}>
                            {t.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mobile-only completion */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Completion</span>
                      <span className={`font-bold ${s.color}`}>{completion}%</span>
                    </div>
                    <Progress value={completion} className="h-1.5" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
