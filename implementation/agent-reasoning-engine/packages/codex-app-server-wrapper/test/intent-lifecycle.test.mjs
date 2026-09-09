import assert from "node:assert/strict";
import test from "node:test";
import {addIntentLifecycleContext, INTENT_CONTEXT_KEY, prepareCodexIntentLifecycle} from "../index.mjs";

function start(id, text) { return {jsonrpc: "2.0", id, method: "turn/start", params: {threadId: "thread:intent", input: [{type: "text", text}]}}; }

test("intent lifecycle is a zero-call default no-op", async () => {
  let calls = 0;
  const value = await prepareCodexIntentLifecycle({message: start(1, "Explain it"), request_ref: "rpc:1", intent_provider: () => { calls += 1; }});
  assert.equal(value.disposition, "disabled");
  assert.equal(calls, 0);
});

test("opt-in lifecycle compiles and projects an inspectable contract", async () => {
  const value = await prepareCodexIntentLifecycle({configuration: {enabled: true, control_profile: {visibility: "inspect"}}, message: start(2, "For the homepage copywriting, start with a definition, then an example, then a deeper look."), request_ref: "rpc:2", context_envelope_digest: "context:2"});
  assert.equal(value.ok, true);
  assert.equal(value.intent_contract.construction_directives[0].posture, "structural");
  const message = addIntentLifecycleContext(start(2, "request"), value);
  const fragment = JSON.parse(message.params.additionalContext[INTENT_CONTEXT_KEY].value);
  assert.equal(fragment.intent_contract.intent_contract_digest, value.intent_contract.intent_contract_digest);
  assert.equal(fragment.authority_effect, "none");
});

test("an explicit next-turn correction creates a successor reflection", async () => {
  const first = await prepareCodexIntentLifecycle({configuration: {enabled: true}, message: start(3, "Put Knowledge Expansion Protocol in the button."), request_ref: "rpc:3"});
  const corrected = await prepareCodexIntentLifecycle({configuration: {enabled: true}, message: start(4, "Not in the button, in the text; make Knowledge Expansion Protocol part of the narrative."), request_ref: "rpc:4", previous_contract: first.intent_contract});
  assert.equal(corrected.disposition, "corrected");
  assert.equal(corrected.reflection.correction_kind, "wrong-referent");
  assert.equal(corrected.intent_contract.predecessor_contract_digest, first.intent_contract.intent_contract_digest);
});
