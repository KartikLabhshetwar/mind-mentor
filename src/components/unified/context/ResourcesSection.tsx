"use client";

import { ExternalLink, FileText } from "lucide-react";

interface Resource {
  title: string;
  url?: string;
  type: "link" | "pdf";
}

interface ResourcesSectionProps {
  resources: Resource[];
}

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  if (resources.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No pinned resources yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      {resources.slice(0, 5).map((r, i) => (
        <a key={i} href={r.url || "#"} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors group">
          {r.type === "pdf" ? <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" /> : <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
          <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--accent)] truncate">{r.title}</span>
        </a>
      ))}
    </div>
  );
}
