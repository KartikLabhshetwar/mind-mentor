"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function VelocityChart({ velocity }: { velocity: Record<string, number> }) {
  const data = Object.entries(velocity).map(([subject, rate]) => ({ subject, rate }));
  if (data.length === 0) return <p className="text-muted-foreground text-sm">Study more subjects to see velocity data.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="subject" tick={{ fill: "var(--color-navy-800)", fontSize: 12 }} />
        <YAxis tick={{ fill: "var(--color-navy-800)", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "var(--color-cream-700)", border: "1px solid var(--color-aqua-300)", borderRadius: 8, color: "var(--color-navy-900)" }} />
        <Bar dataKey="rate" fill="var(--color-teal-900)" radius={[4, 4, 0, 0]} name="Topics/week" />
      </BarChart>
    </ResponsiveContainer>
  );
}
