import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Bot, User, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  page: number;
  content: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sourcePages?: number[];
  sources?: Source[];
  timestamp?: Date;
  _id?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  loading: boolean;
  onSubmit: (content: string) => void;
}

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key takeaways?",
  "Explain the main concepts",
];

export default function ChatInterface({
  messages,
  loading,
  onSubmit
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSubmit(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm rounded-xl border border-[var(--color-aqua-300)] shadow-sm relative overflow-hidden">
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-[var(--color-aqua-300)]/60 bg-white/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-teal-800)] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-navy-900)] tracking-tight">Scriba Assistant</h2>
            <p className="text-xs text-[var(--color-navy-700)]/70">Ask about your document</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 sm:px-4 py-3 sm:py-4">
        <div className="space-y-3 pb-2">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-14 w-14 rounded-2xl bg-[var(--color-aqua-100)] flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-[var(--color-teal-800)]" />
              </div>
              <p className="text-sm font-medium text-[var(--color-navy-900)] mb-1">Start a conversation</p>
              <p className="text-xs text-[var(--color-navy-700)]/60 text-center mb-5">Ask anything about this document</p>
              <div className="flex flex-col gap-2 w-full max-w-[260px]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSubmit(s)}
                    className="text-xs text-left px-3 py-2.5 rounded-lg border border-[var(--color-aqua-300)]/80 bg-white/60 text-[var(--color-navy-800)] hover:bg-[var(--color-aqua-100)]/50 hover:border-[var(--color-teal-800)]/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const messageId = message._id || `msg-${index}`;
            const isAssistant = message.role === 'assistant';
            const isLastMsg = index === messages.length - 1;

            if (isAssistant && !message.content?.trim() && isLastMsg && loading) return null;

            return (
              <div
                key={messageId}
                className={cn(
                  "flex gap-2 w-full message-in",
                  isAssistant ? 'justify-start' : 'justify-end'
                )}
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                {isAssistant && (
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-6 w-6 rounded-md bg-[var(--color-teal-800)] flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[80%] px-3 py-2.5 rounded-xl text-sm",
                    isAssistant
                      ? 'bg-white/80 border border-[var(--color-aqua-300)]/50 rounded-tl-sm text-[var(--color-navy-900)]'
                      : 'bg-[var(--color-navy-900)] text-white rounded-tr-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-1.5 gap-2">
                    {isAssistant && message.sourcePages && message.sourcePages.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {message.sourcePages.map((page) => (
                          <span
                            key={page}
                            className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-aqua-100)] text-[var(--color-teal-900)] font-medium"
                          >
                            <FileText className="h-2.5 w-2.5" />
                            p.{page}
                          </span>
                        ))}
                      </div>
                    )}
                    {message.timestamp && (
                      <span className={cn(
                        "text-[10px] ml-auto",
                        isAssistant ? 'text-[var(--color-navy-700)]/50' : 'text-white/50'
                      )}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
                {!isAssistant && (
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-6 w-6 rounded-md bg-[var(--color-aqua-500)] flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-[var(--color-navy-900)]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2 justify-start message-in">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-6 w-6 rounded-md bg-[var(--color-teal-800)] flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-white/80 border border-[var(--color-aqua-300)]/50">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-teal-800)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-teal-800)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-teal-800)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 sm:p-4 border-t border-[var(--color-aqua-300)]/60 bg-white/40 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this document..."
              disabled={loading}
              rows={1}
              className="w-full resize-none rounded-xl border border-[var(--color-aqua-300)] bg-white/80 px-4 py-3 text-sm text-[var(--color-navy-900)] placeholder:text-[var(--color-navy-700)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-800)]/30 focus:border-[var(--color-teal-800)]/50 transition-all disabled:opacity-50"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="icon"
            className="h-[42px] w-[42px] rounded-xl bg-[var(--color-navy-900)] hover:bg-[var(--color-navy-800)] text-white shadow-sm transition-all hover:shadow-md disabled:opacity-30 flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 