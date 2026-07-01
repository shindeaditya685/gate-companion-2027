'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
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
import { DailyQuestions } from '@/components/sections/daily-questions';
import { NotificationSettings } from '@/components/sections/notification-settings';
import { MockTest } from '@/components/sections/mock-test';
import { GateCalculator } from '@/components/calculator/gate-calculator';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { Sidebar } from '@/components/layout/sidebar';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Sidebar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <AppHeader sidebarCollapsed={sidebarCollapsed} />

      <main className={cn(
        'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64',
        'lg:pr-8',
      )}>
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'subjects' && <SubjectsView />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'spaced' && <SpacedRepetitionView />}
        {activeTab === 'daily' && <DailyQuestions />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'mocks' && <MockTrackerView />}
        {activeTab === 'pyq' && <PYQTrackerView />}
        {activeTab === 'cheatsheet' && <CheatSheetView />}
        {activeTab === 'dsa' && <DSATables />}
        {activeTab === 'psu' && <PSUTrackerView />}
        {activeTab === 'selfcare' && <SelfCareView />}
        {activeTab === 'mocktest' && <MockTest />}
        {activeTab === 'timer' && <StudyTimer />}
        {activeTab === 'todos' && <TodoPanel />}
        {activeTab === 'calculator' && <GateCalculator inline />}
      </main>

      <AppFooter sidebarCollapsed={sidebarCollapsed} />
    </div>
  );
}
