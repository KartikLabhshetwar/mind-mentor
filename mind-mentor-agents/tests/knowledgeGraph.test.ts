import { describe, it, expect } from "vitest";
import { KnowledgeGraph } from "../src/intelligence/knowledgeGraph.js";

describe("Knowledge Graph", () => {
  it("adds nodes and edges", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "js-basics", topic: "JavaScript Basics", subject: "JavaScript", mastery: 80 });
    graph.addNode({ id: "react", topic: "React", subject: "JavaScript", mastery: 30 });
    graph.addEdge("js-basics", "react", "prerequisite");
    expect(graph.getNodes()).toHaveLength(2);
    expect(graph.getEdges()).toHaveLength(1);
  });

  it("finds prerequisites for a topic", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "arrays", topic: "Arrays", subject: "DSA", mastery: 90 });
    graph.addNode({ id: "dp", topic: "Dynamic Programming", subject: "DSA", mastery: 20 });
    graph.addNode({ id: "recursion", topic: "Recursion", subject: "DSA", mastery: 50 });
    graph.addEdge("arrays", "dp", "prerequisite");
    graph.addEdge("recursion", "dp", "prerequisite");
    const prereqs = graph.getPrerequisites("dp");
    expect(prereqs).toHaveLength(2);
    expect(prereqs.map(n => n.id)).toContain("arrays");
    expect(prereqs.map(n => n.id)).toContain("recursion");
  });

  it("identifies weak prerequisites (gaps)", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "closures", topic: "Closures", subject: "JS", mastery: 25 });
    graph.addNode({ id: "hooks", topic: "React Hooks", subject: "React", mastery: 10 });
    graph.addEdge("closures", "hooks", "prerequisite");
    const gaps = graph.findGaps("hooks", 50);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].id).toBe("closures");
  });

  it("suggests next topics based on mastery", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "a", topic: "A", subject: "X", mastery: 90 });
    graph.addNode({ id: "b", topic: "B", subject: "X", mastery: 20 });
    graph.addNode({ id: "c", topic: "C", subject: "X", mastery: 0 });
    graph.addEdge("a", "b", "prerequisite");
    graph.addEdge("b", "c", "prerequisite");
    const next = graph.suggestNext();
    expect(next[0].id).toBe("b");
  });

  it("serializes to and from JSON", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "x", topic: "X", subject: "S", mastery: 50 });
    graph.addNode({ id: "y", topic: "Y", subject: "S", mastery: 70 });
    graph.addEdge("x", "y", "related");
    const json = graph.toJSON();
    const restored = KnowledgeGraph.fromJSON(json);
    expect(restored.getNodes()).toHaveLength(2);
    expect(restored.getEdges()).toHaveLength(1);
  });
});
