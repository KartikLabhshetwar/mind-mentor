import { Hono } from "hono";
import { Env, ReminderPreferences } from "../types/index.js";
import { verifyUserAuth } from "../middleware/auth.js";
import { createExpressClient } from "../api/expressClient.js";
import { createResendClient, sendEmail } from "../email/resendClient.js";
import { createMem0Client, getUserMemories } from "../memory/mem0Client.js";
import { dailyReminderHtml } from "../email/templates/dailyReminder.js";
import { streakWarningHtml } from "../email/templates/streakWarning.js";
import { spacedRepetitionHtml } from "../email/templates/spacedRepetition.js";
import { weeklyDigestHtml } from "../email/templates/weeklyDigest.js";
import { milestoneHtml } from "../email/templates/milestone.js";

export const schedulerRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

schedulerRoutes.use("*", verifyUserAuth);

schedulerRoutes.post("/configure", async (c) => {
  const userId = c.get("userId");
  const preferences = await c.req.json<Partial<ReminderPreferences>>();

  const res = await fetch(`${c.env.EXPRESS_BACKEND_URL}/api/reminders/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Agent-Secret": c.env.AGENT_SERVICE_SECRET },
    body: JSON.stringify({ userId, ...preferences }),
  });

  if (!res.ok) return c.json({ error: "Failed to save preferences" }, 500);
  return c.json({ success: true });
});

schedulerRoutes.get("/status", async (c) => {
  const userId = c.get("userId");
  const express = createExpressClient(c.env);
  const prefs = await express.getReminderPreferences(userId);
  return c.json({ preferences: prefs, nextCheck: "within 1 hour" });
});

// Called by cron trigger
export async function runSchedulerCron(env: Env) {
  const express = createExpressClient(env);
  const resend = createResendClient(env);
  const mem0 = createMem0Client(env);

  const res = await fetch(`${env.EXPRESS_BACKEND_URL}/api/reminders/active-users`, {
    headers: { "Content-Type": "application/json", "X-Agent-Secret": env.AGENT_SERVICE_SECRET },
  });

  if (!res.ok) return;
  const { users } = await res.json() as { users: Array<{ userId: string; email: string; name: string; preferences: any }> };

  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  for (const user of users) {
    const { userId, email, name, preferences } = user;

    // Skip if paused due to ignored emails
    if (preferences.consecutiveIgnored >= 3) continue;

    const userHour = getCurrentHourInTimezone(preferences.timezone || "Asia/Kolkata");
    let emailsSentThisRun = 0;
    const maxEmails = preferences.maxEmailsPerDay || 2;

    // Quiet hours check (default: 22:00 - 07:00)
    const quietStart = parseInt(preferences.quietHoursStart || "22");
    const quietEnd = parseInt(preferences.quietHoursEnd || "7");
    if (isQuietHours(userHour, quietStart, quietEnd)) continue;

    // 1. Daily reminder
    if (preferences.dailyReminder?.enabled && emailsSentThisRun < maxEmails) {
      const reminderHour = parseInt(preferences.dailyReminder.time?.split(":")[0] || "19");
      if (userHour === reminderHour) {
        const memories = await getUserMemories(mem0, userId, "current study subject topic");
        const topic = extractTopicFromMemories(memories);
        const sent = await sendEmail(resend, email, `Time to study: ${topic}`,
          dailyReminderHtml({ name, subject: topic, topic, suggestedDuration: "45 minutes" })
        );
        if (sent) emailsSentThisRun++;
      }
    }

    // 2. Streak warning
    if (preferences.streakWarning?.enabled && emailsSentThisRun < maxEmails) {
      const hoursLeft = 24 - userHour;
      if (hoursLeft <= (preferences.streakWarning.hoursBeforeMidnight || 3)) {
        const sessions = await express.getStudySessions(userId) as any;
        const studiedToday = sessions?.todayCount > 0;
        if (!studiedToday && sessions?.currentStreak > 0) {
          const sent = await sendEmail(resend, email, `Your ${sessions.currentStreak}-day streak is at risk!`,
            streakWarningHtml({ name, streak: sessions.currentStreak, hoursLeft })
          );
          if (sent) emailsSentThisRun++;
        }
      }
    }

    // 3. Spaced repetition alerts
    if (preferences.spacedRepetition?.enabled && emailsSentThisRun < maxEmails) {
      const topics = await express.getTopicMastery(userId) as any[];
      const dueTopics = (topics || []).filter((t: any) => {
        if (!t.sm2?.nextReview) return false;
        return new Date(t.sm2.nextReview) <= now;
      });
      if (dueTopics.length > 0) {
        const dueTopic = dueTopics[0];
        const daysSince = Math.floor((now.getTime() - new Date(dueTopic.lastReviewed || now).getTime()) / (1000 * 60 * 60 * 24));
        const sent = await sendEmail(resend, email, `Review: ${dueTopic.topic}`,
          spacedRepetitionHtml({ name, topic: dueTopic.topic, daysSince, subject: dueTopic.subject })
        );
        if (sent) emailsSentThisRun++;
      }
    }

    // 4. Weekly digest (on user's configured day)
    if (preferences.weeklyDigest?.enabled && emailsSentThisRun < maxEmails) {
      const digestDay = preferences.weeklyDigest.day || "sunday";
      const currentDay = dayNames[now.getDay()];
      if (currentDay === digestDay && userHour === 18) {
        const sessions = await express.getStudySessions(userId) as any;
        const sent = await sendEmail(resend, email, "Your Weekly Learning Report",
          weeklyDigestHtml({
            name,
            totalHours: sessions?.weeklyHours || 0,
            sessionsCount: sessions?.weeklyCount || 0,
            streak: sessions?.currentStreak || 0,
            topTopics: sessions?.topTopics || [],
            recommendations: ["Continue your study plan", "Review weak topics"],
          })
        );
        if (sent) emailsSentThisRun++;
      }
    }

    // 5. Milestone detection
    if (emailsSentThisRun < maxEmails) {
      const sessions = await express.getStudySessions(userId) as any;
      const streak = sessions?.currentStreak || 0;
      // Check milestone thresholds
      if (streak === 7 || streak === 14 || streak === 30) {
        const sent = await sendEmail(resend, email, `Achievement: ${streak}-Day Streak!`,
          milestoneHtml({ name, achievement: `${streak}-Day Study Streak!`, nextGoal: `Reach ${streak + 7} days` })
        );
        if (sent) emailsSentThisRun++;
      }
    }
  }
}

function getCurrentHourInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone });
    return parseInt(formatter.format(new Date()));
  } catch {
    return new Date().getUTCHours();
  }
}

function isQuietHours(currentHour: number, start: number, end: number): boolean {
  if (start > end) {
    // Wraps midnight (e.g., 22-7)
    return currentHour >= start || currentHour < end;
  }
  return currentHour >= start && currentHour < end;
}

function extractTopicFromMemories(memories: unknown[]): string {
  if (!Array.isArray(memories) || memories.length === 0) return "your current subject";
  const first = memories[0] as { memory?: string; content?: string };
  return (first.memory || first.content || "your current subject").slice(0, 50);
}
