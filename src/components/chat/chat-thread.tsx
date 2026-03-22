'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './chat-message';
import { Loader2, Sparkles } from 'lucide-react';

interface ChatThreadProps {
  messages: any[];
  status: string;
}

export function ChatThread({ messages, status }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-[#497D74] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-lexend text-2xl font-bold text-[#27445D] mb-2">Mind Mentor</h2>
          <p className="text-[#538B81] text-sm mb-6">
            Ask me anything — I can help you study, create plans, find resources, and analyze documents.
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            {[
              'Create a study plan for calculus',
              'Find resources on machine learning',
              'Explain quantum computing',
              'Show my study stats',
            ].map((suggestion) => (
              <button key={suggestion}
                className="p-3 text-xs text-[#335775] bg-white border border-[#D5EBE7] rounded-xl hover:border-[#71BBB2] transition-colors text-left">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg: any) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {status === 'submitted' && (
          <div className="flex gap-3 px-4 py-6">
            <div className="w-8 h-8 rounded-full bg-[#497D74] flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[#538B81]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
