import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";

import {loadRepositoryProfile} from "../src/config.mjs";
import {createAreHostedEffectAssessor, createGatewayHostedEffectAssessor, createHostedEffectApprovalAdapter, createHostedEffectBroker, createHostedEffectDynamicToolHandler} from "../src/hosted-effect-broker.mjs";
import {digestValue} from "../src/canonical.mjs";
import {createFileHostedEffectJournal} from "../src/hosted-effect-journal.mjs";
import {createApprovalBroker} from "../src/windows-client-host.mjs";
import {createCodexAppServerWrapper} from "../src/wrapper.mjs";

const packageRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const request = {thread_id: "thread-owned", turn_id: "turn-owned", effect_id: "effect-one",
  kind: "command", proposal: {executable_id: "bounded-tool", args: ["--check"], cwd: repositoryRoot}};

function fixture({approvalDecision = "accept", failOutcome = false, failIntent = false,
  assessmentKind = "gate", activeAfterApproval = true,
  throwExecute = false, invalidExecute = false} = {}) {
  const records = new Map();
  const order = [];
  const journal = {
    get: async id => records.get(id) ?? null,
    unsettled: async () => [...records.values()].filter(entry => entry.status === "intent")
      .map(entry => entry.effect_id),
    append: async entry => {
      order.push(entry.status === "intent" ? "intent" : "outcome");
      if (entry.status === "intent" && failIntent) return {ok: false};
      if (entry.status === "complete" && failOutcome) return {ok: false};
      records.set(entry.effect_id, entry);
      return {ok: true};
    },
  };
  let executions = 0;
  const broker = createHostedEffectBroker({journal,
    is_active_turn: async () => activeAfterApproval,
    assess: async candidate => {
      order.push("assess");
      return {ok: true, value: {method: "item/commandExecution/requestApproval",
        rpc_id: candidate.effect_id, thread_id: candidate.thread_id,
        turn_id: candidate.turn_id, item_id: candidate.effect_id,
        directive_kind: assessmentKind, effect_digest: "effect-digest",
        decision_digest: "decision-digest", owner_gate_refs: ["owner"],
        authority_effect: "none"}};
    },
    approve: async prompt => {
      order.push("approve");
      return {decision: approvalDecision, proposal_digest: prompt.proposal_digest};
    },
    execute: async () => {
      executions += 1;
      order.push("execute");
      if (throwExecute) throw new Error("host response lost after dispatch");
      if (invalidExecute) return {uncertain: true};
      return {ok: true, exit_code: 0};
    }});
  return {broker, records, order, executions: () => executions};
}

test("hosted effect requires an ARE directive, exact one-use approval and durable intent before execution", async () => {
  const state = fixture();
  const result = await state.broker.requestEffect(request);
  assert.equal(result.ok, true);
  assert.equal(result.execution.exit_code, 0);
  assert.deepEqual(state.order, ["assess", "approve", "intent", "execute", "outcome"]);
  assert.equal(state.records.get(request.effect_id).status, "complete");
  assert.equal(state.executions(), 1);
  assert.deepEqual(await state.broker.requestEffect(request), result);
  assert.equal(state.executions(), 1);
  const conflict = await state.broker.requestEffect({...request, proposal: {args: ["--different"]}});
  assert.deepEqual(conflict.reason_codes, ["hosted-effect.effect-id-conflict"]);
});

test("blocked, declined and non-durable intents cannot execute", async () => {
  for (const [options, reason] of [
    [{assessmentKind: "block"}, "hosted-effect.assessment-blocked"],
    [{approvalDecision: "decline"}, "hosted-effect.declined"],
    [{activeAfterApproval: false}, "hosted-effect.turn-not-active"],
    [{failIntent: true}, "hosted-effect.intent-not-durable"],
  ]) {
    const state = fixture(options);
    const result = await state.broker.requestEffect(request);
    assert.deepEqual(result.reason_codes, [reason]);
    assert.equal(state.executions(), 0);
  }
});

test("a lost outcome latches the broker and an intent without outcome is never replayed", async () => {
  const state = fixture({failOutcome: true});
  assert.deepEqual((await state.broker.requestEffect(request)).reason_codes,
    ["hosted-effect.outcome-not-durable"]);
  assert.equal(state.executions(), 1);
  assert.equal(state.broker.inspect().outcome_unknown, true);
  assert.deepEqual((await state.broker.requestEffect({...request, effect_id: "effect-two"})).reason_codes,
    ["hosted-effect.outcome-unknown"]);
  assert.equal(state.executions(), 1);
  const restarted = createHostedEffectBroker({journal: {get: async () => state.records.get(request.effect_id),
    unsettled: async () => [request.effect_id],
    append: async () => { throw new Error("must not append"); }},
    is_active_turn: async () => false,
    assess: async () => { throw new Error("must not assess"); },
    approve: async () => { throw new Error("must not approve"); },
    execute: async () => { throw new Error("must not execute"); }});
  assert.deepEqual((await restarted.requestEffect(request)).reason_codes,
    ["hosted-effect.outcome-unknown"]);
  assert.deepEqual((await restarted.requestEffect({...request, effect_id: "effect-new"})).reason_codes,
    ["hosted-effect.outcome-unknown"]);
});

test("abrupt death after durable intent never reexecutes that effect after journal recovery", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "are-hosted-effect-crash-"));
  const source = `const {createHostedEffectBroker} = await import(process.argv[1]);
    const {createFileHostedEffectJournal} = await import(process.argv[2]);
    const journal = createFileHostedEffectJournal({state_dir: process.argv[3]});
    const request = JSON.parse(process.argv[4]);
    const broker = createHostedEffectBroker({journal,
      is_active_turn: async () => true,
      assess: async candidate => ({ok: true, value: {
        method: "item/commandExecution/requestApproval", rpc_id: candidate.effect_id,
        thread_id: candidate.thread_id, turn_id: candidate.turn_id,
        item_id: candidate.effect_id, directive_kind: "gate",
        effect_digest: "effect-digest", decision_digest: "decision-digest",
        owner_gate_refs: ["owner"], authority_effect: "none"}}),
      approve: async prompt => ({decision: "accept", proposal_digest: prompt.proposal_digest}),
      execute: async () => {process.stdout.write("intent-durable\\n");
        setInterval(() => {}, 1000); return new Promise(() => {});}});
    await broker.requestEffect(request);`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", source,
    new URL("../src/hosted-effect-broker.mjs", import.meta.url).href,
    new URL("../src/hosted-effect-journal.mjs", import.meta.url).href,
    stateDir, JSON.stringify(request)], {stdio: ["ignore", "pipe", "pipe"]});
  try {
    await new Promise((done, fail) => {
      const timer = setTimeout(() => fail(new Error("crash fixture did not durably record intent")), 10000);
      child.stdout.once("data", bytes => {
        clearTimeout(timer);
        if (String(bytes).includes("intent-durable")) done();
        else fail(new Error("crash fixture reported unexpected output"));
      });
      child.once("exit", code => { clearTimeout(timer); fail(new Error(`crash fixture exited early: ${code}`)); });
    });
    assert.equal(child.exitCode, null);
    const closed = once(child, "close");
    child.kill("SIGKILL");
    await closed;
    const journal = createFileHostedEffectJournal({state_dir: stateDir});
    try {
      assert.deepEqual(await journal.unsettled(), [request.effect_id]);
      let assessed = 0;
      let executed = 0;
      const recovered = createHostedEffectBroker({journal,
        is_active_turn: async () => true,
        assess: async () => { assessed += 1; throw new Error("must not assess"); },
        approve: async () => { throw new Error("must not approve"); },
        execute: async () => { executed += 1; throw new Error("must not execute"); }});
      assert.deepEqual((await recovered.requestEffect(request)).reason_codes,
        ["hosted-effect.outcome-unknown"]);
      assert.deepEqual((await recovered.requestEffect({...request, effect_id: "effect-new"})).reason_codes,
        ["hosted-effect.outcome-unknown"]);
      assert.equal(assessed, 0);
      assert.equal(executed, 0);
    } finally { journal.close(); }
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    rmSync(stateDir, {recursive: true, force: true});
  }
});

test("executor transport faults and malformed responses leave durable intent unsettled", async () => {
  for (const options of [{throwExecute: true}, {invalidExecute: true}]) {
    const state = fixture(options);
    const result = await state.broker.requestEffect(request);
    assert.deepEqual(result.reason_codes, ["hosted-effect.outcome-unknown"]);
    assert.equal(state.records.get(request.effect_id).status, "intent");
    assert.equal(state.broker.inspect().outcome_unknown, true);
    assert.equal(state.executions(), 1);
    assert.deepEqual((await state.broker.requestEffect(request)).reason_codes,
      ["hosted-effect.outcome-unknown"]);
    assert.equal(state.executions(), 1);
    assert.deepEqual(state.order, ["assess", "approve", "intent", "execute"]);
  }
});

test("real ARE assessment gates an exact hosted command proposal", () => {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  const assess = createAreHostedEffectAssessor({decision_profile: loaded.decision_profile,
    metadata_provider: () => ({route_id: "CA2-ROUTE-IMPLEMENT",
      effect_classes: ["unknown-command-effect"], reversible: false,
      owner_gate_ref: "Owner of the exact effect"})});
  const result = assess(request);
  assert.equal(result.ok, true);
  assert.equal(result.value.directive_kind, "gate");
  assert.equal(result.value.thread_id, request.thread_id);
  assert.equal(result.value.item_id, request.effect_id);
  assert.equal(result.value.authority_effect, "none");
});

test("gateway assessor sends only the exact hosted request and rejects a mismatched receipt", async () => {
  const observed = [];
  let mismatch = false;
  const assess = createGatewayHostedEffectAssessor({rpc_client: {request: async (method, params) => {
    observed.push({method, params});
    return {schema_version: "are.hosted-effect-assessment/v1", ok: true,
      request_digest: mismatch ? "wrong" : digestValue(request),
      value: {directive_kind: "gate"}, authority_effect: "none"};
  }}});
  assert.equal((await assess(request)).ok, true);
  assert.deepEqual(observed[0], {method: "cyberalchemy/hostedEffect/assess",
    params: {threadId: request.thread_id, turnId: request.turn_id,
      effectId: request.effect_id, kind: request.kind, proposal: request.proposal}});
  mismatch = true;
  assert.deepEqual((await assess(request)).reason_codes, ["hosted-effect.gateway-assessment-invalid"]);
  assert.deepEqual((await assess({...request, route_id: "CA2-ROUTE-IMPLEMENT"})).reason_codes,
    ["hosted-effect.request-invalid"]);
  assert.equal(observed.length, 2);
});

test("hosted effect approval uses the one-use browser broker with exact identity", async () => {
  const calls = [];
  const approve = createHostedEffectApprovalAdapter({approval_broker: {request: async message => {
    calls.push(message);
    return {decision: "accept"};
  }}});
  const directive = {method: "item/commandExecution/requestApproval", rpc_id: request.effect_id,
    thread_id: request.thread_id, turn_id: request.turn_id, item_id: request.effect_id,
    directive_kind: "gate", decision_digest: "decision", owner_gate_refs: ["owner"]};
  const proposalDigest = digestValue(request);
  assert.deepEqual(await approve({request, proposal_digest: proposalDigest, directive}),
    {decision: "accept", proposal_digest: proposalDigest});
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, request.effect_id);
  assert.equal(calls[0].params.approvalSource, "are-hosted-effect");
  assert.deepEqual(calls[0].params.proposal, request.proposal);
  assert.deepEqual(await approve({request, proposal_digest: proposalDigest,
    directive: {...directive, turn_id: "wrong"}}),
  {decision: "decline", proposal_digest: proposalDigest});
  assert.equal(calls.length, 1);
});

test("real hosted approval broker consumes an exact effect decision once", async () => {
  const approvalBroker = createApprovalBroker({timeout_ms: 1000});
  try {
    const approve = createHostedEffectApprovalAdapter({approval_broker: approvalBroker});
    const proposalDigest = digestValue(request);
    const pending = approve({request, proposal_digest: proposalDigest,
      directive: {method: "item/commandExecution/requestApproval", rpc_id: request.effect_id,
        thread_id: request.thread_id, turn_id: request.turn_id, item_id: request.effect_id,
        directive_kind: "gate", decision_digest: "decision", owner_gate_refs: ["owner"]}});
    assert.equal(approvalBroker.snapshot().length, 1);
    assert.equal(approvalBroker.snapshot()[0].request_id, request.effect_id);
    assert.equal(approvalBroker.decide(request.effect_id, {decision: "accept"}).ok, true);
    assert.deepEqual(await pending, {decision: "accept", proposal_digest: proposalDigest});
    assert.equal(approvalBroker.snapshot().length, 0);
    assert.equal(approvalBroker.decide(request.effect_id, {decision: "accept"}).ok, false);
  } finally { approvalBroker.close(); }
});

test("host call joins bound ARE assessment, one-use approval and durable intent before a fixture effect", async () => {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true);
  const wrapper = createCodexAppServerWrapper({...loaded, loaded_profile: loaded.value,
    allow_hosted_effect_tool: true, require_bound_effect_route: true});
  const threadId = "joined-hosted-thread";
  const turnId = "joined-hosted-turn";
  const started = await wrapper.processClientMessage({jsonrpc: "2.0", id: 1,
    method: "turn/start", params: {threadId,
      input: [{type: "text", text: "Implement the bounded change."}]}});
  assert.equal(started.to_server.length, 1);
  await wrapper.processServerMessage({jsonrpc: "2.0", id: 1,
    result: {turn: {id: turnId, status: "inProgress"}}});
  const stateDir = mkdtempSync(join(tmpdir(), "are-hosted-joined-"));
  const journal = createFileHostedEffectJournal({state_dir: stateDir});
  const approvals = createApprovalBroker({timeout_ms: 1000});
  let executions = 0;
  try {
    const assess = createGatewayHostedEffectAssessor({rpc_client: {request: async (method, params) => {
      const action = await wrapper.processClientMessage({jsonrpc: "2.0", id: 2, method, params});
      assert.deepEqual(action.to_server, []);
      if (action.to_client[0].error) throw new Error(action.to_client[0].error.message);
      return action.to_client[0].result;
    }}});
    const isActiveTurn = async (thread, turn) => thread === threadId && turn === turnId;
    const broker = createHostedEffectBroker({assess, journal,
      approve: createHostedEffectApprovalAdapter({approval_broker: approvals}),
      is_active_turn: isActiveTurn,
      execute: async ({request: exact}) => {
        executions += 1;
        assert.equal(exact.thread_id, threadId);
        assert.equal((await journal.unsettled()).length, 1);
        return {ok: true, fixture: true};
      }});
    const handler = createHostedEffectDynamicToolHandler({broker, is_active_turn: isActiveTurn});
    const call = {jsonrpc: "2.0", id: "host-rpc", method: "item/tool/call", params: {
      threadId, turnId, callId: "joined-call", namespace: null, tool: "are_effect_request",
      arguments: {kind: "command", proposal: {command: ["pwd"]}}}};
    const pending = handler(call);
    for (let attempt = 0; approvals.snapshot().length === 0 && attempt < 50; attempt += 1) {
      await new Promise(resolveLater => setTimeout(resolveLater, 1));
    }
    assert.equal(approvals.snapshot().length, 1);
    const effectId = approvals.snapshot()[0].request_id;
    assert.equal(approvals.decide(effectId, {decision: "accept"}).ok, true);
    const result = await pending;
    assert.equal(result.success, true);
    assert.equal(JSON.parse(result.contentItems[0].text).execution.fixture, true);
    assert.equal(executions, 1);
    assert.deepEqual(await journal.unsettled(), []);
    assert.equal((await handler(call)).success, true);
    assert.equal(executions, 1);
  } finally {
    approvals.close();
    journal.close();
    rmSync(stateDir, {recursive: true, force: true});
  }
});

test("model input cannot supply metadata, unknown fields or malformed proposal", async () => {
  const state = fixture();
  for (const candidate of [
    {...request, effect_classes: ["read-only"]},
    {...request, proposal: null},
    {...request, effect_id: " spaced "},
    {...request, kind: "permissions"},
  ]) {
    assert.deepEqual((await state.broker.requestEffect(candidate)).reason_codes,
      ["hosted-effect.request-invalid"]);
  }
  assert.deepEqual(state.order, []);
});

test("different effect IDs cannot race through the same broker", async () => {
  let releaseApproval;
  const waiting = new Promise(resolveApproval => { releaseApproval = resolveApproval; });
  const broker = createHostedEffectBroker({
    journal: {get: async () => null, unsettled: async () => [], append: async () => ({ok: true})},
    is_active_turn: async () => true,
    assess: async candidate => ({ok: true, value: {method: "item/commandExecution/requestApproval",
      rpc_id: candidate.effect_id, thread_id: candidate.thread_id, turn_id: candidate.turn_id,
      item_id: candidate.effect_id, directive_kind: "gate", effect_digest: "effect",
      decision_digest: "decision", owner_gate_refs: ["owner"], authority_effect: "none"}}),
    approve: async prompt => { await waiting;
      return {decision: "accept", proposal_digest: prompt.proposal_digest}; },
    execute: async () => ({ok: true})});
  const first = broker.requestEffect(request);
  assert.deepEqual((await broker.requestEffect({...request, effect_id: "effect-other"})).reason_codes,
    ["hosted-effect.broker-busy"]);
  releaseApproval();
  assert.equal((await first).ok, true);
});

test("dynamic host call derives its effect identity and cannot bypass the active-turn check", async () => {
  const requests = [];
  let active = true;
  const handler = createHostedEffectDynamicToolHandler({
    broker: {requestEffect: async value => { requests.push(value); return {ok: true,
      schema_version: "are.hosted-effect-result/v1", execution: {ok: true, exit_code: 0}}; }},
    is_active_turn: async (threadId, turnId) => active && threadId === "thread-owned" && turnId === "turn-owned",
  });
  const call = {jsonrpc: "2.0", id: "rpc-1", method: "item/tool/call", params: {
    threadId: "thread-owned", turnId: "turn-owned", callId: "host-call-1", namespace: null,
    tool: "are_effect_request", arguments: {kind: "command", proposal: {command: ["pwd"]}}}};
  const result = await handler(call);
  assert.equal(result.success, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].effect_id.startsWith("hosted-effect:"), true);
  await handler(call);
  assert.equal(requests[0].effect_id, requests[1].effect_id);
  assert.deepEqual(requests[0].proposal, {command: ["pwd"]});
  active = false;
  const denied = await handler({...call, params: {...call.params, callId: "host-call-2"}});
  assert.equal(denied.success, false);
  assert.deepEqual(JSON.parse(denied.contentItems[0].text).reason_codes, ["hosted-effect.turn-not-active"]);
  assert.equal(requests.length, 2);
  const invalid = await handler({...call, params: {...call.params, tool: "foreign_tool"}});
  assert.equal(invalid.success, false);
  assert.equal(requests.length, 2);
});
