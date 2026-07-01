'use client';

import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, CalendarDays, Repeat,
  FileBarChart, ScrollText, FileText, Binary,
  Building2, HeartPulse, Timer, CheckSquare,
  X, Menu, GraduationCap, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  Icon: typeof LayoutDashboard;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { items: [{ id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard }] },
  {
    label: 'Study',
    items: [
      { id: 'subjects', label: 'Subjects', Icon: BookOpen },
      { id: 'timeline', label: 'Timeline', Icon: CalendarDays },
      { id: 'spaced', label: 'Spaced Rep.', Icon: Repeat },
    ],
  },
  {
    label: 'Practice',
    items: [
      { id: 'mocks', label: 'Mocks', Icon: FileBarChart },
      { id: 'pyq', label: 'PYQs', Icon: ScrollText },
      { id: 'cheatsheet', label: 'Cheat Sheet', Icon: FileText },
      { id: 'dsa', label: 'DSA Ref', Icon: Binary },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'timer', label: 'Timer', Icon: Timer },
      { id: 'todos', label: 'Todos', Icon: CheckSquare },
    ],
  },
  {
    label: 'Track',
    items: [
      { id: 'psu', label: 'PSU Tracker', Icon: Building2 },
      { id: 'selfcare', label: 'Self-Care', Icon: HeartPulse },
    ],
  },
];

export function Sidebar({
  activeTab,
  onNavigate,
  collapsed,
  onToggle,
}: {
  activeTab: string;
  onNavigate: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-3 z-40 lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full bg-slate-900 flex flex-col',
          'transition-all duration-300 ease-out',
          'sidebar-scroll-container',
          // Mobile: slide in/out
          mobileOpen ? 'translate-x-0 shadow-2xl shadow-slate-900/50' : '-translate-x-full',
          // Desktop: positioned by collapsed state (no translate)
          'lg:translate-x-0',
          collapsed ? 'lg:w-16' : 'lg:w-64',
        )}
      >
        {/* Brand row */}
        <div className={cn(
          'flex items-center h-14 shrink-0 border-b border-slate-800 transition-all',
          collapsed ? 'justify-center px-0' : 'justify-between px-4',
        )}>
          <div className={cn('flex items-center', collapsed ? 'gap-0' : 'gap-2.5')}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className={cn(
              'text-sm font-bold text-white tracking-tight truncate transition-opacity duration-200',
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100',
            )}>
              GATE CSE 2027
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-lg p-1 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? 'main'}>
              {group.label && (
                <div className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 transition-all duration-200',
                  collapsed ? 'h-0 opacity-0 overflow-hidden px-0 pb-0' : 'px-3 pt-4 pb-1',
                )}>
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ id, label, Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleNav(id)}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'relative w-full flex items-center rounded-lg text-sm transition-all duration-150',
                        collapsed ? 'justify-center h-10 px-0' : 'gap-3 px-3 py-2',
                        isActive
                          ? 'bg-emerald-500/10 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
                      )}
                    >
                      {isActive && (
                        <span className={cn(
                          'absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]',
                          collapsed ? 'left-0' : 'left-0',
                        )} />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-emerald-400' : 'text-slate-500',
                        )}
                      />
                      <span className={cn(
                        'truncate transition-opacity duration-200',
                        collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100',
                      )}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: target + toggle */}
        <div className={cn(
          'shrink-0 border-t border-slate-800 transition-all',
          collapsed ? 'px-2 py-3' : 'px-4 py-3',
        )}>
          <div className={cn(
            'flex items-center',
            collapsed ? 'justify-center' : 'justify-between',
          )}>
            <div className={cn(
              'items-center gap-2.5',
              collapsed ? 'hidden' : 'flex',
            )}>
              <div className="h-7 w-7 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-emerald-400">G</span>
              </div>
              <div className="leading-tight">
                <p className="text-xs font-medium text-slate-300">GATE 2027</p>
                <p className="text-[10px] text-slate-600">Rank &lt; 1,500</p>
              </div>
            </div>

            {/* Desktop toggle button */}
            <button
              onClick={onToggle}
              className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Collapsed reopen tab on desktop */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden lg:flex items-center justify-center h-12 w-4 bg-slate-900 rounded-r-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all border-r border-slate-700"
          aria-label="Expand sidebar"
        >
          <PanelLeft className="h-3 w-3" />
        </button>
      )}

      <style>{`
        .sidebar-scroll-container::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll-container::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 999px;
        }
        .sidebar-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </>
  );
}
