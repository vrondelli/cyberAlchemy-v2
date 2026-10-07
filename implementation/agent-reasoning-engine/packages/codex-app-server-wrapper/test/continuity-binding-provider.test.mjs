import assert from "node:assert/strict";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {
  createContinuityBindingProvider,
  materializeContinuityBindingSnapshot,
  resolveContinuityBindingProvider,
  validateContinuityBindingSnapshot,
} from "../index.mjs";

const binding = (overrides = {}) => ({
  selector: {consumer_ref: "codex:human-chat"},
  active_cycle: "engine-improvement",
  relationship_by_transition: {continue: "same-cycle-continuation", refine: "same-cycle-refinement", interrupt: "temporary-interruption", replace: "sibling-cycle-handoff"},
  response_language: "en",
  next_action: "Run the bounded gateway canary.",
  clarification_needed: false,
  evidence_status: "pending",
  high_risk_transitions: ["continue", "refine", "interrupt", "replace"],
  ...overrides,
});
const snapshot = (bindings = [binding()]) => materializeContinuityBindingSnapshot({snapshot_id: "continuity-provider-test", revision: 1, bindings});
const input = (transition, threadId = "thread-1") => ({message: {params: {threadId}}, turn_binding: {consumer_ref: "codex:human-chat"}, objective_resolution: {transition, resolution_digest: "a".repeat(64)}});

test("provider deterministically classifies high-risk and low-risk transitions", async () => {
  const provider = createContinuityBindingProvider(snapshot());
  assert.deepEqual(await provider(input("new")), {high_risk: false});
  assert.deepEqual(await provider(input("refine")), {high_risk: true, active_cycle: "engine-improvement", relationship_code: "same-cycle-refinement", response_language: "en", next_action: "Run the bounded gateway canary.", clarification_needed: false, evidence_status: "pending"});
  assert.equal(provider.inspect().receipt_count, 2);
  assert.equal(provider.inspect().receipts[0].disposition, "low-risk-bypass");
  assert.equal(provider.inspect().receipts[1].disposition, "high-risk-binding");
});

test("exact thread selector overrides consumer default", async () => {
  const provider = createContinuityBindingProvider(snapshot([binding(), binding({selector: {consumer_ref: "codex:human-chat", thread_id: "special"}, active_cycle: "benchmark-research"})]));
  assert.equal((await provider(input("continue", "special"))).active_cycle, "benchmark-research");
  assert.equal((await provider(input("continue", "ordinary"))).active_cycle, "engine-improvement");
});

test("provider fails closed when no engine-owned selector exists", async () => {
  const provider = createContinuityBindingProvider(snapshot());
  await assert.rejects(provider({message: {params: {threadId: "thread"}}, turn_binding: {consumer_ref: "unknown"}, objective_resolution: {transition: "continue", resolution_digest: "a".repeat(64)}}), /selector-unresolved/);
});

test("snapshot validation detects digest tampering and duplicate selectors", () => {
  const tampered = structuredClone(snapshot());
  tampered.bindings[0].active_cycle = "tampered";
  assert.ok(validateContinuityBindingSnapshot(tampered).reason_codes.includes("continuity-provider.snapshot-digest-mismatch"));
  assert.throws(() => snapshot([binding(), binding()]), /selector-duplicate/);
});

test("entrypoint resolver requires an exact snapshot only when renderer is enabled", () => {
  assert.equal(resolveContinuityBindingProvider({loaded_profile: {continuity_renderer: {enabled: false}}}).disposition, "disabled");
  assert.deepEqual(resolveContinuityBindingProvider({loaded_profile: {continuity_renderer: {enabled: true}}}).reason_codes, ["continuity-provider.state-path-required"]);
  const directory = mkdtempSync("/tmp/continuity-provider-test-");
  try {
    const path = resolve(directory, "state.json");
    writeFileSync(path, `${JSON.stringify(snapshot())}\n`);
    const resolved = resolveContinuityBindingProvider({loaded_profile: {continuity_renderer: {enabled: true}}, state_path: path});
    assert.equal(resolved.ok, true);
    assert.equal(typeof resolved.provider, "function");
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
