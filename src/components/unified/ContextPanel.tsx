"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreSection } from "./context/ScoreSection";
import { WeakTopicsSection } from "./context/WeakTopicsSection";
import { StudyPlanSection } from "./context/StudyPlanSection";
import { ResourcesSection } from "./context/ResourcesSection";
import { MemorySection } from "./context/MemorySection";
import { StreakSection } from "./context/StreakSection";
import { fetchMemories } from "@/lib/agent-client";

interface ContextPanelProps {
  onTriggerCommand: (command: string) => void;
  token?: string;
}

function AccordionSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-[var(--border-color)] last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        {title}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

interface PerformanceData {
  overallScore: number;
  topics: { topic: string; mastery: number; subject: string }[];
  weakTopics: { topic: string; mastery: number; daysSinceReview: number | null; reviewOverdue: boolean }[];
  streak: number;
  todayQuestions?: number;
}

export function ContextPanel({ onTriggerCommand, token }: ContextPanelProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [memories, setMemories] = useState<{ id: string; text: string }[]>([]);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id || !token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/performance/summary/${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
  }, [session?.user?.id, token]);

  const loadMemories = useCallback(async () => {
    if (!token) return;
    const mems = await fetchMemories(token);
    setMemories(mems);
  }, [token]);

  useEffect(() => { fetchData(); loadMemories(); }, [fetchData, loadMemories]);
  useEffect(() => {
    const interval = setInterval(() => { fetchData(); loadMemories(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchData, loadMemories]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-0">
      <AccordionSection title="Performance" defaultOpen>
        <ScoreSection
          overallScore={data?.overallScore ?? 0}
          topics={(data?.topics ?? []).map(t => ({ topic: t.topic, mastery: t.mastery }))}
        />
      </AccordionSection>

      <AccordionSection title="Weak Topics" defaultOpen>
        <WeakTopicsSection
          weakTopics={data?.weakTopics ?? []}
          onReview={(topic) => onTriggerCommand(`/review ${topic}`)}
        />
      </AccordionSection>

      <AccordionSection title="Study Plan">
        <StudyPlanSection plan={null} />
      </AccordionSection>

      <AccordionSection title="Resources">
        <ResourcesSection resources={[]} />
      </AccordionSection>

      <AccordionSection title="AI Memory" defaultOpen={memories.length > 0}>
        <MemorySection memories={memories} />
      </AccordionSection>

      <AccordionSection title="Streak">
        <StreakSection streak={data?.streak ?? 0} todayQuestions={data?.todayQuestions ?? 0} />
      </AccordionSection>
    </div>
  );
}
