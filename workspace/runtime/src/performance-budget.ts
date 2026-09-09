import type { PerformanceSample } from "./performance";

export interface PerformanceBudget {
  minimum_samples: number;
  p95_ms: number;
}

export interface PerformanceBudgetResult {
  name: string;
  status: "PASS" | "FAIL";
  sampleCount: number;
  p95Ms: number | null;
  budgetMs: number;
  reason: "within-budget" | "insufficient-samples" | "p95-exceeded";
}

export function percentile95(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null;
}

export function evaluatePerformanceBudgets(
  samples: readonly PerformanceSample[],
  budgets: Readonly<Record<string, PerformanceBudget>>,
): PerformanceBudgetResult[] {
  return Object.entries(budgets).map(([name, budget]) => {
    const durations = samples
      .filter((sample) => sample.name === name)
      .map((sample) => sample.durationMs)
      .filter((duration) => Number.isFinite(duration) && duration >= 0);
    const p95Ms = percentile95(durations);
    if (durations.length < budget.minimum_samples) {
      return { name, status: "FAIL", sampleCount: durations.length, p95Ms, budgetMs: budget.p95_ms, reason: "insufficient-samples" };
    }
    if (p95Ms === null || p95Ms > budget.p95_ms) {
      return { name, status: "FAIL", sampleCount: durations.length, p95Ms, budgetMs: budget.p95_ms, reason: "p95-exceeded" };
    }
    return { name, status: "PASS", sampleCount: durations.length, p95Ms, budgetMs: budget.p95_ms, reason: "within-budget" };
  });
}
