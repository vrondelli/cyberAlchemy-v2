import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {canonicalJson, canonicalizeJson, sha256HexText} from "../../intent-route-resolver/index.mjs";

import {
  acquireReasoningStateWriterLock,
  inspectReasoningStateWriterLock,
  appendReasoningCounterevidence,
  appendReasoningStateReduction,
  assessReasoningStateTransition,
  bindCacheTelemetryObservation,
  checkpointReasoningStateByRisk,
  compareReasoningProvenance,
  checkpointReasoningState,
  createAppendOnlyFileReasoningStateSink,
  createMemoryReasoningStateSink,
  createReasoningStateLedger,
  createReasoningStateBranch,
  createRequestSeriesHeader,
  deriveReasoningReplayFixture,
  executeReasoningStateTransition,
  exportPortableReasoningEpoch,
  importPortableReasoningEpoch,
  materializeCacheAffinityProjection,
  materializeContextBoundCacheAffinityProjection,
  materializeReasoningDispatch,
  planReasoningStateTransition,
  getReasoningStateFrontier,
  listReasoningStateFrontiers,
  rebuildReasoningStateIndexes,
  recoverReasoningStateLedger,
  reconstructReasoningDispatch,
  sealReasoningStateFrontier,
  selectRecoverableCheckpoint,
  selectReasoningCheckpointPolicy,
  selectReusableCounterevidence,
  verifyReasoningDispatch,
  verifyReasoningStateLog,
  verifyReasoningStateEpoch,
  verifyReasoningStateFrontier,
  verifyReasoningReplayFixture,
  verifyReasoningStateTransitionPlan,
  verifyReasoningStateTransitionReceipt,
  verifyPortableReasoningEpoch,
} from "../index.mjs";

function valueDigest(value) {
  return sha256HexText(canonicalJson(canonicalizeJson(value)));
}

function refreshAssessment({dependencies, disposition = "reuse-current", changes = [], unrelated = []}) {
  const value = canonicalizeJson({
    schema_version: "are.context-refresh-assessment/v1",
    disposition,
    reason_codes: [disposition === "reuse-current" ? "refresh.selected-dependencies-current" : "refresh.selected-dependency-drift"],
    previous_context_epoch_id: "context-epoch:previous",
    changed_selected_dependencies: changes,
    unrelated_source_drift: unrelated,
    current_selected_dependencies: dependencies,
    current_source_snapshot: [],
    reuse_allowed: disposition === "reuse-current",
    authority_effect: "none",
  });
  return {ok: true, value, digest: valueDigest(value), authority_effect: "none"};
}

test("content-addressed branches retain their exact base without rewriting it", () => {
  const {ledger, epoch} = state();
  const additional = ledger.append({event_kind: "hypothesis-added", content: {hypothesis: "branch-only"}});
  const branched = createReasoningStateBranch(ledger, {base_epoch: epoch.value, branch_ref: "branch:counterfactual", additional_event_digests: [additional.event.event_digest], branch_basis: {technique: "counterfactual"}});
  assert.equal(branched.ok, true);
  assert.equal(branched.epoch.frontier.branch_id, branched.branch.branch_id);
  assert.deepEqual(epoch.value.event_digests, [epoch.value.event_digests[0], epoch.value.event_digests[1]]);
  const duplicate = createReasoningStateBranch(ledger, {base_epoch: epoch.value, branch_ref: "branch:counterfactual", additional_event_digests: [additional.event.event_digest], branch_basis: {technique: "counterfactual"}});
  assert.equal(duplicate.branch.branch_id, branched.branch.branch_id);
});

test("verified replay state deterministically derives executable-free fixtures", () => {
  const {ledger, epoch} = state();
  const first = deriveReasoningReplayFixture(ledger, epoch.value, {fixture_ref: "fixture:state"});
  const second = deriveReasoningReplayFixture(ledger, epoch.value, {fixture_ref: "fixture:state"});
  assert.deepEqual(first, second);
  assert.equal(verifyReasoningReplayFixture(first.value).ok, true);
  const changed = structuredClone(first.value);
  changed.events[0].content.request_id = "tampered";
  assert.equal(verifyReasoningReplayFixture(changed).ok, false);
});

test("reductions append successor records and preserve source epochs", () => {
  const {ledger, epoch} = state();
  const retained = [epoch.value.event_digests[1]];
  const reduced = appendReasoningStateReduction(ledger, {source_epoch: epoch.value, retained_event_digests: retained, reduction_basis: {policy: "retain-context-evidence"}});
  assert.equal(reduced.ok, true);
  assert.deepEqual(reduced.reduction.omitted_event_digests, [epoch.value.event_digests[0]]);
  assert.equal(reduced.reduction.destructive, false);
  assert.deepEqual(epoch.value.event_digests.length, 2);
  assert.deepEqual(reduced.epoch.event_digests, [retained[0], reduced.event.event_digest]);
});

test("checkpoint durability scales with boundary risk and fails closed", () => {
  assert.equal(selectReasoningCheckpointPolicy({boundary: "observation"}).value.checkpoint_required, false);
  assert.equal(selectReasoningCheckpointPolicy({boundary: "effect"}).value.minimum_durability, "append-only-file-fsync");
  const memory = state();
  assert.deepEqual(checkpointReasoningStateByRisk(memory.ledger, {boundary: "effect", epoch: memory.epoch.value}).reason_codes, ["reasoning.checkpoint-durability-insufficient"]);
  assert.equal(checkpointReasoningStateByRisk(memory.ledger, {boundary: "model-request", epoch: memory.epoch.value}).ok, true);
});

test("counterevidence remains reusable only while its selected source is current", () => {
  const ledger = createReasoningStateLedger({ledger_id: "reasoning:counterevidence"});
  const added = appendReasoningCounterevidence(ledger, {claim_ref: "claim:eligible", evidence_ref: "evidence:defeater", source_identity: "source:policy", source_digest: "digest:v1", content: {defeater: "hold"}});
  assert.equal(added.ok, true);
  const current = selectReusableCounterevidence(ledger, {claim_ref: "claim:eligible", current_sources: [{source_identity: "source:policy", source_digest: "digest:v1"}]});
  assert.equal(current.value.selected.length, 1);
  const drifted = selectReusableCounterevidence(ledger, {claim_ref: "claim:eligible", current_sources: [{source_identity: "source:policy", source_digest: "digest:v2"}]});
  assert.equal(drifted.value.selected.length, 0);
  assert.equal(drifted.value.invalidated[0].reason, "counterevidence.source-changed");
});

test("portable epochs require exact compatibility and import as new local events", () => {
  const {ledger, epoch} = state();
  const compatibility = {protocol: "are-reasoning-state/v1", semantic_profile: "semantic:v1"};
  const exported = exportPortableReasoningEpoch(ledger, epoch.value, {compatibility_profile: compatibility});
  assert.equal(verifyPortableReasoningEpoch(exported.value, compatibility).ok, true);
  assert.deepEqual(verifyPortableReasoningEpoch(exported.value, {...compatibility, semantic_profile: "semantic:v2"}).reason_codes, ["reasoning.portable-compatibility-mismatch"]);
  const target = createReasoningStateLedger({ledger_id: "reasoning:portable-target"});
  const imported = importPortableReasoningEpoch(target, exported.value, {compatibility_profile: compatibility, consumer_ref: "codex:handoff"});
  assert.equal(imported.ok, true);
  assert.equal(imported.epoch.frontier.source_epoch_digest, epoch.value.epoch_digest);
  assert.equal(target.snapshot().length, 1);
});

test("provenance comparison names every reason similar requests cannot reuse state", () => {
  const {ledger, epoch} = state();
  const changed = ledger.seal({...epoch.value, event_digests: epoch.value.event_digests, selected_dependencies: ["definition:2"], context_envelope_digest: "context:2", frontier: {continuation: "gated"}, request_ref: "request:2"});
  const comparison = compareReasoningProvenance(epoch.value, changed.value);
  assert.equal(comparison.value.reuse_eligible, false);
  assert.deepEqual(comparison.value.difference_reasons, ["provenance.context-envelope-changed", "provenance.frontier-changed", "provenance.request-changed", "provenance.selected-dependencies-changed"]);
  assert.equal(compareReasoningProvenance(epoch.value, epoch.value).value.same_provenance, true);
});

test("transition coordinator deterministically selects reuse, branch, and reduction", () => {
  const {ledger, epoch} = state();
  const reuse = planReasoningStateTransition({current_epoch: epoch.value, boundary: "observation"});
  assert.equal(reuse.value.assessment.selected_action, "reuse");
  assert.equal(executeReasoningStateTransition(ledger, reuse.value).receipt.action, "reuse");

  const added = ledger.append({event_kind: "candidate-observed", content: {candidate_digest: "candidate:1"}});
  const branch = planReasoningStateTransition({current_epoch: epoch.value, requested_action: "branch", branch_ref: "candidate:1", additional_event_digests: [added.event.event_digest], boundary: "observation"});
  assert.equal(branch.value.assessment.selected_action, "branch");
  const executed = executeReasoningStateTransition(ledger, branch.value);
  assert.equal(executed.ok, true);
  assert.equal(verifyReasoningStateTransitionReceipt(executed.receipt).ok, true);
  const tamperedReceipt = structuredClone(executed.receipt);
  tamperedReceipt.result.disposition = "reused";
  assert.equal(verifyReasoningStateTransitionReceipt(tamperedReceipt).ok, false);

  const reduction = planReasoningStateTransition({current_epoch: executed.result.epoch, maximum_event_count: 1, retained_event_digests: [executed.result.epoch.event_digests.at(-1)], boundary: "observation"});
  assert.equal(reduction.value.assessment.selected_action, "reduce");
});

test("transition coordinator blocks incomplete operations and tampered plans", () => {
  const {epoch} = state();
  const incomplete = assessReasoningStateTransition({current_epoch: epoch.value, requested_action: "branch", boundary: "observation"});
  assert.equal(incomplete.ok, false);
  assert.deepEqual(incomplete.reason_codes, ["reasoning.transition-branch-input-required"]);
  const planned = planReasoningStateTransition({current_epoch: epoch.value, boundary: "observation"});
  const tampered = structuredClone(planned.value);
  tampered.assessment.selected_action = "checkpoint";
  assert.equal(verifyReasoningStateTransitionPlan(tampered).ok, false);
});

test("a reasoning-state log admits exactly one writer until clean release", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-lock-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const first = acquireReasoningStateWriterLock({path, owner_id: "writer:first"});
    assert.equal(first.ok, true);
    assert.deepEqual(acquireReasoningStateWriterLock({path, owner_id: "writer:second"}).reason_codes, ["reasoning.writer-lock-held"]);
    assert.equal(first.lock.release().ok, true);
    const successor = acquireReasoningStateWriterLock({path, owner_id: "writer:successor"});
    assert.equal(successor.ok, true);
    assert.equal(successor.lock.release().ok, true);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("writer-lock inspection identifies stale candidates without breaking them", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-lock-inspect-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const acquired = acquireReasoningStateWriterLock({path, owner_id: "writer:inspect"});
    const stale = inspectReasoningStateWriterLock({path, process_probe: () => "missing"});
    assert.equal(stale.disposition, "stale-candidate");
    assert.equal(stale.break_authorized, false);
    assert.equal(acquired.lock.release().ok, true);
    assert.equal(inspectReasoningStateWriterLock({path}).disposition, "missing");
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test("reasoning-state writer reclaims a verified terminated local owner", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-crash-lock-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const moduleUrl = new URL("../index.mjs", import.meta.url).href;
    const script = `const {acquireReasoningStateWriterLock} = await import(${JSON.stringify(moduleUrl)}); const result = acquireReasoningStateWriterLock({path: ${JSON.stringify(path)}}); if (!result.ok) throw new Error(JSON.stringify(result.reason_codes));`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], {encoding: "utf8"});
    assert.equal(child.status, 0, child.stderr);
    assert.equal(inspectReasoningStateWriterLock({path}).disposition, "stale-candidate");
    const recovered = acquireReasoningStateWriterLock({path, owner_id: "writer:recovered"});
    assert.equal(recovered.ok, true);
    assert.equal(inspectReasoningStateWriterLock({path}).disposition, "active");
    assert.equal(recovered.lock.release().ok, true);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test("reasoning-state writer leaves interrupted recovery and legacy locks untouched", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-recovery-marker-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const moduleUrl = new URL("../index.mjs", import.meta.url).href;
    const script = `const {acquireReasoningStateWriterLock} = await import(${JSON.stringify(moduleUrl)}); const result = acquireReasoningStateWriterLock({path: ${JSON.stringify(path)}}); if (!result.ok) throw new Error(JSON.stringify(result.reason_codes));`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], {encoding: "utf8"});
    assert.equal(child.status, 0, child.stderr);
    const marker = `${path}.writer.lock.recovery.lock`;
    writeFileSync(marker, "", {flag: "wx"});
    assert.deepEqual(acquireReasoningStateWriterLock({path}).reason_codes, ["reasoning.writer-lock-recovery-held"]);
    rmSync(marker);
    const lockPath = `${path}.writer.lock`;
    const current = JSON.parse(readFileSync(lockPath, "utf8"));
    const legacy = {...current, schema_version: "are.reasoning-state-writer-lock/v1"};
    delete legacy.host_name; delete legacy.lock_digest;
    writeFileSync(lockPath, `${canonicalJson({...legacy, lock_digest: sha256HexText(canonicalJson(canonicalizeJson(legacy)))})}\n`);
    assert.equal(inspectReasoningStateWriterLock({path}).disposition, "legacy-unrecoverable");
    assert.deepEqual(acquireReasoningStateWriterLock({path}).reason_codes, ["reasoning.writer-lock-held"]);
    writeFileSync(marker, "", {flag: "wx"});
    rmSync(lockPath);
    assert.equal(inspectReasoningStateWriterLock({path}).disposition, "recovery-interrupted");
    assert.deepEqual(acquireReasoningStateWriterLock({path}).reason_codes, ["reasoning.writer-lock-recovery-held"]);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

function state() {
  const sink = createMemoryReasoningStateSink();
  const ledger = createReasoningStateLedger({ledger_id: "reasoning:test", sink});
  const request = ledger.append({event_kind: "request-interpreted", content: {request_id: "request:1", route_id: "CA2-ROUTE-RESEARCH"}});
  const context = ledger.append({event_kind: "context-projected", content: {context_envelope_digest: "context:1", selected_dependencies: ["definition:1"]}});
  const epoch = ledger.seal({event_digests: [request.event.event_digest, context.event.event_digest], consumer_ref: "codex:test", request_ref: "request:1", context_envelope_digest: "context:1", selected_dependencies: ["definition:1"], frontier: {continuation: "open"}});
  return {sink, ledger, request, context, epoch};
}

test("append-only events are hash-chained, immutable, and idempotent", () => {
  const {ledger, request, context} = state();
  assert.equal(request.ok, true);
  assert.equal(context.event.predecessor_digest, request.event.event_digest);
  assert.equal(Object.isFrozen(request.event), true);
  const duplicate = ledger.append({event_kind: "request-interpreted", content: {request_id: "request:1", route_id: "CA2-ROUTE-RESEARCH"}});
  assert.equal(duplicate.disposition, "duplicate");
  assert.equal(ledger.inspect().event_count, 2);
});

test("sealed epochs select exact events and replay deterministically", () => {
  const {ledger, epoch} = state();
  assert.equal(epoch.ok, true);
  assert.equal(verifyReasoningStateEpoch(epoch.value).ok, true);
  const first = ledger.replay(epoch.value);
  const second = ledger.replay(epoch.value);
  assert.deepEqual(first, second);
  assert.equal(first.value.events.length, 2);
  const changed = structuredClone(epoch.value);
  changed.event_digests.reverse();
  assert.equal(verifyReasoningStateEpoch(changed).ok, false);
});

test("selected dependency ordering does not change epoch identity", () => {
  const {ledger, request, context} = state();
  const input = {event_digests: [request.event.event_digest, context.event.event_digest], selected_dependencies: [{id: "b", digest: "2"}, {id: "a", digest: "1"}]};
  const left = ledger.seal(input);
  const right = ledger.seal({...input, selected_dependencies: [...input.selected_dependencies].reverse()});
  assert.equal(left.digest, right.digest);
  assert.equal(right.disposition, "duplicate");
});

test("checkpoints flush only after epoch verification", () => {
  const {sink, ledger, epoch} = state();
  const checkpoint = checkpointReasoningState(ledger, {checkpoint_kind: "before-model-request", epoch: epoch.value, subject_digest: "dispatch:1"});
  assert.equal(checkpoint.ok, true);
  assert.equal(checkpoint.value.durability, "process-memory");
  assert.equal(sink.inspect().flush_count, 1);
  const tampered = structuredClone(epoch.value);
  tampered.epoch_digest = "0".repeat(64);
  assert.equal(ledger.checkpoint({checkpoint_kind: "before-effect", epoch: tampered}).ok, false);
  assert.equal(sink.inspect().flush_count, 1);
});

test("file sink appends canonical records and fsyncs at checkpoints", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-state-"));
  const path = resolve(directory, "events.jsonl");
  try {
    const sink = createAppendOnlyFileReasoningStateSink({path});
    const ledger = createReasoningStateLedger({ledger_id: "reasoning:file", sink});
    const appended = ledger.append({event_kind: "request-interpreted", content: {request_id: "file:1"}});
    const epoch = ledger.seal({event_digests: [appended.event.event_digest], request_ref: "file:1"});
    const checkpoint = ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: epoch.value});
    assert.equal(checkpoint.ok, true);
    ledger.close();
    const lines = readFileSync(path, "utf8").trim().split("\n").map(JSON.parse);
    assert.deepEqual(lines.map((line) => line.record_kind), ["reasoning-state-event", "reasoning-state-epoch", "reasoning-state-checkpoint"]);
    assert.equal(lines[0].value.event_digest, appended.event.event_digest);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("dispatch reconstruction binds exact request, header, and epoch", () => {
  const {epoch} = state();
  const message = {jsonrpc: "2.0", id: 7, method: "turn/start", params: {threadId: "thread:1", model: "gpt-test", input: [{type: "text", text: "Research it."}], tools: [{name: "search"}]}};
  const header = createRequestSeriesHeader(message);
  const dispatch = materializeReasoningDispatch({epoch: epoch.value, message, request_header: header});
  assert.equal(dispatch.ok, true);
  const verified = verifyReasoningDispatch(dispatch.value, {epoch: epoch.value, message});
  assert.equal(verified.ok, true);
  assert.deepEqual(reconstructReasoningDispatch(dispatch.value, {epoch: epoch.value}).value, message);
  const changed = structuredClone(message);
  changed.params.model = "different";
  assert.deepEqual(verifyReasoningDispatch(dispatch.value, {epoch: epoch.value, message: changed}).reason_codes, ["reasoning.dispatch-message-mismatch"]);
});

test("cache affinity projects stable request and reasoning bytes before the volatile suffix", () => {
  const message = {jsonrpc: "2.0", id: 8, method: "turn/start", params: {threadId: "thread:cache", model: "gpt-test", input: [{type: "text", text: "first"}], tools: [{name: "search"}]}};
  const header = createRequestSeriesHeader(message, {system: "stable-system", configuration: {sandbox: "read-only"}});
  const reusable = {context_envelope_digest: "context:stable", selected_dependencies: [{id: "definition:1", digest: "a"}], included_items: [{id: "definition:1", text: "stable meaning"}]};
  const first = materializeCacheAffinityProjection({request_header: header, reusable_reasoning_state: reusable, volatile_current_turn_suffix: {request_id: "request:1", input: "first"}});
  assert.equal(first.ok, true);
  assert.equal(first.assessment.posture, "cold");
  assert.equal(first.assessment.cache_hit_posture, "unobserved");
  assert.equal(first.projection.wire_value.startsWith(`${JSON.stringify(first.projection.stable_request_prefix)}\n`), true);
  assert.equal(first.projection.exact_reusable_prefix_bytes, first.projection.stable_prefix_bytes + first.projection.reusable_reasoning_bytes + 2);

  const second = materializeCacheAffinityProjection({request_header: header, reusable_reasoning_state: reusable, volatile_current_turn_suffix: {request_id: "request:2", input: "second"}, previous_projection: first.projection});
  assert.equal(second.assessment.posture, "eligible-reuse");
  assert.equal(second.assessment.exact_prefix_reuse, true);
  assert.equal(second.assessment.reused_prefix_bytes >= second.projection.exact_reusable_prefix_bytes, true);
  assert.deepEqual(second.assessment.invalidation_reasons, []);
  assert.equal(second.assessment.observed_time_savings_ms, null);
  assert.match(second.assessment.claim_ceiling, /no cache hit/);
});

test("cache affinity explains exact prefix invalidation without treating it as a correctness result", () => {
  const baseMessage = {jsonrpc: "2.0", id: 9, method: "turn/start", params: {threadId: "thread:cache", model: "gpt-a", input: []}};
  const first = materializeCacheAffinityProjection({
    request_header: createRequestSeriesHeader(baseMessage, {tools: [{name: "one"}]}),
    reusable_reasoning_state: {context_envelope_digest: "context:a"},
    volatile_current_turn_suffix: {request_id: "request:a"},
  });
  const second = materializeCacheAffinityProjection({
    request_header: createRequestSeriesHeader({...baseMessage, params: {...baseMessage.params, model: "gpt-b"}}, {tools: [{name: "two"}]}),
    reusable_reasoning_state: {context_envelope_digest: "context:b"},
    volatile_current_turn_suffix: {request_id: "request:b"},
    previous_projection: first.projection,
  });
  assert.equal(second.assessment.posture, "invalidated");
  assert.equal(second.assessment.exact_prefix_reuse, false);
  assert.deepEqual(second.assessment.invalidation_reasons, [
    "cache-affinity.model-changed",
    "cache-affinity.reasoning-state-changed",
    "cache-affinity.tools-changed",
  ]);
  assert.equal(second.assessment.authority_effect, "none");
});

test("context-bound reuse gates exact prefix eligibility on selected dependency currentness", () => {
  const dependencies = [{dependency_id: "definition:one", digest: "digest:v1", kind: "definition"}];
  const header = createRequestSeriesHeader({jsonrpc: "2.0", method: "turn/start", params: {model: "gpt-test"}});
  const initialRefresh = refreshAssessment({
    dependencies,
    disposition: "successor-required",
    changes: [{kind: "selected-dependency", identity: "definition:one", previous_digest: null, current_digest: "digest:v1", change: "added"}],
  });
  const stateV1 = {selected_dependencies_digest: valueDigest(dependencies), context_envelope_digest: "context:v1"};
  const initial = materializeContextBoundCacheAffinityProjection({
    request_header: header,
    current_reusable_reasoning_state: stateV1,
    volatile_current_turn_suffix: {request_ref: "request:one"},
    refresh_assessment: initialRefresh,
  });
  assert.equal(initial.ok, true);
  assert.equal(initial.receipt.disposition, "cold-start");

  const reused = materializeContextBoundCacheAffinityProjection({
    request_header: header,
    current_reusable_reasoning_state: stateV1,
    volatile_current_turn_suffix: {request_ref: "request:two"},
    previous_projection: initial.projection,
    refresh_assessment: refreshAssessment({dependencies}),
  });
  assert.equal(reused.ok, true);
  assert.equal(reused.receipt.disposition, "reuse-current");
  assert.equal(reused.receipt.exact_prefix_reuse, true);
  assert.equal(reused.receipt.cache_hit_posture, "unobserved");
});

test("context-bound reuse creates a successor when a selected dependency changes", () => {
  const before = [{dependency_id: "definition:one", digest: "digest:v1", kind: "definition"}];
  const after = [{dependency_id: "definition:one", digest: "digest:v2", kind: "definition"}];
  const header = createRequestSeriesHeader({jsonrpc: "2.0", method: "turn/start", params: {model: "gpt-test"}});
  const prior = materializeCacheAffinityProjection({
    request_header: header,
    reusable_reasoning_state: {selected_dependencies_digest: valueDigest(before), context_envelope_digest: "context:v1"},
    volatile_current_turn_suffix: {request_ref: "request:before"},
  });
  const refresh = refreshAssessment({
    dependencies: after,
    disposition: "successor-required",
    changes: [{kind: "selected-dependency", identity: "definition:one", previous_digest: "digest:v1", current_digest: "digest:v2", change: "changed"}],
  });
  const result = materializeContextBoundCacheAffinityProjection({
    request_header: header,
    current_reusable_reasoning_state: {selected_dependencies_digest: valueDigest(after), context_envelope_digest: "context:v2"},
    volatile_current_turn_suffix: {request_ref: "request:after"},
    previous_projection: prior.projection,
    refresh_assessment: refresh,
  });
  assert.equal(result.ok, true);
  assert.equal(result.receipt.disposition, "successor-created");
  assert.equal(result.receipt.exact_prefix_reuse, false);
  assert.equal(result.receipt.changed_selected_dependencies[0].identity, "definition:one");
  assert.equal(result.receipt.invalidation_reasons.includes("cache-affinity.reasoning-state-changed"), true);
});

test("context-bound reuse blocks stale state, tampered refresh evidence, and tampered prior bytes", () => {
  const dependencies = [{dependency_id: "definition:one", digest: "digest:v2", kind: "definition"}];
  const header = createRequestSeriesHeader({jsonrpc: "2.0", method: "turn/start", params: {model: "gpt-test"}});
  const refresh = refreshAssessment({dependencies});
  const stale = materializeContextBoundCacheAffinityProjection({
    request_header: header,
    current_reusable_reasoning_state: {selected_dependencies_digest: valueDigest([{...dependencies[0], digest: "digest:v1"}])},
    volatile_current_turn_suffix: {request_ref: "request:stale"},
    refresh_assessment: refresh,
  });
  assert.deepEqual(stale.reason_codes, ["context-bound-reuse.selected-dependencies-binding-mismatch"]);

  const tamperedRefresh = structuredClone(refresh);
  tamperedRefresh.value.reuse_allowed = false;
  assert.deepEqual(materializeContextBoundCacheAffinityProjection({
    request_header: header,
    current_reusable_reasoning_state: {selected_dependencies_digest: valueDigest(dependencies)},
    volatile_current_turn_suffix: {request_ref: "request:tampered-refresh"},
    refresh_assessment: tamperedRefresh,
  }).reason_codes, ["context-bound-reuse.refresh-assessment-digest-invalid", "context-bound-reuse.refresh-reuse-flag-inconsistent"]);

  const prior = materializeCacheAffinityProjection({
    request_header: header,
    reusable_reasoning_state: {selected_dependencies_digest: valueDigest(dependencies)},
    volatile_current_turn_suffix: {request_ref: "request:prior"},
  });
  const tamperedProjection = structuredClone(prior.projection);
  tamperedProjection.wire_value += "tampered";
  assert.deepEqual(materializeContextBoundCacheAffinityProjection({
    request_header: header,
    current_reusable_reasoning_state: {selected_dependencies_digest: valueDigest(dependencies)},
    volatile_current_turn_suffix: {request_ref: "request:next"},
    previous_projection: tamperedProjection,
    refresh_assessment: refresh,
  }).reason_codes, ["context-bound-reuse.prior-projection-bytes-invalid", "context-bound-reuse.prior-projection-digest-invalid"]);
});

test("cache telemetry binds measured provider usage to one exact projection", () => {
  const message = {jsonrpc: "2.0", id: 10, method: "turn/start", params: {threadId: "thread:telemetry", model: "gpt-test", input: []}};
  const projected = materializeCacheAffinityProjection({request_header: createRequestSeriesHeader(message), reusable_reasoning_state: {context: "stable"}, volatile_current_turn_suffix: {request_id: "telemetry:1"}});
  const observed = bindCacheTelemetryObservation({
    projection: projected.projection,
    assessment: projected.assessment,
    provider_usage: {
      schema_version: "are.provider-cache-usage/v1",
      projection_digest: projected.projection.projection_digest,
      exact_prefix_digest: projected.projection.exact_prefix_digest,
      provider_ref: projected.projection.stable_request_prefix.provider_ref,
      model_ref: projected.projection.stable_request_prefix.model_ref,
      input_tokens: 1200,
      cached_input_tokens: 900,
      latency_ms: 80,
      baseline_latency_ms: 125,
    },
  });
  assert.equal(observed.ok, true);
  assert.equal(observed.value.cache_hit_posture, "observed-hit");
  assert.equal(observed.value.observed_token_savings, 900);
  assert.equal(observed.value.observed_time_savings_ms, 45);
  assert.equal(observed.value.authority_effect, "none");
});

test("cache telemetry stays unobserved without usage and blocks cross-projection claims", () => {
  const message = {jsonrpc: "2.0", id: 11, method: "turn/start", params: {threadId: "thread:telemetry", model: "gpt-test", input: []}};
  const projected = materializeCacheAffinityProjection({request_header: createRequestSeriesHeader(message), reusable_reasoning_state: {context: "stable"}, volatile_current_turn_suffix: {request_id: "telemetry:2"}});
  const absent = bindCacheTelemetryObservation({projection: projected.projection, assessment: projected.assessment, provider_usage: null});
  assert.equal(absent.value.cache_hit_posture, "unobserved");
  assert.equal(absent.value.observed_token_savings, null);
  const drifted = bindCacheTelemetryObservation({projection: projected.projection, assessment: projected.assessment, provider_usage: {
    schema_version: "are.provider-cache-usage/v1", projection_digest: "different", exact_prefix_digest: projected.projection.exact_prefix_digest,
    provider_ref: projected.projection.stable_request_prefix.provider_ref, model_ref: projected.projection.stable_request_prefix.model_ref,
    input_tokens: 100, cached_input_tokens: 50,
  }});
  assert.equal(drifted.ok, false);
  assert.deepEqual(drifted.reason_codes, ["cache-telemetry.projection-binding-mismatch"]);
});

test("idempotency conflicts and invalid dispatches fail closed", () => {
  const {ledger, epoch} = state();
  ledger.append({event_kind: "fact", idempotency_key: "same", content: {value: 1}});
  const conflict = ledger.append({event_kind: "fact", idempotency_key: "same", content: {value: 2}});
  assert.deepEqual(conflict.reason_codes, ["reasoning.event-idempotency-conflict"]);
  assert.equal(materializeReasoningDispatch({epoch: epoch.value, message: null}).ok, false);
});

test("a checkpointed file recovers its exact ledger and continues the hash chain", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-recovery-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const sink = createAppendOnlyFileReasoningStateSink({path});
    const ledger = createReasoningStateLedger({ledger_id: "reasoning:recover", sink});
    const event = ledger.append({event_kind: "request-interpreted", content: {request_id: "recover:1"}});
    const epoch = ledger.seal({event_digests: [event.event.event_digest], request_ref: "recover:1"});
    const checkpoint = ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: epoch.value, subject_digest: "dispatch:recover:1"});
    ledger.close();

    const verified = verifyReasoningStateLog(path, {expected_ledger_id: "reasoning:recover"});
    assert.equal(verified.ok, true);
    assert.equal(verified.value.index.event_count, 1);
    assert.equal(rebuildReasoningStateIndexes(verified).value.index_digest, verified.value.index.index_digest);
    assert.equal(selectRecoverableCheckpoint(verified).digest, checkpoint.digest);

    const recovered = recoverReasoningStateLedger({path, ledger_id: "reasoning:recover"});
    assert.equal(recovered.ok, true);
    assert.equal(recovered.assessment.disposition, "recovered");
    assert.equal(recovered.ledger.inspect().sink.record_count, 3);
    assert.deepEqual(recovered.ledger.replay(epoch.value).value.events, [event.event]);
    const successor = recovered.ledger.append({event_kind: "request-interpreted", content: {request_id: "recover:2"}});
    assert.equal(successor.event.sequence, 2);
    assert.equal(successor.event.predecessor_digest, event.event.event_digest);
    recovered.ledger.close();
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("recovery creates a new empty file only when an explicit ledger identity is supplied", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-empty-"));
  const path = resolve(directory, "new.jsonl");
  try {
    assert.deepEqual(verifyReasoningStateLog(path).reason_codes, ["reasoning.log-missing"]);
    assert.deepEqual(recoverReasoningStateLedger(path).reason_codes, ["reasoning.recovery-ledger-id-required"]);
    const recovered = recoverReasoningStateLedger({path, ledger_id: "reasoning:new"});
    assert.equal(recovered.ok, true);
    assert.equal(recovered.assessment.disposition, "empty-ledger-ready");
    assert.equal(recovered.ledger.inspect().event_count, 0);
    recovered.ledger.close();
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("torn, malformed, noncanonical, and unknown records fail closed", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-corrupt-"));
  try {
    const torn = resolve(directory, "torn.jsonl");
    writeFileSync(torn, "{\"record_kind\":");
    assert.deepEqual(verifyReasoningStateLog(torn).reason_codes, ["reasoning.log-torn-tail"]);

    const malformed = resolve(directory, "malformed.jsonl");
    writeFileSync(malformed, "not-json\n");
    assert.deepEqual(verifyReasoningStateLog(malformed).reason_codes, ["reasoning.log-json-invalid"]);

    const noncanonical = resolve(directory, "noncanonical.jsonl");
    writeFileSync(noncanonical, "{ \"record_kind\": \"other\", \"value\": {} }\n");
    assert.deepEqual(verifyReasoningStateLog(noncanonical).reason_codes, ["reasoning.log-record-noncanonical"]);

    const unknown = resolve(directory, "unknown.jsonl");
    writeFileSync(unknown, '{"record_kind":"other","value":{"authority_effect":"none","ledger_id":"reasoning:unknown"}}\n');
    assert.deepEqual(verifyReasoningStateLog(unknown).reason_codes, ["reasoning.log-record-kind-unknown"]);

    const leftPath = resolve(directory, "left.jsonl");
    const rightPath = resolve(directory, "right.jsonl");
    const left = createReasoningStateLedger({ledger_id: "reasoning:left", sink: createAppendOnlyFileReasoningStateSink({path: leftPath})});
    const right = createReasoningStateLedger({ledger_id: "reasoning:right", sink: createAppendOnlyFileReasoningStateSink({path: rightPath})});
    left.append({event_kind: "fact", content: {side: "left"}});
    right.append({event_kind: "fact", content: {side: "right"}});
    left.close();
    right.close();
    const mixed = resolve(directory, "mixed.jsonl");
    writeFileSync(mixed, `${readFileSync(leftPath, "utf8")}${readFileSync(rightPath, "utf8")}`);
    assert.equal(verifyReasoningStateLog(mixed).reason_codes.includes("reasoning.log-ledger-id-mismatch"), true);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("tampering and an uncheckpointed crash tail block recovery without truncation", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-tail-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const sink = createAppendOnlyFileReasoningStateSink({path});
    const ledger = createReasoningStateLedger({ledger_id: "reasoning:tail", sink});
    const event = ledger.append({event_kind: "request-interpreted", content: {request_id: "tail:1"}});
    const epoch = ledger.seal({event_digests: [event.event.event_digest]});
    ledger.checkpoint({checkpoint_kind: "manual", epoch: epoch.value});
    ledger.append({event_kind: "uncommitted", content: {request_id: "tail:2"}});
    ledger.close();
    const before = readFileSync(path);
    assert.deepEqual(recoverReasoningStateLedger({path, ledger_id: "reasoning:tail"}).reason_codes, ["reasoning.log-uncheckpointed-tail"]);
    assert.deepEqual(readFileSync(path), before);

    const lines = readFileSync(path, "utf8").trimEnd().split("\n").map(JSON.parse);
    lines[0].value.content.request_id = "tampered";
    writeFileSync(path, `${lines.map(JSON.stringify).join("\n")}\n`);
    assert.equal(verifyReasoningStateLog(path).reason_codes.includes("reasoning.log-event-invalid"), true);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("blank records and bytes appended after a checkpoint remain visible blockers", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-visible-tail-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const sink = createAppendOnlyFileReasoningStateSink({path});
    const ledger = createReasoningStateLedger({ledger_id: "reasoning:visible", sink});
    const event = ledger.append({event_kind: "request-interpreted", content: {request_id: "visible:1"}});
    const epoch = ledger.seal({event_digests: [event.event.event_digest]});
    ledger.checkpoint({checkpoint_kind: "manual", epoch: epoch.value});
    ledger.close();
    appendFileSync(path, "\n");
    assert.deepEqual(verifyReasoningStateLog(path).reason_codes, ["reasoning.log-blank-record"]);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("a completed reasoning frontier seals one exact epoch and after-completion checkpoint", () => {
  const ledger = createReasoningStateLedger({ledger_id: "reasoning:frontier"});
  const input = {
    frontier_key: "codex-turn:thread-1:turn-1",
    subject_digest: "completion:1",
    consumer_ref: "codex:human-chat",
    request_ref: "turn:turn-1",
    context_envelope_digest: "context:1",
    prior_reasoning_epoch_digest: "epoch:request:1",
    state: {kind: "codex-turn-completion", semantic: {disposition: "not-applicable"}, continuation: {directive_kind: "complete"}},
  };
  const sealed = sealReasoningStateFrontier(ledger, input);
  assert.equal(sealed.ok, true);
  assert.equal(sealed.checkpoint.checkpoint_kind, "after-turn-completion");
  assert.equal(sealed.checkpoint.subject_digest, input.subject_digest);
  assert.equal(verifyReasoningStateFrontier(sealed.frontier).ok, true);
  assert.equal(getReasoningStateFrontier(ledger, input.frontier_key).frontier.frontier_digest, sealed.frontier.frontier_digest);
  assert.equal(listReasoningStateFrontiers(ledger).length, 1);
  const duplicate = ledger.sealFrontier(input);
  assert.equal(duplicate.disposition, "duplicate");
  assert.equal(ledger.inspect().frontier_count, 1);
  const conflict = ledger.sealFrontier({...input, state: {kind: "changed"}});
  assert.deepEqual(conflict.reason_codes, ["reasoning.frontier-idempotency-conflict"]);
});

test("checkpointed completion frontiers recover exactly and rebuild their disposable index", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-frontier-recovery-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const ledger = createReasoningStateLedger({ledger_id: "reasoning:frontier-recover", sink: createAppendOnlyFileReasoningStateSink({path})});
    const sealed = ledger.sealFrontier({
      frontier_key: "codex-turn:thread-r:turn-r",
      subject_digest: "completion:r",
      consumer_ref: "codex:human-chat",
      request_ref: "turn:turn-r",
      state: {kind: "codex-turn-completion", semantic: {evaluator_calls: 0}, continuation: {directive_kind: "gate"}},
    });
    ledger.close();
    const verified = verifyReasoningStateLog(path, {expected_ledger_id: "reasoning:frontier-recover"});
    assert.equal(verified.ok, true);
    assert.equal(verified.value.index.frontier_count, 1);
    assert.deepEqual(verified.value.index.frontier_digests, [sealed.frontier.frontier_digest]);
    const recovered = recoverReasoningStateLedger({path, ledger_id: "reasoning:frontier-recover"});
    assert.equal(recovered.ok, true);
    const restored = recovered.ledger.getFrontier("codex-turn:thread-r:turn-r");
    assert.equal(restored.disposition, "found");
    assert.deepEqual(restored.frontier, sealed.frontier);
    assert.deepEqual(recovered.ledger.replay(restored.epoch).value.events, [restored.event]);
    recovered.ledger.close();
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("a frontier event without its exact completion checkpoint is not recoverable", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-reasoning-frontier-incomplete-"));
  const path = resolve(directory, "reasoning.jsonl");
  try {
    const ledger = createReasoningStateLedger({ledger_id: "reasoning:frontier-incomplete", sink: createAppendOnlyFileReasoningStateSink({path})});
    const appended = ledger.append({
      event_kind: "reasoning-frontier-sealed",
      content: {
        schema_version: "are.reasoning-state-frontier/v1",
        ledger_id: "reasoning:frontier-incomplete",
        frontier_key: "codex-turn:thread-i:turn-i",
        subject_digest: "completion:i",
        consumer_ref: null,
        request_ref: null,
        context_envelope_digest: null,
        prior_reasoning_epoch_digest: null,
        state: {kind: "incomplete"},
        authority_effect: "none",
        frontier_id: "invalid",
        frontier_digest: "invalid",
      },
    });
    const epoch = ledger.seal({event_digests: [appended.event.event_digest]});
    ledger.checkpoint({checkpoint_kind: "manual", epoch: epoch.value});
    ledger.close();
    const before = readFileSync(path);
    assert.equal(verifyReasoningStateLog(path).reason_codes.includes("reasoning.log-frontier-invalid"), true);
    assert.equal(recoverReasoningStateLedger({path, ledger_id: "reasoning:frontier-incomplete"}).ok, false);
    assert.deepEqual(readFileSync(path), before);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
