import { describe, expect, it } from "vitest";
import { evaluatePerformanceBudgets, percentile95 } from "./performance-budget";
import type { PerformanceSample } from "./performance";

const sample = (name: string, durationMs: number): PerformanceSample => ({
  name,
  durationMs,
  recordedAtUnixMs: 1,
});

describe("workspace performance budget evaluator", () => {
  it("uses nearest-rank p95 and rejects missing evidence", () => {
    expect(percentile95([1, 2, 3, 4, 100])).toBe(100);
    expect(evaluatePerformanceBudgets([], {
      navigation: { minimum_samples: 1, p95_ms: 16.7 },
    })).toEqual([expect.objectContaining({ status: "FAIL", reason: "insufficient-samples" })]);
  });

  it("separates passing and exceeded interaction budgets", () => {
    const samples = [sample("navigation", 8), sample("navigation", 12), sample("command", 151)];
    expect(evaluatePerformanceBudgets(samples, {
      navigation: { minimum_samples: 2, p95_ms: 16.7 },
      command: { minimum_samples: 1, p95_ms: 150 },
    })).toEqual([
      expect.objectContaining({ name: "navigation", status: "PASS", p95Ms: 12 }),
      expect.objectContaining({ name: "command", status: "FAIL", reason: "p95-exceeded" }),
    ]);
  });

  it("keeps steady and cold navigation in independent unchanged contracts", () => {
    const samples = [
      sample("workspace.navigation-to-paint", 40),
      sample("workspace.navigation-to-paint", 80),
      sample("workspace.navigation-to-paint", 120),
      sample("workspace.cold-navigation-to-paint", 300),
      sample("workspace.cold-navigation-to-paint", 700),
      sample("workspace.cold-navigation-to-paint", 1000),
    ];
    expect(evaluatePerformanceBudgets(samples, {
      "workspace.navigation-to-paint": { minimum_samples: 3, p95_ms: 120 },
      "workspace.cold-navigation-to-paint": { minimum_samples: 3, p95_ms: 1000 },
    })).toEqual([
      expect.objectContaining({ name: "workspace.navigation-to-paint", status: "PASS", p95Ms: 120 }),
      expect.objectContaining({ name: "workspace.cold-navigation-to-paint", status: "PASS", p95Ms: 1000 }),
    ]);
  });

  it("requires a meaningful sample population before calling a p95 valid", () => {
    const nineteen = Array.from({ length: 19 }, (_, index) => sample("navigation", 20 + index));
    expect(evaluatePerformanceBudgets(nineteen, {
      navigation: { minimum_samples: 20, p95_ms: 120 },
    })).toEqual([expect.objectContaining({ status: "FAIL", reason: "insufficient-samples", sampleCount: 19 })]);
  });

});
