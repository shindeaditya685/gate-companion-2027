'use client';

import { useEffect, useRef, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { usePrepStore, getSnapshot, saveToLocalStorage, loadFromLocalStorage } from '@/lib/store';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

export function MongoSyncProvider({ children }: { children: React.ReactNode }) {
  const store = usePrepStore();
  const [ready, setReady] = useState(false);
  const savedRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      const cached = loadFromLocalStorage();
      if (cached) store.loadFromMongo(cached);
      setReady(true);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    fetch('/api/prep', {
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          store.loadFromMongo(json.data);
          saveToLocalStorage(json.data);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        const cached = loadFromLocalStorage();
        if (cached) {
          store.loadFromMongo(cached);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setReady(true);
      });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const token = getToken();
    if (!token) return;

    const unsub = usePrepStore.subscribe((state) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const snapshot = getSnapshot(state);
        const serialized = JSON.stringify(snapshot);

        if (serialized === savedRef.current) return;
        savedRef.current = serialized;

        saveToLocalStorage(snapshot);

        fetch('/api/prep', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: serialized,
        }).catch(() => {
          toast.error('Failed to sync data to server');
        });
      }, 2000);
    });

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="animate-pulse text-sm text-slate-400">Loading your data...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
