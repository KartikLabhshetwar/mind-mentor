"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface ScoreSectionProps {
  overallScore: number;
  topics: { topic: string; mastery: number }[];
}

export function ScoreSection({ overallScore, topics }: ScoreSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-[var(--accent)]">{overallScore}%</span>
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          {overallScore >= 60 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
          <span>Overall</span>
        </div>
      </div>
      <div className="space-y-2">
        {topics.slice(0, 5).map(t => (
          <div key={t.topic}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-secondary)] truncate">{t.topic}</span>
              <span className="text-[var(--text-muted)]">{t.mastery}%</span>
            </div>
            <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${t.mastery}%`,
                  backgroundColor: t.mastery >= 70 ? "var(--accent)" : t.mastery >= 40 ? "var(--warning)" : "var(--error)"
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
