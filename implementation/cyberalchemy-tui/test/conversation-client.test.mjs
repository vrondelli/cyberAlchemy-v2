import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {createConversationRuntime} from "../../agent-reasoning-engine/packages/conversation-runtime/index.mjs";
import {createConversationClient} from "../src/conversation-client.mjs";

function ids() {
  let sequence = 0;
  return (kind) => `${kind}-${++sequence}`;
}

test("the TUI client projects one ARE conversation into one transcript", async () => {
  const runtime = createConversationRuntime({idFactory: ids(), now: () => "2026-09-04T00:00:00.000Z", turnHandler: async () => ({assistant_text: "I kept this inside the same conversation."})});
  const client = createConversationClient({service: runtime});
  client.open("primary-chat");
  const result = await client.submit("Research this and then revise the plan.");
  assert.equal(result.ok, true);
  assert.deepEqual(client.snapshot().transcript, [
    {role: "human", text: "Research this and then revise the plan."},
    {role: "agent", text: "I kept this inside the same conversation."},
  ]);
  assert.equal(client.snapshot().phase, "ready");
  assert.equal(client.snapshot().conversationId, "primary-chat");
});

test("the TUI renders but does not validate an ARE-owned decision gate", async () => {
  const subject = "f".repeat(64);
  const runtime = createConversationRuntime({
    idFactory: ids(),
    turnHandler: async () => ({assistant_text: "A decision is required.", decision_gate: {gate_id: "review", kind: "proposal-approval", subject_digest: subject, allowed_decisions: ["reject"]}}),
  });
  const client = createConversationClient({service: runtime});
  client.open("primary-chat");
  await client.submit("Prepare the candidate.");
  assert.equal(client.snapshot().phase, "waiting-human");
  assert.equal(client.snapshot().pendingDecision.subject_digest, subject);
  const rejected = await client.decide("reject");
  assert.equal(rejected.ok, true);
  assert.equal(client.snapshot().pendingDecision, null);
  assert.equal(client.snapshot().phase, "ready");
});

test("the TUI conversation client imports only the public ARE conversation package", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../src/conversation-client.mjs"), "utf8");
  assert.match(source, /packages\/conversation-runtime\/index\.mjs/u);
  assert.doesNotMatch(source, /request-intent-runtime|request-decision-router|coding-agent-runtime|define-cli/u);
});

