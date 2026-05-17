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
import { apiClient } from "@/lib/api-client";

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

interface StudyPlanData {
  name: string;
  progress: number;
  tasks: { title: string; completed: boolean }[];
  nextDeadline?: string;
}

interface ResourceData {
  title: string;
  url?: string;
  type: "link" | "pdf";
}

export function ContextPanel({ onTriggerCommand, token }: ContextPanelProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [memories, setMemories] = useState<{ id: string; text: string }[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanData | null>(null);
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [streakData, setStreakData] = useState<{ currentStreak: number; todayQuestions: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id || !token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/performance/summary/${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
  }, [session?.user?.id, token]);

  const fetchStudyPlan = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const data = await apiClient.getStudyPlan(session.user.id);
      if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
        const activePlan = data.plans.find((p: { isActive?: boolean }) => p.isActive !== false) || data.plans[0];
        const tasks: { title: string; completed: boolean }[] = [];
        if (activePlan.weeklyPlans) {
          for (const week of activePlan.weeklyPlans) {
            if (week.dailyTasks) {
              for (const day of week.dailyTasks) {
                if (day.tasks) {
                  for (const task of day.tasks) {
                    if (typeof task === "string") {
                      tasks.push({ title: task, completed: false });
                    } else if (task && typeof task === "object") {
                      const text = task.text || task.task || task.label || task.name || task.title || "Task";
                      tasks.push({ title: String(text), completed: task.completed ?? false });
                    }
                  }
                }
              }
            }
          }
        }
        setStudyPlan({
          name: activePlan.overview?.subject || "Study Plan",
          progress: activePlan.progress || 0,
          tasks: tasks.slice(0, 8),
          nextDeadline: activePlan.overview?.examDate,
        });
      }
    } catch { /* silent */ }
  }, [session?.user?.id]);

  const fetchResources = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const data = await apiClient.getCuratedResources(session.user.id);
      if (data.resources && Array.isArray(data.resources)) {
        const allResources: ResourceData[] = data.resources.flatMap(
          (group: { resources?: { title: string; link: string; type?: string }[] }) =>
            (group.resources || []).map((r) => ({
              title: r.title,
              url: r.link,
              type: (r.type === "pdf" ? "pdf" : "link") as "link" | "pdf",
            }))
        );
        setResources(allResources);
      }
    } catch { /* silent */ }
  }, [session?.user?.id]);

  const fetchStreak = useCallback(async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const stats = await res.json();
        setStreakData({
          currentStreak: stats.currentStreak || 0,
          todayQuestions: 0,
        });
      }
    } catch { /* silent */ }
  }, []);

  const loadMemories = useCallback(async () => {
    if (!token) return;
    const mems = await fetchMemories(token);
    setMemories(mems);
  }, [token]);

  useEffect(() => { fetchData(); loadMemories(); fetchStudyPlan(); fetchResources(); fetchStreak(); }, [fetchData, loadMemories, fetchStudyPlan, fetchResources, fetchStreak]);
  useEffect(() => {
    const interval = setInterval(() => { fetchData(); loadMemories(); fetchStudyPlan(); fetchResources(); fetchStreak(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchData, loadMemories, fetchStudyPlan, fetchResources, fetchStreak]);

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

      <AccordionSection title="Study Plan" defaultOpen={!!studyPlan}>
        <StudyPlanSection plan={studyPlan} />
      </AccordionSection>

      <AccordionSection title="Resources" defaultOpen={resources.length > 0}>
        <ResourcesSection resources={resources} />
      </AccordionSection>

      <AccordionSection title="AI Memory" defaultOpen={memories.length > 0}>
        <MemorySection memories={memories} />
      </AccordionSection>

      <AccordionSection title="Streak" defaultOpen={(streakData?.currentStreak ?? 0) > 0}>
        <StreakSection streak={streakData?.currentStreak ?? data?.streak ?? 0} todayQuestions={data?.todayQuestions ?? streakData?.todayQuestions ?? 0} />
      </AccordionSection>
    </div>
  );
}
