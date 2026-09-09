#!/usr/bin/env node
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {appendFileSync, createReadStream, readFileSync} from "node:fs";
import {createInterface} from "node:readline";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {createDecisionEngine, digest} from "./engine.mjs";
import {TurnEvidenceLedger} from "./turn-evidence-ledger.mjs";
import {selectTestFixture} from "./test-fixture.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const observationCandidates = [
  "codex-app-server-protocol-observation.v1.json",
  "codex-app-server-protocol-observation.windows-0.151.json",
].map((name) => JSON.parse(readFileSync(resolve(packageRoot, "evidence", name), "utf8")));

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const upstream = argument("--upstream", process.env.CODEX_BINARY ?? "codex");
const receiptPath = argument("--receipt", process.env.ARE_CODEX_RECEIPT_PATH ?? null);
const allowProtocolDrift = process.argv.includes("--allow-protocol-drift");
const engine = createDecisionEngine();
const evidenceLedger = new TurnEvidenceLedger();
let sequence = 0;

function fileSha256(path) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolvePromise(hash.digest("hex")));
  });
}

let actualUpstreamSha256 = null;
try { actualUpstreamSha256 = await fileSha256(upstream); } catch (error) {
  if (!allowProtocolDrift) throw new Error(`ARE_CODEX_UPSTREAM_BINARY_UNREADABLE:${upstream}:${error.message}`);
}
const testFixture = selectTestFixture(process.env.ARE_CODEX_TEST_FIXTURE, upstream, actualUpstreamSha256);
const observation = testFixture ?? observationCandidates.find(
  (candidate) => candidate.observed_binary_sha256 === actualUpstreamSha256,
) ?? observationCandidates[0];
if (!allowProtocolDrift && actualUpstreamSha256 !== observation.observed_binary_sha256) {
  throw new Error(`ARE_CODEX_PROTOCOL_DRIFT:${actualUpstreamSha256}:${observationCandidates.map((candidate) => candidate.observed_binary_sha256).join(",")}`);
}
const approvalMethods = new Set(observation.observed_surfaces.server_requests.filter((method) => method.endsWith("/requestApproval")));

function writeJson(stream, message) {
  stream.write(`${JSON.stringify(message)}\n`);
}

function record(kind, fields = {}) {
  const entry = {
    schema_version: "are.codex-wrapper-event/v1",
    sequence: ++sequence,
    observed_at: new Date().toISOString(),
    kind,
    ...fields,
  };
  entry.event_digest = digest(entry);
  if (receiptPath) appendFileSync(receiptPath, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

function notify(method, params) {
  writeJson(process.stdout, {method, params, emittedAtMs: Date.now()});
}

function key(id) {
  return JSON.stringify(id);
}

const javascriptUpstream = /\.(?:mjs|js|cjs)$/.test(upstream);
const child = javascriptUpstream
  ? spawn(process.execPath, [upstream, "app-server"], {stdio: ["pipe", "pipe", "inherit"]})
  : spawn(upstream, ["app-server"], {stdio: ["pipe", "pipe", "inherit"]});
const pendingApprovals = new Map();
const pendingTurnRequests = new Map();
const continuationByTurn = new Map();
const unboundContinuationByThread = new Map();
const pendingContinuationGates = new Map();
const internalTurnRequests = new Set();
let internalTurnSequence = 0;

record("proxy.started", {upstream, protocol_observation_id: testFixture ? null : observation.observation_id, test_fixture_id: testFixture?.observation_id ?? null, evidence_mode: testFixture ? "synthetic-fixture" : "runtime", actual_upstream_sha256: actualUpstreamSha256, decision_profile_digest: engine.profileDigest});

const clientInput = createInterface({input: process.stdin, crlfDelay: Infinity});
clientInput.on("line", (line) => {
  let message;
  try { message = JSON.parse(line); } catch {
    record("client.invalid-json");
    return;
  }

  if (message.method === "are/continuation/resolve" && Object.hasOwn(message, "id")) {
    const params = message.params ?? {};
    const pending = pendingContinuationGates.get(params.threadId);
    const candidate = pending?.assessed?.proposal(params.optionId, params.proposalDigest) ?? null;
    const exactDecision = pending?.assessed?.decision?.decision_digest === params.decisionDigest;
    if (!pending || !exactDecision || !candidate) {
      const reasonCodes = [
        !pending ? "continuation.pending-gate-required" : null,
        pending && !exactDecision ? "continuation.decision-digest-mismatch" : null,
        pending && exactDecision && !candidate ? "continuation.proposal-binding-mismatch" : null,
      ].filter(Boolean);
      writeJson(process.stdout, {id: message.id, error: {code: -32074, message: "ARE_CONTINUATION_BINDING_REJECTED", data: {reason_codes: reasonCodes}}});
      record("continuation.binding-rejected", {thread_id: params.threadId ?? null, reason_codes: reasonCodes});
      return;
    }
    if (params.decision !== "accept") {
      pendingContinuationGates.delete(params.threadId);
      const bindingDigest = digest({decision_digest: params.decisionDigest, option_id: params.optionId, proposal_digest: params.proposalDigest, decision: "decline"});
      record("continuation.human-declined", {thread_id: params.threadId, option_id: params.optionId, proposal_digest: params.proposalDigest, binding_digest: bindingDigest});
      writeJson(process.stdout, {id: message.id, result: {status: "declined", bindingDigest}});
      return;
    }
    if (!candidate.binding.has_next_turn) {
      writeJson(process.stdout, {id: message.id, error: {code: -32075, message: "ARE_CONTINUATION_NEXT_TURN_REQUIRED", data: {reason_codes: ["continuation.next-turn-required"]}}});
      record("continuation.binding-rejected", {thread_id: params.threadId, reason_codes: ["continuation.next-turn-required"]});
      return;
    }
    const bindingDigest = digest({decision_digest: params.decisionDigest, option_id: params.optionId, proposal_digest: params.proposalDigest, decision: "accept"});
    const internalId = `are-human-continuation-${++internalTurnSequence}`;
    const declaredNext = structuredClone(candidate.proposal.next_turn);
    const existingContext = declaredNext?._are?.requestContext ?? {};
    declaredNext._are = {
      ...(declaredNext._are ?? {}),
      requestContext: {
        ...existingContext,
        evidence_refs: [...new Set([...(existingContext.evidence_refs ?? []), `human-decision:${bindingDigest}`])],
      },
    };
    const nextMessage = {id: internalId, method: "turn/start", params: {...declaredNext, threadId: params.threadId}};
    const evaluated = engine.preflight(nextMessage);
    record("continuation.human-bound", {thread_id: params.threadId, option_id: params.optionId, proposal_digest: params.proposalDigest, binding_digest: bindingDigest, preflight_decision_digest: evaluated.decision.decision_digest});
    record("preflight.decision", {
      request_id: internalId,
      thread_id: params.threadId,
      request_context_digest: evaluated.decision.request_context_digest,
      decision_profile_digest: evaluated.decision.decision_profile_digest,
      decision_digest: evaluated.decision.decision_digest,
      directive_kind: evaluated.decision.kind,
      selected_route: evaluated.decision.selected?.route_id ?? null,
      reason_codes: evaluated.decision.reason_codes,
    });
    notify("are/preflight/completed", evaluated.decision);
    if (!evaluated.forwarded) {
      writeJson(process.stdout, {id: message.id, error: {code: -32076, message: "ARE_CONTINUATION_PREFLIGHT_REJECTED", data: evaluated.decision}});
      record("continuation.turn-not-forwarded", {request_id: internalId, thread_id: params.threadId, directive_kind: evaluated.decision.kind});
      return;
    }
    pendingContinuationGates.delete(params.threadId);
    internalTurnRequests.add(key(internalId));
    pendingTurnRequests.set(key(internalId), {threadId: params.threadId, requestId: internalId, requestContextDigest: evaluated.decision.request_context_digest, continuation: evaluated.continuation, preflightDecisionDigest: evaluated.decision.decision_digest});
    record("continuation.turn-forwarded", {request_id: internalId, thread_id: params.threadId, predecessor_turn_id: pending.turnId, preflight_decision_digest: evaluated.decision.decision_digest, human_binding_digest: bindingDigest});
    writeJson(child.stdin, evaluated.forwarded);
    writeJson(process.stdout, {id: message.id, result: {status: "accepted", bindingDigest, requestId: internalId}});
    return;
  }

  if (message.method === "turn/start" && Object.hasOwn(message, "id")) {
    const evaluated = engine.preflight(message);
    record("preflight.decision", {
      request_id: message.id,
      thread_id: message.params?.threadId ?? null,
      request_context_digest: evaluated.decision.request_context_digest,
      decision_profile_digest: evaluated.decision.decision_profile_digest,
      decision_digest: evaluated.decision.decision_digest,
      directive_kind: evaluated.decision.kind,
      selected_route: evaluated.decision.selected?.route_id ?? null,
      reason_codes: evaluated.decision.reason_codes,
    });
    notify("are/preflight/completed", evaluated.decision);
    if (!evaluated.forwarded) {
      record("turn.not-forwarded", {request_id: message.id, directive_kind: evaluated.decision.kind});
      writeJson(process.stdout, {
        id: message.id,
        error: {code: -32071, message: `ARE_${evaluated.decision.kind.toUpperCase()}`, data: evaluated.decision},
      });
      return;
    }
    pendingTurnRequests.set(key(message.id), {
      threadId: message.params.threadId,
      requestId: message.id,
      requestContextDigest: evaluated.decision.request_context_digest,
      continuation: evaluated.continuation,
      preflightDecisionDigest: evaluated.decision.decision_digest,
    });
    record("turn.forwarded", {request_id: message.id, thread_id: message.params.threadId, preflight_decision_digest: evaluated.decision.decision_digest});
    writeJson(child.stdin, evaluated.forwarded);
    return;
  }

  if (Object.hasOwn(message, "id") && !message.method && pendingApprovals.has(key(message.id))) {
    const pending = pendingApprovals.get(key(message.id));
    pendingApprovals.delete(key(message.id));
    const permissionDecision = message?._are?.permissionDecision ?? null;
    const binding = engine.bindApproval(pending.request, message, pending.decision, permissionDecision);
    const bindingEvent = record("effect.approval-bound", {
      rpc_id: message.id,
      thread_id: pending.request.params?.threadId ?? null,
      turn_id: pending.request.params?.turnId ?? null,
      item_id: pending.request.params?.itemId ?? null,
      effect_decision_digest: pending.decision.decision_digest,
      decision_profile_digest: pending.decision.decision_profile_digest,
      permission_decision_digest: permissionDecision?.decision_digest ?? null,
      binding_digest: binding.decision_digest,
      binding_kind: binding.kind,
    });
    evidenceLedger.append(pending.request.params?.turnId, bindingEvent);
    notify("are/effect/approvalBound", binding);
    const outbound = structuredClone(message);
    delete outbound._are;
    if (binding.kind !== "human-bound" && outbound.result) {
      if (pending.request.method === "item/permissions/requestApproval") {
        delete outbound.result;
        outbound.error = {code: -32073, message: "ARE_PERMISSION_POLICY_DENIED"};
      } else outbound.result = {decision: "decline"};
    }
    writeJson(child.stdin, outbound);
    return;
  }

  writeJson(child.stdin, message);
});
clientInput.on("close", () => child.stdin.end());

createInterface({input: child.stdout, crlfDelay: Infinity}).on("line", (line) => {
  let message;
  try { message = JSON.parse(line); } catch {
    process.stdout.write(`${line}\n`);
    return;
  }

  if (approvalMethods.has(message.method) && Object.hasOwn(message, "id")) {
    const decision = engine.effect(message);
    const effectEvent = record("effect.decision", {
      rpc_id: message.id,
      method: message.method,
      thread_id: message.params?.threadId ?? null,
      turn_id: message.params?.turnId ?? null,
      item_id: message.params?.itemId ?? null,
      effect_digest: decision.effect_digest,
      decision_digest: decision.decision_digest,
      decision_profile_digest: decision.decision_profile_digest,
      directive_kind: decision.kind,
      reason_codes: decision.reason_codes,
    });
    evidenceLedger.append(message.params?.turnId, effectEvent);
    notify("are/effect/decision", decision);
    if (decision.kind === "block") {
      writeJson(child.stdin, {
        id: message.id,
        error: {code: -32072, message: "ARE_EFFECT_BLOCK", data: decision},
      });
      record("effect.not-forwarded", {rpc_id: message.id, decision_digest: decision.decision_digest});
      return;
    }
    pendingApprovals.set(key(message.id), {request: message, decision});
    writeJson(process.stdout, message);
    return;
  }

  if (message.method === "turn/started") {
    const threadId = message.params?.threadId;
    const turnId = message.params?.turn?.id;
    const unbound = unboundContinuationByThread.get(threadId);
    if (turnId && unbound) continuationByTurn.set(turnId, unbound);
    else if (turnId && !continuationByTurn.has(turnId)) continuationByTurn.set(turnId, {continuation: {}});
    unboundContinuationByThread.delete(threadId);
    const startedEvent = record("turn.started", {thread_id: threadId ?? null, turn_id: turnId ?? null});
    const bound = continuationByTurn.get(turnId) ?? {continuation: {}};
    evidenceLedger.begin({
      threadId,
      turnId,
      requestId: bound.requestId ?? null,
      requestContextDigest: bound.requestContextDigest ?? null,
      preflightDecisionDigest: bound.preflightDecisionDigest ?? null,
      decisionProfileDigest: engine.profileDigest,
      declared: bound.continuation,
      event: startedEvent,
    });
  }

  if (Object.hasOwn(message, "id") && pendingTurnRequests.has(key(message.id)) && message.result) {
    const pending = pendingTurnRequests.get(key(message.id));
    pendingTurnRequests.delete(key(message.id));
    const turnId = message.result?.turn?.id;
    const bound = {...pending};
    if (turnId) continuationByTurn.set(turnId, bound);
    else unboundContinuationByThread.set(pending.threadId, bound);
  }

  if (Object.hasOwn(message, "id") && internalTurnRequests.has(key(message.id))) {
    internalTurnRequests.delete(key(message.id));
    record("continuation.turn-response", {request_id: message.id, turn_id: message.result?.turn?.id ?? null, error: message.error?.message ?? null});
    notify("are/continuation/turnResponse", {request_id: message.id, result: message.result ?? null, error: message.error ?? null});
    return;
  }

  if (message.method === "item/started" || message.method === "item/completed" || message.method === "hook/started" || message.method === "hook/completed") {
    const observedEvent = record(message.method, {
      thread_id: message.params?.threadId ?? null,
      turn_id: message.params?.turnId ?? null,
      item_id: message.params?.item?.id ?? null,
    });
    evidenceLedger.observe(message, observedEvent);
  }

  if (message.method === "turn/completed") {
    const threadId = message.params?.threadId;
    const turnId = message.params?.turn?.id;
    const completedEvent = record("turn.completed", {
      thread_id: message.params?.threadId ?? null,
      turn_id: turnId ?? null,
      status: message.params?.turn?.status ?? null,
    });
    const evidence = evidenceLedger.finalize(message, completedEvent);
    const assessed = engine.continuation(message, evidence.declared, evidence);
    continuationByTurn.delete(turnId);
    record("continuation.decision", {
      thread_id: message.params?.threadId ?? null,
      turn_id: turnId ?? null,
      completion_digest: assessed.decision.completion_digest,
      decision_profile_digest: assessed.decision.decision_profile_digest,
      decision_digest: assessed.decision.decision_digest,
      directive_kind: assessed.decision.kind,
      selected_option_id: assessed.decision.selected_option_id,
      source_lanes: assessed.source_lanes,
      reason_codes: assessed.decision.reason_codes,
    });
    record("turn.receipt-manifest", {
      thread_id: threadId ?? null,
      turn_id: turnId ?? null,
      request_context_digest: evidence.manifest?.request_context_digest ?? null,
      decision_profile_digest: evidence.manifest?.decision_profile_digest ?? null,
      preflight_decision_digest: evidence.manifest?.preflight_decision_digest ?? null,
      continuation_decision_digest: assessed.decision.decision_digest,
      manifest_digest: evidence.manifest?.manifest_digest ?? null,
      evidence_valid: evidence.valid,
      reason_codes: evidence.reason_codes,
    });
    pendingContinuationGates.delete(threadId);
    if (assessed.decision.kind === "gate") pendingContinuationGates.set(threadId, {turnId, assessed});
    notify("are/continuation/completed", {...assessed.decision, source_lanes: assessed.source_lanes, proposal_bindings: assessed.proposal_bindings, plan_evidence_status: assessed.plan_evidence_status, evidence_manifest: assessed.evidence_manifest});
    if (assessed.decision.kind === "direct" && assessed.selected_plan?.next_turn) {
      const internalId = `are-continuation-${++internalTurnSequence}`;
      const nextMessage = {
        id: internalId,
        method: "turn/start",
        params: {...assessed.selected_plan.next_turn, threadId: message.params.threadId},
      };
      const evaluated = engine.preflight(nextMessage);
      record("preflight.decision", {
        request_id: internalId,
        thread_id: message.params.threadId,
        request_context_digest: evaluated.decision.request_context_digest,
        decision_profile_digest: evaluated.decision.decision_profile_digest,
        decision_digest: evaluated.decision.decision_digest,
        directive_kind: evaluated.decision.kind,
        selected_route: evaluated.decision.selected?.route_id ?? null,
        reason_codes: evaluated.decision.reason_codes,
      });
      notify("are/preflight/completed", evaluated.decision);
      if (evaluated.forwarded) {
        internalTurnRequests.add(key(internalId));
        pendingTurnRequests.set(key(internalId), {
          threadId: message.params.threadId,
          requestId: internalId,
          requestContextDigest: evaluated.decision.request_context_digest,
          continuation: evaluated.continuation,
          preflightDecisionDigest: evaluated.decision.decision_digest,
        });
        record("continuation.turn-forwarded", {request_id: internalId, thread_id: message.params.threadId, predecessor_turn_id: turnId, preflight_decision_digest: evaluated.decision.decision_digest});
        writeJson(child.stdin, evaluated.forwarded);
      } else {
        record("continuation.turn-not-forwarded", {request_id: internalId, thread_id: message.params.threadId, predecessor_turn_id: turnId, directive_kind: evaluated.decision.kind});
      }
    }
  }

  writeJson(process.stdout, message);
});

child.on("exit", (code, signal) => {
  record("proxy.stopped", {upstream_exit_code: code, upstream_signal: signal});
  process.exitCode = code ?? (signal ? 1 : 0);
});
child.on("error", (error) => {
  record("proxy.upstream-error", {error: error.message});
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
