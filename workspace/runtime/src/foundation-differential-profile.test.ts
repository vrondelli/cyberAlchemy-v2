import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
// @ts-expect-error The benchmark importer is an executable JavaScript module exercised directly here.
import { validateAndEvaluateEvidence } from "../scripts/import-foundation-browser-evidence.mjs";

const contract = JSON.parse(readFileSync(resolve(process.cwd(), "foundation-differential-profiles.candidate.json"), "utf8"));
const report = JSON.parse(readFileSync(resolve(process.cwd(), "benchmarks/foundation/differential/CAMPAIGN-2026-09-04.candidate.json"), "utf8"));
const budgetsBytes = readFileSync(resolve(process.cwd(), "foundation-performance-budgets.candidate.json"));
const budgets = JSON.parse(budgetsBytes.toString("utf8"));
const regimeBytes = readFileSync(resolve(process.cwd(), "benchmarks/foundation/browser-regime.js"));
const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const context = { contract, budgets, budgetSha256: digest(budgetsBytes), regimeSha256: digest(regimeBytes) };
const passingEvidence = {
  schema_version: "cav2-workspace-foundation-browser-evidence/v1-candidate",
  authority_effect: "none",
  profile_id: "linux-x64-firefox",
  observed_at: "2026-09-04T00:00:00.000Z",
  identity: { platform: "linux", architecture: "x64", browser_engine: "firefox", browser_version: "142.0", viewport: { width: 1280, height: 820 } },
  bindings: { budget_sha256: context.budgetSha256, regime_sha256: context.regimeSha256 },
  samples: [
    ...Array.from({ length: 5 }, (_, index) => ({ name: "foundation.navigation-to-paint", durationMs: 20 + index })),
    ...Array.from({ length: 5 }, (_, index) => ({ name: "foundation.search-to-paint", durationMs: 10 + index })),
    ...Array.from({ length: 5 }, (_, index) => ({ name: "foundation.selection-to-paint", durationMs: 10 + index })),
  ],
  console_errors: [],
  page_errors: [],
};

describe("Foundation differential evidence contract", () => {
  it("declares the complete browser and platform matrix without authority", () => {
    expect(contract.authority_effect).toBe("none");
    expect(contract.profiles).toHaveLength(9);
    expect(new Set(contract.profiles.map((profile: { browser_engine: string }) => profile.browser_engine))).toEqual(new Set(["chromium", "firefox", "webkit"]));
    expect(new Set(contract.profiles.map((profile: { platform: string }) => profile.platform))).toEqual(new Set(["linux", "darwin", "win32"]));
  });

  it("keeps the current evidence as one reference rather than portability proof", () => {
    expect(report.status).toBe("not_evaluable");
    expect(report.authority_effect).toBe("none");
    expect(report.summary).toEqual(expect.objectContaining({ reference: 1, comparable: 0, not_evaluable: 8 }));
    expect(report.profiles.filter((profile: { classification: string }) => profile.classification === "reference")).toHaveLength(1);
    expect(report.profiles.filter((profile: { classification: string }) => profile.classification === "not_evaluable")).toHaveLength(8);
  });

  it("requires exact identity and constrains equivalence to the metric intersection", () => {
    expect(contract.identity_requirements).toContain("browser_version");
    expect(contract.identity_requirements).toContain("sample_sha256");
    expect(contract.comparison_metrics).toHaveLength(3);
    expect(contract.equivalence_ceiling).toContain("establishes no equivalence");
    expect(contract.classification_vocabulary).not.toContain("equal_within_fixed_budgets");
    expect(report.profiles.every((profile: { classification: string }) => profile.classification !== "comparable_pass")).toBe(true);
  });

  it("accepts a complete exact Firefox attempt and evaluates fixed budgets", () => {
    const evaluation = validateAndEvaluateEvidence(passingEvidence, context);
    expect(evaluation.status).toBe("PASS");
    expect(evaluation.metrics["foundation.search-to-paint"]).toEqual(expect.objectContaining({ value: 14, sample_count: 5 }));
  });

  it("fails closed on identity and binding drift", () => {
    expect(() => validateAndEvaluateEvidence({ ...passingEvidence, identity: { ...passingEvidence.identity, browser_engine: "webkit" } }, context)).toThrow("FOUNDATION_EVIDENCE_IDENTITY_MISMATCH:browser_engine");
    expect(() => validateAndEvaluateEvidence({ ...passingEvidence, bindings: { ...passingEvidence.bindings, regime_sha256: "0".repeat(64) } }, context)).toThrow("FOUNDATION_EVIDENCE_REGIME_BINDING_MISMATCH");
  });
});
