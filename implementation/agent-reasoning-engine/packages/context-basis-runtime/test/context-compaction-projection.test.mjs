import assert from "node:assert/strict";
import test from "node:test";

import {projectCompactionAwareContext, verifyCompactionProjection} from "../index.mjs";

function fixture() {
  return {
    source_epoch_id: "epoch:test",
    events: [
      {event_id: "request", sequence: 1, event_kind: "request-interpreted", retention_class: "pinned", content: {text: "Keep the correction visible."}},
      {event_id: "tool-start", sequence: 2, event_kind: "tool-started", tool_call_id: "tool-1", content: {name: "search"}},
      {event_id: "tool-result", sequence: 3, event_kind: "tool-completed", tool_call_id: "tool-1", content: {text: "noise".repeat(2000)}},
      {event_id: "counter", sequence: 4, event_kind: "counterevidence-recorded", content: {text: "The first answer was contradicted."}},
      {event_id: "current", sequence: 5, event_kind: "analysis-recorded", content: {text: "Current branch"}},
    ],
  };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

test("projection preserves pinned events, balances tool units, and is deterministic", () => {
  const input = fixture();
  const policy = {max_inline_bytes: 2800, recent_active_units: 1, preview_head_characters: 32, preview_tail_characters: 32};
  const first = projectCompactionAwareContext(input, policy);
  const second = projectCompactionAwareContext(structuredClone(input), policy);
  assert.equal(first.ok, true, first.reason_codes?.join(","));
  assert.equal(first.digest, second.digest);
  assert.deepEqual(first.value.projected_context.pinned_events.map((event) => event.event_id), ["request", "counter"]);
  assert.deepEqual(first.value.projected_context.folded_events.map((event) => event.tool_call_id), ["tool-1", "tool-1"]);
  assert.equal(first.value.source_retained, true);
  assert.equal(verifyCompactionProjection(first, input).ok, true);
});

test("pinned material is never truncated to satisfy the inline budget", () => {
  const result = projectCompactionAwareContext({
    source_epoch_id: "epoch:overflow",
    events: [{event_id: "mandatory", sequence: 1, event_kind: "constraint-recorded", content: {text: "x".repeat(4000)}}],
  }, {max_inline_bytes: 512});
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["context.mandatory-budget-exceeded"]);
});

test("older active tool units fold atomically when the budget tightens", () => {
  const result = projectCompactionAwareContext(fixture(), {max_inline_bytes: 1700, recent_active_units: 3, preview_head_characters: 0, preview_tail_characters: 0});
  assert.equal(result.ok, true, result.reason_codes?.join(","));
  const exactToolIds = result.value.projected_context.active_events.filter((event) => event.tool_call_id === "tool-1").map((event) => event.event_id);
  const foldedToolIds = result.value.projected_context.folded_events.filter((event) => event.tool_call_id === "tool-1").map((event) => event.event_id);
  assert.equal(exactToolIds.length === 0 || foldedToolIds.length === 0, true);
});

test("deeply frozen source bytes reuse the exact projection while mutable input is recomputed", () => {
  const policy = {max_inline_bytes: 2800, recent_active_units: 1};
  const frozen = deepFreeze(fixture());
  const first = projectCompactionAwareContext(frozen, policy);
  const second = projectCompactionAwareContext(frozen, policy);
  assert.equal(first, second);

  const mutable = fixture();
  const before = projectCompactionAwareContext(mutable, policy);
  mutable.events.at(-1).content.text = "changed current branch";
  const after = projectCompactionAwareContext(mutable, policy);
  assert.notEqual(before.digest, after.digest);
});

test("verification rejects fabricated projection bytes", () => {
  const input = fixture();
  const result = projectCompactionAwareContext(input, {max_inline_bytes: 2800, recent_active_units: 1});
  const tampered = structuredClone(result);
  tampered.value.projected_context.pinned_events[0].content.text = "fabricated";
  assert.equal(verifyCompactionProjection(tampered, input).ok, false);
  assert.equal(verifyCompactionProjection(tampered, input).reason_codes.includes("compaction.projection-digest-invalid"), true);
});
