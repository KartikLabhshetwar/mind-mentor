import { Env } from "../types/index.js";

export function createExpressClient(env: Env) {
  const baseUrl = env.EXPRESS_BACKEND_URL;
  const headers = {
    "Content-Type": "application/json",
    "X-Agent-Secret": env.AGENT_SERVICE_SECRET,
  };

  return {
    async getStudySessions(userId: string) {
      const res = await fetch(`${baseUrl}/api/analytics/sessions/${userId}`, { headers });
      if (!res.ok) return null;
      return res.json();
    },

    async getTopicMastery(userId: string) {
      const res = await fetch(`${baseUrl}/api/topics/mastery/${userId}`, { headers });
      if (!res.ok) return [];
      return res.json();
    },

    async updateTopicMastery(userId: string, data: unknown) {
      const res = await fetch(`${baseUrl}/api/topics/mastery`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, ...data as object }),
      });
      return res.ok;
    },

    async getReminderPreferences(userId: string) {
      const res = await fetch(`${baseUrl}/api/reminders/preferences/${userId}`, { headers });
      if (!res.ok) return null;
      return res.json();
    },

    async saveChatMessage(userId: string, messages: unknown[]) {
      await fetch(`${baseUrl}/api/chat/history`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, messages }),
      });
    },

    async getChatHistory(userId: string) {
      const res = await fetch(`${baseUrl}/api/chat/history/${userId}`, { headers });
      if (!res.ok) return [];
      return res.json();
    },

    async curateResources(userId: string, subject: string): Promise<{
      success?: boolean;
      message?: string;
      resources?: { resources: { title: string; link: string; description: string }[] };
    } | null> {
      try {
        const res = await fetch(`${baseUrl}/curate-resources`, {
          method: "POST",
          headers,
          body: JSON.stringify({ userId, subject }),
        });
        return res.json();
      } catch {
        return null;
      }
    },

    async webSearch(query: string): Promise<{
      answer?: string | null;
      results: { title: string; url: string; content: string; score: number }[];
    } | null> {
      try {
        const res = await fetch(`${baseUrl}/web-search`, {
          method: "POST",
          headers,
          body: JSON.stringify({ query }),
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  };
}
