"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasteryRadar } from "@/components/insights/MasteryRadar";
import { StudyHeatmap } from "@/components/insights/StudyHeatmap";
import { VelocityChart } from "@/components/insights/VelocityChart";
import { WeakSpots } from "@/components/insights/WeakSpots";
import { ReadinessGauge } from "@/components/insights/ReadinessGauge";
import { triggerAnalysis } from "@/lib/agent-client";
import PacmanLoader from "react-spinners/PacmanLoader";

export default function InsightsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [insights, setInsights] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) return;
    const fetchData = async () => {
      const data = await triggerAnalysis(session.token!, "quick");
      setInsights(data);
      setLoading(false);
    };
    fetchData();
  }, [session]);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><PacmanLoader color="#6366f1" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Learning Insights</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Topic Mastery</CardTitle></CardHeader>
          <CardContent><MasteryRadar nodes={insights?.knowledgeGraph?.nodes || []} /></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Study Patterns</CardTitle></CardHeader>
          <CardContent><StudyHeatmap patterns={insights?.patterns} /></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Learning Velocity</CardTitle></CardHeader>
          <CardContent><VelocityChart velocity={insights?.patterns?.learningVelocity || {}} /></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Weak Spots</CardTitle></CardHeader>
          <CardContent><WeakSpots nodes={insights?.knowledgeGraph?.nodes || []} /></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Readiness</CardTitle></CardHeader>
          <CardContent><ReadinessGauge nodes={insights?.knowledgeGraph?.nodes || []} streak={insights?.patterns?.currentStreak || 0} /></CardContent>
        </Card>
      </div>
      {insights?.recommendations && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-zinc-300 flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">&#8226;</span>{rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
