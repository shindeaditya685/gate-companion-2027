'use client';

import { useEffect, useRef } from 'react';
import { usePrepStore } from '@/lib/store';
import {
  registerServiceWorker,
  requestPermission,
  checkExamCountdown,
  checkDailyChallengeReminder,
  checkPhaseMilestone,
  sendBrowserNotification,
} from '@/lib/notifications';
import { getCurrentPhase } from '@/lib/store';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const gateDate = usePrepStore((s) => s.gateDate);
  const startDate = usePrepStore((s) => s.startDate);
  const prefs = usePrepStore((s) => s.notificationPrefs);
  const updatePrefs = usePrepStore((s) => s.updateNotificationPrefs);
  const streak = usePrepStore((s) => s.dailyChallenge.streak);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    registerServiceWorker();
    requestPermission();

    const check = () => {
      if (!prefs.enabled) return;

      // Exam countdown
      const cd = checkExamCountdown(gateDate, prefs);
      if (cd.shouldNotify && cd.milestone !== null) {
        sendBrowserNotification(
          `${cd.daysLeft} days to GATE!`,
          cd.daysLeft === 1
            ? 'Your GATE exam is TOMORROW. Stay calm, revise key formulas, get good sleep.'
            : `Only ${cd.daysLeft} days until GATE 2027. Keep pushing!`
        );
        updatePrefs({ lastNotifiedMilestones: [...prefs.lastNotifiedMilestones, cd.milestone] });
      }

      // Daily challenge reminder
      const dr = checkDailyChallengeReminder(prefs);
      if (dr.shouldNotify) {
        const dayNum = Object.keys(usePrepStore.getState().dailyChallenge.calendar).length + 1;
        sendBrowserNotification(
          'Daily Challenge Ready',
          `Day #${dayNum} is waiting. Open the app to attempt 10 GATE-level questions.`
        );
        updatePrefs({ lastDailyNotifDate: new Date().toISOString().slice(0, 10) });
      }

      // Phase milestone
      const phase = getCurrentPhase(startDate, gateDate);
      const pm = checkPhaseMilestone(phase, prefs);
      if (pm.shouldNotify) {
        const names = ['', 'Foundation', 'Practice & PYQs', 'Advanced & Mocks', 'Revision & Final'];
        sendBrowserNotification(
          `Phase ${phase} Started: ${names[phase] || ''}`,
          'Check the timeline for updated milestones and goals.'
        );
        updatePrefs({ lastPhaseNotified: phase });
      }

      // Streak reminder (if not completed today)
      const today = new Date().toISOString().slice(0, 10);
      const calendar = usePrepStore.getState().dailyChallenge.calendar;
      if (prefs.streakAlerts && streak >= 3 && !calendar[today]) {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 20 && hour < 23) {
          sendBrowserNotification(
            '🔥 Don\'t break your streak!',
            `You're on a ${streak}-day streak. Complete today's challenge before midnight.`
          );
        }
      }
    };

    // Check on mount
    const timer = setTimeout(check, 3000);

    // Check every 30 minutes
    const interval = setInterval(check, 30 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
