import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = resolve(scriptDir, "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function percentile95(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null;
}

export function validateAndEvaluateEvidence(evidence, context) {
  if (evidence?.schema_version !== "cav2-workspace-foundation-browser-evidence/v1-candidate") throw new Error("FOUNDATION_EVIDENCE_SCHEMA_VERSION_INVALID");
  if (evidence.authority_effect !== "none") throw new Error("FOUNDATION_EVIDENCE_AUTHORITY_INVALID");
  const profile = context.contract.profiles.find((candidate) => candidate.profile_id === evidence.profile_id);
  if (!profile || evidence.profile_id === context.contract.reference_profile_id) throw new Error("FOUNDATION_EVIDENCE_PROFILE_INVALID");
  for (const field of ["platform", "architecture", "browser_engine"]) {
    if (evidence.identity?.[field] !== profile[field]) throw new Error(`FOUNDATION_EVIDENCE_IDENTITY_MISMATCH:${field}`);
  }
  if (typeof evidence.identity?.browser_version !== "string" || evidence.identity.browser_version.length === 0) throw new Error("FOUNDATION_EVIDENCE_BROWSER_VERSION_MISSING");
  if (!Number.isInteger(evidence.identity?.viewport?.width) || !Number.isInteger(evidence.identity?.viewport?.height)) throw new Error("FOUNDATION_EVIDENCE_VIEWPORT_INVALID");
  if (evidence.bindings?.budget_sha256 !== context.budgetSha256) throw new Error("FOUNDATION_EVIDENCE_BUDGET_BINDING_MISMATCH");
  if (evidence.bindings?.regime_sha256 !== context.regimeSha256) throw new Error("FOUNDATION_EVIDENCE_REGIME_BINDING_MISMATCH");
  if (!Array.isArray(evidence.samples) || !Array.isArray(evidence.console_errors) || !Array.isArray(evidence.page_errors)) throw new Error("FOUNDATION_EVIDENCE_COLLECTIONS_INVALID");
  if (typeof evidence.observed_at !== "string" || Number.isNaN(Date.parse(evidence.observed_at)) || new Date(evidence.observed_at).toISOString() !== evidence.observed_at) throw new Error("FOUNDATION_EVIDENCE_TIMESTAMP_INVALID");

  const runtimeErrors = evidence.console_errors.length + evidence.page_errors.length;
  const metrics = Object.fromEntries(Object.entries(context.budgets.profiles.browser_runtime.metrics).map(([name, budget]) => {
    const samples = evidence.samples
      .filter((sample) => sample?.name === name && Number.isFinite(sample?.durationMs) && sample.durationMs >= 0)
      .map((sample) => sample.durationMs);
    const value = percentile95(samples);
    const status = samples.length < budget.minimum_samples
      ? "FAIL"
      : value === null || value > budget.maximum
        ? "FAIL"
        : "PASS";
    return [name, { status, value, sample_count: samples.length, maximum: budget.maximum }];
  }));
  const status = runtimeErrors === 0 && Object.values(metrics).every((metric) => metric.status === "PASS") ? "PASS" : "FAIL";
  return { status, runtime_errors: runtimeErrors, metrics };
}

function loadContext() {
  const contractBytes = readFileSync(resolve(runtimeRoot, "foundation-differential-profiles.candidate.json"));
  const budgetBytes = readFileSync(resolve(runtimeRoot, "foundation-performance-budgets.candidate.json"));
  const regimeBytes = readFileSync(resolve(runtimeRoot, "benchmarks/foundation/browser-regime.js"));
  return {
    contract: JSON.parse(contractBytes.toString("utf8")),
    budgets: JSON.parse(budgetBytes.toString("utf8")),
    budgetSha256: sha256(budgetBytes),
    regimeSha256: sha256(regimeBytes),
  };
}

function main() {
  const sourceArg = process.argv[2];
  if (!sourceArg || sourceArg.startsWith("--")) throw new Error("FOUNDATION_EVIDENCE_SOURCE_REQUIRED");
  const sourcePath = resolve(process.cwd(), sourceArg);
  if (!existsSync(sourcePath)) throw new Error(`FOUNDATION_EVIDENCE_SOURCE_MISSING:${sourcePath}`);
  const sourceBytes = readFileSync(sourcePath);
  const evidence = JSON.parse(sourceBytes.toString("utf8"));
  const evaluation = validateAndEvaluateEvidence(evidence, loadContext());
  const receipt = { source: basename(sourcePath), sha256: sha256(sourceBytes), profile_id: evidence.profile_id, evaluation };
  if (process.argv.includes("--write")) {
    const timestamp = new Date(evidence.observed_at).toISOString().replaceAll(":", "-").replace(".", "-");
    const outputPath = resolve(runtimeRoot, "benchmarks/foundation/differential-inputs", evidence.profile_id, `${timestamp}-${receipt.sha256.slice(0, 12)}.evidence.json`);
    mkdirSync(dirname(outputPath), { recursive: true });
    if (existsSync(outputPath) && sha256(readFileSync(outputPath)) !== receipt.sha256) throw new Error("FOUNDATION_EVIDENCE_OUTPUT_COLLISION");
    if (!existsSync(outputPath)) writeFileSync(outputPath, sourceBytes);
    receipt.output_path = outputPath.slice(runtimeRoot.length + 1);
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (evaluation.status === "FAIL") process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
