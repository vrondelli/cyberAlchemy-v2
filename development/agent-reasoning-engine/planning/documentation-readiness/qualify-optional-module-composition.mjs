#!/usr/bin/env node

import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, relative, resolve} from "node:path";
import {pathToFileURL} from "node:url";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const productRelative = "implementation/agent-reasoning-engine";
const defaultCandidate = resolve(repositoryRoot, productRelative, "evidence/product-candidate.020.json");
const defaultArchive = resolve(repositoryRoot, productRelative, "evidence/archives/are-0.10.0-rc.1-candidate.020.tar.gz");
const defaultLifecycleReceipt = resolve(repositoryRoot, productRelative, "docs/releases/0.10.0-rc.1-lifecycle-receipt.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fail(code, detail = "") {
  throw new Error(detail ? `${code}:${detail}` : code);
}

function run(command, args) {
  const result = spawnSync(command, args, {encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "pipe"]});
  if (result.error) fail(`command.failed:${command}`, result.error.message);
  if (result.status !== 0 || result.signal) fail(`command.nonzero:${command}`, `${result.status ?? result.signal}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result;
}

function walk(root, current = root, output = []) {
  for (const name of readdirSync(current).sort()) {
    const path = resolve(current, name);
    const stat = lstatSync(path);
    if (stat.isDirectory()) walk(root, path, output);
    else output.push(relative(root, path).replaceAll("\\", "/"));
  }
  return output;
}

function verifyClosure(root, candidate) {
  const expected = candidate.source_closure.files.map((entry) => entry.path).sort();
  const observed = walk(root).sort();
  if (JSON.stringify(expected) !== JSON.stringify(observed)) fail("archive.inventory-mismatch");
  for (const entry of candidate.source_closure.files) {
    const path = resolve(root, entry.path);
    const stat = lstatSync(path);
    if (entry.kind === "symlink") {
      if (!stat.isSymbolicLink()) fail("archive.symlink-mismatch", entry.path);
      continue;
    }
    if (!stat.isFile()) fail("archive.file-mismatch", entry.path);
    if (sha256(readFileSync(path)) !== entry.sha256) fail("archive.digest-mismatch", entry.path);
    if ((stat.mode & 0o777) !== entry.mode) fail("archive.mode-mismatch", entry.path);
  }
}

function parseArguments() {
  const parsed = {candidate: defaultCandidate, archive: defaultArchive, lifecycleReceipt: defaultLifecycleReceipt, output: null};
  const names = new Map([["--candidate", "candidate"], ["--archive", "archive"], ["--lifecycle-receipt", "lifecycleReceipt"], ["--output", "output"]]);
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const key = names.get(args[index]);
    const value = args[index + 1];
    if (!key || !value || value.startsWith("--")) fail("usage", "qualify-optional-module-composition.mjs [--candidate <path>] [--archive <path>] [--lifecycle-receipt <path>] [--output <path>]");
    parsed[key] = resolve(value);
  }
  return parsed;
}

function semanticInput(digestValue) {
  const value = {purchase_age_days: 12, purchase_amount: 75, receipt_present: true, fraud_hold: false, final_sale: false};
  const sourceDigest = digestValue(value);
  return {
    owner_ref: "commerce-policy-owner@local",
    created_at: "2026-07-23T12:00:00.000Z",
    as_of: "2026-07-23T12:05:00.000Z",
    observation_sources: [{source_ref: "fixture://wrapper/refund-case", value, digest: sourceDigest}],
    observation_candidates: Object.entries(value).map(([field, fieldValue], index) => ({
      schema_version: "are.observation-candidate/v1",
      candidate_id: `wrapper:candidate:${String(index + 1).padStart(2, "0")}`,
      field,
      value: fieldValue,
      issuer_ref: "commerce-policy-owner@local",
      source_ref: "fixture://wrapper/refund-case",
      source_digest: sourceDigest,
      validator_ref: "wrapper-fixture-validator@1",
      temporal_scope: {observed_at: "2026-07-23T12:05:00.000Z"},
      proposed_posture: "admitted",
    })),
    challenge_state: {required_lanes: [{lane_id: "owner-policy-challenge", status: "closed", attempt_count: 1}]},
  };
}

function assessComposition(observations) {
  const required = ["semantic_evaluation", "evolution_signals", "intent_compilation", "cache_telemetry"];
  const reasons = required.filter((name) => observations[name]?.status !== "PASS").map((name) => `composition.required-observation-missing:${name}`);
  return {status: reasons.length === 0 ? "PASS" : "BLOCK", reason_codes: reasons};
}

function turnStart(id, threadId) {
  return {jsonrpc: "2.0", id, method: "turn/start", params: {threadId, input: [{type: "text", text: "Research whether this refund is eligible, then preserve the improvement signal."}]}};
}

function turnResponse(id, turnId, usage) {
  return {jsonrpc: "2.0", id, result: {turn: {id: turnId}, usage}};
}

function completed(threadId, turnId) {
  return {jsonrpc: "2.0", method: "turn/completed", params: {threadId, turn: {id: turnId, items: [], status: "completed"}}};
}

const paths = parseArguments();
const temporary = mkdtempSync(resolve(tmpdir(), "are-optional-composition-"));

try {
  const candidate = JSON.parse(readFileSync(paths.candidate, "utf8"));
  const lifecycle = JSON.parse(readFileSync(paths.lifecycleReceipt, "utf8"));
  const archiveBytes = readFileSync(paths.archive);
  if (candidate.candidate_id !== "ARE-PRODUCT-CANDIDATE-020") fail("candidate.identity-invalid");
  if (lifecycle.status !== "PASS"
    || lifecycle.candidate?.candidate_id !== candidate.candidate_id
    || lifecycle.candidate?.candidate_digest !== candidate.candidate_digest
    || lifecycle.candidate?.closure_digest !== candidate.source_closure.closure_digest) fail("lifecycle.candidate-binding-invalid");
  if (lifecycle.artifact?.sha256 !== sha256(archiveBytes) || lifecycle.artifact?.bytes !== archiveBytes.byteLength) fail("lifecycle.archive-binding-invalid");

  const extraction = resolve(temporary, "candidate-020-optional-composition");
  mkdirSync(extraction);
  run("tar", ["-xzf", paths.archive, "-C", extraction]);
  verifyClosure(extraction, candidate);
  const root = resolve(extraction, "cyberAlchemy-v2");
  const productRoot = resolve(root, productRelative);
  const wrapperApi = await import(pathToFileURL(resolve(productRoot, "packages/codex-app-server-wrapper/index.mjs")).href);
  const semanticApi = await import(pathToFileURL(resolve(productRoot, "packages/semantic-judgment-evaluator/index.mjs")).href);
  const semanticInputApi = await import(pathToFileURL(resolve(productRoot, "packages/semantic-input-runtime/index.mjs")).href);
  const loaded = wrapperApi.loadRepositoryProfile(resolve(productRoot, "packages/codex-app-server-wrapper/profiles/repository-v1.json"), extraction);
  if (!loaded.ok) fail("composition.profile-load-failed", (loaded.reason_codes ?? []).join(","));
  const semanticProfile = semanticInputApi.loadSemanticInputProfile(resolve(productRoot, "packages/codex-app-server-wrapper/test/fixtures/semantic/profile.json"), extraction);
  if (!semanticProfile.ok) fail("composition.semantic-profile-load-failed", (semanticProfile.reason_codes ?? []).join(","));

  function createInstance({invalidSemanticInput = false} = {}) {
    const profile = structuredClone(loaded.value);
    profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
    profile.evolution_signals = {enabled: true, trigger: "turn/completed"};
    profile.intent_compilation = {enabled: true, trigger: "turn/start", control_profile: {visibility: "inspect", correction_retention: "current-interaction"}};
    profile.cache_telemetry = {enabled: true, usage_paths: ["result.usage"], fields: {input_tokens: "input_tokens", cached_input_tokens: "cached_input_tokens", latency_ms: "latency_ms", baseline_latency_ms: "baseline_latency_ms"}};
    const emitted = [];
    const instance = wrapperApi.createCodexAppServerWrapper({
      loaded_profile: profile,
      decision_profile: loaded.decision_profile,
      definition_catalog: loaded.definition_catalog,
      ontology_snapshot: loaded.ontology_snapshot,
      source_snapshot: loaded.source_snapshot,
      context_source_provider: loaded.context_source_provider,
      semantic_profile: semanticProfile.value,
      semantic_input_provider: () => invalidSemanticInput ? {} : semanticInput(semanticApi.digestValue),
      evolution_signal_provider: () => [{kind: "context-precision-failure", scope: "context-precision", observed_value: 0.71, expected_value: 0.8, metric: "context_precision"}],
      evolution_signal_sink: (signal) => { emitted.push(signal); return {ok: true}; },
    });
    return {instance, emitted};
  }

  const {instance, emitted} = createInstance();
  const started = await instance.processClientMessage(turnStart(7001, "thread-composition"));
  if (started.to_server.length !== 1 || started.to_client.length !== 0) fail("composition.turn-start-not-forwarded");
  const intentEntry = started.to_server[0].params.additionalContext?.[wrapperApi.INTENT_CONTEXT_KEY];
  const intent = intentEntry ? JSON.parse(intentEntry.value) : null;
  if (!intent?.intent_contract?.intent_contract_digest) fail("composition.intent-compilation-missing");

  const projection = instance.inspectState().cache_affinity_consumers[0];
  const mismatchedCache = instance.recordCacheTelemetry({
    consumer_ref: projection.consumer,
    provider_usage: {
      schema_version: "are.provider-cache-usage/v1",
      projection_digest: "mismatched-projection",
      exact_prefix_digest: projection.exact_prefix_digest,
      provider_ref: projection.provider_ref,
      model_ref: projection.model_ref,
      input_tokens: 900,
      cached_input_tokens: 700,
      latency_ms: 70,
      baseline_latency_ms: 100,
    },
  });
  if (mismatchedCache.ok !== false) fail("composition.cache-mismatch-did-not-fail-closed");

  await instance.processServerMessage(turnResponse(7001, "turn-composition", {input_tokens: 900, cached_input_tokens: 700, latency_ms: 70, baseline_latency_ms: 100}));
  const completion = await instance.processServerMessage(completed("thread-composition", "turn-composition"));
  const semantic = completion.to_client.find((message) => message.method === wrapperApi.SEMANTIC_NOTIFICATION)?.params;
  if (semantic?.disposition !== "evaluated" || semantic.semantic_outcome !== "RecommendedUnderSnapshot" || semantic.evaluator_calls !== 1) fail("composition.semantic-evaluation-missing", JSON.stringify(semantic));
  if (emitted.length !== 1 || emitted[0].schema_version !== "are.improvement-signal/v1") fail("composition.evolution-signal-missing");
  const state = instance.inspectState();
  const cache = state.cache_affinity_consumers[0];
  if (cache.cache_hit_posture !== "observed-hit" || cache.observed_cached_input_tokens !== 700 || !cache.cache_telemetry_observation_digest) fail("composition.cache-telemetry-missing");
  const events = instance.ledger.snapshot();
  if (!events.some((event) => event.event_kind === "semantic-evaluation-completed")
    || !events.some((event) => event.event_kind === "evolution-signals-assessed")
    || !events.some((event) => event.event_kind === "cache-telemetry-observed")) fail("composition.ledger-evidence-incomplete");

  const observations = {
    semantic_evaluation: {status: "PASS", disposition: semantic.disposition, outcome: semantic.semantic_outcome},
    evolution_signals: {status: "PASS", emitted_count: emitted.length, signal_schema: emitted[0].schema_version},
    intent_compilation: {status: "PASS", trigger: "turn/start", contract_bound: true},
    cache_telemetry: {status: "PASS", posture: cache.cache_hit_posture, cached_input_tokens: cache.observed_cached_input_tokens},
  };
  const assessment = assessComposition(observations);
  if (assessment.status !== "PASS") fail("composition.required-observations-incomplete", assessment.reason_codes.join(","));

  const negative = createInstance({invalidSemanticInput: true});
  const negativeStart = await negative.instance.processClientMessage(turnStart(7002, "thread-composition-negative"));
  if (negativeStart.to_server.length !== 1) fail("composition.negative-turn-start-not-forwarded");
  await negative.instance.processServerMessage(turnResponse(7002, "turn-composition-negative", {input_tokens: 100, cached_input_tokens: 0, latency_ms: 10, baseline_latency_ms: 10}));
  const negativeCompletion = await negative.instance.processServerMessage(completed("thread-composition-negative", "turn-composition-negative"));
  const negativeSemantic = negativeCompletion.to_client.find((message) => message.method === wrapperApi.SEMANTIC_NOTIFICATION)?.params;
  if (negativeSemantic?.disposition !== "block" || negativeSemantic.evaluator_calls !== 0) fail("composition.invalid-semantic-input-did-not-fail-closed");
  const incompleteAssessment = assessComposition({...observations, evolution_signals: null});
  if (incompleteAssessment.status !== "BLOCK" || !incompleteAssessment.reason_codes.includes("composition.required-observation-missing:evolution_signals")) fail("composition.missing-observation-did-not-fail-closed");

  const receipt = {
    schema_version: "are.optional-module-composition-qualification/v1",
    status: "PASS",
    candidate: {
      candidate_id: candidate.candidate_id,
      candidate_digest: candidate.candidate_digest,
      source_closure_digest: candidate.source_closure.closure_digest,
      archive_sha256: sha256(archiveBytes),
    },
    execution: {mode: "single-synthetic-turn", provider_calls: 0, external_effects: 0},
    modules: observations,
    fail_closed: {
      invalid_semantic_input: "PASS",
      mismatched_cache_identity: "PASS",
      missing_required_observation: "PASS",
    },
    reason_codes: [],
    claim_limit: "PASS proves that Candidate 020's frozen Linux x64 source archive composes semantic evaluation, evolution signals, intent compilation, and observed cache telemetry in one deterministic synthetic turn, with three fail-closed checks. It does not prove live-provider behavior, model quality, cross-platform support, product approval, signing, publication, delivery, deployment, or an external effect.",
    authority_effect: "none",
  };
  receipt.receipt_digest = sha256(JSON.stringify(receipt));
  const encoded = `${JSON.stringify(receipt, null, 2)}\n`;
  if (paths.output) {
    mkdirSync(dirname(paths.output), {recursive: true});
    writeFileSync(paths.output, encoded);
  }
  process.stdout.write(encoded);
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
