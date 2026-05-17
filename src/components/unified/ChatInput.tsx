"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

interface ChatInputProps {
  onSend: (message: string, command?: string) => void;
  onFileUpload?: (file: File) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, onFileUpload, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/")) {
      setShowPalette(true);
      setPaletteQuery(val);
    } else {
      setShowPalette(false);
    }

    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  };

  const handleSubmit = useCallback(() => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
    setShowPalette(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !showPalette) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCommandSelect = (cmd: { name: string; action: string }) => {
    if (cmd.action === "pdf") {
      fileRef.current?.click();
      setInput("");
    } else {
      setInput(cmd.name + " ");
    }
    setShowPalette(false);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) onFileUpload(file);
    e.target.value = "";
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="relative max-w-3xl mx-auto">
        {showPalette && (
          <CommandPalette
            query={paletteQuery}
            onSelect={handleCommandSelect}
            onClose={() => setShowPalette(false)}
          />
        )}

        <div className="flex items-end gap-2 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] focus-within:border-[var(--accent)] transition-colors">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-3 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={handleFileChange} />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Mind Mentor... (type / for commands)"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm py-3 resize-none outline-none max-h-[200px]"
          />

          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
