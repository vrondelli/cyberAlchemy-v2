import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_CONTEXT_KEY,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_NOTIFICATION,
  CONTINUITY_OWNER_DECISION_DIGEST,
  createCodexAppServerWrapper,
  loadRepositoryProfile,
  materializeContinuityProjection,
} from "../index.mjs";
import {semanticModulePort} from "./semantic-module-fixture.mjs";
import {renderDeterministicContinuity as renderRetainedCandidate} from "../../evolution-runtime/src/deterministic-continuity-renderer-v4.mjs";
import {LIVE_SCENARIOS_V4} from "../../evolution-runtime/test/fixtures/live-scenarios-v4.mjs";
import {renderDeterministicContinuity as renderIntegratedCandidate} from "../src/continuity-renderer.mjs";

const root = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(root, "../../../../..");
const loaded = loadRepositoryProfile(resolve(root, "profiles/repository-v1.json"), repositoryRoot);
assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));

const enabled = {
  enabled: true,
  mode: "context-and-notification",
  candidate_ref: CONTINUITY_CANDIDATE_REF,
  learning_package_digest: CONTINUITY_LEARNING_PACKAGE_DIGEST,
  owner_decision_digest: CONTINUITY_OWNER_DECISION_DIGEST,
};
const start = (id, text, threadId = "continuity-thread") => ({jsonrpc: "2.0", id, method: "turn/start", params: {threadId, input: [{type: "text", text}]}});

function wrapper(overrides = {}, continuity_renderer = enabled) {
  return createCodexAppServerWrapper({
    loaded_profile: {...loaded.value, objective_resolution: {enabled: true}, continuity_renderer},
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot,
    module_port: semanticModulePort(),
    ...overrides,
  });
}

test("disabled repository profile never calls the binding provider or emits continuity output", async () => {
  let calls = 0;
  const instance = wrapper({continuity_binding_provider: () => { calls += 1; }}, {enabled: false});
  const actions = await instance.processClientMessage(start(1, "Implement the reconnect handler."));
  assert.equal(actions.to_server.length, 1);
  assert.equal(actions.to_client.length, 0);
  assert.equal(actions.to_server[0].params.additionalContext[CONTINUITY_CONTEXT_KEY], undefined);
  assert.equal(calls, 0);
});

test("enabled construction integration rejects unclosed bindings", async () => {
  const instance = wrapper({continuity_binding_provider: () => ({
    high_risk: true,
    active_cycle: "engine-improvement",
    relationship_code: "same-cycle-continuation",
    response_language: "en",
    next_action: "Integrate the retained renderer behind the disabled boundary.",
    clarification_needed: false,
    evidence_status: "pending",
    model_authored_field: "forbidden",
  })});
  const actions = await instance.processClientMessage(start(1, "Implement the reconnect handler."));
  assert.equal(actions.to_server.length, 0);
  assert.deepEqual(actions.to_client[0].error.data.reason_codes, ["continuity.engine-binding-invalid"]);
});

test("enabled construction integration renders engine-owned state before model dispatch", async () => {
  const instance = wrapper({continuity_binding_provider: () => ({
    high_risk: true,
    active_cycle: "engine-improvement",
    relationship_code: "same-cycle-continuation",
    response_language: "en",
    next_action: "Integrate the retained renderer behind the disabled boundary.",
    clarification_needed: false,
    evidence_status: "pending",
  })});
  const actions = await instance.processClientMessage(start(2, "Implement the reconnect handler.", "continuity-accepted"));
  assert.equal(actions.to_server.length, 1, JSON.stringify(actions.to_client));
  assert.equal(actions.to_client.length, 1);
  assert.equal(actions.to_client[0].method, CONTINUITY_NOTIFICATION);
  const projection = JSON.parse(actions.to_server[0].params.additionalContext[CONTINUITY_CONTEXT_KEY].value);
  assert.equal(projection.active_objective, "Implement the reconnect handler.");
  assert.equal(projection.transition, "new");
  assert.equal(projection.learning_package_digest, CONTINUITY_LEARNING_PACKAGE_DIGEST);
  assert.equal(projection.owner_decision_digest, CONTINUITY_OWNER_DECISION_DIGEST);
  assert.equal(actions.to_client[0].params.projection_digest, projection.projection_digest);
  const events = instance.ledger.snapshot();
  const objectiveIndex = events.findIndex((event) => event.event_kind === "objective-transition-resolved");
  const continuityIndex = events.findIndex((event) => event.event_kind === "continuity-rendered");
  const dispatchIndex = events.findIndex((event) => event.event_kind === "turn-start-forwarded");
  assert.ok(objectiveIndex >= 0 && objectiveIndex < continuityIndex && continuityIndex < dispatchIndex);
});

test("low-risk engine classification bypasses rendering with no durable prose", async () => {
  const instance = wrapper({continuity_binding_provider: () => ({high_risk: false})});
  const actions = await instance.processClientMessage(start(3, "Implement a bounded parser.", "continuity-low-risk"));
  assert.equal(actions.to_server.length, 1);
  assert.equal(actions.to_client.length, 0);
  assert.equal(actions.to_server[0].params.additionalContext[CONTINUITY_CONTEXT_KEY], undefined);
  assert.equal(instance.ledger.snapshot().some((event) => event.event_kind === "continuity-rendered"), false);
});

test("enabled integration fails closed without an engine binding provider", async () => {
  const actions = await wrapper().processClientMessage(start(4, "Implement the exact adapter.", "continuity-missing"));
  assert.equal(actions.to_server.length, 0);
  assert.deepEqual(actions.to_client[0].error.data.reason_codes, ["continuity.engine-binding-provider-required"]);
});

test("configuration binds the exact retained package and owner decision", () => {
  const directory = mkdtempSync("/tmp/are-continuity-config-");
  try {
    const profile = JSON.parse(readFileSync(resolve(root, "profiles/repository-v1.json"), "utf8"));
    profile.objective_resolution = {enabled: true};
    profile.continuity_renderer = {...enabled, learning_package_digest: "0".repeat(64)};
    const path = resolve(directory, "profile.json");
    writeFileSync(path, JSON.stringify(profile));
    const result = loadRepositoryProfile(path, repositoryRoot);
    assert.equal(result.ok, false);
    assert.deepEqual(result.reason_codes, ["config.continuity-renderer-invalid"]);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("projection rejects a low-risk binding that smuggles high-risk fields", () => {
  const result = materializeContinuityProjection({
    configuration: enabled,
    resolution: {disposition: "resolved", transition: "new", resolution_digest: "a".repeat(64), next_state: {state_digest: "b".repeat(64), active_objective: {description: "Bounded objective"}}},
    engine_binding: {high_risk: false, active_cycle: "injected"},
  });
  assert.deepEqual(result.reason_codes, ["continuity.low-risk-binding-not-minimal"]);
});

test("integrated renderer preserves exact output parity for the retained 20-scenario cohort", () => {
  for (const scenario of LIVE_SCENARIOS_V4) {
    const input = {
      transition: scenario.expected_transition,
      active_objective: scenario.active_objective,
      active_cycle: scenario.active_cycle,
      relationship_code: scenario.relationship_code,
      response_language: scenario.response_language,
      next_action: scenario.next_pending_action,
      clarification_needed: scenario.clarification_expected,
      evidence_status: scenario.evidence_status,
    };
    assert.deepEqual(renderIntegratedCandidate(input), renderRetainedCandidate(input));
  }
});
