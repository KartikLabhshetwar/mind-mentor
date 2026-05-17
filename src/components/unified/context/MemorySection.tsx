"use client";

import { Brain, X } from "lucide-react";

interface Memory {
  id: string;
  text: string;
}

interface MemorySectionProps {
  memories: Memory[];
  onDelete?: (id: string) => void;
}

export function MemorySection({ memories, onDelete }: MemorySectionProps) {
  if (memories.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No memories yet. Chat to build your profile.</p>;
  }

  return (
    <div className="space-y-1.5">
      {memories.map(m => (
        <div key={m.id} className="flex items-start gap-2 bg-[var(--bg-surface)] rounded-lg p-2.5 group">
          <Brain className="h-3.5 w-3.5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[var(--text-secondary)] flex-1">{m.text}</p>
          {onDelete && (
            <button onClick={() => onDelete(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-3 w-3 text-[var(--text-muted)] hover:text-[var(--error)]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
