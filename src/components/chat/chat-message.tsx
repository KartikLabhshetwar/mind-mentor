'use client';

import { useState } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ToolRenderer } from './tool-results/tool-renderer';

interface ChatMessageProps {
  message: any; // UIMessage type
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    const text = message.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('') || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 px-4 py-6', isUser ? 'bg-transparent' : 'bg-[#FBFAF8]/50')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-[#27445D]' : 'bg-[#497D74]'
      )}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {message.parts?.map((part: any, i: number) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="prose prose-sm max-w-none text-[#27445D] prose-headings:text-[#27445D] prose-a:text-[#497D74]">
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }

          if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
            const toolName = part.type.replace('tool-', '');
            return (
              <ToolRenderer
                key={i}
                toolName={toolName}
                state={part.state}
                input={part.input}
                output={part.output}
              />
            );
          }

          return null;
        })}
      </div>

      {!isUser && (
        <button onClick={handleCopy}
          className="self-start mt-1 text-[#8AC7C0] hover:text-[#497D74] transition-colors">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
