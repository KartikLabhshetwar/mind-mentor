'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatComposerProps {
  onSend: (text: string, files?: File[]) => void;
  disabled: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(input.trim(), files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  return (
    <div className="border-t border-[#D5EBE7] bg-[#FBFAF8] px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {files.length > 0 && (
          <div className="flex gap-2 mb-2">
            {files.map((f, i) => (
              <span key={i} className="text-xs bg-[#D5EBE7] text-[#27445D] px-2 py-1 rounded-full">
                {f.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 bg-white border border-[#BCDFD9] rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#71BBB2]">
          <button onClick={() => fileInputRef.current?.click()}
            className="text-[#8AC7C0] hover:text-[#497D74] transition-colors pb-1" disabled={disabled}>
            <Paperclip className="h-5 w-5" />
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => { if (e.target.files) setFiles(Array.from(e.target.files)); }} />
          <textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown}
            placeholder="Ask me anything..." disabled={disabled} rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-[#27445D] placeholder:text-[#8AC7C0]',
              'focus:outline-none text-sm leading-6'
            )} />
          <Button onClick={handleSubmit}
            disabled={disabled || (!input.trim() && files.length === 0)}
            size="icon" className="bg-[#497D74] hover:bg-[#538B81] text-white rounded-full h-8 w-8 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-center text-[#A3D3CD] mt-2">
          Mind Mentor can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
