import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateAndEvaluateEvidence } from "./import-foundation-browser-evidence.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = resolve(scriptDir, "..");
const contractPath = resolve(runtimeRoot, "foundation-differential-profiles.candidate.json");
const campaignPath = resolve(runtimeRoot, "benchmarks/foundation/CAMPAIGN-2026-09-04.candidate.json");
const inputRoot = resolve(runtimeRoot, "benchmarks/foundation/differential-inputs");
const outputPath = resolve(runtimeRoot, "benchmarks/foundation/differential/CAMPAIGN-2026-09-04.candidate.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function readJson(path) {
  const bytes = readFileSync(path);
  return { bytes, value: JSON.parse(bytes.toString("utf8")) };
}

function verifyBinding(basePath, binding, label) {
  const path = resolve(dirname(basePath), binding.ref);
  const bytes = readFileSync(path);
  const actual = sha256(bytes);
  if (actual !== binding.sha256) throw new Error(`FOUNDATION_DIFFERENTIAL_BINDING_MISMATCH:${label}:${actual}:${binding.sha256}`);
  return { ref: relative(runtimeRoot, path), sha256: actual };
}

function browserIdentity(sample) {
  const match = sample.browser.user_agent.match(/(?:HeadlessChrome|Chrome)\/([^ ]+)/);
  if (!match) throw new Error("FOUNDATION_DIFFERENTIAL_REFERENCE_VERSION_MISSING");
  const platform = sample.browser.user_agent.includes("Linux") ? "linux" : sample.browser.user_agent.includes("Windows") ? "win32" : sample.browser.user_agent.includes("Macintosh") ? "darwin" : null;
  const architecture = sample.browser.user_agent.includes("x86_64") || sample.browser.user_agent.includes("Win64") ? "x64" : null;
  if (!platform || !architecture) throw new Error("FOUNDATION_DIFFERENTIAL_REFERENCE_HOST_IDENTITY_MISSING");
  return {
    platform,
    architecture,
    browser_engine: "chromium",
    browser_version: match[1],
    browser_executable: sample.browser.executable,
    viewport: sample.browser.viewport,
  };
}

const contract = readJson(contractPath);
const campaign = readJson(campaignPath);
if (contract.value.authority_effect !== "none" || campaign.value.authority_effect !== "none") {
  throw new Error("FOUNDATION_DIFFERENTIAL_AUTHORITY_INVALID");
}
if (campaign.value.browser_runtime_profile.status !== "two-consecutive-passes") {
  throw new Error("FOUNDATION_DIFFERENTIAL_REFERENCE_INCOMPLETE");
}

const budgetBinding = verifyBinding(campaignPath, campaign.value.budget_binding, "budget");
const regimeBinding = verifyBinding(campaignPath, campaign.value.browser_harness_binding.regime, "regime");
const attempts = campaign.value.browser_runtime_profile.attempts.map((attempt) => {
  const sampleBinding = verifyBinding(campaignPath, { ref: attempt.sample_ref, sha256: attempt.sample_sha256 }, `sample-${attempt.sequence}`);
  const evaluationBinding = verifyBinding(campaignPath, { ref: attempt.report_ref, sha256: attempt.report_sha256 }, `evaluation-${attempt.sequence}`);
  const sample = readJson(resolve(dirname(campaignPath), attempt.sample_ref)).value;
  return {
    sequence: attempt.sequence,
    status: attempt.status,
    identity: browserIdentity(sample),
    metrics: attempt.p95_ms,
    runtime_errors: attempt.runtime_errors,
    sample_binding: sampleBinding,
    evaluation_binding: evaluationBinding,
  };
});

const referenceIdentity = attempts[0].identity;
if (attempts.some((attempt) => JSON.stringify(attempt.identity) !== JSON.stringify(referenceIdentity))) {
  throw new Error("FOUNDATION_DIFFERENTIAL_REFERENCE_IDENTITY_DRIFT");
}
const referenceProfile = contract.value.profiles.find((profile) => profile.profile_id === contract.value.reference_profile_id);
if (!referenceProfile) throw new Error("FOUNDATION_DIFFERENTIAL_REFERENCE_PROFILE_MISSING");
if (referenceIdentity.platform !== referenceProfile.platform || referenceIdentity.architecture !== referenceProfile.architecture) {
  throw new Error(`FOUNDATION_DIFFERENTIAL_HOST_IDENTITY_MISMATCH:${referenceIdentity.platform}:${referenceIdentity.architecture}`);
}

const budget = readJson(resolve(runtimeRoot, budgetBinding.ref));
const evaluationContext = {
  contract: contract.value,
  budgets: budget.value,
  budgetSha256: budgetBinding.sha256,
  regimeSha256: regimeBinding.sha256,
};
const importedInputs = [];
if (existsSync(inputRoot)) {
  for (const profileEntry of readdirSync(inputRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).sort((left, right) => left.name.localeCompare(right.name))) {
    const profileRoot = resolve(inputRoot, profileEntry.name);
    for (const file of readdirSync(profileRoot).filter((name) => name.endsWith(".evidence.json")).sort()) {
      const path = resolve(profileRoot, file);
      const source = readJson(path);
      const evaluation = validateAndEvaluateEvidence(source.value, evaluationContext);
      importedInputs.push({
        profile_id: source.value.profile_id,
        observed_at: source.value.observed_at,
        identity: source.value.identity,
        evaluation,
        evidence_binding: { ref: relative(runtimeRoot, path), sha256: sha256(source.bytes) },
        bytes: source.bytes,
      });
    }
  }
}

function comparisonFor(profileAttempts) {
  if (profileAttempts.length === 0) return null;
  const sorted = [...profileAttempts].sort((left, right) => left.observed_at.localeCompare(right.observed_at));
  const reportAttempts = sorted.map(({ bytes: _bytes, ...attempt }) => attempt);
  const latest = sorted.at(-1);
  if (latest.evaluation.status === "FAIL") return { classification: "comparable_budget_failure", evidence_status: "measured-failure", attempts: reportAttempts };
  const pair = sorted.slice(-2);
  const stableIdentity = pair.length === 2 && JSON.stringify(pair[0].identity) === JSON.stringify(pair[1].identity);
  if (pair.length === 2 && pair.every((attempt) => attempt.evaluation.status === "PASS") && stableIdentity) {
    const metric_deltas = Object.fromEntries(contract.value.comparison_metrics.map((name) => {
      const shortName = name.replace("foundation.", "").replace("-to-paint", "");
      const profileValues = pair.map((attempt) => attempt.evaluation.metrics[name].value);
      const referenceValues = attempts.map((attempt) => attempt.metrics[shortName]);
      return [name, {
        reference_p95_ms: referenceValues,
        profile_p95_ms: profileValues,
        latest_delta_ms: Number((profileValues.at(-1) - referenceValues.at(-1)).toFixed(3)),
      }];
    }));
    return { classification: "comparable_pass", evidence_status: "two-consecutive-passes", resolved_identity: pair[0].identity, metric_deltas, attempts: reportAttempts };
  }
  return {
    classification: "not_evaluable",
    evidence_status: "incomplete",
    reason: stableIdentity ? "insufficient-consecutive-passes" : "identity-drift-between-latest-attempts",
    attempts: reportAttempts,
  };
}

const profiles = contract.value.profiles.map((profile) => {
  if (profile.profile_id === contract.value.reference_profile_id) {
    return {
      ...profile,
      classification: "reference",
      evidence_status: "two-consecutive-passes",
      resolved_identity: referenceIdentity,
      budget_binding: budgetBinding,
      regime_binding: regimeBinding,
      attempts,
    };
  }
  const imported = importedInputs.filter((attempt) => attempt.profile_id === profile.profile_id);
  const comparison = comparisonFor(imported);
  if (comparison) return { ...profile, ...comparison };
  const sameHost = profile.platform === process.platform && profile.architecture === process.arch;
  return {
    ...profile,
    classification: "not_evaluable",
    evidence_status: "missing",
    reason: sameHost
      ? `browser-engine-unavailable:${profile.browser_engine}`
      : `platform-runner-unavailable:${profile.platform}-${profile.architecture}`,
    required_next_evidence: "two-consecutive-passing-attempts-with-complete-exact-identity-and-the-bound-budget-and-regime",
  };
});

const report = {
  schema_version: "cav2-workspace-foundation-differential-report/v1-candidate",
  report_id: sha256(Buffer.concat([contract.bytes, campaign.bytes, ...importedInputs.map((input) => input.bytes)])),
  observed_at: new Date().toISOString(),
  status: profiles.some((profile) => profile.classification === "comparable_budget_failure")
    ? "fail"
    : profiles.filter((profile) => profile.classification !== "reference").every((profile) => profile.classification === "comparable_pass")
      ? "pass"
      : "not_evaluable",
  authority_effect: "none",
  contract_binding: { ref: relative(runtimeRoot, contractPath), sha256: sha256(contract.bytes) },
  reference_campaign_binding: { ref: relative(runtimeRoot, campaignPath), sha256: sha256(campaign.bytes) },
  evaluated_host: { platform: process.platform, architecture: process.arch },
  comparison_metrics: contract.value.comparison_metrics,
  profiles,
  summary: {
    reference: profiles.filter((profile) => profile.classification === "reference").length,
    comparable: profiles.filter((profile) => profile.classification === "comparable_pass" || profile.classification === "comparable_budget_failure").length,
    passing: profiles.filter((profile) => profile.classification === "comparable_pass").length,
    budget_failures: profiles.filter((profile) => profile.classification === "comparable_budget_failure").length,
    not_evaluable: profiles.filter((profile) => profile.classification === "not_evaluable").length,
    conclusion: profiles.some((profile) => profile.classification === "comparable_pass" || profile.classification === "comparable_budget_failure")
      ? "One or more exact non-reference profiles are comparable; inspect their per-metric deltas and classifications."
      : "No cross-browser or cross-platform comparison is currently evaluable; the Linux x64 Chromium evidence is the sole reference profile."
  },
  deferred_operational_residue: [
    { owner: "environment-toolchain", task: "Provide Firefox and WebKit executables on Linux x64", affected_stage: "differential product-test evidence" },
    { owner: "platform-infrastructure", task: "Provide governed macOS arm64 and Windows x64 runners", affected_stage: "differential product-test evidence" }
  ],
  equivalence_ceiling: contract.value.equivalence_ceiling,
  claim_ceiling: contract.value.claim_ceiling,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ status: report.status, report_path: relative(runtimeRoot, outputPath), summary: report.summary }, null, 2)}\n`);
