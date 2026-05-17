import { TopicNode, TopicEdge } from "../types/index.js";

export class KnowledgeGraph {
  private nodes: Map<string, TopicNode> = new Map();
  private edges: TopicEdge[] = [];

  addNode(node: TopicNode) {
    this.nodes.set(node.id, node);
  }

  addEdge(source: string, target: string, type: "prerequisite" | "related") {
    this.edges.push({ source, target, type });
  }

  getNodes(): TopicNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): TopicEdge[] {
    return [...this.edges];
  }

  getPrerequisites(topicId: string): TopicNode[] {
    const prereqIds = this.edges
      .filter(e => e.target === topicId && e.type === "prerequisite")
      .map(e => e.source);
    return prereqIds.map(id => this.nodes.get(id)!).filter(Boolean);
  }

  findGaps(topicId: string, minMastery: number): TopicNode[] {
    const prereqs = this.getPrerequisites(topicId);
    return prereqs.filter(node => node.mastery < minMastery);
  }

  suggestNext(): TopicNode[] {
    const candidates: TopicNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.mastery >= 80) continue;
      const prereqs = this.getPrerequisites(node.id);
      const allPrereqsMet = prereqs.every(p => p.mastery >= 60);
      if (allPrereqsMet || prereqs.length === 0) {
        candidates.push(node);
      }
    }
    return candidates.sort((a, b) => a.mastery - b.mastery);
  }

  toJSON() {
    return { nodes: this.getNodes(), edges: this.getEdges() };
  }

  static fromJSON(data: { nodes: TopicNode[]; edges: TopicEdge[] }): KnowledgeGraph {
    const graph = new KnowledgeGraph();
    for (const node of data.nodes) graph.addNode(node);
    for (const edge of data.edges) graph.addEdge(edge.source, edge.target, edge.type);
    return graph;
  }
}
