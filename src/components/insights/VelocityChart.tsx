"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function VelocityChart({ velocity }: { velocity: Record<string, number> }) {
  const data = Object.entries(velocity).map(([subject, rate]) => ({ subject, rate }));
  if (data.length === 0) return <p className="text-zinc-500 text-sm">Study more subjects to see velocity data.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }} />
        <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Topics/week" />
      </BarChart>
    </ResponsiveContainer>
  );
}
