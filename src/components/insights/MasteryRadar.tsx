"use client";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

interface Node { topic: string; mastery: number; }

export function MasteryRadar({ nodes }: { nodes: Node[] }) {
  const data = nodes.slice(0, 8).map(n => ({ topic: n.topic, mastery: n.mastery }));
  if (data.length === 0) return <p className="text-zinc-500 text-sm">No mastery data yet. Start studying to see insights.</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="topic" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
