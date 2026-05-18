"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { streamChat } from "@/lib/agent-client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

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
      { page: pathname },
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
      (error) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `Error: ${error}` };
          return updated;
        });
        setIsStreaming(false);
      },
      history
    );
  }, [session, pathname, messages]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-[var(--color-navy-900)] hover:bg-[var(--color-navy-800)] rounded-full shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-6 w-[380px] h-[500px] bg-white border border-[var(--color-cream-700)] rounded-xl shadow-2xl flex flex-col z-50">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-cream-700)] bg-[var(--color-cream-300)] rounded-t-xl">
            <h3 className="font-semibold text-[var(--color-navy-900)]">Mind Mentor Tutor</h3>
            <button onClick={() => setIsOpen(false)} className="text-[var(--color-navy-800)]/60 hover:text-[var(--color-navy-900)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <ChatMessages messages={messages} isStreaming={isStreaming} />
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </div>
      )}
    </>
  );
}
