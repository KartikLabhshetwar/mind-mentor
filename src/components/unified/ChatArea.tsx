"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { QuizCard } from "./QuizCard";
import { MindMentorLogo } from "@/components/ui/MindMentorLogo";
import { FileText, BookOpen, MessageSquare } from "lucide-react";

export interface MessageContent {
  type: "text" | "quiz" | "resources" | "plan" | "pdf";
  data: string;
}

export interface Message {
  role: "user" | "assistant";
  content: MessageContent[];
}

function stripThinkingTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*/g, "").trim();
}

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  onQuizSubmit?: (quizId: string, answers: { questionIndex: number; answer: number }[], questions: { question: string; options: string[]; correctAnswer: number }[]) => void;
  onSend?: (message: string) => void;
}

export function ChatArea({ messages, isStreaming, onQuizSubmit, onSend }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderContent = (content: MessageContent, idx: number) => {
    switch (content.type) {
      case "quiz":
        try {
          const quizData = JSON.parse(content.data);
          return <QuizCard key={idx} quiz={quizData} onSubmit={onQuizSubmit} />;
        } catch {
          return null;
        }
      case "resources":
        try {
          const resources = JSON.parse(content.data);
          return (
            <div key={idx} className="grid gap-2 mt-2">
              {resources.items?.map((r: { title: string; url: string; description: string }, i: number) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="block bg-[var(--bg-surface)] rounded-lg p-3 hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--accent)]">{r.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{r.description}</p>
                </a>
              ))}
            </div>
          );
        } catch { return null; }
      case "plan":
        try {
          const plan = JSON.parse(content.data);
          return (
            <div key={idx} className="bg-[var(--bg-surface)] rounded-lg p-4 mt-2 border border-[var(--border-color)]">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{plan.name || "Study Plan"}</h4>
              {plan.weeks?.map((w: { title: string; tasks: string[] }, i: number) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-medium text-[var(--accent)]">{w.title}</p>
                  <ul className="text-xs text-[var(--text-secondary)] ml-4 list-disc">
                    {w.tasks?.map((t: string, j: number) => <li key={j}>{t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          );
        } catch { return null; }
      case "pdf":
        try {
          const pdfInfo = JSON.parse(content.data);
          return (
            <div key={idx} className="mt-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="w-12 h-14 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{pdfInfo.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{pdfInfo.pageCount} pages</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onSend?.(`Summarize this document`)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      <BookOpen className="h-3 w-3" />
                      Summarize
                    </button>
                    <button
                      onClick={() => onSend?.(`What are the key points in this document?`)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Key points
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        } catch { return null; }
      default: {
        const text = stripThinkingTags(content.data);
        if (!text) return null;
        return (
          <div key={idx} className="prose prose-sm max-w-none
            prose-p:my-1.5 prose-p:leading-relaxed
            prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
            prose-strong:text-[var(--accent)] prose-strong:font-semibold
            prose-code:text-[var(--accent)] prose-code:bg-[var(--bg-surface)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-pre:bg-[var(--bg-surface)] prose-pre:border prose-pre:border-[var(--border-color)] prose-pre:rounded-lg
            prose-li:my-0.5 prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        );
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">
              <MindMentorLogo size={40} />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">What would you like to learn?</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">
              Ask anything, generate quizzes with /quiz, find resources with /resources, or create study plans with /plan.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["Quiz me on calculus", "Find resources for data structures", "Create a study plan for finals"].map(s => (
                <button key={s} onClick={() => onSend?.(s)} className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex-shrink-0 flex items-center justify-center mt-1">
                <MindMentorLogo size={22} animate={false} />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                : ""
            }`}>
              {msg.content.map((c, idx) => renderContent(c, idx))}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex-shrink-0 flex items-center justify-center">
              <MindMentorLogo size={22} className="animate-pulse" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
