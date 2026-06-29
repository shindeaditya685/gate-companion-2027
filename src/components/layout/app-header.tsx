'use client';

import { GraduationCap, Github, ExternalLink } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-base text-slate-900 dark:text-slate-50">
              GATE Companion
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              CSE 2027 · BARC · NIC · ISRO
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://gateoverflow.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            GATE Overflow
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://www.isro.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            ISRO
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://barc.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            BARC
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://www.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            NIC
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
