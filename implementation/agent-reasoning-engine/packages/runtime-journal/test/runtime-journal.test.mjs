import assert from "node:assert/strict";
import test from "node:test";

import {
  appendRuntimeEvent,
  createInMemoryRuntimeJournal,
  cutRuntimeJournal,
  evictClosedJournalSegments,
  replayRuntimeJournal,
  verifyRuntimeJournalCut,
} from "../index.mjs";

function event(kind, turn = "turn-1", extra = {}) {
  return {event_kind: kind, thread_id: "thread-1", turn_id: turn, observed_at: null, ...extra};
}

test("append creates an immutable hash chain and deterministic cut", () => {
  const journal = createInMemoryRuntimeJournal({journal_id: "journal:test"});
  const first = appendRuntimeEvent(journal, event("turn-started", "turn-1", {idempotency_key: "start:1"}));
  const second = appendRuntimeEvent(journal, event("turn-completed-observed", "turn-1", {idempotency_key: "complete:1"}));
  assert.equal(first.ok, true);
  assert.equal(second.event.predecessor_digest, first.event.event_digest);
  assert.equal(Object.isFrozen(second.event), true);
  const left = cutRuntimeJournal(journal, {thread_id: "thread-1", turn_id: "turn-1"});
  const right = cutRuntimeJournal(journal, {thread_id: "thread-1", turn_id: "turn-1"});
  assert.equal(left.digest, right.digest);
  assert.equal(verifyRuntimeJournalCut(left.value).ok, true);
});

test("same idempotency key and content deduplicates while changed content conflicts", () => {
  const journal = createInMemoryRuntimeJournal();
  const input = event("turn-started", "turn-1", {idempotency_key: "same"});
  const first = journal.append(input);
  const duplicate = journal.append(input);
  const conflict = journal.append({...input, message_digest: "changed"});
  assert.equal(first.disposition, "appended");
  assert.equal(duplicate.disposition, "duplicate");
  assert.equal(duplicate.event.event_digest, first.event.event_digest);
  assert.deepEqual(conflict.reason_codes, ["journal.idempotency-conflict"]);
  assert.equal(journal.inspect().event_count, 1);
});

test("cut verification detects event, ordering, and cut substitution", () => {
  const journal = createInMemoryRuntimeJournal();
  journal.append(event("turn-started", "turn-1", {idempotency_key: "one"}));
  journal.append(event("turn-completed-observed", "turn-1", {idempotency_key: "two"}));
  const cut = journal.cut({thread_id: "thread-1"}).value;
  assert.equal(verifyRuntimeJournalCut({...cut, cut_digest: "0".repeat(64)}).ok, false);
  const reversed = structuredClone(cut);
  reversed.events.reverse();
  assert.equal(verifyRuntimeJournalCut(reversed).ok, false);
  const changed = structuredClone(cut);
  changed.events[0].content.event_kind = "tampered";
  assert.equal(verifyRuntimeJournalCut(changed).ok, false);
});

test("replay is deterministic and performs zero external calls", () => {
  const journal = createInMemoryRuntimeJournal();
  for (const [index, kind] of ["turn-completed-observed", "semantic-evaluation-completed", "reasoning-receipt-constraints-derived", "continuation-decision", "successor-started", "turn-closed"].entries()) {
    journal.append(event(kind, "turn-1", {idempotency_key: `event:${index}`}));
  }
  const cut = journal.cut({turn_id: "turn-1"}).value;
  const first = replayRuntimeJournal(cut);
  const second = replayRuntimeJournal(cut);
  assert.deepEqual(first, second);
  assert.equal(first.value.semantic_evaluation_count, 1);
  assert.equal(first.value.continuation_decision_count, 1);
  assert.equal(first.value.successor_started_count, 1);
  assert.equal(first.value.external_calls, 0);
});

test("cuts exclude unrelated turns and can stop at an exact sequence", () => {
  const journal = createInMemoryRuntimeJournal();
  journal.append(event("turn-started", "turn-1", {idempotency_key: "a"}));
  const boundary = journal.append(event("turn-completed-observed", "turn-1", {idempotency_key: "b"})).event.sequence;
  journal.append(event("turn-started", "turn-2", {idempotency_key: "c"}));
  journal.append(event("semantic-evaluation-completed", "turn-1", {idempotency_key: "d"}));
  const cut = journal.cut({thread_id: "thread-1", turn_id: "turn-1", up_to_sequence: boundary}).value;
  assert.deepEqual(cut.events.map((item) => item.event_kind), ["turn-started", "turn-completed-observed"]);
});

test("eviction removes only oldest closed turns and preserves active turns", () => {
  const journal = createInMemoryRuntimeJournal({max_events: 3, max_closed_turns: 1});
  journal.append(event("turn-started", "turn-1", {idempotency_key: "1a"}));
  journal.append(event("turn-closed", "turn-1", {idempotency_key: "1b"}));
  journal.append(event("turn-started", "turn-2", {idempotency_key: "2a"}));
  journal.append(event("turn-closed", "turn-2", {idempotency_key: "2b"}));
  journal.append(event("turn-started", "turn-active", {idempotency_key: "3a"}));
  const evicted = evictClosedJournalSegments(journal);
  assert.equal(evicted.disposition, "evicted");
  assert.deepEqual(evicted.receipt.evicted_turn_keys, ["thread-1:turn-1"]);
  assert.equal(journal.snapshot().some((item) => item.turn_id === "turn-active"), true);
  assert.equal(journal.snapshot().some((item) => item.turn_id === "turn-1"), false);
});

test("eviction is explicit and unchanged when within bounds", () => {
  const journal = createInMemoryRuntimeJournal({max_events: 10, max_closed_turns: 10});
  journal.append(event("turn-started", "turn-active", {idempotency_key: "active"}));
  const result = journal.evict();
  assert.equal(result.disposition, "unchanged");
  assert.equal(result.receipt.evicted_event_digests.length, 0);
});

test("invalid inputs and cross-content idempotency fail closed", () => {
  const journal = createInMemoryRuntimeJournal();
  assert.equal(journal.append(null).ok, false);
  assert.equal(journal.append({event_kind: ""}).ok, false);
  assert.equal(journal.cut(null).ok, false);
});
