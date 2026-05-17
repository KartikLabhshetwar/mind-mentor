"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { triggerAnalysis } from "@/lib/agent-client";
import PacmanLoader from "react-spinners/PacmanLoader";

interface GraphNode { id: string; name: string; val: number; color: string; mastery: number; }
interface GraphLink { source: string; target: string; }

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function KnowledgeGraphPage() {
  const { data: session } = useSession();
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) return;
    const fetchData = async () => {
      const data = await triggerAnalysis(session.token!, "quick");
      if (data?.knowledgeGraph) {
        setGraphData({
          nodes: data.knowledgeGraph.nodes.map((n: { id: string; topic: string; mastery: number }) => ({
            id: n.id, name: n.topic,
            val: Math.max(n.mastery / 10, 1),
            color: n.mastery > 66 ? "#22c55e" : n.mastery > 33 ? "#eab308" : "#ef4444",
            mastery: n.mastery,
          })),
          links: data.knowledgeGraph.edges.map((e: { source: string; target: string }) => ({ source: e.source, target: e.target })),
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [session]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><PacmanLoader color="#6366f1" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">Knowledge Graph</h1>
      <p className="text-zinc-400 text-sm">Topics colored by mastery: <span className="text-red-400">weak</span> / <span className="text-yellow-400">learning</span> / <span className="text-green-400">strong</span></p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden" style={{ height: "70vh" }}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node: object) => `${(node as GraphNode).name} (${(node as GraphNode).mastery}%)`}
            nodeColor={(node: object) => (node as GraphNode).color}
            linkColor={() => "#4b5563"}
            backgroundColor="#09090b"
            nodeRelSize={6}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500">No topics tracked yet. Start studying to build your knowledge graph.</p>
          </div>
        )}
      </div>
    </div>
  );
}
