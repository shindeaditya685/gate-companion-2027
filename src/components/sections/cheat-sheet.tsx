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
  FlipHorizontal,
  Lightbulb,
  Plus,
  Printer,
  Search,
  Sparkles,
  StickyNote,
  Table2,
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
import { SEED_SUBJECTS } from '@/lib/data';
import { cheatSheetProgress, usePrepStore } from '@/lib/store';
import type { CheatSheetDifficulty, CheatSheetItem } from '@/lib/types';

const ALL_SUBJECTS = 'all';
const ALL_DIFFICULTIES = 'all';
const ALL_STATUSES = 'all';
const DEFAULT_SUBJECT = SEED_SUBJECTS[0]?.name ?? 'Engineering Mathematics';

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

type AIDraftItem = Partial<Pick<CheatSheetItem, 'name' | 'subject' | 'formula' | 'example' | 'code' | 'notes' | 'tags' | 'difficulty'>>;

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
  const [draftTopic, setDraftTopic] = useState('');
  const [draftSubject, setDraftSubject] = useState(DEFAULT_SUBJECT);
  const [draftDifficulty, setDraftDifficulty] = useState<CheatSheetDifficulty>('must-know');
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [mode, setMode] = useState<'list' | 'flashcard' | 'table'>('list');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const progress = cheatSheetProgress(cheatSheetItems);

  const subjects = useMemo(() => {
    const baseSubjects = SEED_SUBJECTS.map((subject) => subject.name);
    const extraSubjects = cheatSheetItems
      .map((item) => item.subject)
      .filter((subject) => !baseSubjects.includes(subject));

    return [...baseSubjects, ...Array.from(new Set(extraSubjects)).sort()];
  }, [cheatSheetItems]);

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
      subject: activeSubject === ALL_SUBJECTS ? draftSubject || subjects[0] || DEFAULT_SUBJECT : activeSubject,
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

  const draftWithAI = async () => {
    const topic = draftTopic.trim() || query.trim();
    if (!topic || !draftSubject) return;

    setDrafting(true);
    setDraftError('');

    try {
      const response = await fetch('/api/cheat-sheet/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject: draftSubject,
          difficulty: draftDifficulty,
        }),
      });

      const data = (await response.json()) as { item?: AIDraftItem; error?: string };

      if (!response.ok || !data.item?.formula) {
        throw new Error(data.error ?? 'AI draft unavailable.');
      }

      setEditingItem(null);
      setForm({
        name: data.item.name?.trim() || topic,
        subject: draftSubject,
        formula: data.item.formula.trim(),
        difficulty: data.item.difficulty ?? draftDifficulty,
        example: data.item.example ?? '',
        code: data.item.code ?? '',
        tags: data.item.tags?.join(', ') ?? '',
        notes: data.item.notes ?? '',
      });
      setOpen(true);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'AI draft unavailable.');
    } finally {
      setDrafting(false);
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

            <div className="flex gap-2">
              <Button
                variant={mode === 'flashcard' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => { setMode('flashcard'); setFlashcardIndex(0); setFlipped(false); }}
              >
                <FlipHorizontal className="h-4 w-4" />
                Flashcard
              </Button>
              <Button
                variant={mode === 'table' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setMode('table')}
              >
                <Table2 className="h-4 w-4" />
                Table
              </Button>
              <Button
                variant={mode === 'list' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setMode('list')}
              >
                <BookOpen className="h-4 w-4" />
                List
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
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
                      <Select
                        value={form.subject || DEFAULT_SUBJECT}
                        onValueChange={(value) => updateForm('subject', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Subject" />
                        </SelectTrigger>
                        <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
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
          </div>

          <div className="rounded-md border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-900 dark:bg-violet-950/20">
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_150px_auto]">
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <Input
                  value={draftTopic}
                  onChange={(event) => setDraftTopic(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && draftWithAI()}
                  placeholder="AI draft topic, e.g. FD closure, TCP AIMD, Master theorem..."
                  className="border-violet-200 bg-white pl-10 dark:border-violet-900 dark:bg-slate-950"
                />
              </div>

              <Select value={draftSubject} onValueChange={setDraftSubject}>
                <SelectTrigger className="w-full border-violet-200 bg-white dark:border-violet-900 dark:bg-slate-950">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={draftDifficulty}
                onValueChange={(value) => setDraftDifficulty(value as CheatSheetDifficulty)}
              >
                <SelectTrigger className="w-full border-violet-200 bg-white dark:border-violet-900 dark:bg-slate-950">
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

              <Button
                variant="secondary"
                onClick={draftWithAI}
                disabled={drafting || (!draftTopic.trim() && !query.trim())}
                className="border border-violet-200 bg-white text-violet-700 hover:bg-violet-100 dark:border-violet-900 dark:bg-slate-950 dark:text-violet-300 dark:hover:bg-violet-950"
              >
                <Sparkles className="h-4 w-4" />
                {drafting ? 'Drafting' : 'Draft'}
              </Button>
            </div>
            {draftError && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{draftError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; size: A4 portrait; }
        }
      `}</style>

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
      ) : mode === 'flashcard' ? (
        <Card>
          <CardHeader className="pb-3 no-print">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlipHorizontal className="h-4 w-4 text-emerald-600" />
              Flashcard Review
              <Badge variant="outline" className="ml-auto text-[10px]">
                {flashcardIndex + 1} / {filteredItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const item = filteredItems[flashcardIndex];
              if (!item) return <p className="text-slate-500">No flashcards available.</p>;
              const difficulty = difficultyMeta(item.difficulty);

              return (
                <div className="flex flex-col items-center gap-6">
                  <div
                    className="flex min-h-64 w-full max-w-lg cursor-pointer select-none"
                    onClick={() => setFlipped(!flipped)}
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className="relative h-full w-full transition-all duration-500"
                      style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    >
                      <div
                        className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-xl border-2 p-8 text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{item.name}</h3>
                        <Badge variant="outline" className={cn('text-xs', difficulty.className)}>
                          {difficulty.label}
                        </Badge>
                        {item.subject && (
                          <p className="text-xs text-slate-500">{item.subject}</p>
                        )}
                        <p className="mt-4 text-sm text-slate-400">Tap to reveal formula</p>
                      </div>
                      <div
                        className="absolute inset-0 flex min-h-64 w-full flex-col items-center justify-center rounded-xl border-2 p-8"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <div className="w-full">
                          <FormulaBlock formula={item.formula} />
                          {item.example && (
                            <div className="mt-4 rounded-md border border-sky-100 bg-sky-50 p-3 text-left text-sm dark:border-sky-900 dark:bg-sky-950/30">
                              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">Example</p>
                              <p className="mt-1 text-sky-900 dark:text-sky-200">{item.example}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 no-print">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (flashcardIndex > 0) { setFlashcardIndex(flashcardIndex - 1); setFlipped(false); }
                      }}
                      disabled={flashcardIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant={item.mastered ? 'secondary' : 'outline'}
                      onClick={() => toggleCheatSheetMastered(item.id)}
                    >
                      <Check className="h-4 w-4" />
                      {item.mastered ? 'Mastered' : 'Mark Mastered'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (flashcardIndex < filteredItems.length - 1) { setFlashcardIndex(flashcardIndex + 1); setFlipped(false); }
                      }}
                      disabled={flashcardIndex === filteredItems.length - 1}
                    >
                      Next
                    </Button>
                  </div>

                  {item.aiExplanation && (
                    <div className="w-full max-w-lg rounded-md border border-violet-100 bg-violet-50 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">AI Explanation</p>
                      <p className="mt-1 text-violet-900 dark:text-violet-200">{item.aiExplanation}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      ) : mode === 'table' ? (
        <div className="print-area space-y-6">
          {Object.entries(groupedItems).map(([subject, items]) => (
            <Card key={subject}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Table2 className="h-4 w-4 text-emerald-600" />
                  {subject}
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Algorithm</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Best</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Average</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Worst</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Space</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Equation / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((item) => {
                        const parts = item.notes ? item.notes.match(/Best\s+([^,]+),\s*(?:Avg\/)?Worst\s+([^,]+),\s*Space\s+([^.]+)\.?\s*(.*)/i) : null;
                        const best = parts?.[1]?.trim() ?? '—';
                        const worst = parts?.[2]?.trim() ?? '—';
                        const space = parts?.[3]?.trim() ?? '—';
                        const extra = parts?.[4]?.trim() ?? item.notes ?? '';
                        const avgMatch = item.notes?.match(/Avg\s+([^,]+)/i);
                        const avg = avgMatch?.[1]?.trim() ?? best;
                        return (
                          <tr
                            key={item.id}
                            className={cn(
                              'transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50',
                              item.mastered && 'bg-emerald-50/50 dark:bg-emerald-950/10'
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 dark:text-slate-50">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{best}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{avg}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{worst}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{space}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="max-w-xs"><FormulaBlock formula={item.formula} /></div>
                                {extra && (
                                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{extra}</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="print-area space-y-4">
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

                        <div className="no-print flex shrink-0 flex-wrap gap-2 lg:w-36 lg:flex-col">
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
