"use client";

import { ReminderSettings } from "@/components/settings/ReminderSettings";

export default function RemindersSettingsPage() {
  return (
    <div className="unified-dark max-w-2xl mx-auto py-2">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Reminder Settings</h1>
      <ReminderSettings />
    </div>
  );
}
