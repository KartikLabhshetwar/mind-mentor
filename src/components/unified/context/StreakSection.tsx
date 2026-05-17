"use client";

import { Flame } from "lucide-react";

interface StreakSectionProps {
  streak: number;
  todayQuestions: number;
}

export function StreakSection({ streak, todayQuestions }: StreakSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Flame className={`h-5 w-5 ${streak > 0 ? "text-orange-500" : "text-[var(--text-muted)]"}`} />
          <span className="text-lg font-bold text-[var(--text-primary)]">{streak}</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">day streak</span>
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">{todayQuestions}</span> questions answered today
      </div>
    </div>
  );
}
