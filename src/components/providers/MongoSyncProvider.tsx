'use client';

import { useEffect, useRef } from 'react';
import { usePrepStore } from '@/lib/store';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

export function MongoSyncProvider({ children }: { children: React.ReactNode }) {
  const store = usePrepStore();
  const savedRef = useRef('');
  const loadingRef = useRef(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(`/api/prep?token=${token}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          loadingRef.current = true;
          store.loadFromMongo(json.data);
          loadingRef.current = false;
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
  }, []);

  useEffect(() => {
    if (loadingRef.current) return;

    const token = getToken();
    if (!token) return;

    const unsub = usePrepStore.subscribe((state) => {
      const snapshot = JSON.stringify({
        startDate: state.startDate,
        gateDate: state.gateDate,
        subjects: state.subjects,
        srItems: state.srItems,
        pyqAttempts: state.pyqAttempts,
        mocks: state.mocks,
        checkIns: state.checkIns,
        cheatSheetItems: state.cheatSheetItems,
      });

      if (snapshot === savedRef.current) return;
      savedRef.current = snapshot;

      fetch('/api/prep', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(JSON.parse(snapshot)),
      }).catch(() => {});
    });

    return unsub;
  }, []);

  return <>{children}</>;
}
