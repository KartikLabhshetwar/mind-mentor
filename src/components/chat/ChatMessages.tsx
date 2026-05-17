"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function stripThinkingTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*/g, "").trim();
}

export function ChatMessages({ messages, isStreaming }: { messages: Message[]; isStreaming: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-cream-100)]">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
          <div className="w-12 h-12 rounded-full bg-[var(--color-teal-900)]/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-teal-900)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0l.94.94a.75.75 0 11-1.06 1.06l-.94-.94m-12 0l-.94.94a.75.75 0 101.06 1.06l.94-.94" />
            </svg>
          </div>
          <p className="text-[var(--color-navy-800)] text-sm font-medium">Ask me anything about your studies</p>
          <p className="text-[var(--color-navy-800)]/60 text-xs">I remember your progress and adapt to your level</p>
        </div>
      )}

      {messages.map((msg, i) => {
        const displayContent = msg.role === "assistant" ? stripThinkingTags(msg.content) : msg.content;
        const isThinking = msg.role === "assistant" && isStreaming && i === messages.length - 1 && !displayContent;

        if (isThinking) return null;

        return (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-[var(--color-teal-900)]/10 flex-shrink-0 flex items-center justify-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-teal-900)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
              msg.role === "user"
                ? "bg-[var(--color-navy-900)] text-white"
                : "bg-white border border-[var(--color-cream-700)] text-[var(--color-navy-900)] shadow-sm"
            }`}>
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm">{displayContent}</p>
              ) : (
                <div className="prose prose-sm max-w-none
                  prose-p:my-1.5 prose-p:leading-relaxed prose-p:text-[var(--color-navy-900)]
                  prose-headings:text-[var(--color-navy-900)] prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
                  prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-wide
                  prose-strong:text-[var(--color-teal-900)] prose-strong:font-semibold
                  prose-code:text-[var(--color-teal-900)] prose-code:bg-[var(--color-cream-700)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                  prose-pre:bg-[var(--color-cream-500)] prose-pre:border prose-pre:border-[var(--color-cream-700)] prose-pre:rounded-lg prose-pre:my-2
                  prose-li:my-0.5 prose-li:text-[var(--color-navy-800)]
                  prose-ol:my-1.5 prose-ul:my-1.5
                  prose-hr:border-[var(--color-cream-700)] prose-hr:my-3
                  prose-a:text-[var(--color-teal-900)] prose-a:no-underline hover:prose-a:underline
                ">
                  <ReactMarkdown>{displayContent}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isStreaming && (
        <div className="flex justify-start gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-teal-900)]/10 flex-shrink-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-teal-900)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="bg-white border border-[var(--color-cream-700)] rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-[var(--color-teal-900)] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[var(--color-teal-900)] rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-[var(--color-teal-900)] rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
              <span className="text-xs text-[var(--color-navy-800)]/60">Thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
