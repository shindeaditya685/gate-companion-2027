'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, BookOpen, CalendarDays, Repeat,
  FileBarChart, FileText, Building2, HeartPulse, ScrollText, Timer,
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
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <AppHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 overflow-x-auto">
            <TabsList className="grid w-full min-w-[860px] grid-cols-9 h-auto">
              <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <BookOpen className="h-4 w-4" />
                Subjects
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <CalendarDays className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="spaced" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <Repeat className="h-4 w-4" />
                Spaced Rep.
              </TabsTrigger>
              <TabsTrigger value="mocks" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <FileBarChart className="h-4 w-4" />
                Mocks
              </TabsTrigger>
              <TabsTrigger value="pyq" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <ScrollText className="h-4 w-4" />
                PYQs
              </TabsTrigger>
              <TabsTrigger value="cheatsheet" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                Cheat Sheet
              </TabsTrigger>
              <TabsTrigger value="psu" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <Building2 className="h-4 w-4" />
                PSU Tracker
              </TabsTrigger>
              <TabsTrigger value="selfcare" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <HeartPulse className="h-4 w-4" />
                Self-Care
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex flex-col items-center gap-1 py-2 px-2 text-xs sm:text-sm">
                <Timer className="h-4 w-4" />
                Timer
              </TabsTrigger>
            </TabsList>
          </div>

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
          <TabsContent value="psu" className="mt-0">
            <PSUTrackerView />
          </TabsContent>
          <TabsContent value="selfcare" className="mt-0">
            <SelfCareView />
          </TabsContent>
          <TabsContent value="timer" className="mt-0">
            <StudyTimer />
          </TabsContent>
        </Tabs>
      </main>

      <AppFooter />
    </div>
  );
}
