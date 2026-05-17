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
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    const fetchData = async () => {
      try {
        const data = await triggerAnalysis(session.token!, "quick");
        setInsights(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><PacmanLoader color="#497D74" /></div>;
  }

  if (error || !insights) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-3">
        <p className="text-lg font-medium text-foreground">Could not load analytics</p>
        <p className="text-sm text-muted-foreground">Make sure the agent service is running on port 8787.</p>
      </div>
    );
  }

  const hasTopics = (insights.knowledgeGraph?.nodes?.length || 0) > 0;
  const hasSessions = insights.patterns?.avgSessionDuration > 0 || insights.patterns?.optimalStudyTime !== "unknown";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {hasTopics || hasSessions
            ? "Your study performance and insights at a glance."
            : "Start chatting with AI Tutor and using the Timer to see your analytics here."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Topic Mastery</CardTitle></CardHeader>
          <CardContent><MasteryRadar nodes={insights.knowledgeGraph?.nodes || []} /></CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Study Patterns</CardTitle></CardHeader>
          <CardContent><StudyHeatmap patterns={insights.patterns} /></CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Learning Velocity</CardTitle></CardHeader>
          <CardContent><VelocityChart velocity={insights.patterns?.learningVelocity || {}} /></CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Weak Spots</CardTitle></CardHeader>
          <CardContent><WeakSpots nodes={insights.knowledgeGraph?.nodes || []} /></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Readiness</CardTitle></CardHeader>
          <CardContent><ReadinessGauge nodes={insights.knowledgeGraph?.nodes || []} streak={insights.patterns?.currentStreak || 0} /></CardContent>
        </Card>

        {insights.recommendations && insights.recommendations.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-card-foreground">Recommendations</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-muted-foreground flex items-start gap-2 text-sm">
                    <span className="text-secondary mt-0.5">&#8226;</span>{rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
