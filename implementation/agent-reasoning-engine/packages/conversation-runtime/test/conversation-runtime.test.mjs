import assert from "node:assert/strict";
import test from "node:test";

import {createConversationRuntime, verifyRecordDigest} from "../index.mjs";

function deterministicIds() {
  let value = 0;
  return (kind) => `${kind}-${++value}`;
}

test("one message crosses an ARE-owned conversation and emits an ordered transcript", async () => {
  const observed = [];
  const runtime = createConversationRuntime({
    idFactory: deterministicIds(),
    now: () => "2026-09-04T00:00:00.000Z",
    turnHandler: async (turn) => {
      observed.push(turn);
      return {assistant_text: "Let us define the product boundary first."};
    },
  });
  const opened = runtime.open({conversation_id: "conversation-one"});
  assert.equal(opened.ok, true);
  const result = await runtime.submitMessage({conversation_id: "conversation-one", text: "Build one chat for the agent."});
  assert.equal(result.ok, true);
  assert.equal(observed.length, 1);
  assert.equal(observed[0].intent_contract.authority_effect, "none");
  assert.deepEqual(result.value.messages.map(({role, text}) => ({role, text})), [
    {role: "human", text: "Build one chat for the agent."},
    {role: "agent", text: "Let us define the product boundary first."},
  ]);
  assert.deepEqual(result.value.events.map((event) => event.sequence), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(result.value.events.every((event) => verifyRecordDigest(event, "event_digest")), true);
  assert.equal(result.value.state, "ready");
});

test("successive turns retain one conversation and bind predecessor intent", async () => {
  const inputs = [];
  const runtime = createConversationRuntime({
    idFactory: deterministicIds(),
    now: () => "2026-09-04T00:00:00.000Z",
    compileIntent: async (input) => {
      inputs.push(input);
      const digest = inputs.length === 1 ? "a".repeat(64) : "b".repeat(64);
      return {ok: true, value: {contract: {intent_contract_digest: digest, disposition: "act", route_candidate: inputs.length === 1 ? "define" : "research", authority_effect: "none"}}};
    },
    turnHandler: async ({text}) => ({assistant_text: `Handled ${text}`}),
  });
  runtime.open({conversation_id: "same-chat"});
  await runtime.submitMessage({conversation_id: "same-chat", text: "Define the product."});
  await runtime.submitMessage({conversation_id: "same-chat", text: "Now research alternatives."});
  assert.equal(inputs[0].predecessor_contract_digest, null);
  assert.equal(inputs[1].predecessor_contract_digest, "a".repeat(64));
  const inspected = runtime.inspect({conversation_id: "same-chat"});
  assert.equal(inspected.value.messages.length, 4);
  assert.equal(inspected.value.current_intent_contract_digest, "b".repeat(64));
});

test("decision gates reject stale or undeclared decisions and accept one exact decision", async () => {
  const digest = "d".repeat(64);
  const runtime = createConversationRuntime({
    idFactory: deterministicIds(),
    now: () => "2026-09-04T00:00:00.000Z",
    turnHandler: async () => ({assistant_text: "Review required.", decision_gate: {gate_id: "gate-1", kind: "proposal-approval", subject_digest: digest, allowed_decisions: ["approve", "reject"]}}),
    decisionHandler: async ({decision}) => ({assistant_text: `Decision ${decision} recorded without implicit authority.`}),
  });
  runtime.open({conversation_id: "gated"});
  const waiting = await runtime.submitMessage({conversation_id: "gated", text: "Prepare a proposal."});
  assert.equal(waiting.value.state, "waiting-human");
  assert.equal((await runtime.submitDecision({conversation_id: "gated", gate_id: "gate-1", subject_digest: "0".repeat(64), decision: "approve"})).ok, false);
  assert.equal((await runtime.submitDecision({conversation_id: "gated", gate_id: "gate-1", subject_digest: digest, decision: "defer"})).ok, false);
  const accepted = await runtime.submitDecision({conversation_id: "gated", gate_id: "gate-1", subject_digest: digest, decision: "reject"});
  assert.equal(accepted.ok, true);
  assert.equal(accepted.value.pending_gate, null);
  assert.equal(accepted.value.state, "ready");
});

test("a conversation refuses concurrent turns and messages while a decision is pending", async () => {
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  const runtime = createConversationRuntime({idFactory: deterministicIds(), turnHandler: async () => held});
  runtime.open({conversation_id: "bounded"});
  const active = runtime.submitMessage({conversation_id: "bounded", text: "First"});
  assert.equal((await runtime.submitMessage({conversation_id: "bounded", text: "Second"})).ok, false);
  release({assistant_text: "Done"});
  await active;
});
