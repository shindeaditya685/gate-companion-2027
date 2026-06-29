'use client';

import { useMemo, useState } from 'react';
import katex from 'katex';
import {
  BookOpen,
  Brain,
  Check,
  Code2,
  Edit3,
  FileText,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { cheatSheetProgress, usePrepStore } from '@/lib/store';
import type { CheatSheetDifficulty, CheatSheetItem } from '@/lib/types';

const ALL_SUBJECTS = 'all';
const ALL_DIFFICULTIES = 'all';
const ALL_STATUSES = 'all';

const DIFFICULTIES: { value: CheatSheetDifficulty; label: string; className: string }[] = [
  {
    value: 'must-know',
    label: 'Must know',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    value: 'frequent',
    label: 'Frequent',
    className: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  },
  {
    value: 'tricky',
    label: 'Tricky',
    className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  },
];

type CheatSheetForm = {
  name: string;
  subject: string;
  formula: string;
  difficulty: CheatSheetDifficulty;
  example: string;
  code: string;
  tags: string;
  notes: string;
};

const EMPTY_FORM: CheatSheetForm = {
  name: '',
  subject: '',
  formula: '',
  difficulty: 'must-know',
  example: '',
  code: '',
  tags: '',
  notes: '',
};

function difficultyMeta(difficulty?: CheatSheetDifficulty) {
  return DIFFICULTIES.find((item) => item.value === difficulty) ?? DIFFICULTIES[1];
}

function FormulaBlock({ formula }: { formula: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return '';
    }
  }, [formula]);

  if (!html) {
    return (
      <code className="block whitespace-pre-wrap break-words rounded-md border bg-white px-3 py-2 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        {formula}
      </code>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-md border bg-white px-3 py-2 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-100"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function itemToForm(item: CheatSheetItem): CheatSheetForm {
  return {
    name: item.name,
    subject: item.subject,
    formula: item.formula,
    difficulty: item.difficulty ?? 'frequent',
    example: item.example ?? '',
    code: item.code ?? '',
    tags: item.tags?.join(', ') ?? '',
    notes: item.notes ?? '',
  };
}

function parseTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function CheatSheetView() {
  const {
    cheatSheetItems,
    addCheatSheetItem,
    removeCheatSheetItem,
    toggleCheatSheetMastered,
    updateCheatSheetAIExplanation,
    updateCheatSheetItem,
    updateCheatSheetNotes,
  } = usePrepStore();

  const [query, setQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState(ALL_SUBJECTS);
  const [activeDifficulty, setActiveDifficulty] = useState(ALL_DIFFICULTIES);
  const [activeStatus, setActiveStatus] = useState(ALL_STATUSES);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CheatSheetItem | null>(null);
  const [form, setForm] = useState<CheatSheetForm>(EMPTY_FORM);
  const [explainingId, setExplainingId] = useState<string | null>(null);

  const progress = cheatSheetProgress(cheatSheetItems);

  const subjects = useMemo(
    () => Array.from(new Set(cheatSheetItems.map((item) => item.subject))).sort(),
    [cheatSheetItems]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return cheatSheetItems.filter((item) => {
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.example?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(q));

      const matchesSubject = activeSubject === ALL_SUBJECTS || item.subject === activeSubject;
      const matchesDifficulty =
        activeDifficulty === ALL_DIFFICULTIES || item.difficulty === activeDifficulty;
      const matchesStatus =
        activeStatus === ALL_STATUSES ||
        (activeStatus === 'mastered' ? item.mastered : !item.mastered);

      return matchesQuery && matchesSubject && matchesDifficulty && matchesStatus;
    });
  }, [activeDifficulty, activeStatus, activeSubject, cheatSheetItems, query]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, CheatSheetItem[]>>((groups, item) => {
      groups[item.subject] = [...(groups[item.subject] ?? []), item];
      return groups;
    }, {});
  }, [filteredItems]);

  const needsAttention = cheatSheetItems.filter((item) => !item.mastered && item.difficulty === 'must-know').length;

  const openAddDialog = () => {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      subject: activeSubject === ALL_SUBJECTS ? subjects[0] ?? '' : activeSubject,
    });
    setOpen(true);
  };

  const openEditDialog = (item: CheatSheetItem) => {
    setEditingItem(item);
    setForm(itemToForm(item));
    setOpen(true);
  };

  const saveItem = () => {
    const name = form.name.trim();
    const subject = form.subject.trim();
    const formula = form.formula.trim();

    if (!name || !subject || !formula) return;

    const data = {
      name,
      subject,
      formula,
      difficulty: form.difficulty,
      example: form.example.trim() || undefined,
      code: form.code.trim() || undefined,
      tags: parseTags(form.tags),
      notes: form.notes.trim() || undefined,
    };

    if (editingItem) {
      updateCheatSheetItem(editingItem.id, data);
    } else {
      addCheatSheetItem({
        ...data,
        mastered: false,
      });
    }

    setOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const explainItem = async (item: CheatSheetItem) => {
    setExplainingId(item.id);

    try {
      const response = await fetch('/api/cheat-sheet/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          formula: item.formula,
          subject: item.subject,
        }),
      });

      const data = (await response.json()) as { explanation?: string };
      updateCheatSheetAIExplanation(item.id, data.explanation ?? 'Could not generate explanation.');
    } catch {
      updateCheatSheetAIExplanation(item.id, 'AI explanation unavailable. Check the app connection and GROQ_API_KEY.');
    } finally {
      setExplainingId(null);
    }
  };

  const updateForm = <K extends keyof CheatSheetForm>(key: K, value: CheatSheetForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-emerald-600" />
                Formula Cheat Sheet
              </CardTitle>
              <CardDescription>
                Search, revise, and mark the formulas that need to become reflex before the final mock sprint.
              </CardDescription>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
              <div className="rounded-md border bg-slate-50 p-3 dark:bg-slate-900/50">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{progress.total}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Total</div>
              </div>
              <div className="rounded-md border bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{progress.pct}%</div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-700/70 dark:text-emerald-300/70">Mastered</div>
              </div>
              <div className="rounded-md border bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{needsAttention}</div>
                <div className="text-[10px] uppercase tracking-wider text-amber-700/70 dark:text-amber-300/70">Must-Know Left</div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Progress value={progress.pct} className="h-2 bg-slate-100 dark:bg-slate-800" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {progress.mastered} of {progress.total} formulas marked mastered.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_150px_140px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search formulas, tags, examples, notes..."
                className="pl-10"
              />
            </div>

            <Select value={activeSubject} onValueChange={setActiveSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUBJECTS}>All subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeDifficulty} onValueChange={setActiveDifficulty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DIFFICULTIES}>All levels</SelectItem>
                {DIFFICULTIES.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeStatus} onValueChange={setActiveStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>All status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="mastered">Mastered</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Formula' : 'Add Formula'}</DialogTitle>
                  <DialogDescription>
                    Keep entries short enough to scan during revision, but rich enough to remember the trap.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input
                        value={form.name}
                        onChange={(event) => updateForm('name', event.target.value)}
                        placeholder="e.g. Master Theorem"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Input
                        value={form.subject}
                        onChange={(event) => updateForm('subject', event.target.value)}
                        placeholder="e.g. Algorithms"
                        list="cheat-sheet-subjects"
                      />
                      <datalist id="cheat-sheet-subjects">
                        {subjects.map((subject) => (
                          <option key={subject} value={subject} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Formula</Label>
                    <Textarea
                      value={form.formula}
                      onChange={(event) => updateForm('formula', event.target.value)}
                      placeholder="Use plain text or LaTeX, e.g. T(n)=aT(n/b)+f(n)"
                      className="min-h-24 font-mono text-sm"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Difficulty</Label>
                      <Select
                        value={form.difficulty}
                        onValueChange={(value) => updateForm('difficulty', value as CheatSheetDifficulty)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTIES.map((difficulty) => (
                            <SelectItem key={difficulty.value} value={difficulty.value}>
                              {difficulty.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tags</Label>
                      <Input
                        value={form.tags}
                        onChange={(event) => updateForm('tags', event.target.value)}
                        placeholder="dp, recurrence, exam-trap"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Example</Label>
                    <Textarea
                      value={form.example}
                      onChange={(event) => updateForm('example', event.target.value)}
                      placeholder="A quick substitution or exam-style reminder"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Code / Steps</Label>
                    <Textarea
                      value={form.code}
                      onChange={(event) => updateForm('code', event.target.value)}
                      placeholder="Optional pseudocode, C snippet, or step checklist"
                      className="min-h-28 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Personal Notes</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(event) => updateForm('notes', event.target.value)}
                      placeholder="Your own mistake pattern or memory hook"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveItem} disabled={!form.name.trim() || !form.subject.trim() || !form.formula.trim()}>
                    {editingItem ? 'Save Changes' : 'Add Formula'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {filteredItems.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />
            <p className="font-medium text-slate-700 dark:text-slate-300">No formulas match the current filters.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
              Clear a filter or add the formula you expected to find.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([subject, items]) => (
            <Card key={subject}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  {subject}
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {items.map((item) => {
                  const difficulty = difficultyMeta(item.difficulty);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-md border bg-slate-50 p-3 transition-colors dark:bg-slate-900/50',
                        item.mastered && 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'
                      )}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</h3>
                            <Badge variant="outline" className={cn('text-[10px]', difficulty.className)}>
                              {difficulty.label}
                            </Badge>
                            {item.isUserAdded && (
                              <Badge variant="outline" className="text-[10px]">
                                Custom
                              </Badge>
                            )}
                            {item.mastered && (
                              <Badge className="bg-emerald-600 text-[10px] text-white">
                                <Check className="h-3 w-3" />
                                Mastered
                              </Badge>
                            )}
                          </div>

                          <FormulaBlock formula={item.formula} />

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {item.example && (
                            <div className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                <Lightbulb className="h-3.5 w-3.5" />
                                Example
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{item.example}</p>
                            </div>
                          )}

                          {item.code && (
                            <div className="rounded-md border bg-white dark:bg-slate-950">
                              <div className="flex items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <Code2 className="h-3.5 w-3.5" />
                                Steps / Code
                              </div>
                              <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                <code>{item.code}</code>
                              </pre>
                            </div>
                          )}

                          <div className="rounded-md border bg-white p-3 dark:bg-slate-950">
                            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              <StickyNote className="h-3.5 w-3.5" />
                              Personal Notes
                            </Label>
                            <Textarea
                              value={item.notes ?? ''}
                              onChange={(event) => updateCheatSheetNotes(item.id, event.target.value)}
                              placeholder="Add a memory hook, PYQ trap, or mistake pattern..."
                              className="min-h-16 text-sm"
                            />
                          </div>

                          {item.aiExplanation && (
                            <div className="rounded-md border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-900 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200">
                              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                                <Brain className="h-3.5 w-3.5" />
                                AI Explanation
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{item.aiExplanation}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 lg:w-36 lg:flex-col">
                          <Button
                            size="sm"
                            variant={item.mastered ? 'secondary' : 'outline'}
                            onClick={() => toggleCheatSheetMastered(item.id)}
                          >
                            <Check className="h-4 w-4" />
                            {item.mastered ? 'Done' : 'Master'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => explainItem(item)}
                            disabled={explainingId === item.id}
                          >
                            <Sparkles className="h-4 w-4" />
                            {explainingId === item.id ? 'Thinking' : 'Explain'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-rose-600"
                            onClick={() => removeCheatSheetItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
