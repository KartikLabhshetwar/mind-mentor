"use client";

import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const quickActions = [
  "What should I study next?",
  "Quiz me on my weak topics",
  "Explain my current topic simply",
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="border-t border-[var(--color-cream-700)] p-4 bg-white">
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => onSend(action)}
            disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-cream-500)] text-[var(--color-navy-900)] hover:bg-[var(--color-cream-700)] border border-[var(--color-cream-700)] whitespace-nowrap disabled:opacity-50 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your tutor anything..."
          disabled={disabled}
          className="flex-1 bg-[var(--color-cream-100)] border border-[var(--color-cream-700)] rounded-lg px-4 py-2 text-sm text-[var(--color-navy-900)] placeholder-[var(--color-navy-800)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-900)]/30 focus:border-[var(--color-teal-900)]"
        />
        <button type="submit" disabled={disabled || !input.trim()} className="px-4 py-2 bg-[var(--color-navy-900)] hover:bg-[var(--color-navy-800)] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
          Send
        </button>
      </form>
    </div>
  );
}
