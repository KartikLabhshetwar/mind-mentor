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
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSave = async () => {
    if (!session?.token) return;
    setSaving(true);
    const success = await configureReminders(session.token, prefs);
    setSaving(false);
    if (success) setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
        <div>
          <p className="text-[var(--text-primary)] font-medium text-sm">Daily Study Reminder</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Get reminded to study at your preferred time</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="time" value={prefs.dailyReminder.time}
            onChange={(e) => setPrefs({ ...prefs, dailyReminder: { ...prefs.dailyReminder, time: e.target.value } })}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)]" />
          <input type="checkbox" checked={prefs.dailyReminder.enabled}
            onChange={(e) => setPrefs({ ...prefs, dailyReminder: { ...prefs.dailyReminder, enabled: e.target.checked } })}
            className="w-4 h-4 accent-[var(--accent)]" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
        <div>
          <p className="text-[var(--text-primary)] font-medium text-sm">Streak Warning</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Alert when your streak is at risk</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={prefs.streakWarning.hoursBeforeMidnight}
            onChange={(e) => setPrefs({ ...prefs, streakWarning: { ...prefs.streakWarning, hoursBeforeMidnight: Number(e.target.value) } })}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)]">
            <option value={2}>2h before</option>
            <option value={3}>3h before</option>
            <option value={4}>4h before</option>
          </select>
          <input type="checkbox" checked={prefs.streakWarning.enabled}
            onChange={(e) => setPrefs({ ...prefs, streakWarning: { ...prefs.streakWarning, enabled: e.target.checked } })}
            className="w-4 h-4 accent-[var(--accent)]" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
        <div>
          <p className="text-[var(--text-primary)] font-medium text-sm">Weekly Digest</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Get a weekly progress summary</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={prefs.weeklyDigest.day}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: { ...prefs.weeklyDigest, day: e.target.value } })}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)]">
            <option value="sunday">Sunday</option>
            <option value="saturday">Saturday</option>
            <option value="monday">Monday</option>
          </select>
          <input type="checkbox" checked={prefs.weeklyDigest.enabled}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: { ...prefs.weeklyDigest, enabled: e.target.checked } })}
            className="w-4 h-4 accent-[var(--accent)]" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
        <div>
          <p className="text-[var(--text-primary)] font-medium text-sm">Spaced Repetition Alerts</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Reminders to review topics at optimal intervals</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={prefs.spacedRepetition.intensity}
            onChange={(e) => setPrefs({ ...prefs, spacedRepetition: { ...prefs.spacedRepetition, intensity: e.target.value } })}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)]">
            <option value="relaxed">Relaxed</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <input type="checkbox" checked={prefs.spacedRepetition.enabled}
            onChange={(e) => setPrefs({ ...prefs, spacedRepetition: { ...prefs.spacedRepetition, enabled: e.target.checked } })}
            className="w-4 h-4 accent-[var(--accent)]" />
        </div>
      </div>

      <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
        <label className="text-[var(--text-primary)] font-medium text-sm block mb-2">Email Address</label>
        <input type="email" value={prefs.email}
          onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-3 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-medium transition-opacity">
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </button>
        <button
          onClick={async () => {
            if (!prefs.email) return;
            setSending(true);
            setSendResult(null);
            try {
              const res = await fetch("/api/reminders/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: prefs.email, name: session?.user?.name || "" }),
              });
              const data = await res.json();
              if (res.ok) {
                setSendResult({ ok: true, msg: "Test email sent!" });
              } else {
                setSendResult({ ok: false, msg: data.error || "Failed to send" });
              }
            } catch {
              setSendResult({ ok: false, msg: "Network error" });
            } finally {
              setSending(false);
              setTimeout(() => setSendResult(null), 4000);
            }
          }}
          disabled={sending || !prefs.email}
          className="px-5 py-3 bg-[var(--text-primary)] hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-medium transition-opacity text-sm"
        >
          {sending ? "Sending..." : "Send Test Email"}
        </button>
      </div>
      {sendResult && (
        <p className={`text-xs text-center mt-1 ${sendResult.ok ? "text-green-600" : "text-red-500"}`}>
          {sendResult.msg}
        </p>
      )}
    </div>
  );
}
