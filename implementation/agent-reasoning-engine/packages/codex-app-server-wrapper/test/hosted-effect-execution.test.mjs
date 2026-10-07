import assert from "node:assert/strict";
import {resolve} from "node:path";
import test from "node:test";

import {digestValue} from "../src/canonical.mjs";
import {bindApprovalResponse} from "../src/effect-boundary.mjs";
import {createGatewayHostedEffectCommandDispatcher, createHostedEffectCommandExecutor, prepareHostedCommandExecution} from "../src/hosted-effect-execution.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");
const effectId = `hosted-effect:${"a".repeat(64)}`;
const request = {thread_id: "thread-owned", turn_id: "turn-owned", effect_id: effectId,
  kind: "command", proposal: {command: ["node", "--version"], cwd: repositoryRoot}};
const directive = {schema_version: "are.codex-effect-directive/v1",
  directive_kind: "gate", method: "item/commandExecution/requestApproval",
  rpc_id: effectId, thread_id: request.thread_id, turn_id: request.turn_id,
  item_id: effectId, effect_digest: "effect-digest", decision_digest: "decision-digest",
  owner_gate_refs: ["owner"], authority_effect: "none"};
const approvalBinding = bindApprovalResponse({pending: directive,
  response: {jsonrpc: "2.0", id: effectId, result: {decision: "accept"}}}).binding;
const intent = {schema_version: "are.hosted-effect-intent/v1", effect_id: effectId,
  proposal_digest: digestValue(request), engine_decision_digest: directive.decision_digest,
  approval_binding_digest: approvalBinding.binding_digest, request, status: "intent",
  authority_effect: "none"};
const input = {request, directive, intent, approval_binding: approvalBinding,
  repository_root: repositoryRoot};

test("command dispatch is bound to the exact request, directive, approval and intent",
  {skip: process.platform === "win32"}, () => {
  const prepared = prepareHostedCommandExecution(input);
  assert.equal(prepared.ok, true);
  assert.equal(prepared.host_method, "command/exec");
  assert.deepEqual(prepared.params.command, ["node", "--version"]);
  assert.equal(prepared.params.sandboxPolicy.networkAccess, false);
  assert.deepEqual(prepared.params.sandboxPolicy.writableRoots, [repositoryRoot]);
  assert.equal(prepared.intent_digest, digestValue(intent));
});

test("changed proposal, directive, approval or intent cannot form a host command", () => {
  for (const changed of [
    {...input, request: {...request, proposal: {command: ["node", "--help"]}}},
    {...input, directive: {...directive, directive_kind: "block"}},
    {...input, directive: {...directive, turn_id: "another-turn"}},
    {...input, approval_binding: {...approvalBinding, binding_digest: "forged"}},
    {...input, approval_binding: {...approvalBinding, decision: "decline"}},
    {...input, intent: {...intent, status: "complete"}},
    {...input, intent: {...intent, approval_binding_digest: "other"}},
    {...input, request: {...request, proposal: {command: ["node", "--version"], cwd: "/"}}},
  ]) assert.equal(prepareHostedCommandExecution(changed).ok, false);
});

test("executor rechecks durable intent and active turn immediately before dispatch",
  {skip: process.platform === "win32"}, async () => {
  let recorded = intent;
  let active = true;
  const dispatched = [];
  const execute = createHostedEffectCommandExecutor({journal: {get: async () => recorded},
    is_active_turn: async () => active, repository_root: repositoryRoot,
    dispatch: async ({prepared}) => { dispatched.push(prepared); return {ok: true, exit_code: 0}; }});
  assert.equal((await execute(input)).ok, true);
  assert.equal(dispatched.length, 1);
  assert.deepEqual((await execute(input)).reason_codes, ["hosted-effect.execution-already-dispatched"]);
  active = false;
  const later = createHostedEffectCommandExecutor({journal: {get: async () => recorded},
    is_active_turn: async () => active, repository_root: repositoryRoot,
    dispatch: async ({prepared}) => { dispatched.push(prepared); return {ok: true}; }});
  assert.deepEqual((await later(input)).reason_codes, ["hosted-effect.execution-turn-not-active"]);
  assert.equal(dispatched.length, 1);
  active = true;
  recorded = {...intent, proposal_digest: "other"};
  assert.deepEqual((await later(input)).reason_codes, ["hosted-effect.execution-intent-not-durable"]);
  assert.equal(dispatched.length, 1);
});

test("gateway dispatcher uses the effect identity as its stable key",
  {skip: process.platform === "win32"}, async () => {
  const calls = [];
  const dispatch = createGatewayHostedEffectCommandDispatcher({rpc_client: {
    request: async (...args) => { calls.push(args); return {ok: true,
      effect_id: effectId, exit_code: 0}; },
  }});
  const prepared = prepareHostedCommandExecution(input);
  assert.equal((await dispatch({prepared, envelope: input})).ok, true);
  assert.equal(calls[0][0], "cyberalchemy/hostedEffect/execute");
  assert.equal(calls[0][2].idempotency_key, effectId);
  assert.equal(calls[0][1].intent, intent);
});

test("native Windows refuses an approved hosted command before gateway dispatch",
  {skip: process.platform !== "win32"}, async () => {
    assert.deepEqual(prepareHostedCommandExecution(input).reason_codes,
      ["hosted-effect.windows-sandbox-unverified"]);
    let called = false;
    const execute = createHostedEffectCommandExecutor({journal: {get: async () => intent},
      is_active_turn: async () => true, repository_root: repositoryRoot,
      dispatch: async () => { called = true; return {ok: true, exit_code: 0}; }});
    assert.deepEqual((await execute(input)).reason_codes,
      ["hosted-effect.windows-sandbox-unverified"]);
    assert.equal(called, false);
  });

test("native Windows command preparation requires a same-root gateway proof",
  {skip: process.platform !== "win32"}, () => {
    assert.deepEqual(prepareHostedCommandExecution({...input,
      windows_backend_sandbox_attested: true,
      windows_backend_sandbox_root: "C:\\wrong-root"}).reason_codes,
    ["hosted-effect.windows-sandbox-unverified"]);
    const prepared = prepareHostedCommandExecution({...input,
      windows_backend_sandbox_attested: true,
      windows_backend_sandbox_root: repositoryRoot});
    assert.deepEqual(prepared.reason_codes,
      ["hosted-effect.windows-output-bound-unavailable"]);
  });
