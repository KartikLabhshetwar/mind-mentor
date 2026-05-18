"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { streamChat } from "@/lib/agent-client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { data: session } = useSession();

  const handleSend = useCallback(async (message: string) => {
    if (!session?.token) return;

    const history = messages
      .filter((m) => m.content.trim())
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsStreaming(true);

    let assistantMessage = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      message,
      session.token,
      { page: "/chat" },
      (event) => {
        if (event.type === "text") {
          assistantMessage += event.data;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
            return updated;
          });
        }
      },
      () => setIsStreaming(false),
      () => setIsStreaming(false),
      history
    );
  }, [session, messages]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <h1 className="text-2xl font-bold text-zinc-100 mb-4">AI Tutor</h1>
      <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <ChatMessages messages={messages} isStreaming={isStreaming} />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
