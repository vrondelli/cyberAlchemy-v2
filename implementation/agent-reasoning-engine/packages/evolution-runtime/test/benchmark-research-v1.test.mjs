import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, unlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import test from "node:test";

import {
  createBenchmarkResearchRuntime,
  createDurableEvolutionKernel,
  evolutionProtocolDigest,
  loadHenFrontierImportManifest,
  verifyBenchmarkImportManifest,
  verifyHenProgressionEvidence,
} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../..");

function temporaryRoot() {
  const root = mkdtempSync(join(tmpdir(), "are-benchmark-prototype-"));
  test.after(() => rmSync(root, {recursive: true, force: true}));
  return root;
}

function runtime(root, requireEnabled = false, evidenceRoot = undefined) {
  const kernel = createDurableEvolutionKernel({root, require_enabled: requireEnabled});
  return {kernel, benchmark: createBenchmarkResearchRuntime({kernel, repository_root: repositoryRoot,
    ...(evidenceRoot === undefined ? {} : {evidence_root: evidenceRoot})})};
}

function importedAt() {
  return "2026-09-22T15:00:00.000Z";
}

test("the exact H-EN manifest verifies all bounded source bytes", () => {
  const manifest = loadHenFrontierImportManifest();
  const checked = verifyBenchmarkImportManifest(manifest, {repository_root: repositoryRoot, verify_source_bytes: true});
  assert.equal(checked.ok, true);
  assert.deepEqual(manifest.excluded_scopes.includes("ARE-DSH rounds 73-78 branch"), true);
  assert.deepEqual(manifest.hypothesis.legacy_aliases, ["E5"]);
});

test("progression verification fails closed on reviewed continuity mutation", () => {
  const checked = verifyHenProgressionEvidence({packageRoot, read_bytes: (path) => {
    const bytes = readFileSync(path);
    if (!path.endsWith("HEN-07-08-RUNTIME-CONTINUITY.v1.json")) return bytes;
    const changed = JSON.parse(bytes);
    changed.additive_integration_successors[0].successor_sha256 = "0".repeat(64);
    return Buffer.from(JSON.stringify(changed));
  }});
  assert.equal(checked.ok, false);
  assert.ok(checked.reason_codes.includes("hen-progression.continuity-successor-invalid"));
  assert.ok(checked.reason_codes.includes("hen-progression.subject-drift:evidence/HEN-07-08-RUNTIME-CONTINUITY.v1.json"));
});

test("progression verification rejects a mutated continuity successor transition", () => {
  const checked = verifyHenProgressionEvidence({packageRoot, read_bytes: (path) => {
    const bytes = readFileSync(path);
    if (!path.endsWith("HEN-07-08-RUNTIME-CONTINUITY-SUCCESSOR.v1.json")) return bytes;
    const changed = JSON.parse(bytes);
    changed.transition.successor_sha256 = "0".repeat(64);
    return Buffer.from(JSON.stringify(changed));
  }});
  assert.equal(checked.ok, false);
  assert.ok(checked.reason_codes.includes("hen-progression.continuity-successor-review-invalid"));
  assert.ok(checked.reason_codes.includes("hen-progression.continuity-drift:implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs"));
});

test("progression verification rejects a mutated successor review", () => {
  const checked = verifyHenProgressionEvidence({packageRoot, read_bytes: (path) => {
    const bytes = readFileSync(path);
    if (!path.endsWith("HEN-07-08-RUNTIME-CONTINUITY-SUCCESSOR-REVIEW.v1.json")) return bytes;
    const changed = JSON.parse(bytes);
    changed.verdict = "rejected";
    return Buffer.from(JSON.stringify(changed));
  }});
  assert.equal(checked.ok, false);
  assert.ok(checked.reason_codes.includes("hen-progression.continuity-successor-review-invalid"));
});

test("progression verification rejects current facade byte drift after successor review", () => {
  const checked = verifyHenProgressionEvidence({packageRoot, read_bytes: (path) => {
    const bytes = readFileSync(path);
    return path.endsWith("implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs") ? Buffer.concat([bytes, Buffer.from("\n")]) : bytes;
  }});
  assert.equal(checked.ok, false);
  assert.ok(checked.reason_codes.includes("hen-progression.continuity-drift:implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs"));
});

test("source drift blocks import without rewriting the declared digest", () => {
  const manifest = structuredClone(loadHenFrontierImportManifest());
  manifest.source_artifacts[0].sha256 = "0".repeat(64);
  const {manifest_digest: _old, ...material} = manifest;
  manifest.manifest_digest = evolutionProtocolDigest(material);
  const checked = verifyBenchmarkImportManifest(manifest, {repository_root: repositoryRoot, verify_source_bytes: true});
  assert.equal(checked.ok, false);
  assert.ok(checked.reason_codes.some((reason) => reason.startsWith("benchmark-import.source-drift:")));
});

test("the prototype imports H-EN as awaiting validation and replays idempotently", () => {
  const root = temporaryRoot();
  const {kernel, benchmark} = runtime(root);
  const first = benchmark.importFrontier({imported_at: importedAt()});
  assert.equal(first.ok, true);
  assert.equal(first.disposition, "accepted");
  assert.equal(first.value.objective.objective_ref, "objective:glm8k-contextbench-context-selection");
  assert.equal(first.value.hypotheses[0].status, "awaiting-validation");
  assert.equal(first.value.candidates[0].status, "awaiting-validation");
  assert.equal(first.value.ready_work[0].task_ref, "task:HEN-06-independent-construction-review");
  assert.equal(first.value.artifact_bindings.length, 11);
  assert.equal(first.value.import_receipt.import_posture, "retrospective");
  assert.equal(kernel.inspect().value.commit_count, 5);
  const replay = benchmark.importFrontier({imported_at: importedAt()});
  assert.equal(replay.ok, true);
  assert.equal(replay.disposition, "replayed");
  assert.equal(kernel.inspect().value.commit_count, 5);
});

test("accepted HEN evidence advances the durable frontier to HEN-10 and replays idempotently", () => {
  const root = temporaryRoot();
  const {kernel, benchmark} = runtime(root);
  assert.equal(verifyHenProgressionEvidence({packageRoot}).ok, true);
  assert.equal(benchmark.importFrontier({imported_at: importedAt()}).ok, true);
  const first = benchmark.advanceHen();
  assert.equal(first.ok, true);
  assert.equal(first.disposition, "accepted");
  assert.equal(first.value.candidates.at(-1).candidate_ref, "candidate:H-EN-R2-adaptive-v2");
  assert.equal(first.value.candidates.at(-1).status, "qualified");
  assert.equal(first.value.qualifications.at(-1).qualification_ref, "qualification:HEN-09-v2");
  assert.equal(first.value.qualifications.at(-1).provider_calls_total, 186);
  assert.equal(first.value.qualifications.at(-1).benchmark_dispatch_admitted, false);
  assert.deepEqual(first.value.ready_work.map((work) => work.task_ref), ["task:HEN-10-freeze-review-execute"]);
  assert.equal(first.value.artifact_bindings.length, 24);
  assert.match(first.value.claim_ceiling, /live benchmark launch.*remain unadmitted/);
  assert.equal(kernel.inspect().value.commit_count, 8);
  const replay = benchmark.advanceHen();
  assert.equal(replay.ok, true);
  assert.equal(replay.disposition, "replayed");
  assert.equal(kernel.inspect().value.commit_count, 8);
  const sourceIndependent = runtime(root, false, join(root, "missing-evidence-root")).benchmark.advanceHen();
  assert.equal(sourceIndependent.ok, true);
  assert.equal(sourceIndependent.disposition, "replayed");
});

test("restart and SQLite loss reconstruct the byte-identical benchmark projection", () => {
  const root = temporaryRoot();
  const first = runtime(root);
  assert.equal(first.benchmark.importFrontier({imported_at: importedAt()}).ok, true);
  assert.equal(first.benchmark.advanceHen().ok, true);
  const expected = first.benchmark.inspect().value;
  unlinkSync(first.kernel.paths.index);
  const restarted = runtime(root);
  const diagnosis = restarted.kernel.diagnose();
  assert.equal(diagnosis.value.disposition, "rebuild-required");
  assert.equal(restarted.kernel.recover().ok, true);
  assert.deepEqual(restarted.benchmark.inspect().value, expected);
});

test("missing referenced artifact bytes block diagnosis and recovery", () => {
  const root = temporaryRoot();
  const first = runtime(root);
  assert.equal(first.benchmark.importFrontier({imported_at: importedAt()}).ok, true);
  assert.equal(first.benchmark.advanceHen().ok, true);
  const artifact = first.benchmark.inspect().value.artifact_bindings[0];
  unlinkSync(join(first.kernel.paths.artifacts, `${artifact.sha256}.json`));
  unlinkSync(join(first.kernel.paths.objects, artifact.sha256.slice(0, 2), artifact.sha256.slice(2)));
  const restarted = runtime(root);
  const diagnosis = restarted.kernel.diagnose();
  assert.equal(diagnosis.value.disposition, "blocked-corrupt-durable-evidence");
  assert.ok(diagnosis.value.reason_codes.some((reason) => reason.startsWith("kernel.event-artifact-binding-invalid:")));
  assert.equal(restarted.kernel.recover().ok, false);
});

test("the reconstruction bundle closes the provider-free durable references", () => {
  const root = temporaryRoot();
  const {benchmark} = runtime(root);
  benchmark.importFrontier({imported_at: importedAt()});
  benchmark.advanceHen();
  const bundle = benchmark.reconstructionBundle();
  assert.equal(bundle.ok, true);
  assert.equal(bundle.value.provider_calls_required, 0);
  assert.equal(bundle.value.cycle_event_refs.length, 8);
  assert.equal(bundle.value.cycle_receipt_refs.length, 8);
  assert.equal(bundle.value.artifact_bindings.length, 24);
  assert.match(bundle.value.bundle_digest, /^[a-f0-9]{64}$/);
});

test("production defaults keep the candidate benchmark definition non-runnable", () => {
  const root = temporaryRoot();
  const {kernel, benchmark} = runtime(root, true);
  const attempted = benchmark.importFrontier({imported_at: importedAt()});
  assert.equal(attempted.disposition, "rejected");
  assert.ok(attempted.value.receipt.reason_codes.includes("command.definition-not-enabled"));
  assert.equal(kernel.inspect().value.benchmark_research, undefined);
});

test("the closed CLI runs the prototype and rejects projection injection", () => {
  const root = temporaryRoot();
  const cli = join(packageRoot, "bin", "prototype.mjs");
  const args = [cli, "--root", root, "--repository-root", repositoryRoot, "--construction-disabled-definitions"];
  const invoke = (request) => spawnSync(process.execPath, args, {input: JSON.stringify(request), encoding: "utf8"});
  const imported = invoke({schema_version: "are.evolution-prototype-cli-request/v1", operation: "import-hen", input: {imported_at: importedAt(), actor: {actor_id: "agent:prototype-test", actor_kind: "agent"}}});
  assert.equal(imported.status, 0, imported.stderr || imported.stdout);
  assert.equal(JSON.parse(imported.stdout).value.candidates[0].status, "awaiting-validation");
  const advanced = invoke({schema_version: "are.evolution-prototype-cli-request/v1", operation: "advance-hen", input: {actor: {actor_id: "agent:prototype-test", actor_kind: "agent"}}});
  assert.equal(advanced.status, 0, advanced.stderr || advanced.stdout);
  assert.equal(JSON.parse(advanced.stdout).value.qualifications[0].status, "qualified");
  const inspected = invoke({schema_version: "are.evolution-prototype-cli-request/v1", operation: "inspect", input: {}});
  assert.equal(inspected.status, 0);
  assert.equal(JSON.parse(inspected.stdout).value.ready_work[0].task_ref, "task:HEN-10-freeze-review-execute");
  const injected = invoke({schema_version: "are.evolution-prototype-cli-request/v1", operation: "inspect", input: {state: "completed"}});
  assert.equal(injected.status, 2);
  assert.deepEqual(JSON.parse(injected.stdout).reason_codes, ["prototype.request-invalid"]);
});

test("the published benchmark schema keeps import and projection documents closed", () => {
  const schema = JSON.parse(readFileSync(join(packageRoot, "schemas", "benchmark-research-v1.schema.json")));
  assert.equal(schema.$defs.importManifest.additionalProperties, false);
  assert.equal(schema.$defs.sourceArtifact.additionalProperties, false);
  assert.equal(schema.$defs.projection.additionalProperties, false);
  assert.ok(schema.$defs.projection.required.includes("qualifications"));
});
