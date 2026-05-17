"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface Node { topic: string; mastery: number; }

function getMasteryColor(mastery: number) {
  if (mastery >= 70) return "var(--color-teal-900)";
  if (mastery >= 40) return "var(--color-aqua-900)";
  return "#d97706";
}

export function MasteryRadar({ nodes }: { nodes: Node[] }) {
  const data = nodes.slice(0, 10).map(n => ({
    topic: n.topic.length > 20 ? n.topic.slice(0, 18) + "…" : n.topic,
    fullTopic: n.topic,
    mastery: Math.round(n.mastery),
  }));

  if (data.length === 0) return <p className="text-muted-foreground text-sm">No mastery data yet. Start studying to see insights.</p>;

  const chartHeight = Math.max(200, data.length * 48);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 8, bottom: 8 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--color-navy-800)", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="topic" width={140} tick={{ fill: "var(--color-navy-800)", fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: "var(--color-cream-700)", border: "1px solid var(--color-aqua-300)", borderRadius: 8, color: "var(--color-navy-900)" }}
          formatter={(value) => [`${value}%`, "Mastery"]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTopic || ""}
        />
        <Bar dataKey="mastery" radius={[0, 6, 6, 0]} barSize={24}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getMasteryColor(entry.mastery)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
