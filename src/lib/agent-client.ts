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

export async function streamChat(
  message: string,
  token: string,
  context: ChatContext,
  onEvent: (event: ChatEvent) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  try {
    const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8787";
    const response = await fetch(`${agentUrl}/agents/tutor/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      onError(`Agent error: ${response.status}`);
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const parser = createParser((event) => {
      if (event.type === "event") {
        if (event.event === "done") {
          onDone();
          return;
        }
        if (event.event === "error") {
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
        onDone();
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

export async function configureReminders(token: string, preferences: unknown) {
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8787";
  const res = await fetch(`${agentUrl}/agents/scheduler/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(preferences),
  });
  return res.ok;
}
