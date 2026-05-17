"use client";

import { CheckSquare, Square, Clock } from "lucide-react";

interface StudyPlanSectionProps {
  plan: {
    name: string;
    progress: number;
    tasks: { title: string; completed: boolean }[];
    nextDeadline?: string;
  } | null;
}

export function StudyPlanSection({ plan }: StudyPlanSectionProps) {
  if (!plan) {
    return <p className="text-xs text-[var(--text-muted)]">No active study plan. Use /plan to create one.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-[var(--text-primary)]">{plan.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${plan.progress}%` }} />
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">{plan.progress}%</span>
        </div>
      </div>
      {plan.nextDeadline && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--warning)]">
          <Clock className="h-3 w-3" />
          <span>Deadline: {new Date(plan.nextDeadline).toLocaleDateString()}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {plan.tasks.slice(0, 4).map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            {t.completed
              ? <CheckSquare className="h-3.5 w-3.5 text-[var(--accent)]" />
              : <Square className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            }
            <span className={`text-xs ${t.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]"}`}>{t.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
