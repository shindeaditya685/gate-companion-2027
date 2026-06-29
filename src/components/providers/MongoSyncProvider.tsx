'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePrepStore } from '@/lib/store';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

export function MongoSyncProvider({ children }: { children: React.ReactNode }) {
  const store = usePrepStore();
  const savedRef = useRef('');
  const loadingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const token = getToken();
    if (!token) return;

    const controller = new AbortController();

    fetch('/api/prep', {
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then((json) => {
        if (!mountedRef.current) return;
        if (json.data) {
          loadingRef.current = true;
          store.loadFromMongo(json.data);
          loadingRef.current = false;
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          toast.error('Failed to sync data from server');
        }
      });

    return () => { mountedRef.current = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (loadingRef.current) return;

    const token = getToken();
    if (!token) return;

    const unsub = usePrepStore.subscribe((state) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const snapshot = JSON.stringify({
          startDate: state.startDate,
          gateDate: state.gateDate,
          subjects: state.subjects,
          srItems: state.srItems,
          pyqAttempts: state.pyqAttempts,
          mocks: state.mocks,
          checkIns: state.checkIns,
          cheatSheetItems: state.cheatSheetItems,
          studySessions: state.studySessions,
        });

        if (snapshot === savedRef.current) return;
        savedRef.current = snapshot;

        fetch('/api/prep', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: snapshot,
        }).catch(() => {
          toast.error('Failed to sync data to server');
        });
      }, 2000);
    });

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return <>{children}</>;
}
