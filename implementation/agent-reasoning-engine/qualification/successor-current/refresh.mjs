#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {inspectProduct, materializeProductClosure} from "../../src/product.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const productRoot = resolve(root, "../..");
const qualificationPath = resolve(root, "qualification.json");
const baseline = JSON.parse(readFileSync(resolve(productRoot, "evidence/product-candidate.018.json"), "utf8"));
const successor = JSON.parse(readFileSync(resolve(productRoot, "evidence/product-candidate.020.json"), "utf8"));
const testReceipt = JSON.parse(readFileSync(resolve(productRoot, "evidence/product-test-receipt.020.json"), "utf8"));
const lifecycleReceipt = JSON.parse(readFileSync(resolve(productRoot, "docs/releases/0.10.0-rc.1-lifecycle-receipt.json"), "utf8"));
const qualification = JSON.parse(readFileSync(qualificationPath, "utf8"));
const closure = materializeProductClosure();
const health = inspectProduct({require_exact_runtime: true});

if (successor.source_closure.closure_digest !== closure.closure_digest) throw new Error("qualification.candidate-closure-drift");
if (testReceipt.status !== "PASS") throw new Error("qualification.candidate-tests-not-pass");
if (testReceipt.candidate_binding?.candidate_digest !== successor.candidate_digest) throw new Error("qualification.candidate-test-binding-drift");
const lifecycleMaterial = {...lifecycleReceipt};
delete lifecycleMaterial.receipt_digest;
if (lifecycleReceipt.receipt_digest !== createHash("sha256").update(JSON.stringify(lifecycleMaterial)).digest("hex")) throw new Error("qualification.lifecycle-receipt-digest-invalid");
if (lifecycleReceipt.status !== "PASS" || lifecycleReceipt.candidate?.candidate_digest !== successor.candidate_digest) throw new Error("qualification.lifecycle-receipt-binding-invalid");
const retainedArchive = readFileSync(resolve(productRoot, lifecycleReceipt.retention.artifact_path.replace("implementation/agent-reasoning-engine/", "")));
if (retainedArchive.byteLength !== lifecycleReceipt.artifact.bytes
  || createHash("sha256").update(retainedArchive).digest("hex") !== lifecycleReceipt.artifact.sha256) throw new Error("qualification.lifecycle-artifact-invalid");

const frozen = new Map(baseline.source_closure.files.map(file => [file.path, file]));
const current = new Map(closure.files.map(file => [file.path, file]));
const added = [...current.keys()].filter(path => !frozen.has(path)).sort();
const removed = [...frozen.keys()].filter(path => !current.has(path)).sort();
const contentChanged = [...current].filter(([path, file]) => {
  const old = frozen.get(path);
  return old && (old.sha256 !== file.sha256 || old.bytes !== file.bytes);
}).map(([path]) => path).sort();
const modeOnlyChanged = [...current].filter(([path, file]) => {
  const old = frozen.get(path);
  return old && old.sha256 === file.sha256 && old.bytes === file.bytes && old.mode !== file.mode;
}).map(([path]) => path).sort();

qualification.reported_product_version = health.product_version;
qualification.successor_identity = {version: "0.10.0-rc.1", status: "frozen-testable-candidate", candidate_id: successor.candidate_id};
qualification.source_observation = {
  observed_date: "2026-09-25",
  repository_head: qualification.source_observation.repository_head,
  closure_digest: closure.closure_digest,
  file_count: closure.files.length,
  total_bytes: closure.files.reduce((sum, file) => sum + file.bytes, 0),
  working_tree_posture: "dirty-preexisting-and-preserved",
  claim: "Exact frozen Candidate 020 source state with passing isolated tests.",
};
qualification.candidate_018_comparison = {
  candidate_id: baseline.candidate_id,
  candidate_digest: baseline.candidate_digest,
  closure_digest: baseline.source_closure.closure_digest,
  file_count: baseline.source_closure.files.length,
  total_bytes: baseline.source_closure.files.reduce((sum, file) => sum + file.bytes, 0),
  inspection_status: "BLOCK",
  reason_codes: ["candidate.current-source-closure-mismatch", "candidate.source-closure-drift"],
  preservation: "immutable-historical-evidence",
};
qualification.source_drift = {
  classification: "candidate-020-successor-to-candidate-018",
  added_count: added.length,
  removed_count: removed.length,
  content_changed_count: contentChanged.length,
  mode_only_changed_count: modeOnlyChanged.length,
  added_paths: added,
  removed_paths: removed,
  content_changed_paths: contentChanged,
  mode_only_changed_paths: modeOnlyChanged,
  note: "Exact comparison between immutable Candidate 018 and frozen Candidate 020.",
};
qualification.documentation_findings = [
  {path: "cyberAlchemy-v2/implementation/agent-reasoning-engine/docs/releases/0.10.0-rc.1.md", posture: "current-candidate", finding: "Binds RC1 to frozen Candidate 020 and lists remaining gates."},
  {path: "cyberAlchemy-v2/implementation/agent-reasoning-engine/README.md", posture: "frozen-current", finding: "Candidate 020 identifies its frozen identity and inspection workflow."},
  {path: "cyberAlchemy-v2/implementation/agent-reasoning-engine/RELEASE.md", posture: "frozen-current", finding: "Candidate 020 identifies its frozen status and separate later gates."},
  {path: "cyberAlchemy-v2/implementation/agent-reasoning-engine/evidence/product-candidate.019.json", posture: "preserve-historical", finding: "Immutable Candidate 019 evidence is retained without rewriting its frozen wording."},
  {path: "cyberAlchemy-v2/implementation/agent-reasoning-engine/docs/releases/0.10.0-self-contained-candidate.7.md", posture: "preserve-historical", finding: "Immutable Candidate 018 history; not rewritten as successor evidence."},
];
for (const gate of qualification.gates) {
  if (gate.gate_id === "source-closure-stable") {
    gate.status = "PASS";
    gate.evidence = `Candidate 020 binds closure ${closure.closure_digest}.`;
  } else if (gate.gate_id === "product-health") {
    gate.status = health.status;
    gate.evidence = `Node ${health.node.observed}; ${health.components.length} components and ${health.integrations.length} integrations present.`;
  } else if (gate.gate_id === "full-product-tests-isolated") {
    gate.status = "PASS";
    gate.evidence = `${testReceipt.product_test_evidence.total_test_cases}/${testReceipt.product_test_evidence.total_test_cases} cases passed across ${testReceipt.product_test_evidence.total_test_files} files in isolated-source-closure mode; receipt ${testReceipt.receipt_digest}.`;
  } else if (gate.gate_id === "documentation-current") {
    gate.status = "PASS";
    gate.evidence = "Candidate 020 freezes corrected README.md and RELEASE.md wording; Candidates 018 and 019 remain historical.";
  } else if (gate.gate_id === "archive-lifecycle-and-retention") {
    gate.status = "PASS";
    gate.evidence = `Candidate 020 archive lifecycle receipt ${lifecycleReceipt.receipt_digest} binds two identical builds, disposable lifecycle checks, and repository-local retention.`;
  }
}
qualification.claim_limit = "This package binds frozen Candidate 020, its passing isolated suite, and repository-local archive lifecycle evidence. It proves no external archive custody, legal clearance, approval, signing, publication, release, delivery, deployment, or live-provider behavior.";
writeFileSync(qualificationPath, `${JSON.stringify(qualification, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({status: "WROTE", candidate_id: successor.candidate_id, closure_digest: closure.closure_digest, file_count: closure.files.length, test_cases: testReceipt.product_test_evidence.total_test_cases, authority_effect: "none"}, null, 2)}\n`);
