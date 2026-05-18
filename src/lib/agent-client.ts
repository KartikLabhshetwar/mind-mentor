import { createParser } from "eventsource-parser";

export interface ChatContext {
  page?: string;
  subject?: string;
  command?: string;
  topic?: string;
  pdfId?: string;
}

export interface ChatEvent {
  type: "text" | "quiz" | "resources" | "plan";
  data: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(
  message: string,
  token: string,
  context: ChatContext,
  onEvent: (event: ChatEvent) => void,
  onDone: () => void,
  onError: (error: string) => void,
  history?: ChatHistoryMessage[]
) {
  try {
    const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8787";
    const response = await fetch(`${agentUrl}/agents/tutor/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, context, history }),
    });

    if (!response.ok) {
      onError(`Agent error: ${response.status}`);
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let finished = false;
    const parser = createParser((event) => {
      if (event.type === "event") {
        if (event.event === "done") {
          finished = true;
          onDone();
          return;
        }
        if (event.event === "error") {
          finished = true;
          onError(event.data);
          return;
        }

        const eventType = (event.event || "text") as ChatEvent["type"];
        if (["text", "quiz", "resources", "plan"].includes(eventType)) {
          onEvent({ type: eventType, data: event.data });
        } else {
          onEvent({ type: "text", data: event.data });
        }
      }
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (!finished) onDone();
        break;
      }
      parser.feed(decoder.decode(value));
    }
  } catch {
    onError("Connection failed");
  }
}

export async function triggerAnalysis(token: string, type: "full" | "quick") {
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8787";
  const res = await fetch(`${agentUrl}/agents/analyst/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMemories(token: string): Promise<{ id: string; text: string }[]> {
  try {
    const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8787";
    const res = await fetch(`${agentUrl}/agents/analyst/insights`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.memories || [];
    const memories = Array.isArray(raw) ? raw : raw.results || [];
    return memories.map((m: { id?: string; memory?: string; content?: string }, i: number) => ({
      id: m.id || String(i),
      text: m.memory || m.content || "",
    })).filter((m: { text: string }) => m.text);
  } catch {
    return [];
  }
}

export async function configureReminders(token: string, preferences: unknown) {
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8787";
  const res = await fetch(`${agentUrl}/agents/scheduler/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(preferences),
  });
  return res.ok;
}
