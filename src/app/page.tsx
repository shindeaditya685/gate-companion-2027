'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, BookOpen, CalendarDays, Repeat,
  FileBarChart, FileText, Building2, HeartPulse, ScrollText, Timer, CheckSquare, Binary,
} from 'lucide-react';
import { Dashboard } from '@/components/sections/dashboard';
import { SubjectsView } from '@/components/sections/subjects';
import { TimelineView } from '@/components/sections/timeline';
import { SpacedRepetitionView } from '@/components/sections/spaced-repetition';
import { MockTrackerView } from '@/components/sections/mock-tracker';
import { PYQTrackerView } from '@/components/sections/pyq-tracker';
import { CheatSheetView } from '@/components/sections/cheat-sheet';
import { PSUTrackerView } from '@/components/sections/psu-tracker';
import { SelfCareView } from '@/components/sections/self-care';
import { StudyTimer } from '@/components/sections/study-timer';
import { TodoPanel } from '@/components/sections/todo-panel';
import { DSATables } from '@/components/sections/dsa-tables';
import { CalculatorToggle } from '@/components/calculator/calculator-toggle';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'subjects', label: 'Subjects', Icon: BookOpen },
  { id: 'timeline', label: 'Timeline', Icon: CalendarDays },
  { id: 'spaced', label: 'Spaced Rep.', Icon: Repeat },
  { id: 'mocks', label: 'Mocks', Icon: FileBarChart },
  { id: 'pyq', label: 'PYQs', Icon: ScrollText },
  { id: 'cheatsheet', label: 'Cheat Sheet', Icon: FileText },
  { id: 'dsa', label: 'DSA Ref', Icon: Binary },
  { id: 'psu', label: 'PSU Tracker', Icon: Building2 },
  { id: 'selfcare', label: 'Self-Care', Icon: HeartPulse },
  { id: 'timer', label: 'Timer', Icon: Timer },
  { id: 'todos', label: 'Todos', Icon: CheckSquare },
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <AppHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 overflow-x-auto">
            <TabsList className="gap-0">
              {TABS.map(({ id, label, Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={[
                    'flex-1 min-w-0',
                    'data-[state=active]:bg-gradient-to-b data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600',
                    'data-[state=active]:text-white',
                    'data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25',
                    'data-[state=active]:rounded-t-xl',
                    'data-[state=active]:-mb-px',
                    'data-[state=active]:border data-[state=active]:border-emerald-600 data-[state=active]:border-b-0',
                    'data-[state=active]:relative',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'h-4 w-4',
                      'data-[state=active]:animate-tab-pop',
                    ].join(' ')}
                    data-state={activeTab === id ? 'active' : 'inactive'}
                  />
                  <span className="truncate max-w-full">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <style>{`
            @keyframes tab-pop {
              0% { transform: scale(1); }
              40% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
            .animate-tab-pop {
              animation: tab-pop 300ms ease-out;
            }
          `}</style>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard onNavigate={setActiveTab} />
          </TabsContent>
          <TabsContent value="subjects" className="mt-0">
            <SubjectsView />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <TimelineView />
          </TabsContent>
          <TabsContent value="spaced" className="mt-0">
            <SpacedRepetitionView />
          </TabsContent>
          <TabsContent value="mocks" className="mt-0">
            <MockTrackerView />
          </TabsContent>
          <TabsContent value="pyq" className="mt-0">
            <PYQTrackerView />
          </TabsContent>
          <TabsContent value="cheatsheet" className="mt-0">
            <CheatSheetView />
          </TabsContent>
          <TabsContent value="dsa" className="mt-0">
            <DSATables />
          </TabsContent>
          <TabsContent value="psu" className="mt-0">
            <PSUTrackerView />
          </TabsContent>
          <TabsContent value="selfcare" className="mt-0">
            <SelfCareView />
          </TabsContent>
          <TabsContent value="timer" className="mt-0">
            <StudyTimer />
          </TabsContent>
          <TabsContent value="todos" className="mt-0">
            <TodoPanel />
          </TabsContent>
        </Tabs>
        <CalculatorToggle />
      </main>

      <AppFooter />
    </div>
  );
}
