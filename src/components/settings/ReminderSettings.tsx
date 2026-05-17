"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { configureReminders } from "@/lib/agent-client";

export function ReminderSettings() {
  const { data: session } = useSession();
  const [prefs, setPrefs] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dailyReminder: { enabled: true, time: "19:00" },
    streakWarning: { enabled: true, hoursBeforeMidnight: 3 },
    weeklyDigest: { enabled: true, day: "sunday" },
    spacedRepetition: { enabled: true, intensity: "balanced" },
    email: session?.user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!session?.token) return;
    setSaving(true);
    const success = await configureReminders(session.token, prefs);
    setSaving(false);
    if (success) setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Daily Study Reminder</p>
          <p className="text-zinc-400 text-sm">Get reminded to study at your preferred time</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="time" value={prefs.dailyReminder.time}
            onChange={(e) => setPrefs({ ...prefs, dailyReminder: { ...prefs.dailyReminder, time: e.target.value } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100" />
          <input type="checkbox" checked={prefs.dailyReminder.enabled}
            onChange={(e) => setPrefs({ ...prefs, dailyReminder: { ...prefs.dailyReminder, enabled: e.target.checked } })}
            className="w-4 h-4 accent-indigo-600" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Streak Warning</p>
          <p className="text-zinc-400 text-sm">Alert when your streak is at risk</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={prefs.streakWarning.hoursBeforeMidnight}
            onChange={(e) => setPrefs({ ...prefs, streakWarning: { ...prefs.streakWarning, hoursBeforeMidnight: Number(e.target.value) } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100">
            <option value={2}>2h before</option>
            <option value={3}>3h before</option>
            <option value={4}>4h before</option>
          </select>
          <input type="checkbox" checked={prefs.streakWarning.enabled}
            onChange={(e) => setPrefs({ ...prefs, streakWarning: { ...prefs.streakWarning, enabled: e.target.checked } })}
            className="w-4 h-4 accent-indigo-600" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Weekly Digest</p>
          <p className="text-zinc-400 text-sm">Get a weekly progress summary</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={prefs.weeklyDigest.day}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: { ...prefs.weeklyDigest, day: e.target.value } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100">
            <option value="sunday">Sunday</option>
            <option value="saturday">Saturday</option>
            <option value="monday">Monday</option>
          </select>
          <input type="checkbox" checked={prefs.weeklyDigest.enabled}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: { ...prefs.weeklyDigest, enabled: e.target.checked } })}
            className="w-4 h-4 accent-indigo-600" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Spaced Repetition Alerts</p>
          <p className="text-zinc-400 text-sm">Reminders to review topics at optimal intervals</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={prefs.spacedRepetition.intensity}
            onChange={(e) => setPrefs({ ...prefs, spacedRepetition: { ...prefs.spacedRepetition, intensity: e.target.value } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100">
            <option value="relaxed">Relaxed</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <input type="checkbox" checked={prefs.spacedRepetition.enabled}
            onChange={(e) => setPrefs({ ...prefs, spacedRepetition: { ...prefs.spacedRepetition, enabled: e.target.checked } })}
            className="w-4 h-4 accent-indigo-600" />
        </div>
      </div>

      <div className="p-4 bg-zinc-800 rounded-lg">
        <label className="text-zinc-100 font-medium block mb-2">Email Address</label>
        <input type="email" value={prefs.email}
          onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
          className="w-full bg-zinc-700 border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100" />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium">
        {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}
