import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {loadVerifiedDecisionProfile} from "../../request-decision-router/index.mjs";
import {applyIntegratedCorrection, openPersistentCodingSession, prepareIntegratedContext} from "../integrated-context.mjs";
import {createAlchSemanticModulePort} from "../../module-port/alch-semantic-adapter.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");

function contextInput() {
  const contextPackage = resolve(packageRoot, "../context-basis-runtime");
  const catalog = JSON.parse(readFileSync(resolve(contextPackage, "test/fixtures/definition-catalog.json"), "utf8"));
  const snapshot = JSON.parse(readFileSync(resolve(contextPackage, "test/fixtures/ontology-snapshot.json"), "utf8"));
  const loaded = loadVerifiedDecisionProfile(resolve(packageRoot, "../request-decision-router/profiles/cyberalchemy-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true);
  return {
    request_context: {schema_version: "are.request-context/v1", request_id: "REQ-INTEGRATED", raw_request: "Research current context management approaches.", objective_kind: null, requested_effects: [], target_refs: [], constraints: [], evidence_refs: ["user"]},
    decision_profile: loaded.value,
    definition: {catalog, seed_definition_ids: ["RequestContext"], universal_relation_classes: ["requires"], route_relation_classes_by_route: {"CA2-ROUTE-RESEARCH": ["route-context"]}},
    ontology: {snapshot, initial_node_ids: ["Request"], required_edge_ids: [], omission_candidate_ids: ["Unrelated"]},
    authority_posture: "candidate-context-only",
    effect_posture: "non-effectful",
    view: {lane: "plan-bound", consumer_ref: "agent:test", window_ref: "window:test", purpose: "coding", source_epoch: "epoch:test", turn_id: "turn:test"},
    current_sources: [{source_identity: catalog.source_identity, source_digest: catalog.source_digest}, {source_identity: snapshot.source_identity, source_digest: snapshot.snapshot_digest}],
  };
}

test("context, intent, correction, and append-only recovery remain digest-bound", async () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-integrated-context-"));
  const logPath = resolve(directory, "state.jsonl");
  try {
    const opened = openPersistentCodingSession({log_path: logPath, ledger_id: "coding:test"});
    assert.equal(opened.ok, true);
    const prepared = await prepareIntegratedContext({session: opened.session, request: "Research current context management approaches.", request_ref: "request:1", context_input: contextInput(), module_port: createAlchSemanticModulePort()});
    assert.equal(prepared.ok, true, prepared.reason_codes?.join(","));
    const corrected = await applyIntegratedCorrection({
      session: opened.session,
      previous_contract: prepared.intent_compilation.value.contract,
      request: "You misunderstood; also must keep the result read only.",
      request_ref: "request:2",
      corrected_overrides: {objective: "Research while keeping the result read only"},
      reflection: {causal_analysis: ["omitted read-only constraint"]},
      disposition: {retention_scope: "current-interaction", user_selected: true},
    });
    assert.equal(corrected.ok, true, corrected.reason_codes?.join(","));
    assert.equal(corrected.improvement_signal_candidate, null);
    assert.equal(opened.session.close().ok, true);
    const recovered = openPersistentCodingSession({log_path: logPath, ledger_id: "coding:test"});
    assert.equal(recovered.ok, true, recovered.reason_codes?.join(","));
    assert.equal(recovered.session.inspect().event_count, 4);
    assert.equal(recovered.session.close().ok, true);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test("an uncheckpointed or concurrently locked session fails closed", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-integrated-lock-"));
  try {
    const path = resolve(directory, "state.jsonl");
    const first = openPersistentCodingSession({log_path: path, ledger_id: "coding:lock"});
    assert.equal(first.ok, true);
    const second = openPersistentCodingSession({log_path: path, ledger_id: "coding:lock"});
    assert.equal(second.ok, false);
    assert.equal(second.reason_codes.includes("reasoning.writer-lock-held"), true);
    first.session.close();
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
