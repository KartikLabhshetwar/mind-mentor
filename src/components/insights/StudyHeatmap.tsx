"use client";

interface Props {
  patterns?: { optimalStudyTime: string; avgSessionDuration: number; fatigueThreshold: number };
}

export function StudyHeatmap({ patterns }: Props) {
  if (!patterns) return <p className="text-zinc-500 text-sm">Not enough data to show patterns yet.</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-sm">Best time to study</span>
        <span className="text-zinc-100 font-medium">{patterns.optimalStudyTime}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-sm">Average session</span>
        <span className="text-zinc-100 font-medium">{patterns.avgSessionDuration} min</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-sm">Fatigue threshold</span>
        <span className="text-zinc-100 font-medium">{patterns.fatigueThreshold} min</span>
      </div>
    </div>
  );
}
