import { describe, it, expect } from "vitest";
import { detectPatterns, StudySession } from "../src/intelligence/patterns.js";

describe("Pattern Detection", () => {
  const sessions: StudySession[] = [
    { date: "2026-05-01", startHour: 19, duration: 45 },
    { date: "2026-05-02", startHour: 20, duration: 50 },
    { date: "2026-05-03", startHour: 19, duration: 40 },
    { date: "2026-05-04", startHour: 19, duration: 55 },
    { date: "2026-05-05", startHour: 20, duration: 30 },
  ];

  it("detects optimal study time from most common hour", () => {
    const result = detectPatterns(sessions);
    expect(result.optimalStudyTime).toBe("19:00-20:00");
  });

  it("calculates average session duration", () => {
    const result = detectPatterns(sessions);
    expect(result.avgSessionDuration).toBe(44);
  });

  it("detects fatigue threshold from duration decline", () => {
    const longSessions: StudySession[] = [
      { date: "2026-05-01", startHour: 19, duration: 90 },
      { date: "2026-05-02", startHour: 19, duration: 60 },
      { date: "2026-05-03", startHour: 19, duration: 45 },
    ];
    const result = detectPatterns(longSessions);
    expect(result.fatigueThreshold).toBeLessThanOrEqual(60);
  });

  it("returns defaults for empty sessions", () => {
    const result = detectPatterns([]);
    expect(result.optimalStudyTime).toBe("unknown");
    expect(result.avgSessionDuration).toBe(0);
  });
});
