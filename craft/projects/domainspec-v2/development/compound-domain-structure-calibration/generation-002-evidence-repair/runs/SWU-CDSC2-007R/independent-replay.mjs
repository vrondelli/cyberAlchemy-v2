import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalize, validateEnvelope } from "../../../evaluation/canonical-json.mjs";
import { evaluateFixture } from "../../../evaluation/evaluate-fixture.mjs";
import { generationEntryFromSuite, validateGenerationIndex } from "../../../evaluation/generation-index.mjs";
import { validateEvaluationResult, validateEvidenceReceipt, validateSuiteResult } from "../../../evaluation/validate-input.mjs";
import { evaluateSuccessorSuite } from "../../runtime/evaluate-successor-suite.mjs";
import { materializeAdjudicatedF3, targetStatement } from "../../runtime/materialize-adjudicated-f3.mjs";
import { validateAdjudicationOverlay } from "../../runtime/validate-adjudication-overlay.mjs";
import { validateObservationReceipt, verifyProtectedGeneration } from "../../runtime/validate-generation-002.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(directory, "../..");
const parentRoot = resolve(packageRoot, "..");

const paths = Object.freeze({
  parent: "evidence/generation-001/f3-savvy-page/receipt.json",
  m1: "generation-002-evidence-repair/evidence/generation-002/m1-permitted-screen/receipt.json",
  m2: "generation-002-evidence-repair/evidence/generation-002/m2-breaking-guard/receipt.json",
  overlay: "evidence/generation-002/f3-savvy-page/adjudication-overlay.json",
  compatibility: "evidence/generation-002/f3-savvy-page/compatibility-receipt.json",
  f1: "results/generation-001/f1-result.json",
  f2: "results/generation-001/f2-result.json",
  f3: "results/generation-002/f3-result.json",
  suite: "results/generation-002/suite-result.json",
  provenance: "results/generation-002/provenance-manifest.json",
  runReceipt: "results/generation-002/run-receipt.json",
  index: "generations/index.json",
  evaluator: "evaluation/evaluate-fixture.mjs",
  suiteEvaluator: "evaluation/evaluate-suite.mjs",
  materializer: "generation-002-evidence-repair/runtime/materialize-adjudicated-f3.mjs",
  overlayValidator: "generation-002-evidence-repair/runtime/validate-adjudication-overlay.mjs",
});

const expected = Object.freeze({
  predecessor: "generation:sha256:2ff6a0109e08f188388d580125ab6b185b4ff5f198300cb6bd5db0d9fe31349f",
  generation: "generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683",
  parent: "record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a",
  m1: "record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140",
  m2: "record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd",
  m1Bytes: "sha256:61679792f7a88b1c6e00aca88302c570f88382e97406d9fd4e4066c9aa58ed62",
  m2Bytes: "sha256:89fca15c59d3ba894e31278a1efb11020819664abf2648dcb5392eaedc622a8c",
  overlay: "record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5",
  compatibility: "record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd",
  f3: "record:sha256:8000b77fa0a60967707f5b830b8320fe92bee9965edbb3ff21e12f834620bd1a",
  suite: "record:sha256:2953bb722b9d729c7c6126ef31331a2d652781020a999d2d9a0f466691763e52",
  provenance: "record:sha256:d7f4353c339cb2826e29860d17367c75737ff7f96c3367f856957ff4e98f47e2",
});

const targetFiles = Object.values(paths).map((path) => resolve(parentRoot, path));
const before = hashFiles(targetFiles);

const parent = readJson(paths.parent);
const m1 = readJson(paths.m1);
const m2 = readJson(paths.m2);
const overlay = readJson(paths.overlay);
const compatibility = readJson(paths.compatibility);
const f1 = readJson(paths.f1);
const f2 = readJson(paths.f2);
const storedF3 = readJson(paths.f3);
const storedSuite = readJson(paths.suite);
const provenance = readJson(paths.provenance);
const runReceipt = readJson(paths.runReceipt);
const index = readJson(paths.index);
const protectedManifest = JSON.parse(readFileSync(resolve(packageRoot, "fixtures/contracts/generation-001-protected-files.json"), "utf8"));

const checks = [];
check("protected-generation-001", () => verifyProtectedGeneration(parentRoot, protectedManifest));
check("pre-refresh-mutation-bytes", () => {
  assert.equal(hashFile(resolve(parentRoot, paths.m1)), expected.m1Bytes);
  assert.equal(hashFile(resolve(parentRoot, paths.m2)), expected.m2Bytes);
});
check("independent-layer-validation", () => {
  assert.equal(validateEvidenceReceipt(parent), true);
  assert.equal(validateObservationReceipt(m1), true);
  assert.equal(validateObservationReceipt(m2), true);
  assert.equal(validateAdjudicationOverlay(overlay, { parentReceipt: parent, permittedReceipt: m1, breakingReceipt: m2 }), true);
  assert.deepEqual(
    [parent.record_id, m1.record_id, m2.record_id, overlay.record_id],
    [expected.parent, expected.m1, expected.m2, expected.overlay],
  );
});

let rebuiltCompatibility;
check("compatibility-fresh-replay", () => {
  rebuiltCompatibility = materializeAdjudicatedF3(
    { overlay, parentReceipt: parent, permittedReceipt: m1, breakingReceipt: m2 },
    { createdAt: compatibility.created_at, storagePath: compatibility.storage_path },
  );
  assert.equal(validateEvidenceReceipt(rebuiltCompatibility), true);
  assert.equal(canonicalize(rebuiltCompatibility), canonicalize(compatibility));
  assert.equal(rebuiltCompatibility.content_digest, compatibility.content_digest);
  assert.equal(rebuiltCompatibility.record_id, expected.compatibility);
  assert.equal(rebuiltCompatibility.generation_id, compatibility.generation_id);
});
check("target-provenance", () => {
  assert.equal(compatibility.semantic.Q[5].statement, targetStatement(parent.semantic.S.permitted));
  assert.equal(compatibility.semantic.Q[6].statement, targetStatement(parent.semantic.S.breaking));
  assert.ok(!compatibility.semantic.Q[5].statement.includes(m1.semantic.observed_consequence));
  assert.ok(!compatibility.semantic.Q[6].statement.includes(m2.semantic.observed_consequence));
  assert.equal(provenance.semantic.target_provenance, "parent-substitution-only");
});
check("overlay-totality-and-uncertainty", () => {
  assert.equal(overlay.semantic.adjudication_matrix.length, 12);
  const counts = countBy(overlay.semantic.adjudication_matrix, "state");
  assert.deepEqual(counts, { explained: 2, indeterminate: 6, "not-explained": 4 });
  assert.deepEqual(overlay.semantic.uncertainty_resolutions.map((item) => item.parent_uncertainty_id), ["F3-U-01", "F3-U-02"]);
  assert.deepEqual(overlay.semantic.carried_uncertainty.map((item) => item.uncertainty_id), [
    "F3-U-03", "F3-U-M1-1", "F3-U-M1-2", "F3-U-M2-1", "F3-U-M2-2",
  ]);
  assert.ok(overlay.semantic.carried_uncertainty.every((item) => item.state === "non-portable"));
});

let replayF3;
let replaySuite;
check("fresh-fixture-and-suite-evaluation", () => {
  replayF3 = evaluateFixture(rebuiltCompatibility);
  assert.equal(validateEvaluationResult(replayF3), true);
  assert.equal(canonicalize(replayF3), canonicalize(storedF3));
  const prefix = { schema_version: index.schema_version, entries: [structuredClone(index.entries[0])] };
  replaySuite = evaluateSuccessorSuite([f1, f2, replayF3], {
    replayState: "identical",
    predecessorGenerationId: expected.predecessor,
    generationIndex: prefix,
  });
  assert.equal(validateSuiteResult(replaySuite), true);
  assert.equal(canonicalize(replaySuite), canonicalize(storedSuite));
  assert.equal(replayF3.semantic.fixture_outcome, "INSUFFICIENT-EVIDENCE");
  assert.equal(replaySuite.semantic.suite_verdict, "CALIBRATION-DEFER");
});
check("generation-chain", () => {
  assert.equal(validateGenerationIndex(index), true);
  assert.equal(index.entries.length, 2);
  assert.equal(index.entries[1].predecessor_generation_id, expected.predecessor);
  assert.equal(index.entries[1].generation_id, expected.generation);
  assert.deepEqual(index.entries[1], generationEntryFromSuite(replaySuite, [f1, f2, replayF3]));
});
check("provenance-and-run-receipt", () => {
  assert.equal(validateEnvelope(provenance, { schemaVersion: "cdsc.generation-provenance.v1", contractId: "cdsc.generation-provenance" }), true);
  assert.equal(provenance.record_id, expected.provenance);
  assert.equal(provenance.semantic.generation_id, expected.generation);
  assert.equal(provenance.semantic.suite_result_handle, expected.suite);
  assert.equal(runReceipt.generation_id, expected.generation);
  assert.equal(runReceipt.provenance_handle, expected.provenance);
  assert.equal(runReceipt.same_process_replay, "identical");
  assert.equal(runReceipt.uncertainty.length, 5);
});
check("task-session-receipts", () => {
  for (const swu of ["SWU-CDSC2-001", "SWU-CDSC2-002", "SWU-CDSC2-003", "SWU-CDSC2-004", "SWU-CDSC2-005A", "SWU-CDSC2-005B", "SWU-CDSC2-006R"]) {
    const receipt = JSON.parse(readFileSync(resolve(packageRoot, `runs/${swu}/receipt.json`), "utf8"));
    assert.equal(receipt.result, "pass");
    assert.deepEqual(receipt.blockers, []);
  }
});
check("superseded-blocked-receipt", () => {
  const receipt = JSON.parse(readFileSync(resolve(packageRoot, "runs/SWU-CDSC2-005/receipt.json"), "utf8"));
  assert.equal(receipt.result, "block");
  assert.match(receipt.reroute, /invoke refresh/);
  const parentWorkPack = readFileSync(resolve(packageRoot, "WORK-PACK.md"), "utf8");
  const refreshedWorkPack = readFileSync(resolve(packageRoot, "refreshes/2026-07-12-three-layer-adjudication/REFRESHED-WORK-PACK.md"), "utf8");
  assert.match(parentWorkPack, /status: complete-via-refresh/);
  assert.match(parentWorkPack, /SWU-CDSC2-005[\s\S]*superseded/);
  assert.match(refreshedWorkPack, /SWU-CDSC2-005A/);
  assert.match(refreshedWorkPack, /SWU-CDSC2-007R[\s\S]*complete/);
});
check("authority-boundary", () => {
  const required = ["candidate-promotion", "ds-d1-formation", "ds-d8-authority", "identity", "irreducibility", "pattern-admission", "portability"];
  for (const artifact of [parent, m1, m2, overlay, compatibility, storedF3, storedSuite, provenance]) {
    for (const prohibition of required) assert.ok(artifact.prohibited_inferences.includes(prohibition));
  }
  assert.doesNotMatch(`${storedF3.status} ${storedSuite.status}`, /(identity|authority|promotion|pattern-admission)/i);
  assert.equal(storedSuite.semantic.next_route, "evidence-repair");
});

const after = hashFiles(targetFiles);
check("read-only-target-boundary", () => assert.deepEqual(after, before));

const report = {
  schema_version: "cdsc.independent-replay.v1",
  status: "pass",
  audited_at: "2026-07-12T15:05:00Z",
  fresh_process: true,
  checks,
  handles: {
    parent_f3: parent.record_id,
    m1: m1.record_id,
    m2: m2.record_id,
    overlay: overlay.record_id,
    compatibility: compatibility.record_id,
    f3_result: storedF3.record_id,
    suite_result: storedSuite.record_id,
    provenance: provenance.record_id,
    generation_2: storedSuite.generation_id,
  },
  outcomes: {
    F1: f1.semantic.fixture_outcome,
    F2: f2.semantic.fixture_outcome,
    F3: replayF3.semantic.fixture_outcome,
    suite: replaySuite.semantic.suite_verdict,
    bounded_next_route: replaySuite.semantic.next_route,
  },
  uncertainty_ids: compatibility.semantic.U.map((item) => item.uncertainty_id),
  target_hashes_before: before,
  target_hashes_after: after,
  authority_claims: [],
  prohibited_inferences: provenance.prohibited_inferences,
};

writeFileSync(resolve(directory, "replay-result.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ status: report.status, checks: checks.length, outcomes: report.outcomes })}\n`);

function check(id, operation) {
  operation();
  checks.push({ id, status: "pass" });
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(parentRoot, path), "utf8"));
}

function hashFiles(files) {
  return Object.fromEntries(files.map((file) => [file.slice(parentRoot.length + 1), hashFile(file)]));
}

function hashFile(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

function countBy(values, field) {
  const counts = {};
  for (const value of values) counts[value[field]] = (counts[value[field]] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}
