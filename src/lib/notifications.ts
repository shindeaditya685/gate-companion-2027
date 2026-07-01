'use client';

import type { NotificationPrefs } from './types';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: true,
  examCountdown: true,
  dailyChallengeReminder: true,
  dailyChallengeTime: '09:00',
  streakAlerts: true,
  phaseMilestones: true,
  lastNotifiedMilestones: [],
  lastDailyNotifDate: '',
  lastPhaseNotified: 0,
};

const MILESTONES = [90, 60, 30, 14, 7, 3, 1];

export function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then((p) => p === 'granted');
}

export function sendBrowserNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/logo.svg', badge: '/logo.svg' });
  } catch {}
}

export function checkExamCountdown(
  gateDate: string,
  prefs: NotificationPrefs,
): { shouldNotify: boolean; daysLeft: number; milestone: number | null } {
  if (!prefs.enabled || !prefs.examCountdown) return { shouldNotify: false, daysLeft: 0, milestone: null };

  const now = new Date();
  const gate = new Date(gateDate);
  const diff = gate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  for (const m of MILESTONES) {
    if (daysLeft === m && !prefs.lastNotifiedMilestones.includes(m)) {
      return { shouldNotify: true, daysLeft, milestone: m };
    }
  }
  return { shouldNotify: false, daysLeft, milestone: null };
}

export function checkDailyChallengeReminder(
  prefs: NotificationPrefs,
): { shouldNotify: boolean } {
  if (!prefs.enabled || !prefs.dailyChallengeReminder) return { shouldNotify: false };

  const today = new Date().toISOString().slice(0, 10);
  if (prefs.lastDailyNotifDate === today) return { shouldNotify: false };

  const [h, m] = prefs.dailyChallengeTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);

  if (now >= target && now.getTime() - target.getTime() < 5 * 60 * 1000) {
    return { shouldNotify: true };
  }
  return { shouldNotify: false };
}

export function checkPhaseMilestone(
  currentPhase: number,
  prefs: NotificationPrefs,
): { shouldNotify: boolean } {
  if (!prefs.enabled || !prefs.phaseMilestones) return { shouldNotify: false };
  if (currentPhase !== prefs.lastPhaseNotified && currentPhase > prefs.lastPhaseNotified) {
    return { shouldNotify: true };
  }
  return { shouldNotify: false };
}

export function checkStreak(
  streak: number,
  prefs: NotificationPrefs,
): { shouldNotify: boolean } {
  if (!prefs.enabled || !prefs.streakAlerts || streak < 3) return { shouldNotify: false };
  return { shouldNotify: false }; // streak check is done just before midnight; too complex for client-only
}

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.register('/sw.js').catch(() => null);
}
