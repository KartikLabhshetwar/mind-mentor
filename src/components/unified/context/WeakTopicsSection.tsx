"use client";

import { AlertTriangle } from "lucide-react";

interface WeakTopic {
  topic: string;
  mastery: number;
  daysSinceReview: number | null;
  reviewOverdue: boolean;
}

interface WeakTopicsSectionProps {
  weakTopics: WeakTopic[];
  onReview: (topic: string) => void;
}

export function WeakTopicsSection({ weakTopics, onReview }: WeakTopicsSectionProps) {
  if (weakTopics.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No weak topics. Keep it up!</p>;
  }

  return (
    <div className="space-y-2">
      {weakTopics.slice(0, 5).map(t => (
        <div key={t.topic} className="flex items-center justify-between bg-[var(--bg-surface)] rounded-lg p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${t.reviewOverdue ? "text-[var(--error)]" : "text-[var(--warning)]"}`} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{t.topic}</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {t.mastery}% mastery{t.daysSinceReview !== null ? ` · ${t.daysSinceReview}d ago` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => onReview(t.topic)}
            className="text-[10px] px-2 py-1 rounded bg-[var(--accent-muted)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors flex-shrink-0"
          >
            Review
          </button>
        </div>
      ))}
    </div>
  );
}
