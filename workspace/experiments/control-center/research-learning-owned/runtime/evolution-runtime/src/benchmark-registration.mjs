import {mkdirSync, readFileSync, writeFileSync, linkSync, unlinkSync, openSync, fsyncSync, closeSync, readdirSync} from "node:fs";
import {join} from "node:path";
import {randomUUID} from "node:crypto";
import {fileURLToPath} from "node:url";
import {canonicalJson, digest, deepFreeze} from "../../request-intent-runtime/src/canonical.mjs";
import {createResearchHypothesis, createHypothesisObservation, createResearchExperiment, assessResearchHypothesis, verifyEvolutionRecord} from "../index.mjs";

export const BENCHMARK_RECORD_DIRECTORY = fileURLToPath(new URL("../research-records/", import.meta.url));
const SPECS = {
  "requirement-change-001": {result: "are.requirement-change-live-result/v1", manifest: "are.requirement-change-live-manifest/v1",
    statement: "Explicit requirement deltas improve classification while preserving the expected requirement set.",
    mechanism: "Make retained, added and removed requirements explicit instead of relying on objective prose.",
    pattern: "explicit-requirement-set-accounting", baseline: "baseline", treatment: "treatment"},
  "requirement-latency-001": {result: "are.requirement-latency-result/v1", manifest: "are.requirement-latency-manifest/v1",
    statement: "Compact requirement patches preserve quality, reduce paired p95 by at least 20 percent, and fit the declared wrapper deadline.",
    mechanism: "Generate only additions/removals and reconstruct retained requirements locally.",
    pattern: "host-expanded-requirement-patch", baseline: "full", treatment: "compact"},
  "requirement-replication-001": {result: "are.requirement-replication-result/v1", manifest: "are.requirement-replication-manifest/v1",
    statement: "Explicit requirement accounting improves continue/refine classification on new cases without losing existing requirements.",
    mechanism: "Require an explicit retained, added and removed partition plus the complete resulting set.",
    pattern: "explicit-requirement-set-accounting-replication", baseline: "baseline", treatment: "treatment"},
  "requirement-latency-002": {result: "are.requirement-latency-controlled-result/v1", manifest: "are.requirement-latency-controlled-manifest/v1",
    statement: "Compact requirement patches reduce p95 completion latency by at least 15 percent while preserving all expected results under balanced cache posture.",
    mechanism: "Keep semantic instructions fixed and vary only full-delta versus compact-patch output representation.",
    pattern: "controlled-compact-requirement-patch", baseline: "full", treatment: "compact"},
};
function requireThat(ok, message) {if (!ok) throw Error(message);}
const p95 = rows => rows.map(r => r.elapsed_ms).sort((a,b) => a-b)[Math.ceil(rows.length*.95)-1];

export function materializeBenchmarkRegistration({experiment_id, manifest, result, expected_result_digest}) {
  const spec = SPECS[experiment_id];
  requireThat(spec && manifest?.schema_version === spec.manifest && result?.schema_version === spec.result, "registration.unsupported-schema");
  requireThat(manifest.authority_effect === "none" && result.authority_effect === "none", "registration.authority-invalid");
  requireThat(manifest.model === result.model, "registration.model-mismatch");
  requireThat(digest(result) === expected_result_digest && result.manifest_digest === digest(manifest), "registration.evidence-digest-mismatch");
  requireThat(["completed", "blocked"].includes(result.status) && Array.isArray(result.runs) && Array.isArray(manifest.schedule), "registration.status-invalid");
  const detailedSchedule = ["requirement-replication-001","requirement-latency-002"].includes(experiment_id);
  const schedule = detailedSchedule
    ? result.runs.map(({ordinal,case_id,repetition,variant,prompt_digest}) => ({ordinal,case_id,repetition,variant,prompt_digest}))
    : result.runs.map(({id,variant}) => ({id,variant}));
  const expectedSchedule = detailedSchedule
    ? manifest.schedule.slice(0,schedule.length).map(({ordinal,case_id,repetition,variant,prompt_digest})=>({ordinal,case_id,repetition,variant,prompt_digest}))
    : manifest.schedule.slice(0,schedule.length);
  requireThat(canonicalJson(schedule) === canonicalJson(expectedSchedule)
    && schedule.length <= manifest.schedule.length, "registration.schedule-invalid");
  if (result.status === "completed") requireThat(schedule.length === manifest.schedule.length, "registration.incomplete-run");
  requireThat(result.source_digests && Object.keys(result.source_digests).length > 0
    && Object.values(result.source_digests).every(x => /^[a-f0-9]{64}$/.test(x)), "registration.implementation-binding-invalid");
  let gates = null;
  if (result.status === "completed") {
    requireThat(result.runs.every(r => Number.isFinite(r.elapsed_ms) && r.elapsed_ms > 0), "registration.timing-invalid");
    const baseline = result.runs.filter(r => r.variant === spec.baseline), treatment = result.runs.filter(r => r.variant === spec.treatment);
    const expectedPerArm = ["requirement-replication-001","requirement-latency-002"].includes(experiment_id) ? manifest.cases.length * manifest.repetitions : manifest.cases.length;
    requireThat(baseline.length === expectedPerArm && treatment.length === expectedPerArm, "registration.variant-count-invalid");
    if (experiment_id === "requirement-latency-001") {
      requireThat(Number.isSafeInteger(manifest.gates?.quality_matches) && manifest.gates.quality_matches > 0
        && Number.isFinite(manifest.gates.relative_p95_reduction) && manifest.gates.relative_p95_reduction >= 0
        && manifest.gates.relative_p95_reduction < 1 && Number.isFinite(manifest.gates.wrapper_p95_ms) && manifest.gates.wrapper_p95_ms > 0,
        "registration.thresholds-invalid");
      const passed = r => r.label_matched === true && r.requirements_matched === true && r.tool_events === 0 && r.completion_status === "completed";
      requireThat(result.runs.every(r => r.passed === passed(r)), "registration.row-status-inconsistent");
      gates = {quality: baseline.filter(passed).length === manifest.gates.quality_matches && treatment.filter(passed).length === manifest.gates.quality_matches,
        relative_latency: 1-p95(treatment)/p95(baseline) >= manifest.gates.relative_p95_reduction,
        wrapper_deadline: p95(treatment) <= manifest.gates.wrapper_p95_ms};
      requireThat(canonicalJson(gates) === canonicalJson(result.gates), "registration.gates-inconsistent");
    } else if (experiment_id === "requirement-replication-001") {
      const runtime = r => r.runtime_integrity === true && r.tool_events === 0 && r.completion_status === "completed";
      requireThat(result.runs.every(r => r.passed === (r.label_matched === true && r.requirements_matched === true && r.delta_valid === true && runtime(r))), "registration.row-status-inconsistent");
      gates = {classification_improved:treatment.filter(r=>r.label_matched===true).length>baseline.filter(r=>r.label_matched===true).length,
        requirement_preservation:treatment.every(r=>r.requirements_matched===true&&r.delta_valid===true),
        runtime_integrity:result.runs.every(runtime)};
      requireThat(canonicalJson(gates)===canonicalJson(result.gates), "registration.gates-inconsistent");
    } else if (experiment_id === "requirement-latency-002") {
      const runtime=r=>r.runtime_integrity===true&&r.tool_events===0&&r.completion_status==="completed";
      requireThat(result.runs.every(r=>r.passed===(r.label_matched===true&&r.requirements_matched===true&&runtime(r))),"registration.row-status-inconsistent");
      const mean=rows=>rows.reduce((n,r)=>n+r.token_usage.total.cachedInputTokens,0)/rows.length;
      const cacheDifference=Math.abs(mean(baseline)-mean(treatment))/Math.max(mean(baseline),mean(treatment),1);
      gates={quality:baseline.every(r=>r.passed)&&treatment.every(r=>r.passed),relative_latency:p95(treatment)/p95(baseline)<=manifest.gates.maximum_p95_ratio,
        cache_balance:cacheDifference<=manifest.gates.maximum_cache_mean_relative_difference,runtime_integrity:result.runs.every(runtime)};
      requireThat(canonicalJson(gates)===canonicalJson(result.gates),"registration.gates-inconsistent");
    } else {
      gates = {classification_improved: treatment.filter(r => r.label_matched).length > baseline.filter(r => r.label_matched).length,
        requirement_preservation: treatment.every(r => r.requirements_matched === true && r.contract_disposition === "resolved" && r.tool_events === 0 && r.completion_status === "completed")};
    }
  }
  const sourceRef = `benchmark-result:${expected_result_digest}`;
  const implementation = {schema_version: "are.benchmark-implementation-evidence/v1", source_digests: result.source_digests,
    binding_posture: "historical-source-hashes-not-currentness-or-transitive-closure", authority_effect: "none"};
  implementation.record_id = `implementation-evidence:${digest(implementation)}`;
  const hypothesis = createResearchHypothesis({hypothesis_key: experiment_id, statement: spec.statement, mechanism: spec.mechanism,
    falsifier: "A declared quality or performance check fails; incomplete runs are inconclusive.", scope: manifest.scope,
    metrics: ["classification", "requirement-preservation", "turn-p95-ms"], provenance_refs: [sourceRef],
    implementation_pattern: spec.pattern, implementation_ref: implementation.record_id,
    experiment_template: {research_question: spec.statement, baseline_ref: spec.baseline, treatment_ref: spec.treatment,
      dataset_refs: [`manifest:${digest(manifest)}`], required_repetitions: manifest.repetitions ?? 2, success_criteria: manifest.gates ?? manifest.scoring ?? {post_hoc_quality_checks: true},
      stop_conditions: ["Preserve failed gates; do not activate serving configuration."]}});
  const failed = gates ? Object.keys(gates).filter(k => !gates[k]) : [];
  const observation = createHypothesisObservation({hypothesis_ref: hypothesis.record_id, source_result_ref: sourceRef, source_result_digest: expected_result_digest,
    observation_kind: gates === null ? "inconclusive" : failed.length ? "counterevidence" : "supporting", phase: "experiment",
    claim: gates === null ? "Run blocked; no success claim." : `Reported checks: ${canonicalJson(gates)}`,
    evaluator_id: "are.benchmark-registration/v1", evidence_refs: [sourceRef, implementation.record_id],
    limitations: [...(result.limitations ?? []), "Registration checks structural consistency, not independent semantic truth.",
      "Historical backfill does not manufacture prior hypothesis registration or independent replications."]});
  const experiment = createResearchExperiment({...hypothesis.experiment_template, hypothesis_ref: hypothesis.record_id,
    metrics: hypothesis.metrics, observation_refs: [observation.record_id]});
  const decision = assessResearchHypothesis(hypothesis, [observation], experiment).decision;
  const question = {schema_version: "are.benchmark-research-question/v1", source_observation_ref: observation.record_id,
    question: gates === null ? "What blocked the run, and can it be completed without changing its protocol?" : failed.some(k => ["relative_latency", "wrapper_deadline"].includes(k)) ? "Which harness inputs account for classification latency, and can they be reduced without losing required context?" : failed.length ? "Which classification or requirement-preservation failures explain the counterevidence?" : "Does an independent replication preserve this result?",
    posture: "open-not-a-causal-conclusion", authority_effect: "none"};
  question.record_id = `research-question:${digest(question)}`;
  const material = {schema_version: "are.benchmark-research-registration/v1", ontology_id: "are.research-learning", experiment_id,
    result_digest: expected_result_digest, manifest_digest: digest(manifest), implementation, question,
    records: [hypothesis, observation, experiment, decision],
    relations: [
      {relation_id: "observation-tests-hypothesis", from: observation.record_id, to: hypothesis.record_id},
      {relation_id: "experiment-tests-hypothesis", from: experiment.record_id, to: hypothesis.record_id},
      {relation_id: "experiment-produces-observation", from: experiment.record_id, to: observation.record_id},
      {relation_id: "experiment-evaluates-implementation", from: experiment.record_id, to: implementation.record_id},
      {relation_id: "decision-assesses-hypothesis", from: decision.record_id, to: hypothesis.record_id},
      {relation_id: "observation-motivates-question", from: observation.record_id, to: question.record_id}],
    gates, next_research_question: question.question,
    evidence: {manifest, result}, authority_effect: "none"};
  return deepFreeze({...material, registration_digest: digest(material)});
}

export function verifyBenchmarkRegistration(record) {
  try {
    const expected = materializeBenchmarkRegistration({experiment_id: record.experiment_id, ...record.evidence, expected_result_digest: record.result_digest});
    return canonicalJson(expected) === canonicalJson(record) && record.records.every(r => verifyEvolutionRecord(r).ok);
  } catch {return false;}
}

export function persistBenchmarkRegistration(record, directory = BENCHMARK_RECORD_DIRECTORY) {
  requireThat(verifyBenchmarkRegistration(record), "registration.invalid-record");
  mkdirSync(directory, {recursive: true});
  const path = join(directory, `${record.registration_digest}.json`), bytes = canonicalJson(record) + "\n";
  const temp = join(directory, `.${randomUUID()}.tmp`);
  try {
    writeFileSync(temp, bytes, {flag: "wx", mode: 0o600});
    const fd = openSync(temp, "r"); try {fsyncSync(fd);} finally {closeSync(fd);}
    try {linkSync(temp, path);} catch (error) {
      if (error.code !== "EEXIST") throw error;
      requireThat(readFileSync(path, "utf8") === bytes, "registration.existing-record-conflict");
      return {ok: true, disposition: "replayed", path, registration_digest: record.registration_digest, authority_effect: "none"};
    }
    const dir = openSync(directory, "r"); try {fsyncSync(dir);} finally {closeSync(dir);}
    return {ok: true, disposition: "registered", path, registration_digest: record.registration_digest, authority_effect: "none"};
  } finally {try {unlinkSync(temp);} catch(error) {if(error.code !== "ENOENT") throw error;}}
}

export function loadBenchmarkRegistrations(directory = BENCHMARK_RECORD_DIRECTORY) {
  return readdirSync(directory).filter(f => f.endsWith(".json")).sort().map(f => {
    const record = JSON.parse(readFileSync(join(directory,f), "utf8"));
    requireThat(verifyBenchmarkRegistration(record) && f === `${record.registration_digest}.json`, "registration.stored-record-invalid");
    return record;
  });
}

export function registerRequirementBenchmarkCompletion(manifest, result, directory = BENCHMARK_RECORD_DIRECTORY) {
  const record = materializeBenchmarkRegistration({experiment_id: "requirement-latency-001", manifest, result, expected_result_digest: digest(result)});
  return persistBenchmarkRegistration(record, directory);
}

export function registerRequirementReplicationCompletion(manifest, result, directory = BENCHMARK_RECORD_DIRECTORY) {
  const record = materializeBenchmarkRegistration({experiment_id: "requirement-replication-001", manifest, result, expected_result_digest: digest(result)});
  return persistBenchmarkRegistration(record, directory);
}

export function registerRequirementLatencyControlCompletion(manifest, result, directory = BENCHMARK_RECORD_DIRECTORY) {
  const record=materializeBenchmarkRegistration({experiment_id:"requirement-latency-002",manifest,result,expected_result_digest:digest(result)});
  return persistBenchmarkRegistration(record,directory);
}

export function replayBenchmarkRegistrations(runtime, directory = BENCHMARK_RECORD_DIRECTORY) {
  requireThat(typeof runtime?.append === "function", "registration.runtime-required");
  // Verify the entire collection before appending any record to the caller's ledger.
  const registrations = loadBenchmarkRegistrations(directory), receipts = [];
  for (const registration of registrations) for (const record of registration.records) {
    const receipt = runtime.append(record);
    requireThat(receipt.ok, "registration.runtime-append-failed");
    receipts.push({record_id: record.record_id, disposition: receipt.disposition});
  }
  return {ok: true, registrations: registrations.length, receipts, authority_effect: "none"};
}
