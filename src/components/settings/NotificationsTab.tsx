"use client";

import { Bell, Clock, Globe, Mail } from "lucide-react";
import { useState } from "react";
import { Button, Card, FieldLabel, Select } from "@/components/zedu";

export function NotificationsTab() {
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [dueTodayAlerts, setDueTodayAlerts] = useState(true);
  const [callbackAlerts, setCallbackAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task & Activity Alerts */}
        <Card title="Task & Activity Notifications" icon={<Bell aria-hidden />}>
        <div className="flex flex-col divide-y divide-z-line">
          <label className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-z-small font-medium text-z-fg">Overdue task alerts</span>
              <span className="text-z-caption text-z-fg-muted">
                Display the red alert indicator in the navigation top bar when tasks pass their due date.
              </span>
            </div>
            <input
              type="checkbox"
              checked={overdueAlerts}
              onChange={(e) => setOverdueAlerts(e.target.checked)}
              className="mt-1 size-4 rounded-z-xs border-z-line text-z-primary focus:ring-z-focus"
            />
          </label>

          <label className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-z-small font-medium text-z-fg">Tasks due today</span>
              <span className="text-z-caption text-z-fg-muted">
                Highlight open tasks due within today's calendar window on the dashboard and task board.
              </span>
            </div>
            <input
              type="checkbox"
              checked={dueTodayAlerts}
              onChange={(e) => setDueTodayAlerts(e.target.checked)}
              className="mt-1 size-4 rounded-z-xs border-z-line text-z-primary focus:ring-z-focus"
            />
          </label>

          <label className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-z-small font-medium text-z-fg">Call callback reminders</span>
              <span className="text-z-caption text-z-fg-muted">
                Receive prompt reminders when a scheduled outbound callback date is reached.
              </span>
            </div>
            <input
              type="checkbox"
              checked={callbackAlerts}
              onChange={(e) => setCallbackAlerts(e.target.checked)}
              className="mt-1 size-4 rounded-z-xs border-z-line text-z-primary focus:ring-z-focus"
            />
          </label>

          <label className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 cursor-pointer">
            <div className="flex flex-col">
              <span className="text-z-small font-medium text-z-fg">Daily morning digest</span>
              <span className="text-z-caption text-z-fg-muted">
                Receive an email summary of assigned leads, new activities, and upcoming tasks at 8:00 AM.
              </span>
            </div>
            <input
              type="checkbox"
              checked={dailyDigest}
              onChange={(e) => setDailyDigest(e.target.checked)}
              className="mt-1 size-4 rounded-z-xs border-z-line text-z-primary focus:ring-z-focus"
            />
          </label>
        </div>
      </Card>

      {/* Regional & Timezone Preferences */}
      <Card title="Regional & Schedule Settings" icon={<Globe aria-hidden />}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="timezone-select">Workspace Timezone</FieldLabel>
            <select
              id="timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-9 w-full rounded-z-md border border-z-line bg-z-surface px-3 text-z-small text-z-fg transition hover:border-z-line-hover focus:outline-none focus:ring-1 focus:ring-z-focus"
            >
              <option value="Africa/Lagos">West Africa Time (WAT) — Lagos (GMT+1)</option>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
              <option value="Europe/London">Greenwich Mean Time / BST — London (GMT+0/+1)</option>
              <option value="America/New_York">Eastern Time (ET) — New York (GMT-5/-4)</option>
            </select>
            <p className="text-z-caption text-z-fg-muted">
              Used for call timestamps, task due calculations, and calendar grouping.
            </p>
          </div>
        </div>
      </Card>
      </div>

      {saved && (
        <p role="status" className="rounded-z-md bg-z-status-success/10 px-3 py-2 text-z-small text-z-fg-success">
          Notification and schedule preferences saved.
        </p>
      )}

      <div>
        <Button onClick={handleSave}>Save preferences</Button>
      </div>
    </div>
  );
}
