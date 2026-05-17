import { describe, it, expect } from "vitest";
import { calculateSM2, SM2Input, SM2Result, calculateMasteryScore } from "../src/intelligence/sm2.js";

describe("SM-2 Algorithm", () => {
  it("first review with perfect quality (5) gives 1-day interval", () => {
    const input: SM2Input = { repetitions: 0, easiness: 2.5, interval: 0, quality: 5 };
    const result = calculateSM2(input);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.easiness).toBeGreaterThanOrEqual(2.5);
  });

  it("second review with quality 4 gives 6-day interval", () => {
    const input: SM2Input = { repetitions: 1, easiness: 2.5, interval: 1, quality: 4 };
    const result = calculateSM2(input);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it("third review multiplies interval by easiness factor", () => {
    const input: SM2Input = { repetitions: 2, easiness: 2.5, interval: 6, quality: 4 };
    const result = calculateSM2(input);
    expect(result.interval).toBe(15);
    expect(result.repetitions).toBe(3);
  });

  it("quality below 3 resets repetitions and interval", () => {
    const input: SM2Input = { repetitions: 5, easiness: 2.5, interval: 30, quality: 2 };
    const result = calculateSM2(input);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("easiness factor never drops below 1.3", () => {
    const input: SM2Input = { repetitions: 1, easiness: 1.3, interval: 1, quality: 0 };
    const result = calculateSM2(input);
    expect(result.easiness).toBe(1.3);
  });

  it("quality 5 increases easiness", () => {
    const input: SM2Input = { repetitions: 3, easiness: 2.5, interval: 15, quality: 5 };
    const result = calculateSM2(input);
    expect(result.easiness).toBeGreaterThan(2.5);
  });

  it("quality 3 slightly decreases easiness", () => {
    const input: SM2Input = { repetitions: 3, easiness: 2.5, interval: 15, quality: 3 };
    const result = calculateSM2(input);
    expect(result.easiness).toBeLessThan(2.5);
  });
});

describe("Mastery Score", () => {
  it("calculates mastery from easiness, review count, and recency", () => {
    const score = calculateMasteryScore(2.5, 5, 0);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("decays with days since last review", () => {
    const fresh = calculateMasteryScore(2.5, 5, 0);
    const stale = calculateMasteryScore(2.5, 5, 30);
    expect(fresh).toBeGreaterThan(stale);
  });

  it("low review count gives lower score", () => {
    const experienced = calculateMasteryScore(2.5, 10, 0);
    const newbie = calculateMasteryScore(2.5, 1, 0);
    expect(experienced).toBeGreaterThan(newbie);
  });
});
