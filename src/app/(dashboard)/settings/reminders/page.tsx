"use client";

import { ReminderSettings } from "@/components/settings/ReminderSettings";

export default function RemindersSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Reminder Settings</h1>
      <ReminderSettings />
    </div>
  );
}
