import assert from "node:assert/strict";
import test from "node:test";

import {projectGatewayDecisionObservation, projectWrapperDecisionTrace} from "../src/decision-observation.mjs";

test("decision trace projects only bounded, content-free gateway backend facts", () => {
  const now = Date.now();
  const decisions = projectWrapperDecisionTrace([{decision_type: "effect-evaluation", outcome: "gate", thread_id: "private-thread", decision_digest: "a".repeat(64), evidence_event_digest: "b".repeat(64), event_sequence: 9, observed_at_unix_ms: now, reason_codes: ["effect.owner-approval-required"], private_prompt: "secret"}]);
  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].outcome, "gate");
  assert.match(decisions[0].thread_ref, /^backend-thread:[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(decisions).includes("private-thread"));
  assert.ok(!JSON.stringify(decisions).includes("secret"));
  assert.deepEqual(projectWrapperDecisionTrace(decisions), decisions, "The stored hashed projection can be replayed without a raw thread id.");
  assert.equal(projectWrapperDecisionTrace([{...decisions[0], thread_id: "different-thread"}]).length, 0);
  const observation = projectGatewayDecisionObservation({runtime_epoch_id: "epoch:test", observed_at_unix_ms: now, sessions: [{consumer_id: "private-consumer", decisions}]});
  assert.equal(observation.decision_count, 1);
  assert.equal(observation.scope, "gateway-backend-decisions-not-durable-host-history");
  assert.ok(!JSON.stringify(observation).includes("private-consumer"));
  assert.equal(observation.decisions[0].reason_codes[0], "effect.owner-approval-required");
});

test("decision trace is bounded and declines malformed source facts", () => {
  const now = Date.now();
  const decisions = projectWrapperDecisionTrace(Array.from({length: 140}, (_, index) => ({decision_type: "turn-preflight", outcome: "direct", thread_id: `thread-${index}`, decision_digest: "a".repeat(64), evidence_event_digest: "b".repeat(64), event_sequence: index + 1, observed_at_unix_ms: now, reason_codes: []})));
  assert.equal(decisions.length, 128);
  const observation = projectGatewayDecisionObservation({runtime_epoch_id: "epoch:test", observed_at_unix_ms: now, sessions: [{consumer_id: "consumer", decisions}]});
  assert.equal(observation.decision_count, 128);
  assert.equal(observation.decisions.length, 32);
  assert.equal(observation.truncated, true);
  assert.deepEqual(projectWrapperDecisionTrace([{decision_type: "turn-preflight", outcome: "direct", thread_id: "thread-private", decision_digest: "a".repeat(64), evidence_event_digest: "b".repeat(64), event_sequence: 1, observed_at_unix_ms: now, reason_codes: ["safe.code", "raw private reason text"]}])[0].reason_codes, ["safe.code"]);
  assert.throws(() => projectGatewayDecisionObservation({runtime_epoch_id: "epoch:test", observed_at_unix_ms: now, sessions: [{consumer_id: "consumer", decisions: [{...decisions[0], reason_codes: ["not safe text"]}]}]}));
});
