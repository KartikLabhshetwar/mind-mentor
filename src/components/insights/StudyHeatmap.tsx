"use client";

interface Props {
  patterns?: { optimalStudyTime: string; avgSessionDuration: number; fatigueThreshold: number; currentStreak?: number };
}

export function StudyHeatmap({ patterns }: Props) {
  if (!patterns || (patterns.avgSessionDuration === 0 && patterns.optimalStudyTime === "unknown")) {
    return <p className="text-muted-foreground text-sm">Not enough data to show patterns yet. Use the Timer to track study sessions.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-sm">Best time to study</span>
        <span className="text-foreground font-medium">{patterns.optimalStudyTime === "unknown" ? "—" : patterns.optimalStudyTime}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-sm">Average session</span>
        <span className="text-foreground font-medium">{patterns.avgSessionDuration} min</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-sm">Fatigue threshold</span>
        <span className="text-foreground font-medium">{patterns.fatigueThreshold} min</span>
      </div>
      {patterns.currentStreak !== undefined && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Current streak</span>
          <span className="text-foreground font-medium">{patterns.currentStreak} days</span>
        </div>
      )}
    </div>
  );
}
