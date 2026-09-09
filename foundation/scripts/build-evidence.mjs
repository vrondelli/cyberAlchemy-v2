import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson, evaluateFoundationInvocation } from "../runtime/foundation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidate = JSON.parse(await readFile(resolve(root, "candidate.json"), "utf8"));
const target = resolve(root, "evidence/differential-bundle.json");
const liveTauriEvidencePath = resolve(root, "evidence/live-tauri/foundation-live-preflight.candidate.json");
const liveTauriEvidenceBytes = await readFile(liveTauriEvidencePath);
const liveTauriEvidence = JSON.parse(liveTauriEvidenceBytes.toString("utf8"));
const sha = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const currentSources = candidate.source_bindings.map((term) => ({ term, current: true }));

const baseline = {
  invocation_id: "foundation.evidence.baseline",
  instance_ref: candidate.instance_id,
  parent_capability_ref: candidate.parent_capability_ref,
  principal: { principal_id: "local-process:evidence-fixture", domain: "local-workspace", verified_human_identity: false },
  host_claim: { host: candidate.host, active: true },
  effect_envelope: { envelope_id: candidate.effect_envelope.envelope_id, effects: [] },
  grants: [],
};
const scenarios = [
  { id: "exact-effect-free", invocation: baseline, sources: currentSources },
  { id: "identity-drift", invocation: { ...baseline, instance_ref: "drifted.instance" }, sources: currentSources },
  { id: "host-claim-inactive", invocation: { ...baseline, host_claim: { ...baseline.host_claim, active: false } }, sources: currentSources },
  { id: "effect-requested", invocation: { ...baseline, effect_envelope: { envelope_id: "host.effect/v1", effects: ["filesystem.write"] } }, sources: currentSources },
  { id: "definition-source-drift", invocation: baseline, sources: currentSources.map((source, index) => ({ ...source, current: index !== 0 })) },
];
const observations = scenarios.map((scenario) => ({
  scenario_id: scenario.id,
  invocation_identity: {
    instance_ref: scenario.invocation.instance_ref,
    parent_capability_ref: scenario.invocation.parent_capability_ref,
    principal_ref: scenario.invocation.principal.principal_id,
    host: scenario.invocation.host_claim.host,
  },
  evidence: evaluateFoundationInvocation({ candidate, invocation: scenario.invocation, currentSources: scenario.sources }),
}));
const body = {
  schema: "cav2.foundation-differential-evidence-bundle/v1",
  bundle_id: null,
  subject: {
    instance_id: candidate.instance_id,
    version: candidate.version,
    parent_capability_ref: candidate.parent_capability_ref,
    lifecycle_epoch: candidate.lifecycle.epoch,
  },
  profiles: { baseline: "exact-effect-free", hostile: scenarios.slice(1).map((scenario) => scenario.id) },
  observations,
  live_tauri_evidence: {
    ref: "evidence/live-tauri/foundation-live-preflight.candidate.json",
    sha256: createHash("sha256").update(liveTauriEvidenceBytes).digest("hex"),
    principal_ref: liveTauriEvidence.principal_ref,
    evidence_id: liveTauriEvidence.evidence_id,
    outcome: liveTauriEvidence.outcome,
    execution_attempted: liveTauriEvidence.execution_attempted,
    effect_authorized: liveTauriEvidence.effect_authorized
  },
  summary: {
    scenarios: observations.length,
    passed: observations.filter((entry) => entry.evidence.outcome === "PASS").length,
    failed_closed: observations.filter((entry) => entry.evidence.outcome === "FAIL" && entry.evidence.effect_authorized === false).length,
  },
  claim_ceiling: "deterministic identity-bound candidate evidence; not a Validation Receipt, conformance decision, product approval, or effect authority",
};
body.bundle_id = `sha256:${sha({ ...body, bundle_id: null })}`;
const output = `${JSON.stringify(body, null, 2)}\n`;

if (process.argv.includes("--check")) {
  let actual = null;
  try { actual = await readFile(target, "utf8"); } catch { /* missing is drift */ }
  if (actual !== output) {
    process.stderr.write(`Foundation differential evidence is stale: ${target}\n`);
    process.exitCode = 1;
  }
} else {
  await writeFile(target, output);
  process.stdout.write(`${target}\n`);
}
