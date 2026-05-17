"use client";

interface Props {
  nodes: Array<{ topic: string; mastery: number }>;
  streak: number;
}

export function ReadinessGauge({ nodes, streak }: Props) {
  if (nodes.length === 0) return <p className="text-muted-foreground text-sm">Not enough data for readiness score.</p>;

  const avgMastery = nodes.reduce((sum, n) => sum + n.mastery, 0) / nodes.length;
  const consistency = Math.min(streak / 7, 1) * 100;
  const readiness = Math.round(avgMastery * 0.6 + consistency * 0.4);

  const color = readiness > 70 ? "#22c55e" : readiness > 40 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-aqua-300)" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${readiness * 2.51} 251`} strokeLinecap="round"
            transform="rotate(-90 50 50)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{readiness}%</span>
        </div>
      </div>
      <p className="text-muted-foreground text-sm mt-2">Overall Readiness</p>
    </div>
  );
}
