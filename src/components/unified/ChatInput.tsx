"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, Paperclip, Loader2, FileText, X, Upload } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

interface ChatInputProps {
  onSend: (message: string, command?: string) => void;
  onFileUpload?: (file: File) => void;
  disabled: boolean;
  uploading?: boolean;
  uploadingFileName?: string;
  activePdfTitle?: string;
  onExitPdf?: () => void;
}

export function ChatInput({ onSend, onFileUpload, disabled, uploading, uploadingFileName, activePdfTitle, onExitPdf }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      setShowPalette(true);
      setPaletteQuery(val.slice(1));
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && onFileUpload) onFileUpload(file);
  }, [onFileUpload]);

  return (
    <div
      className="px-4 pb-4 pt-2"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="relative max-w-3xl mx-auto">
        {showPalette && (
          <CommandPalette
            query={paletteQuery}
            onSelect={handleCommandSelect}
            onClose={() => setShowPalette(false)}
          />
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="mb-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] animate-in fade-in slide-in-from-bottom-2">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--bg-surface)] flex items-center justify-center">
                <Loader2 className="h-3 w-3 animate-spin text-[var(--accent)]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate font-medium">{uploadingFileName || "Uploading..."}</p>
              <div className="mt-1.5 h-1 rounded-full bg-[var(--border-color)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent)] animate-pulse" style={{ width: "60%" }} />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Processing and extracting text...</p>
            </div>
          </div>
        )}

        {/* Active PDF indicator */}
        {activePdfTitle && !uploading && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)]/8 border border-[var(--accent)]/20">
            <FileText className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] flex-1 truncate">
              Chatting with <span className="font-medium text-[var(--text-primary)]">{activePdfTitle}</span>
            </p>
            {onExitPdf && (
              <button onClick={onExitPdf} className="p-0.5 rounded hover:bg-[var(--bg-surface)] transition-colors">
                <X className="h-3 w-3 text-[var(--text-muted)]" />
              </button>
            )}
          </div>
        )}

        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/5 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-[var(--accent)]" />
              <p className="text-sm font-medium text-[var(--accent)]">Drop PDF here</p>
            </div>
          </div>
        )}

        <div className="flex flex-col bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] focus-within:border-[var(--accent)] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={activePdfTitle ? `Ask about "${activePdfTitle}"...` : "Write a message..."}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm px-4 pt-4 pb-2 resize-none outline-none max-h-[200px]"
          />

          <div className="flex items-center justify-between px-3 pb-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-8 h-8 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-40"
              title="Upload PDF or image"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input type="file" ref={fileRef} accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />

            <button
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white disabled:opacity-30 transition-colors hover:opacity-90"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
