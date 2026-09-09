import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluatePerformanceBudgets, percentile95 } from "./performance-budget";
import type { PerformanceSample } from "./performance";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "foundation-performance-budgets.candidate.json"), "utf8"));
const browserMetrics = config.profiles.browser_runtime.metrics as Record<string, { minimum_samples: number; maximum: number }>;
const asWorkspaceBudgets = Object.fromEntries(Object.entries(browserMetrics).map(([name, budget]) => [name, {
  minimum_samples: budget.minimum_samples,
  p95_ms: budget.maximum,
}]));
const sample = (name: string, durationMs: number): PerformanceSample => ({ name, durationMs, recordedAtUnixMs: 1 });

describe("Foundation performance benchmark contract", () => {
  it("declares bounded no-authority build and browser profiles", () => {
    expect(config.authority_effect).toBe("none");
    expect(Object.keys(config.profiles.local_build.metrics)).toEqual([
      "foundation.snapshot-check",
      "foundation.generated-snapshot",
      "foundation.lazy-js-gzip",
      "foundation.lazy-css-gzip",
    ]);
    expect(Object.keys(browserMetrics)).toEqual([
      "foundation.navigation-to-paint",
      "foundation.search-to-paint",
      "foundation.selection-to-paint",
    ]);
  });

  it("requires the declared sample counts and uses nearest-rank p95", () => {
    expect(percentile95([4, 5, 6, 7, 49])).toBe(49);
    expect(evaluatePerformanceBudgets([], asWorkspaceBudgets).every((item) => item.reason === "insufficient-samples")).toBe(true);
  });

  it("classifies interaction evidence against the fixed ceilings", () => {
    const samples = [
      ...[80, 90, 100, 110, 140].map((value) => sample("foundation.navigation-to-paint", value)),
      ...[8, 12, 15, 18, 25].map((value) => sample("foundation.search-to-paint", value)),
      ...[8, 12, 15, 18, 55].map((value) => sample("foundation.selection-to-paint", value)),
    ];
    const results = evaluatePerformanceBudgets(samples, asWorkspaceBudgets);
    expect(results.find((item) => item.name === "foundation.navigation-to-paint")?.status).toBe("PASS");
    expect(results.find((item) => item.name === "foundation.search-to-paint")?.status).toBe("PASS");
    expect(results.find((item) => item.name === "foundation.selection-to-paint")?.reason).toBe("p95-exceeded");
  });
});
