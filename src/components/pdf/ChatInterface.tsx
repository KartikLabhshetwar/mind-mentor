import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User } from "lucide-react";
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

export default function ChatInterface({
  messages,
  loading,
  onSubmit
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    if (!input.trim()) return;
    
    onSubmit(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border-2 border-black relative">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b border-black">
        <h2 className="text-lg font-semibold">Scriba Assistant</h2>
        <p className="text-sm text-muted-foreground">Ask questions about your document</p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3 sm:p-4 pb-[80px] sm:pb-[88px]">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const messageId = message._id || `msg-${index}`;
            
            return (
              <div
                key={messageId}
                className={cn(
                  "flex gap-2 sm:gap-3 w-full",
                  message.role === 'assistant' ? 'justify-start' : 'justify-end'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  </div>
                )}
                <Card
                  className={cn(
                    "max-w-[85%] sm:max-w-[80%] p-3 sm:p-4",
                    message.role === 'assistant' 
                      ? 'bg-primary/10 rounded-tl-none' 
                      : 'bg-secondary/10 rounded-tr-none'
                  )}
                >
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                      </span>
                      {message.timestamp && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' && message.sourcePages && message.sourcePages.length > 0 && (
                      <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
                        <span>Source pages: {message.sourcePages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </Card>
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-black z-20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 h-12 text-base px-4 rounded-full border-2 focus-visible:ring-2"
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            size="default"
            className="h-12 px-6 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-lg"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="ml-2 hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
} 