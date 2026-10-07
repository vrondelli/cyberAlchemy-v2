import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyGatewayTurnLifecycle,
  createCodexGatewayBackendAdapter,
  createJsonLineProcessBackendAdapter,
  inspectGatewayBackendLifecycle,
  validateGatewayBackendAdapter,
  validateGatewayBackendLifecycle,
} from "../../codex-app-server-wrapper/index.mjs";
import {createDshGatewayBackendAdapter} from "../index.mjs";

test("Codex and headless DSH declare distinct session history owners without claiming stock-client ingress", () => {
  const codex = inspectGatewayBackendLifecycle(createCodexGatewayBackendAdapter());
  const dsh = inspectGatewayBackendLifecycle(createDshGatewayBackendAdapter());
  assert.equal(codex.ok, true);
  assert.equal(dsh.ok, true);
  assert.deepEqual([codex.value.session_kind, codex.value.history_source],
    ["native-host-thread", "native-host-history"]);
  assert.deepEqual([dsh.value.session_kind, dsh.value.history_source],
    ["adapter-replay-thread", "adapter-replay-history"]);
  assert.equal(codex.value.client_ingress, "unverified");
  assert.equal(dsh.value.client_ingress, "unverified");
  assert.equal(codex.value.turn_acceptance, "rpc-in-progress");
  assert.equal(dsh.value.turn_terminal, "turn/completed");
});

test("unknown and contradictory adapter lifecycle declarations fail closed", () => {
  const unbound = createJsonLineProcessBackendAdapter({adapter_id: "fixture/v1", command: "fixture"});
  assert.deepEqual(inspectGatewayBackendLifecycle(unbound).reason_codes,
    ["backend-lifecycle.undeclared"]);
  const valid = createDshGatewayBackendAdapter().lifecycle_contract;
  assert.deepEqual(validateGatewayBackendLifecycle({...valid,
    history_source: "native-host-history"}).reason_codes,
  ["backend-lifecycle.history-owner-invalid"]);
  assert.deepEqual(validateGatewayBackendLifecycle({...valid,
    client_ingress: "stock-dsh-web-proven"}).reason_codes,
  ["backend-lifecycle.client-ingress-unverified"]);
  const invalid = createJsonLineProcessBackendAdapter({adapter_id: "fixture/v1", command: "fixture",
    lifecycle_contract: {...valid, extra_claim: true}});
  assert.deepEqual(validateGatewayBackendAdapter(invalid).reason_codes,
    ["backend-adapter.lifecycle-contract-invalid"]);
});

test("turn-start acknowledgement is never classified as terminal completion", () => {
  const contract = createDshGatewayBackendAdapter().lifecycle_contract;
  const binding = {request_id: 12, thread_id: "dsh-thread-1"};
  const accepted = classifyGatewayTurnLifecycle(contract,
    {id: 12, result: {turn: {id: "dsh-turn-1", status: "inProgress"}}}, binding);
  assert.deepEqual(accepted, {kind: "accepted", turn_id: "dsh-turn-1", authority_effect: "none"});
  assert.equal(classifyGatewayTurnLifecycle(contract,
    {method: "turn/started", params: {threadId: "dsh-thread-1", turn: {id: "dsh-turn-1"}}},
    {...binding, turn_id: "dsh-turn-1"}).kind, "unrelated");
  assert.equal(classifyGatewayTurnLifecycle(contract,
    {id: 12, result: {turn: {id: "dsh-turn-1", status: "completed"}}}, binding).kind,
  "rejected");
  assert.equal(classifyGatewayTurnLifecycle(contract,
    {method: "turn/completed", params: {threadId: "other-thread", turn: {id: "dsh-turn-1", status: "completed"}}},
    {...binding, turn_id: "dsh-turn-1"}).kind, "unrelated");
  assert.deepEqual(classifyGatewayTurnLifecycle(contract,
    {method: "turn/completed", params: {threadId: "dsh-thread-1",
      turn: {id: "dsh-turn-1", status: "failed"}}}, {...binding, turn_id: "dsh-turn-1"}),
  {kind: "terminal", turn_id: "dsh-turn-1", status: "failed", authority_effect: "none"});
});
