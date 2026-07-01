'use client';

import { Bell, BellRing, CalendarClock, Sun, Flame, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePrepStore } from '@/lib/store';
import { requestPermission } from '@/lib/notifications';
import { useState } from 'react';

export function NotificationSettings() {
  const prefs = usePrepStore((s) => s.notificationPrefs);
  const updatePrefs = usePrepStore((s) => s.updateNotificationPrefs);
  const [permState, setPermState] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const handleEnable = async () => {
    const granted = await requestPermission();
    setPermState(granted ? 'granted' : 'denied');
    if (granted) updatePrefs({ enabled: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-500" />
          Notifications & Reminders
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Get reminded about exam milestones, daily challenges, and streaks.
        </p>
      </div>

      {/* Permission request */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
              Allow desktop notifications to receive exam reminders and daily alerts.
            </p>
            <Button size="sm" onClick={handleEnable}>
              <BellRing className="h-4 w-4 mr-1.5" />
              Enable Notifications
            </Button>
          </CardContent>
        </Card>
      )}

      {permState === 'denied' && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4 text-sm text-red-700 dark:text-red-300">
            Notifications are blocked in your browser. Enable them in site settings to receive reminders.
          </CardContent>
        </Card>
      )}

      {/* Main settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reminder Preferences</CardTitle>
          <CardDescription>Choose what you want to be reminded about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ToggleRow
            icon={<BellRing className="h-4 w-4" />}
            label="Enable notifications"
            description="Master toggle for all reminders"
            checked={prefs.enabled}
            onCheckedChange={(v) => updatePrefs({ enabled: v })}
          />

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4" />

          <ToggleRow
            icon={<CalendarClock className="h-4 w-4 text-emerald-600" />}
            label="Exam countdown"
            description={`Get notified at 90, 60, 30, 14, 7, 3, and 1 day before GATE 2027`}
            checked={prefs.examCountdown && prefs.enabled}
            onCheckedChange={(v) => updatePrefs({ examCountdown: v })}
            disabled={!prefs.enabled}
          />

          <ToggleRow
            icon={<Sun className="h-4 w-4 text-amber-500" />}
            label="Daily challenge reminder"
            description="Daily reminder to attempt your 10 GATE-level questions"
            checked={prefs.dailyChallengeReminder && prefs.enabled}
            onCheckedChange={(v) => updatePrefs({ dailyChallengeReminder: v })}
            disabled={!prefs.enabled}
          >
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="time"
                value={prefs.dailyChallengeTime}
                onChange={(e) => updatePrefs({ dailyChallengeTime: e.target.value })}
                disabled={!prefs.enabled || !prefs.dailyChallengeReminder}
                className="text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              />
            </div>
          </ToggleRow>

          <ToggleRow
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label="Streak alerts"
            description="Evening reminder if you haven&apos;t completed today&apos;s challenge (streak ≥ 3)"
            checked={prefs.streakAlerts && prefs.enabled}
            onCheckedChange={(v) => updatePrefs({ streakAlerts: v })}
            disabled={!prefs.enabled}
          />

          <ToggleRow
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
            label="Phase milestones"
            description="Get notified when you move to the next study phase"
            checked={prefs.phaseMilestones && prefs.enabled}
            onCheckedChange={(v) => updatePrefs({ phaseMilestones: v })}
            disabled={!prefs.enabled}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  icon, label, description, checked, onCheckedChange, disabled, children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 shrink-0 text-slate-500">{icon}</span>
        <div>
          <Label className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {label}
          </Label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          {children}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
