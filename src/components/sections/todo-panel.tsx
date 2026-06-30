'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, ListChecks,
} from 'lucide-react';
import { usePrepStore } from '@/lib/store';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';

  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function TodoPanel() {
  const { todoItems, subjects, addTodo, toggleTodo, removeTodo } = usePrepStore();
  const [cursor, setCursor] = useState(formatDate(new Date()));
  const [text, setText] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const dayTodos = useMemo(
    () => todoItems.filter((t) => t.date === cursor).sort((a, b) => a.order - b.order),
    [todoItems, cursor],
  );

  const doneCount = dayTodos.filter((t) => t.done).length;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addTodo({
      date: cursor,
      text: trimmed,
      done: false,
      subjectId: subjectId && subjectId !== 'none' ? subjectId : undefined,
      order: dayTodos.length,
      createdAt: new Date().toISOString(),
    });
    setText('');
  }

  function goToday() {
    setCursor(formatDate(new Date()));
  }

  function prevDay() {
    const d = new Date(cursor + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setCursor(formatDate(d));
  }

  function nextDay() {
    const d = new Date(cursor + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setCursor(formatDate(d));
  }

  const isToday = cursor === formatDate(new Date());

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <Button variant="ghost" size="icon" onClick={prevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={goToday}
          className="text-center select-none"
        >
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {formatLabel(cursor)}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {cursor}
          </p>
        </button>
        <Button variant="ghost" size="icon" onClick={nextDay} disabled={isToday}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Add todo form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Add a task…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="h-10 w-[130px] text-xs">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.shortName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!text.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Task list */}
      <Card>
        <CardContent className="p-0">
          {dayTodos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ListChecks className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-slate-500">No tasks for {formatLabel(cursor).toLowerCase()}</p>
              <p className="text-xs text-slate-400">Add a task above to get started</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {dayTodos.map((todo) => {
                const sub = todo.subjectId ? subjects.find((s) => s.id === todo.subjectId) : null;
                return (
                  <li
                    key={todo.id}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <Checkbox
                      checked={todo.done}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="shrink-0 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <span
                      className={`flex-1 text-sm leading-snug ${
                        todo.done
                          ? 'text-slate-400 line-through dark:text-slate-600'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {todo.text}
                    </span>
                    {sub && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-60 ${sub.color}`}
                      >
                        {sub.shortName}
                      </Badge>
                    )}
                    <button
                      onClick={() => removeTodo(todo.id)}
                      className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Footer summary */}
      {dayTodos.length > 0 && (
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          {doneCount} of {dayTodos.length} done
        </p>
      )}
    </div>
  );
}
