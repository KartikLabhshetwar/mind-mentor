"use client";

interface Node { topic: string; mastery: number; subject: string; }

export function WeakSpots({ nodes }: { nodes: Node[] }) {
  const weakTopics = nodes.filter(n => n.mastery < 50).sort((a, b) => a.mastery - b.mastery).slice(0, 5);
  if (weakTopics.length === 0) return <p className="text-muted-foreground text-sm">No weak spots detected!</p>;

  return (
    <div className="space-y-3">
      {weakTopics.map((topic) => (
        <div key={topic.topic} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-foreground">{topic.topic}</span>
            <span className="text-muted-foreground">{topic.mastery}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${topic.mastery}%`, background: topic.mastery < 20 ? "#ef4444" : topic.mastery < 40 ? "#f59e0b" : "#eab308" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
