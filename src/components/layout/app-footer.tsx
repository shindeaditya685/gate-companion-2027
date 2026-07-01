import { cn } from '@/lib/utils';

export function AppFooter({ sidebarCollapsed = false }: { sidebarCollapsed?: boolean }) {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
      <div className={cn(
        'max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-68',
        'lg:pr-8',
      )}>
        <p>
          Built for personal prep · Data saved locally in your browser · No account needed
        </p>
        <p>
          Target: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rank &lt; 1,500 in GATE CSE 2027</span>
        </p>
      </div>
    </footer>
  );
}
