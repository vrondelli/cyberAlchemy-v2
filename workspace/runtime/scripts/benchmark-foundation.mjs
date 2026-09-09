import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const runnerPath = fileURLToPath(import.meta.url);
const runtimeRoot = resolve(scriptDir, "..");
const budgetPath = resolve(runtimeRoot, "foundation-performance-budgets.candidate.json");
const generatorPath = resolve(scriptDir, "build-foundation-snapshot.mjs");
const generatedSnapshotPath = resolve(runtimeRoot, "src/domain/foundation.generated.ts");
const assetsPath = resolve(runtimeRoot, "dist/assets");
const budgetsBytes = readFileSync(budgetPath);
const runnerBytes = readFileSync(runnerPath);
const budgets = JSON.parse(budgetsBytes.toString("utf8"));

export function percentile95(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null;
}

function result(name, samples, budget) {
  const value = budget.aggregation === "p95" ? percentile95(samples) : samples[0] ?? null;
  if (samples.length < budget.minimum_samples) return { name, status: "FAIL", reason: "insufficient-samples", samples, value, budget };
  if (value === null || value > budget.maximum) return { name, status: "FAIL", reason: "maximum-exceeded", samples, value, budget };
  return { name, status: "PASS", reason: "within-budget", samples, value, budget };
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`FOUNDATION_BENCHMARK_ARGUMENT_MISSING:${name}`);
  return value;
}

function oneAsset(prefix, extension) {
  const matches = readdirSync(assetsPath).filter((name) => name.startsWith(prefix) && name.endsWith(extension) && !name.endsWith(".map"));
  if (matches.length !== 1) throw new Error(`FOUNDATION_ASSET_IDENTITY_AMBIGUOUS:${prefix}:${matches.join(",")}`);
  return resolve(assetsPath, matches[0]);
}

function run() {
  if (budgets.authority_effect !== "none") throw new Error("FOUNDATION_BENCHMARK_AUTHORITY_INVALID");
  const localBudgets = budgets.profiles.local_build.metrics;
  const checkBudget = localBudgets["foundation.snapshot-check"];
  const checkSamples = [];
  for (let index = 0; index < checkBudget.minimum_samples; index += 1) {
    const startedAt = performance.now();
    const check = spawnSync(process.execPath, [generatorPath, "--check"], { cwd: runtimeRoot, encoding: "utf8" });
    const durationMs = performance.now() - startedAt;
    if (check.status !== 0) throw new Error(`FOUNDATION_SNAPSHOT_CHECK_FAILED:${check.stderr || check.stdout}`);
    checkSamples.push(Number(durationMs.toFixed(3)));
  }

  const jsPath = oneAsset("FoundationSurface-", ".js");
  const cssPath = oneAsset("FoundationSurface-", ".css");
  const measured = [
    result("foundation.snapshot-check", checkSamples, checkBudget),
    result("foundation.generated-snapshot", [readFileSync(generatedSnapshotPath).byteLength], localBudgets["foundation.generated-snapshot"]),
    result("foundation.lazy-js-gzip", [gzipSync(readFileSync(jsPath)).byteLength], localBudgets["foundation.lazy-js-gzip"]),
    result("foundation.lazy-css-gzip", [gzipSync(readFileSync(cssPath)).byteLength], localBudgets["foundation.lazy-css-gzip"]),
  ];
  const browserSampleRef = argumentValue("--browser-samples");
  const browserSampleBundle = browserSampleRef
    ? JSON.parse(readFileSync(resolve(runtimeRoot, browserSampleRef), "utf8"))
    : null;
  const browserSamples = Array.isArray(browserSampleBundle) ? browserSampleBundle : browserSampleBundle?.samples ?? null;
  if (browserSamples !== null && !Array.isArray(browserSamples)) throw new Error("FOUNDATION_BROWSER_SAMPLES_INVALID");
  if (browserSampleBundle && !Array.isArray(browserSampleBundle)) {
    if (browserSampleBundle.authority_effect !== "none") throw new Error("FOUNDATION_BROWSER_SAMPLE_AUTHORITY_INVALID");
    if (browserSampleBundle.console_errors?.length || browserSampleBundle.page_errors?.length) throw new Error("FOUNDATION_BROWSER_SAMPLE_RUNTIME_ERRORS");
  }
  const browserSampleBinding = browserSampleRef ? {
    ref: browserSampleRef,
    sha256: createHash("sha256").update(readFileSync(resolve(runtimeRoot, browserSampleRef))).digest("hex"),
  } : null;
  const browser = Object.entries(budgets.profiles.browser_runtime.metrics).map(([name, budget]) => {
    if (browserSamples === null) return {
      name,
      status: "NOT_EVALUABLE",
      reason: "real-browser-runtime-unavailable-in-this-run",
      samples: [],
      value: null,
      budget,
    };
    const samples = browserSamples.filter((sample) => sample?.name === name && Number.isFinite(sample?.durationMs)).map((sample) => sample.durationMs);
    return result(name, samples, budget);
  });
  const failed = [...measured, ...browser].some((item) => item.status === "FAIL");
  const incomplete = browser.some((item) => item.status === "NOT_EVALUABLE");
  const report = {
    schema_version: "cav2-workspace-foundation-benchmark-report/v1-candidate",
    report_id: createHash("sha256").update(budgetsBytes).update(JSON.stringify({ measured, browser, browserSampleBinding })).digest("hex"),
    observed_at: new Date().toISOString(),
    status: failed ? "FAIL" : incomplete ? "PARTIAL" : "PASS",
    authority_effect: "none",
    environment: { node: process.version, platform: process.platform, architecture: process.arch, cwd: runtimeRoot },
    budget_binding: { ref: "foundation-performance-budgets.candidate.json", sha256: createHash("sha256").update(budgetsBytes).digest("hex") },
    runner_binding: { ref: "scripts/benchmark-foundation.mjs", sha256: createHash("sha256").update(runnerBytes).digest("hex") },
    measured,
    browser,
    browser_sample_ref: browserSampleRef,
    browser_sample_binding: browserSampleBinding,
    artifacts: {
      generated_snapshot: relative(runtimeRoot, generatedSnapshotPath),
      foundation_js: relative(runtimeRoot, jsPath),
      foundation_css: relative(runtimeRoot, cssPath),
    },
    claim_ceiling: budgets.claim_ceiling,
  };
  return { report, failed };
}

const { report, failed } = run();
if (process.argv.includes("--write")) {
  const timestamp = report.observed_at.replaceAll(":", "-").replace(".", "-");
  const reportPath = resolve(runtimeRoot, "benchmarks/foundation/runs", `${timestamp}.candidate.json`);
  report.report_path = relative(runtimeRoot, reportPath);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed) process.exitCode = 1;
