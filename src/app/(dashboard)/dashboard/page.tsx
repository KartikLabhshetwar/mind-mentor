"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChatHistory } from "@/components/unified/ChatHistory";
import { ChatArea, type Message, type MessageContent } from "@/components/unified/ChatArea";
import { ChatInput } from "@/components/unified/ChatInput";
import { streamChat } from "@/lib/agent-client";
import { PanelRight } from "lucide-react";

export default function UnifiedDashboard() {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = useCallback(async (message: string) => {
    if (!session?.token) return;

    const command = message.startsWith("/") ? message.split(" ")[0].slice(1) : undefined;
    const userMsg: Message = { role: "user", content: [{ type: "text", data: message }] };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const structuredContent: MessageContent[] = [];
    let currentText = "";
    setMessages(prev => [...prev, { role: "assistant", content: [] }]);

    await streamChat(
      message,
      session.token,
      { page: "/dashboard", command },
      (event) => {
        if (event.type === "text") {
          currentText += event.data;
          const textContent: MessageContent = { type: "text", data: currentText };
          const nonTextContent = structuredContent.filter(c => c.type !== "text");
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: [textContent, ...nonTextContent] };
            return updated;
          });
        } else {
          structuredContent.push(event);
          const textContent = currentText ? [{ type: "text" as const, data: currentText }] : [];
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: [...textContent, ...structuredContent] };
            return updated;
          });
        }
      },
      () => setIsStreaming(false),
      () => setIsStreaming(false)
    );
  }, [session]);

  const handleQuizSubmit = async (quizId: string, answers: { questionIndex: number; answer: number }[]) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
    } catch { /* silent */ }
  };

  return (
    <div className="unified-dark h-screen flex bg-[var(--bg-primary)] overflow-hidden">
      <div className="hidden md:block">
        <ChatHistory
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectConversation={setActiveConversationId}
          activeConversationId={activeConversationId}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)]">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Mind Mentor</h1>
          <button
            onClick={() => setContextPanelOpen(!contextPanelOpen)}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <PanelRight className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <ChatArea messages={messages} isStreaming={isStreaming} onQuizSubmit={handleQuizSubmit} />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>

      {contextPanelOpen && (
        <div className="hidden lg:block w-72 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Context panel loading...</p>
        </div>
      )}
    </div>
  );
}
