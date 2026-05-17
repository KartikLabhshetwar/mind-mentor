"use client";

import { useState, useEffect, useRef } from "react";
import { FileUp, BookOpen, Brain, HelpCircle, BarChart3, ClipboardList, RefreshCw, Globe } from "lucide-react";

interface Command {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  action: string;
}

const commands: Command[] = [
  { name: "/quiz", description: "Generate a quiz on any topic", icon: ClipboardList, action: "quiz" },
  { name: "/resources", description: "Find learning resources", icon: Brain, action: "resources" },
  { name: "/search", description: "Search the web for anything", icon: Globe, action: "search" },
  { name: "/plan", description: "Create or view study plan", icon: BookOpen, action: "plan" },
  { name: "/pdf", description: "Upload and chat with PDF", icon: FileUp, action: "pdf" },
  { name: "/review", description: "Review weak topics (spaced repetition)", icon: RefreshCw, action: "review" },
  { name: "/explain", description: "Explain a concept simply", icon: HelpCircle, action: "explain" },
  { name: "/score", description: "View your performance", icon: BarChart3, action: "score" },
];

interface CommandPaletteProps {
  query: string;
  onSelect: (command: Command) => void;
  onClose: () => void;
}

export function CommandPalette({ query, onSelect, onClose }: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = commands.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && filtered[selectedIndex]) { e.preventDefault(); onSelect(filtered[selectedIndex]); }
      else if (e.key === "Escape") { onClose(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div ref={ref} className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden z-50 max-w-3xl mx-auto">
      {filtered.map((cmd, i) => (
        <button
          key={cmd.name}
          onClick={() => onSelect(cmd)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            i === selectedIndex ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          <cmd.icon className={`h-5 w-5 ${i === selectedIndex ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{cmd.name}</span>
            <span className="text-xs text-[var(--text-muted)] ml-2">{cmd.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
