import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {isAbsolute, join, relative, resolve, sep} from "node:path";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {
  evolutionProtocolDigest,
  loadCandidateCycleDefinitionRegistry,
  materializeEvolutionCommand,
} from "./protocol-v1.mjs";

export const BENCHMARK_RESEARCH_RUNTIME_VERSION = "are.benchmark-research-runtime/v1";
export const BENCHMARK_RESEARCH_IMPORT_SCHEMA = "are.benchmark-research-legacy-import/v1";
export const BENCHMARK_RESEARCH_PROJECTION_SCHEMA = "are.benchmark-research-projection/v1";
export const BENCHMARK_RECONSTRUCTION_BUNDLE_SCHEMA = "are.evolution-reconstruction-bundle/v1";
export const HEN_MILESTONE_EVIDENCE_SCHEMA = "are.hen-tokenizer-qualification-evidence/v1";
export const HEN_INDEPENDENT_REVIEWS_SCHEMA = "are.hen-independent-reviews/v1";
export const HEN_CONTINUITY_SUCCESSOR_SCHEMA = "are.hen-runtime-continuity-successor-evidence/v1";
export const HEN_CONTINUITY_SUCCESSOR_REVIEW_SCHEMA = "are.hen-runtime-continuity-successor-review/v1";

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;

function exactKeys(value, keys) {
  return object(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}

function digestBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function result(ok, reasonCodes = [], value = null) {
  return freeze({schema_version: "are.benchmark-research-validation/v1", ok, reason_codes: [...new Set(reasonCodes)].sort(), ...(value === null ? {} : {value}), authority_effect: "none"});
}

function withoutManifestDigest(manifest) {
  const {manifest_digest: _digest, ...material} = manifest;
  return material;
}

function safeSourcePath(repositoryRoot, sourcePath) {
  if (!text(sourcePath) || isAbsolute(sourcePath) || sourcePath.split(/[\\/]/).includes("..")) return null;
  const root = resolve(repositoryRoot);
  const target = resolve(root, sourcePath);
  const rel = relative(root, target);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
  return target;
}

export function verifyBenchmarkImportManifest(manifest, {repository_root: repositoryRoot = null, verify_source_bytes: verifySourceBytes = false} = {}) {
  const reasons = [];
  const topKeys = ["schema_version", "manifest_id", "manifest_digest", "cycle_ref", "cycle_definition_ref", "objective", "hypothesis", "candidate", "next_work", "source_artifacts", "excluded_scopes", "missing_evidence", "import_posture", "authority_effect"];
  if (!exactKeys(manifest, topKeys)) reasons.push("benchmark-import.manifest-fields-invalid");
  if (manifest?.schema_version !== BENCHMARK_RESEARCH_IMPORT_SCHEMA || !IDENTIFIER.test(manifest?.manifest_id ?? "") || !IDENTIFIER.test(manifest?.cycle_ref ?? "") || manifest?.cycle_definition_ref !== "benchmark-research/v1" || manifest?.import_posture !== "retrospective" || manifest?.authority_effect !== "none") reasons.push("benchmark-import.manifest-identity-invalid");
  if (!HASH.test(manifest?.manifest_digest ?? "") || manifest?.manifest_digest !== evolutionProtocolDigest(withoutManifestDigest(manifest ?? {}))) reasons.push("benchmark-import.manifest-digest-invalid");
  const objectiveKeys = ["objective_ref", "subject_feature", "goal", "benchmark_ref", "cohort_ref", "window_tokens", "fresh_controls", "status"];
  const hypothesisKeys = ["hypothesis_ref", "legacy_aliases", "claim", "mechanism", "falsifier", "exposure_posture", "status"];
  const candidateKeys = ["candidate_ref", "predecessor_ref", "construction_status", "validation_status", "focused_tests", "offline_replay", "status"];
  const nextKeys = ["task_ref", "reviewer_constraint", "completion_criteria", "status"];
  if (!exactKeys(manifest?.objective, objectiveKeys) || !IDENTIFIER.test(manifest?.objective?.objective_ref ?? "") || manifest?.objective?.window_tokens !== 8000 || manifest?.objective?.status !== "active") reasons.push("benchmark-import.objective-invalid");
  if (!exactKeys(manifest?.hypothesis, hypothesisKeys) || !IDENTIFIER.test(manifest?.hypothesis?.hypothesis_ref ?? "") || manifest?.hypothesis?.status !== "awaiting-validation" || !Array.isArray(manifest?.hypothesis?.legacy_aliases) || !manifest.hypothesis.legacy_aliases.includes("E5")) reasons.push("benchmark-import.hypothesis-invalid");
  if (!exactKeys(manifest?.candidate, candidateKeys) || !IDENTIFIER.test(manifest?.candidate?.candidate_ref ?? "") || manifest?.candidate?.status !== "awaiting-validation" || manifest?.candidate?.validation_status !== "awaiting-independent-construction-review") reasons.push("benchmark-import.candidate-invalid");
  if (!exactKeys(manifest?.next_work, nextKeys) || !IDENTIFIER.test(manifest?.next_work?.task_ref ?? "") || manifest?.next_work?.status !== "ready" || !Array.isArray(manifest?.next_work?.completion_criteria) || manifest.next_work.completion_criteria.length === 0) reasons.push("benchmark-import.next-work-invalid");
  if (!Array.isArray(manifest?.source_artifacts) || manifest.source_artifacts.length === 0 || !Array.isArray(manifest?.excluded_scopes) || !Array.isArray(manifest?.missing_evidence)) reasons.push("benchmark-import.scope-invalid");
  const paths = new Set();
  const artifactKeys = ["path", "sha256", "byte_length", "media_type", "role", "chronology_posture", "exposure_posture", "accounting_posture"];
  for (const source of manifest?.source_artifacts ?? []) {
    if (!exactKeys(source, artifactKeys) || !text(source.path) || !HASH.test(source.sha256 ?? "") || !Number.isSafeInteger(source.byte_length) || source.byte_length < 0 || !text(source.media_type) || !IDENTIFIER.test(source.role ?? "") || paths.has(source.path)) reasons.push("benchmark-import.source-binding-invalid");
    paths.add(source.path);
    if (repositoryRoot !== null) {
      const target = safeSourcePath(repositoryRoot, source.path);
      if (target === null) reasons.push(`benchmark-import.source-path-invalid:${source.path}`);
      else if (verifySourceBytes) {
        try {
          const bytes = readFileSync(target);
          if (bytes.byteLength !== source.byte_length || digestBytes(bytes) !== source.sha256) reasons.push(`benchmark-import.source-drift:${source.path}`);
        } catch {
          reasons.push(`benchmark-import.source-unavailable:${source.path}`);
        }
      }
    }
  }
  return reasons.length ? result(false, reasons) : result(true, [], manifest);
}

export function loadHenFrontierImportManifest() {
  const manifest = JSON.parse(readFileSync(new URL("../registry/hen-frontier-import.v1.json", import.meta.url), "utf8"));
  const checked = verifyBenchmarkImportManifest(manifest);
  if (!checked.ok) throw new Error(`H_EN_IMPORT_MANIFEST_INVALID:${checked.reason_codes.join(",")}`);
  return freeze(manifest);
}

function importReceipt(manifest, artifacts, importedAt, actor) {
  const material = canonicalizeJson({
    schema_version: "are.legacy-evolution-import-receipt/v1",
    manifest_ref: manifest.manifest_id,
    manifest_digest: manifest.manifest_digest,
    cycle_ref: manifest.cycle_ref,
    imported_at: importedAt,
    imported_by: actor,
    import_posture: "retrospective",
    source_bindings: artifacts.map((artifact, index) => ({path: manifest.source_artifacts[index].path, artifact_ref: artifact.artifact_id, sha256: artifact.sha256, role: manifest.source_artifacts[index].role})),
    excluded_scopes: manifest.excluded_scopes,
    missing_evidence: manifest.missing_evidence,
    authority_effect: "none",
  });
  return freeze({...material, receipt_ref: `legacy-import-receipt:${evolutionProtocolDigest(material)}`});
}

function makeCommand({manifest, definition, actor, revision, suffix, operation, target, payload}) {
  return materializeEvolutionCommand({
    idempotency_key: `${manifest.manifest_id}:${suffix}`,
    expected_event_revision: revision,
    actor,
    worker_ref: null,
    cycle_ref: manifest.cycle_ref,
    cycle_definition_ref: definition.definition_ref,
    cycle_definition_digest: definition.definition_digest,
    operation,
    target,
    payload,
  });
}

function accepted(value) {
  return value?.ok === true && ["accepted", "replayed"].includes(value?.disposition);
}

export function verifyHenProgressionEvidence({packageRoot, read_bytes: readBytes = readFileSync}) {
  const repositoryRoot = resolve(packageRoot, "../../../..");
  const evidencePath = join(packageRoot, "evidence/HEN-09-TOKENIZER-QUALIFICATION.v1.json");
  const reviewPath = join(packageRoot, "evidence/HEN-INDEPENDENT-REVIEWS.v1.json");
  const hen06Path = join(repositoryRoot, "goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/HEN-06-INDEPENDENT-REREVIEW.v1.json");
  const hen0708Path = join(packageRoot, "evidence/HEN-07-08-PROVIDER-FREE-COMPLETION.v1.json");
  const continuityPath = join(packageRoot, "evidence/HEN-07-08-RUNTIME-CONTINUITY.v1.json");
  const continuitySuccessorPath = join(packageRoot, "evidence/HEN-07-08-RUNTIME-CONTINUITY-SUCCESSOR.v1.json");
  const continuitySuccessorReviewPath = join(packageRoot, "evidence/HEN-07-08-RUNTIME-CONTINUITY-SUCCESSOR-REVIEW.v1.json");
  const evidenceBytes = readBytes(evidencePath), reviewBytes = readBytes(reviewPath);
  const hen06Bytes = readBytes(hen06Path), hen0708Bytes = readBytes(hen0708Path), continuityBytes = readBytes(continuityPath);
  const continuitySuccessorBytes = readBytes(continuitySuccessorPath), continuitySuccessorReviewBytes = readBytes(continuitySuccessorReviewPath);
  const evidence = JSON.parse(evidenceBytes), review = JSON.parse(reviewBytes);
  const hen06 = JSON.parse(hen06Bytes), hen0708 = JSON.parse(hen0708Bytes), continuity = JSON.parse(continuityBytes);
  const continuitySuccessor = JSON.parse(continuitySuccessorBytes), continuitySuccessorReview = JSON.parse(continuitySuccessorReviewBytes);
  const reasons = [];
  if (hen06.schema_version !== "cav2-are-hen-independent-construction-review/v1" ||
      hen06.task_ref !== "task:HEN-06-independent-construction-review" ||
      hen06.reviewer?.identity !== "agent:benchmark-definition-review" ||
      hen06.overall_verdict !== "accepted-construction-validation-complete" || hen06.authority_effect !== "none")
    reasons.push("hen-progression.hen-06-review-invalid");
  if (hen0708.schema_version !== "are.hen-provider-free-completion-evidence/v1" ||
      hen0708.construction_results?.provider_calls !== 0 || hen0708.construction_results?.model_calls !== 0 ||
      hen0708.authority_effect !== "none") reasons.push("hen-progression.hen-07-08-invalid");
  if (continuity.schema_version !== "are.hen-runtime-continuity-evidence/v1" ||
      continuity.predecessor_evidence?.sha256 !== digestBytes(hen0708Bytes) ||
      continuity.verification?.provider_calls !== 0 || continuity.verification?.model_calls !== 0 ||
      continuity.verification?.benchmark_runs !== 0 || continuity.verification?.network_operations !== 0 ||
      continuity.authority_effect !== "none") reasons.push("hen-progression.continuity-invalid");
  const predecessorBindings = new Map(hen0708.source_bindings?.map((entry) => [entry.path, entry.sha256]));
  const continuityBindings = [
    ...(continuity.unchanged_mechanism_bindings ?? []).map((entry) => ({path: entry.path, predecessor: entry.sha256, successor: entry.sha256})),
    ...(continuity.additive_integration_successors ?? []).map((entry) => ({path: entry.path, predecessor: entry.predecessor_sha256, successor: entry.successor_sha256})),
  ];
  if (hen0708.source_bindings?.length !== 8 || predecessorBindings.size !== 8 || continuityBindings.length !== 8 ||
      new Set(continuityBindings.map((entry) => entry.path)).size !== 8) reasons.push("hen-progression.continuity-bindings-invalid");
  const indexPath = "implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs";
  const historicalIndex = continuityBindings.find((entry) => entry.path === indexPath);
  const successorKeys = ["schema_version", "evidence_id", "predecessor_continuity", "predecessor_review", "transition", "verification", "claim_ceiling", "open_questions", "authority_effect"];
  const transitionKeys = ["path", "predecessor_sha256", "successor_sha256", "disposition"];
  const verificationKeys = ["focused_hen_tests", "runtime_package_tests", "provider_calls", "model_calls", "benchmark_runs", "network_operations"];
  if (!exactKeys(continuitySuccessor, successorKeys) || continuitySuccessor.schema_version !== HEN_CONTINUITY_SUCCESSOR_SCHEMA ||
      continuitySuccessor.evidence_id !== "HEN-07-08-RUNTIME-CONTINUITY-SUCCESSOR-001" || continuitySuccessor.authority_effect !== "none" ||
      continuitySuccessor.predecessor_continuity?.path !== "evidence/HEN-07-08-RUNTIME-CONTINUITY.v1.json" || continuitySuccessor.predecessor_continuity?.sha256 !== digestBytes(continuityBytes) ||
      continuitySuccessor.predecessor_review?.path !== "evidence/HEN-INDEPENDENT-REVIEWS.v1.json" || continuitySuccessor.predecessor_review?.sha256 !== digestBytes(reviewBytes) ||
      !exactKeys(continuitySuccessor.transition, transitionKeys) || continuitySuccessor.transition.path !== indexPath ||
      continuitySuccessor.transition.predecessor_sha256 !== historicalIndex?.successor || !HASH.test(continuitySuccessor.transition.successor_sha256 ?? "") ||
      continuitySuccessor.transition.disposition !== "revalidated-successor-continuity" || !exactKeys(continuitySuccessor.verification, verificationKeys) ||
      continuitySuccessor.verification?.provider_calls !== 0 || continuitySuccessor.verification?.model_calls !== 0 ||
      continuitySuccessor.verification?.benchmark_runs !== 0 || continuitySuccessor.verification?.network_operations !== 0 ||
      continuitySuccessor.verification?.focused_hen_tests?.failed !== 0 || continuitySuccessor.verification?.runtime_package_tests?.failed !== 0 ||
      !Array.isArray(continuitySuccessor.open_questions)) reasons.push("hen-progression.continuity-successor-invalid");
  const successorReviewKeys = ["schema_version", "review_id", "reviewer", "subject_bindings", "verdict", "criteria", "findings", "provider_calls", "model_calls", "benchmark_runs", "network_operations", "claim_ceiling", "authority_effect"];
  const successorSubjects = new Map(continuitySuccessorReview.subject_bindings?.map((entry) => [entry.path, entry.sha256]));
  if (!exactKeys(continuitySuccessorReview, successorReviewKeys) || continuitySuccessorReview.schema_version !== HEN_CONTINUITY_SUCCESSOR_REVIEW_SCHEMA ||
      continuitySuccessorReview.review_id !== "HEN-07-08-RUNTIME-CONTINUITY-SUCCESSOR-REVIEW-001" || continuitySuccessorReview.authority_effect !== "none" ||
      continuitySuccessorReview.reviewer?.actor_id !== "agent:hen-continuity-successor-review" || continuitySuccessorReview.reviewer?.independence !== "different evaluator identity from producing agent" ||
      continuitySuccessorReview.verdict !== "accepted" || !Array.isArray(continuitySuccessorReview.criteria) || continuitySuccessorReview.criteria.length < 5 ||
      !Array.isArray(continuitySuccessorReview.findings) || continuitySuccessorReview.findings.length !== 0 || continuitySuccessorReview.provider_calls !== 0 ||
      continuitySuccessorReview.model_calls !== 0 || continuitySuccessorReview.benchmark_runs !== 0 || continuitySuccessorReview.network_operations !== 0 ||
      continuitySuccessorReview.subject_bindings?.length !== 2 || successorSubjects.size !== 2 ||
      successorSubjects.get("evidence/HEN-07-08-RUNTIME-CONTINUITY-SUCCESSOR.v1.json") !== digestBytes(continuitySuccessorBytes) ||
      successorSubjects.get(indexPath) !== continuitySuccessor.transition?.successor_sha256) reasons.push("hen-progression.continuity-successor-review-invalid");
  for (const binding of continuityBindings) {
    const target = safeSourcePath(repositoryRoot, binding.path);
    try {
      const expectedSuccessor = binding.path === indexPath ? continuitySuccessor.transition?.successor_sha256 : binding.successor;
      if (predecessorBindings.get(binding.path) !== binding.predecessor || target === null ||
          !HASH.test(expectedSuccessor ?? "") || digestBytes(readBytes(target)) !== expectedSuccessor)
        reasons.push(`hen-progression.continuity-drift:${binding.path}`);
    } catch { reasons.push(`hen-progression.continuity-unavailable:${binding.path}`); }
  }
  if (evidence.schema_version !== HEN_MILESTONE_EVIDENCE_SCHEMA || evidence.authority_effect !== "none" ||
      evidence.qualification?.accepted_revision_provider_calls !== 93 ||
      evidence.qualification?.rejected_predecessor_provider_calls !== 93 ||
      evidence.qualification?.total_provider_calls !== 186 || evidence.qualification?.model_calls !== 0 ||
      evidence.qualification?.automatic_retries !== 0 ||
      evidence.accepted_revision?.qualification_ref !== "qualification:HEN-09-v2" ||
      evidence.accepted_revision?.qualified !== true || evidence.accepted_revision?.overflows !== 0 ||
      evidence.accepted_revision?.stage_maximums?.populated !== 7924 ||
      evidence.rejected_predecessor?.qualification_ref !== "qualification:HEN-09-v1" ||
      evidence.rejected_predecessor?.overflows !== 48 ||
      evidence.next_frontier?.task_ref !== "task:HEN-10-freeze-review-execute" ||
      evidence.next_frontier?.benchmark_dispatch_admitted !== false) reasons.push("hen-progression.qualification-invalid");
  if (review.schema_version !== HEN_INDEPENDENT_REVIEWS_SCHEMA || review.authority_effect !== "none" ||
      review.reviewer?.actor_id !== "agent:benchmark-definition-review" ||
      review.reviewer?.independence !== "different evaluator identity from producing agent" ||
      review.reviews?.length !== 3 || review.reviews.some((entry) => entry.verdict !== "accepted" ||
        entry.findings?.length !== 0 || entry.provider_calls !== 0 || entry.model_calls !== 0) ||
      review.reviews?.[0]?.milestone_ref !== "task:HEN-06-independent-construction-review" ||
      review.reviews?.[1]?.milestone_ref !== "qualification:HEN-09-v2" ||
      review.reviews?.[2]?.milestone_ref !== "evidence:HEN-07-08-runtime-continuity" ||
      review.disposition?.hen_07_08_runtime_continuity_accepted !== true ||
      review.disposition?.hen_09_may_close !== true || review.disposition?.hen_10_construction_may_begin !== true ||
      review.disposition?.live_benchmark_launch_admitted !== false) reasons.push("hen-progression.review-invalid");
  const subjects = new Map(review.subject_bindings?.map((entry) => [entry.path, entry.sha256]));
  if (review.subject_bindings?.length !== 4 || subjects.size !== 4) reasons.push("hen-progression.subject-bindings-invalid");
  const subjectPaths = [
    ["goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/HEN-06-INDEPENDENT-REREVIEW.v1.json", hen06Path],
    ["evidence/HEN-07-08-PROVIDER-FREE-COMPLETION.v1.json", hen0708Path],
    ["evidence/HEN-07-08-RUNTIME-CONTINUITY.v1.json", continuityPath],
    ["evidence/HEN-09-TOKENIZER-QUALIFICATION.v1.json", evidencePath],
  ];
  for (const [subject, path] of subjectPaths) {
    try { if (digestBytes(readBytes(path)) !== subjects.get(subject)) reasons.push(`hen-progression.subject-drift:${subject}`); }
    catch { reasons.push(`hen-progression.subject-unavailable:${subject}`); }
  }
  const bound = [
    ["evidence/hen-09-tokenizer-qualification-v1/FREEZE.json", evidence.rejected_predecessor?.freeze_sha256],
    ["evidence/hen-09-tokenizer-qualification-v1/attempts/vps-187-77-163-194-r1/RESULTS.json", evidence.rejected_predecessor?.result_sha256],
    ["evidence/hen-09-tokenizer-qualification-v1/attempts/vps-187-77-163-194-r1/RECEIPTS.jsonl", evidence.rejected_predecessor?.receipts_sha256],
    ["evidence/hen-09-tokenizer-qualification-v2/FREEZE.json", evidence.accepted_revision?.freeze_sha256],
    ["evidence/hen-09-tokenizer-qualification-v2/attempts/vps-187-77-163-194-r2/RESULTS.json", evidence.accepted_revision?.result_sha256],
    ["evidence/hen-09-tokenizer-qualification-v2/attempts/vps-187-77-163-194-r2/RECEIPTS.jsonl", evidence.accepted_revision?.receipts_sha256],
  ];
  for (const [path, expected] of bound) {
    try { if (!HASH.test(expected ?? "") || digestBytes(readBytes(join(packageRoot, path))) !== expected) reasons.push(`hen-progression.evidence-drift:${path}`); }
    catch { reasons.push(`hen-progression.evidence-unavailable:${path}`); }
  }
  return reasons.length ? result(false, reasons) : result(true, [], {evidence, review, evidencePath, reviewPath,
    evidenceSha256: digestBytes(evidenceBytes), reviewSha256: digestBytes(reviewBytes), bound,
    progressionDocuments: [[hen06Path, "independent-construction-review"], [hen0708Path, "provider-free-completion"],
      [continuityPath, "runtime-continuity"], [continuitySuccessorPath, "runtime-continuity-successor"],
      [continuitySuccessorReviewPath, "runtime-continuity-successor-review"]]});
}

export function createBenchmarkResearchRuntime({kernel, registry = loadCandidateCycleDefinitionRegistry(), repository_root: repositoryRoot,
  evidence_root: evidenceRoot = resolve(import.meta.dirname, "..")} = {}) {
  if (!kernel || typeof kernel.process !== "function" || typeof kernel.putArtifact !== "function" || typeof kernel.inspect !== "function") throw new TypeError("Benchmark research runtime requires a P2 durable kernel.");
  if (!text(repositoryRoot)) throw new TypeError("Benchmark research runtime requires an explicit repository root.");
  const definition = registry.definitions.find((entry) => entry.definition_ref === "benchmark-research/v1");
  if (!definition) throw new TypeError("The benchmark-research/v1 definition is unavailable.");

  function importFrontier({manifest = loadHenFrontierImportManifest(), imported_at: importedAt, actor = {actor_id: "adapter:legacy-import", actor_kind: "adapter"}} = {}) {
    const checked = verifyBenchmarkImportManifest(manifest, {repository_root: repositoryRoot, verify_source_bytes: true});
    if (!checked.ok) return checked;
    if (!text(importedAt) || !Number.isFinite(Date.parse(importedAt))) return result(false, ["benchmark-import.import-time-invalid"]);
    const artifacts = [];
    for (const source of manifest.source_artifacts) {
      const bytes = readFileSync(safeSourcePath(repositoryRoot, source.path));
      const stored = kernel.putArtifact({bytes, media_type: source.media_type, semantic_binding: {cycle_ref: manifest.cycle_ref, cycle_definition_digest: definition.definition_digest, role: source.role, provenance_refs: [`source:${source.sha256}`], claim_ceiling: "Retrospective imported evidence only; no scientific acceptance, benchmark execution, or effect authority."}});
      if (!stored.ok) return stored;
      artifacts.push(stored.value);
    }
    const artifactRefs = artifacts.map((artifact) => artifact.artifact_id);
    const receipt = importReceipt(manifest, artifacts, importedAt, actor);
    const steps = [
      {suffix: "import", operation: "cycle.recover", target: {record_kind: "legacy-import", record_ref: manifest.manifest_id}, event: "cycle-recovered", payload: {import_receipt: receipt, artifact_refs: artifactRefs, disposition: "active"}},
      {suffix: "objective", operation: "cycle.diagnose", target: {record_kind: "benchmark-objective", record_ref: manifest.objective.objective_ref}, event: "diagnosis-recorded", payload: {objective: manifest.objective, artifact_refs: artifactRefs, disposition: "active"}},
      {suffix: "hypothesis", operation: "hypothesis.register", target: {record_kind: "benchmark-hypothesis", record_ref: manifest.hypothesis.hypothesis_ref}, event: "hypothesis-registered", payload: {objective_ref: manifest.objective.objective_ref, hypothesis: manifest.hypothesis, artifact_refs: artifactRefs, disposition: "active"}},
      {suffix: "candidate", operation: "candidate.construct", target: {record_kind: "benchmark-candidate", record_ref: manifest.candidate.candidate_ref}, event: "candidate-constructed", payload: {hypothesis_ref: manifest.hypothesis.hypothesis_ref, candidate: manifest.candidate, artifact_refs: artifactRefs, disposition: "active"}},
      {suffix: "review-work", operation: "experiment.specify", target: {record_kind: "task", record_ref: manifest.next_work.task_ref}, event: "experiment-specified", payload: {candidate_ref: manifest.candidate.candidate_ref, review_work: manifest.next_work, artifact_refs: artifactRefs, disposition: "active"}},
    ];
    const commandResults = [];
    for (const [revision, step] of steps.entries()) {
      const command = makeCommand({manifest, definition, actor, revision, suffix: step.suffix, operation: step.operation, target: step.target, payload: step.payload});
      const committed = kernel.process(command, {event_drafts: [{event_type: step.event, payload: step.payload}]});
      if (!accepted(committed)) return committed;
      commandResults.push(committed);
    }
    const inspected = kernel.inspect();
    if (!inspected.ok || !inspected.value.benchmark_research) return result(false, ["benchmark-import.projection-missing"]);
    return freeze({ok: true, operation: "import-hen-frontier", disposition: commandResults.every((entry) => entry.disposition === "replayed") ? "replayed" : "accepted", value: inspected.value.benchmark_research, command_results: commandResults.map((entry) => ({disposition: entry.disposition, commit_ref: entry.commit_ref})), authority_effect: "none"});
  }

  function inspect() {
    const inspected = kernel.inspect();
    if (!inspected.ok) return inspected;
    return freeze({ok: true, operation: "inspect-benchmark-research", value: inspected.value.benchmark_research ?? null, authority_effect: "none"});
  }

  function advanceHen({actor = {actor_id: "adapter:hen-progression", actor_kind: "adapter"}} = {}) {
    const prior = kernel.inspect();
    if (!prior.ok || prior.value.benchmark_research?.manifest_ref !== "legacy-import:contextbench-glm8k-hen-r2-evidence-closure-r1")
      return result(false, ["hen-progression.frontier-not-imported"]);
    const completed = prior.value.benchmark_research;
    if (completed.candidates?.at(-1)?.candidate_ref === "candidate:H-EN-R2-adaptive-v2" &&
        completed.qualifications?.at(-1)?.qualification_ref === "qualification:HEN-09-v2" &&
        completed.ready_work?.some((work) => work.task_ref === "task:HEN-10-freeze-review-execute"))
      return freeze({ok: true, operation: "advance-hen-frontier", disposition: "replayed", value: completed,
        command_results: [], authority_effect: "none"});
    const checked = verifyHenProgressionEvidence({packageRoot: evidenceRoot});
    if (!checked.ok) return checked;
    const files = [[checked.value.evidencePath, "hen-09-qualification"], [checked.value.reviewPath, "independent-review"],
      ...checked.value.progressionDocuments,
      ...checked.value.bound.map(([path]) => [join(evidenceRoot, path), "qualification-source"] )];
    const artifacts = files.map(([path, role]) => kernel.putArtifact({bytes: readFileSync(path),
      media_type: path.endsWith(".jsonl") ? "application/x-ndjson" : "application/json",
      semantic_binding: {cycle_ref: prior.value.benchmark_research.cycle_ref,
        cycle_definition_digest: definition.definition_digest, role,
        provenance_refs: [`source:${digestBytes(readFileSync(path))}`],
        claim_ceiling: "H-EN construction and tokenizer qualification evidence only; no live benchmark launch authority."}}));
    if (artifacts.some((entry) => !entry.ok)) return artifacts.find((entry) => !entry.ok);
    const artifactRefs = artifacts.map((entry) => entry.value.artifact_id);
    const predecessor = prior.value.benchmark_research.candidates[0];
    const candidate = {...predecessor, candidate_ref: "candidate:H-EN-R2-adaptive-v2",
      predecessor_ref: predecessor.candidate_ref, construction_status: "independently-reviewed",
      validation_status: "tokenizer-qualified", status: "qualified"};
    const qualification = {qualification_ref: "qualification:HEN-09-v2", status: "qualified",
      context_limit: 8000, provider_calls_current_attempt: 93, provider_calls_total: 186,
      model_calls: 0, maximum_projected_tokens: 7924, benchmark_dispatch_admitted: false,
      evidence_sha256: checked.value.evidenceSha256, review_sha256: checked.value.reviewSha256};
    const reviewWork = {task_ref: "task:HEN-10-freeze-review-execute",
      reviewer_constraint: "independent launch reviewer before any live dispatch",
      completion_criteria: ["exact-run-registration", "source-and-config-freeze", "independent-launch-review"],
      status: "ready"};
    const manifest = loadHenFrontierImportManifest();
    const steps = [
      {suffix: "hen-06-08-validation", operation: "candidate.validate", target: {record_kind: "benchmark-candidate", record_ref: candidate.candidate_ref}, event: "construction-validated", payload: {candidate, artifact_refs: artifactRefs, supersedes_task_refs: ["task:HEN-06-independent-construction-review"], disposition: "active"}},
      {suffix: "hen-09-qualification", operation: "experiment.qualify", target: {record_kind: "benchmark-qualification", record_ref: qualification.qualification_ref}, event: "execution-qualified", payload: {qualification, artifact_refs: artifactRefs, disposition: "active"}},
      {suffix: "hen-10-work", operation: "experiment.specify", target: {record_kind: "task", record_ref: reviewWork.task_ref}, event: "experiment-specified", payload: {candidate_ref: candidate.candidate_ref, review_work: reviewWork, artifact_refs: artifactRefs, disposition: "active"}},
    ];
    const commandResults = [];
    for (const [index, step] of steps.entries()) {
      const command = makeCommand({manifest, definition, actor, revision: 5 + index,
        suffix: step.suffix, operation: step.operation, target: step.target, payload: step.payload});
      const committed = kernel.process(command, {event_drafts: [{event_type: step.event, payload: step.payload}]});
      if (!accepted(committed)) return committed;
      commandResults.push(committed);
    }
    const projection = inspect();
    if (!projection.ok || projection.value?.qualifications?.at(-1)?.status !== "qualified" ||
      projection.value?.ready_work?.at(-1)?.task_ref !== reviewWork.task_ref) return result(false, ["hen-progression.projection-invalid"]);
    return freeze({ok: true, operation: "advance-hen-frontier",
      disposition: commandResults.every((entry) => entry.disposition === "replayed") ? "replayed" : "accepted",
      value: projection.value, command_results: commandResults.map((entry) => ({disposition: entry.disposition,
        commit_ref: entry.commit_ref})), authority_effect: "none"});
  }

  function reconstructionBundle() {
    const inspected = kernel.inspect();
    if (!inspected.ok || !inspected.value.benchmark_research) return result(false, ["benchmark-reconstruction.frontier-missing"]);
    const cycle = inspected.value.aggregate_cycles.find((entry) => entry.cycle_ref === inspected.value.benchmark_research.cycle_ref);
    const material = canonicalizeJson({
      schema_version: BENCHMARK_RECONSTRUCTION_BUNDLE_SCHEMA,
      bundle_ref: `bundle:${inspected.value.benchmark_research.manifest_digest}`,
      cycle_definition: definition,
      kernel_head_commit_digest: inspected.value.head_commit_digest,
      cycle_event_refs: cycle?.event_refs ?? [],
      cycle_receipt_refs: cycle?.receipt_refs ?? [],
      artifact_bindings: inspected.value.benchmark_research.artifact_bindings,
      benchmark_research: inspected.value.benchmark_research,
      reconstruction: "Verify the P2 commit chain and referenced event, receipt and content-addressed object bytes; delete and rebuild the disposable SQLite index; derive the benchmark projection.",
      provider_calls_required: 0,
      authority_effect: "none",
    });
    return freeze({ok: true, operation: "build-reconstruction-bundle", value: {...material, bundle_digest: evolutionProtocolDigest(material)}, authority_effect: "none"});
  }

  return Object.freeze({version: BENCHMARK_RESEARCH_RUNTIME_VERSION, importFrontier, advanceHen, inspect, reconstructionBundle});
}

export function deriveBenchmarkResearchProjection(verified) {
  const rows = [];
  for (const event of verified.events ?? []) {
    if (event.target?.record_kind?.startsWith("benchmark-") || event.target?.record_kind === "legacy-import" || event.target?.record_kind === "task") rows.push({event, payload: verified.payloads.get(event.event_id)});
  }
  const imported = rows.find(({payload}) => object(payload?.import_receipt));
  if (!imported) return null;
  const objective = rows.find(({payload}) => object(payload?.objective))?.payload.objective ?? null;
  const hypotheses = rows.filter(({payload}) => object(payload?.hypothesis)).map(({payload}) => payload.hypothesis);
  const candidates = rows.filter(({payload}) => object(payload?.candidate)).map(({payload}) => payload.candidate);
  const superseded = new Set(rows.flatMap(({payload}) => payload?.supersedes_task_refs ?? []));
  const readyWork = rows.filter(({payload}) => object(payload?.review_work) && !superseded.has(payload.review_work.task_ref)).map(({payload}) => payload.review_work);
  const qualifications = rows.filter(({payload}) => object(payload?.qualification)).map(({payload}) => payload.qualification);
  const artifactRefs = [...new Set(rows.flatMap(({payload}) => payload?.artifact_refs ?? []))];
  const artifactBindings = artifactRefs.map((ref) => verified.artifacts.find((artifact) => artifact.artifact_id === ref));
  if (artifactBindings.some((artifact) => artifact === undefined)) throw new Error("BENCHMARK_RESEARCH_ARTIFACT_BINDING_MISSING");
  const material = canonicalizeJson({
    schema_version: BENCHMARK_RESEARCH_PROJECTION_SCHEMA,
    cycle_ref: imported.event.cycle_ref,
    manifest_ref: imported.payload.import_receipt.manifest_ref,
    manifest_digest: imported.payload.import_receipt.manifest_digest,
    objective,
    hypotheses,
    candidates,
    qualifications,
    ready_work: readyWork,
    artifact_bindings: artifactBindings,
    import_receipt: imported.payload.import_receipt,
    claim_ceiling: qualifications.length > 0
      ? "H-EN construction is independently reviewed and HEN-09 tokenizer qualification is accepted; HEN-10 is ready, but live benchmark launch, scientific acceptance, publication, release, deployment, and external effects remain unadmitted."
      : "Retrospective H-EN reconstruction at awaiting-validation only; no independent approval, benchmark execution, provider use, scientific acceptance, or external-effect authority.",
    authority_effect: "none",
  });
  return freeze({...material, projection_digest: evolutionProtocolDigest(material)});
}
