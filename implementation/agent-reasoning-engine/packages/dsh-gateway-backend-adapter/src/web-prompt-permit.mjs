import {AsyncLocalStorage} from "node:async_hooks";
import {fork} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {fileURLToPath} from "node:url";

import {decide} from "../../../src/decision-cli.mjs";
import {digestValue} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {verifyRequirementSnapshot} from "../../request-intent-runtime/index.mjs";
import {verifyReasoningPlanContext} from "../../reasoning-state-runtime/plan-context.mjs";
import {projectDshPlanProgress, validDshPlanProgress} from '../../codex-app-server-wrapper/src/dsh-objective-checkpoint-observation.mjs';
import {composeDshPlannedModelContextBatch, reconstructDshPlannedModelContext} from "./web-model-context-batch.mjs";

const PREPARATION_SCHEMA = "are.dsh-web-prompt-preparation/v1";
const WORKER_SCHEMA = "are.dsh-web-preparation-worker/v1";
const DIGEST = /^[0-9a-f]{64}$/u;
const PREPARATION_KEYS = ["schema_version", "session_id", "request_id", "content_digest",
  "route_id", "route_receipt_digest", "context_result_digest", "context_envelope_digest",
  "model_context", "model_context_digest", "authority_effect"].sort().join(",");

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function nonempty(value) {
  return typeof value === "string" && value.trim() !== "";
}

function textContent(content) {
  if (!Array.isArray(content) || content.length === 0 || content.length > 64) return null;
  if (content.some((part) => !part || Object.keys(part).sort().join(",") !== "text,type"
    || part.type !== "text" || typeof part.text !== "string")) return null;
  if (content.every((part) => part.text.trim() === "")) return null;
  if (Buffer.byteLength(JSON.stringify(content)) > 256 * 1024) return null;
  return content.map((part) => ({type: "text", text: part.text}));
}

export function validPreparationFor(preparation, sessionId, requestId, content) {
  const owned = preparation?.schema_version === "are.dsh-web-prompt-preparation/v2";
  const progress = owned && Object.hasOwn(preparation, 'plan_progress');
  const keys = owned ? PREPARATION_KEYS.split(",").concat("objective_binding", ...(progress ? ['plan_progress'] : [])).sort().join(",")
    : PREPARATION_KEYS;
  if (!preparation || typeof preparation !== "object" || Array.isArray(preparation)
    || Object.keys(preparation).sort().join(",") !== keys
    || !owned && preparation.schema_version !== PREPARATION_SCHEMA
    || preparation.session_id !== sessionId || preparation.request_id !== requestId
    || preparation.content_digest !== digest(content)
    || !nonempty(preparation.route_id)
    || !["route_receipt_digest", "context_result_digest", "context_envelope_digest",
      "model_context_digest"].every((key) => DIGEST.test(preparation[key] ?? ""))
    || typeof preparation.model_context !== "string"
    || Buffer.byteLength(preparation.model_context) > 32 * 1024
    || preparation.model_context_digest !== digest(preparation.model_context)
    || preparation.authority_effect !== "none") return false;
  let context;
  try {
    context = JSON.parse(preparation.model_context);
    if (JSON.stringify(context) !== preparation.model_context) return false;
    if (owned && context.schema_version === 'are.dsh-web-model-context/v3') context = reconstructDshPlannedModelContext(context);
    if (progress && (!validDshPlanProgress(preparation.plan_progress)
      || digestValue(preparation.plan_progress) !== digestValue(projectDshPlanProgress(context.objective?.plan_context)))) return false;
  }
  catch { return false; }
  return context && !Array.isArray(context) && typeof context === "object"
    && Object.keys(context).sort().join(",") === (owned
      ? "context_envelope_digest,objective,route_id,schema_version,selected_items"
      : "context_envelope_digest,route_id,schema_version,selected_items")
    && context.schema_version === `are.dsh-web-model-context/v${owned ? 2 : 1}`
    && context.context_envelope_digest === preparation.context_envelope_digest
    && context.route_id === preparation.route_id
    && Array.isArray(context.selected_items) && context.selected_items.length <= 64
    && context.selected_items.every((item) => item && typeof item === "object"
      && !Array.isArray(item) && item.item_kind !== "request")
    && (!owned || preparation.objective_binding?.schema_version !== "are.dsh-objective-binding/v2"
      || context.objective?.plan_context?.thread_ref === `backend-thread:${digestValue({
        adapter: "deepseek-harness-web/are-v1", session_id: sessionId})}`)
    && (!owned || validOwnedObjectiveProjection(preparation.objective_binding, context.objective));
}

function validOwnedObjectiveProjection(binding, projection) {
  if (!binding || !projection || typeof binding !== "object" || typeof projection !== "object") return false;
  const {binding_digest, ...material} = binding;
  const planned = binding.schema_version === "are.dsh-objective-binding/v2";
  const baseKeys = "authority_effect,binding_head_digest,binding_id,checkpoint_digest,consumer_id,generation,objective_state_digest,preflight_event_digest,request_ref_digest,requirement_continuity_digest,resolution_digest,schema_version,scope_digest,writer_ref";
  const keys = planned ? [...baseKeys.split(","), "plan_context_digest"].sort().join(",") : baseKeys;
  if (Object.keys(material).sort().join(",") !== keys
    || !planned && binding.schema_version !== "are.dsh-objective-binding/v1" || binding.authority_effect !== "none"
    || !nonempty(binding.binding_id) || !nonempty(binding.consumer_id)
    || !Number.isSafeInteger(binding.generation) || binding.generation < 1
    || !["binding_head_digest", "checkpoint_digest", "objective_state_digest", "preflight_event_digest",
      "request_ref_digest", "resolution_digest", "scope_digest", "writer_ref"].every(key => DIGEST.test(binding[key] ?? ""))
    || binding.requirement_continuity_digest !== null && !DIGEST.test(binding.requirement_continuity_digest ?? "")
    || planned && (!DIGEST.test(binding.plan_context_digest ?? "") || binding.requirement_continuity_digest === null)
    || digestValue(material) !== binding_digest) return false;
  const baseProjection = "active_objective,authority_effect,objective_binding_digest,requirement_continuity_digest,requirement_snapshot,resolution_digest,state_digest,transition";
  const projectionKeys = planned ? [...baseProjection.split(","), "plan_context"].sort().join(",") : baseProjection;
  return Object.keys(projection).sort().join(",") === projectionKeys
    && (!planned || verifyReasoningPlanContext(projection.plan_context).ok
      && projection.plan_context.plan_context_digest === binding.plan_context_digest)
    && projection.authority_effect === "none" && projection.objective_binding_digest === binding_digest
    && projection.state_digest === binding.objective_state_digest
    && projection.resolution_digest === binding.resolution_digest
    && projection.requirement_continuity_digest === binding.requirement_continuity_digest
    && nonempty(projection.active_objective?.objective_id) && nonempty(projection.active_objective?.description)
    && ["new", "continue", "refine", "replace", "interrupt", "resume"].includes(projection.transition)
    && (projection.requirement_snapshot === null ? binding.requirement_continuity_digest === null
      : verifyRequirementSnapshot(projection.requirement_snapshot)
        && projection.requirement_snapshot.objective_id === projection.active_objective.objective_id
        && projection.requirement_snapshot.objective_state_digest === projection.state_digest);
}

/**
 * Candidate ARE preparation for one exact text prompt. These repository
 * decisions are not a Host identity assertion, a Web profile, or an effect
 * grant. Unknown/ambiguous requests fail closed until P3 has a product-level
 * objective contract for them.
 */
export function prepareAreRepositoryWebPrompt({session_id, request_id, content}) {
  const normalized = textContent(content);
  if (!nonempty(session_id) || !nonempty(request_id) || normalized === null) {
    throw new Error("dsh-web.prompt-preparation-input-invalid");
  }
  const raw = normalized.map((part) => part.text).join("\n");
  const input = {
    schema_version: "are.cli-request/v1", session_id, request_id,
    request: {raw_request: raw, objective_kind: null, requested_effects: [], target_refs: [],
      constraints: [], evidence_refs: [], field_postures: {request_id: "inferred", raw_request: "explicit",
        objective_kind: "absent", requested_effects: "absent", target_refs: "absent",
        constraints: "absent", evidence_refs: "absent"}},
  };
  const route = decide("route", input);
  if (route.ok !== true || route.kind !== "direct" || !nonempty(route.receipt?.receipt_digest)) {
    throw new Error("dsh-web.are-route-not-direct");
  }
  const context = decide("context", {...input, previous_receipt: route.receipt});
  if (context.ok !== true || context.kind !== "direct" || !nonempty(context.result_digest)
    || context.receipt?.receipt_digest !== route.receipt.receipt_digest) {
    throw new Error("dsh-web.are-context-not-direct");
  }
  const envelope = context.result?.context_envelope;
  const selected = envelope?.value?.included_items;
  if (!nonempty(envelope?.digest) || !Array.isArray(selected)
    || selected.length > 64 || !Number.isSafeInteger(envelope.value.inline_bytes)
    || envelope.value.inline_bytes > 32 * 1024) {
    throw new Error("dsh-web.are-context-envelope-invalid");
  }
  const modelContext = JSON.stringify({schema_version: "are.dsh-web-model-context/v1",
    context_envelope_digest: envelope.digest,
    route_id: route.route_contract.route_id,
    selected_items: selected.filter((item) => item.item_kind !== "request")});
  if (Buffer.byteLength(modelContext) > 32 * 1024) {
    throw new Error("dsh-web.are-model-context-too-large");
  }
  return Object.freeze({schema_version: PREPARATION_SCHEMA, session_id, request_id,
    content_digest: digest(normalized), route_id: route.route_contract.route_id,
    route_receipt_digest: route.receipt.receipt_digest, context_result_digest: context.result_digest,
    context_envelope_digest: envelope.digest, model_context: modelContext,
    model_context_digest: digest(modelContext),
    authority_effect: "none"});
}

export async function createDshWebPreparationWorker({timeout_ms = 30_000} = {}) {
  if (!Number.isSafeInteger(timeout_ms) || timeout_ms < 1 || timeout_ms > 120_000) {
    throw new TypeError("dsh-web.preparation-worker-timeout-invalid");
  }
  const worker = fork(fileURLToPath(import.meta.url), ["--are-preparation-worker"], {
    execArgv: [], stdio: ["ignore", "ignore", "ignore", "ipc"],
    env: Object.fromEntries(["PATH", "Path", "SystemRoot", "WINDIR", "LANG", "LC_ALL"]
      .filter((key) => typeof process.env[key] === "string")
      .map((key) => [key, process.env[key]])),
  });
  const pending = new Map();
  const exited = new Promise((resolve) => worker.once("exit", resolve));
  let live = true;
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  const startupTimer = setTimeout(() => readyReject(new Error("dsh-web.preparation-worker-start-timeout")),
    timeout_ms);
  function fail(reason) {
    if (!live) return;
    live = false;
    clearTimeout(startupTimer);
    readyReject(new Error(reason));
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    }
    pending.clear();
    if (worker.exitCode === null && worker.signalCode === null) worker.kill();
  }
  worker.on("message", (message) => {
    if (message?.schema_version !== WORKER_SCHEMA) {
      fail("dsh-web.preparation-worker-protocol-invalid");
      return;
    }
    if (message.kind === "ready") {
      clearTimeout(startupTimer);
      readyResolve();
      return;
    }
    const entry = pending.get(message.id);
    if (!entry || message.kind !== "prepared" || typeof message.ok !== "boolean") {
      fail("dsh-web.preparation-worker-response-invalid");
      return;
    }
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.ok) entry.resolve(message.preparation);
    else entry.reject(new Error("dsh-web.preparation-worker-denied"));
  });
  worker.on("error", () => fail("dsh-web.preparation-worker-failed"));
  worker.on("exit", () => fail("dsh-web.preparation-worker-exited"));
  try { await ready; }
  catch (error) { worker.kill(); throw error; }
  return Object.freeze({
    prepare(input) {
      if (!live || !worker.connected) {
        return Promise.reject(new Error("dsh-web.preparation-worker-unavailable"));
      }
      const id = randomUUID();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          fail("dsh-web.preparation-worker-response-timeout");
          reject(new Error("dsh-web.preparation-worker-response-timeout"));
          worker.kill();
        }, timeout_ms);
        pending.set(id, {resolve, reject, timer});
        worker.send({schema_version: WORKER_SCHEMA, kind: "prepare", id, input}, (error) => {
          if (error) fail("dsh-web.preparation-worker-send-failed");
        });
      });
    },
    async close() {
      if (live) fail("dsh-web.preparation-worker-closed");
      let stopTimer;
      const settled = await Promise.race([exited.then(() => true),
        new Promise((resolve) => {
          stopTimer = setTimeout(() => resolve(false), 5_000);
          stopTimer.unref?.();
        })]);
      clearTimeout(stopTimer);
      if (!settled && worker.exitCode === null && worker.signalCode === null) {
        worker.kill("SIGKILL");
        await exited;
      }
    },
  });
}

if (process.argv[2] === "--are-preparation-worker"
  && process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.send?.({schema_version: WORKER_SCHEMA, kind: "ready"});
  process.on("message", (message) => {
    if (message?.schema_version !== WORKER_SCHEMA || message.kind !== "prepare"
      || typeof message.id !== "string" || !message.id) process.exit(1);
    let preparation;
    try { preparation = prepareAreRepositoryWebPrompt(message.input); }
    catch {
      process.send?.({schema_version: WORKER_SCHEMA, kind: "prepared",
        id: message.id, ok: false});
      return;
    }
    process.send?.({schema_version: WORKER_SCHEMA, kind: "prepared",
      id: message.id, ok: true, preparation});
  });
}

/**
 * Request-scoped bridge between an asynchronous ARE preparation and the
 * pinned DSH Session's synchronous append callback. The caller must provide
 * an independent Host-binding verifier; this module cannot authenticate a
 * browser cookie or establish P1g by itself.
 */
export function createDshWebPromptPermitBroker({prepare = prepareAreRepositoryWebPrompt,
  verify_host_binding, assert_graph_binding = null, on_denial = () => {}} = {}) {
  if (typeof prepare !== "function" || typeof verify_host_binding !== "function") {
    throw new TypeError("dsh-web.prepare-and-host-verifier-required");
  }
  if (typeof on_denial !== "function") throw new TypeError("dsh-web.on-denial-invalid");
  if (assert_graph_binding !== null && typeof assert_graph_binding !== "function") {
    throw new TypeError("dsh-web.graph-verifier-invalid");
  }
  const scope = new AsyncLocalStorage();
  const sessions = new WeakMap();
  const deny = (event, reason) => {
    try { on_denial({event_type: event.type, reason}); } catch { /* Denial telemetry never approves. */ }
    return false;
  };
  function graphWitness(agent) {
    if (assert_graph_binding === null) return null; // Legacy probe only; never a qualified Web profile.
    const value = assert_graph_binding(agent);
    if (!value || typeof value.then === "function" || value.state !== "qualified"
      || !nonempty(value.boot_nonce) || !Number.isSafeInteger(value.epoch) || value.epoch < 1
      || !value.mount || value.session_id !== agent.id) {
      throw new Error("dsh-web.graph-binding-unverified");
    }
    return value;
  }

  function sameGraph(agent, bound, expectedEpoch = null) {
    if (assert_graph_binding === null) return true;
    try {
      const current = graphWitness(agent);
      return current.boot_nonce === bound.boot_nonce && current.mount === bound.mount
        && (expectedEpoch === null || current.epoch === expectedEpoch);
    } catch { return false; }
  }

  function installSession(session) {
    if (!session || !nonempty(session.id) || typeof session.installAppendAdmissionGuardV1 !== "function"
      || sessions.has(session)) throw new Error("dsh-web.session-install-invalid");
    const state = {session, agent: null, generation: 0, graph: null, disposed: false,
      pendingKeys: new Map(), committedKeys: new Set(), admittedMessages: new Map(),
      activeTurn: null, committedTerminal: null};
    session.installAppendAdmissionGuardV1((event) => {
      if (state.disposed) return deny(event, "session-disposed");
      if (event.type === "turn/start") {
        if (state.activeTurn || state.admittedMessages.size === 0) {
          return deny(event, "turn-without-admitted-inbox");
        }
        state.activeTurn = {admitted: false, claimed: false, epoch: null,
          requestId: null, requestIds: [], steeredIds: new Set(), claimedSteeredIds: new Set(),
          hostContextMessages: 0, modelContexts: [], modelBindings: []};
        return true;
      }
      if (event.type === "turn/end") {
        if (state.activeTurn?.admitted && state.activeTurn.requestIds.length > 0) {
          state.committedTerminal = {event, requestIds: [...state.activeTurn.requestIds]};
        }
        state.activeTurn = null;
        return true;
      }
      if (event.type === "agent/inbox/spliced" && event.data.inserted.length === 0) {
        const permit = scope.getStore();
        if (permit?.kind === "queue-steer" && permit.state === state
          && permit.agent === state.agent && permit.generation === state.generation
          && permit.phase === "remove" && event.data.target === "next-turn"
          && event.data.start === permit.index && event.data.removedCount === 1
          && event.data.outcome === "canceled"
          && permit.agent.inbox?.nextTurn?.[permit.index]?.id === permit.itemId
          && state.admittedMessages.get(permit.itemId)?.digest === permit.messageDigest
          && sameGraph(permit.agent, state.graph, permit.epoch)) {
          const result = permit.onAdmission({event});
          if (result && typeof result.then === "function") {
            throw new Error("dsh-web.admission-journal-must-be-synchronous");
          }
          permit.removeEvent = event;
          permit.phase = "insert";
          return true;
        }
        if (permit?.kind === "queue-remove" && permit.state === state
          && permit.agent === state.agent && permit.generation === state.generation
          && !permit.used && event.data.target === "next-turn"
          && event.data.start === permit.index && event.data.removedCount === 1
          && event.data.outcome === "canceled"
          && permit.agent.inbox?.nextTurn?.[permit.index]?.id === permit.itemId
          && state.admittedMessages.get(permit.itemId)?.requestId === permit.targetRequestId
          && sameGraph(permit.agent, state.graph, permit.epoch)) {
          const result = permit.onAdmission({event});
          if (result && typeof result.then === "function") {
            throw new Error("dsh-web.admission-journal-must-be-synchronous");
          }
          permit.used = true;
          permit.event = event;
          state.admittedMessages.delete(permit.itemId);
          return true;
        }
        if (event.data.target === "next-step" && event.data.start === 0
          && event.data.removedCount === 1 && event.data.outcome === undefined
          && state.activeTurn?.admitted === true
          && state.activeTurn.steeredIds.has(state.agent?.inbox?.nextStep?.[0]?.id)) {
          const itemId = state.agent.inbox.nextStep[0].id;
          state.activeTurn.steeredIds.delete(itemId);
          state.activeTurn.claimedSteeredIds.add(itemId);
          return true;
        }
        // In this no-tool, queue-only profile the native loop claims exactly
        // one next-turn message after turn/start. Web cancel retains the inbox;
        // clear and next-step producers remain unqualified.
        if (!state.activeTurn || state.activeTurn.claimed
          || event.data.target !== "next-turn" || event.data.start !== 0
          || event.data.removedCount !== 1 || event.data.outcome !== undefined
          || state.admittedMessages.size === 0) {
          return deny(event, "inbox-removal-not-qualified");
        }
        state.activeTurn.claimed = true;
        return true;
      }
      if (event.type === "agent/inbox/spliced" && event.data.inserted.length > 0) {
        const permit = scope.getStore();
        const inserted = event.data.inserted;
        if (permit?.kind === "queue-steer" && permit.state === state
          && permit.agent === state.agent && permit.generation === state.generation
          && permit.phase === "insert" && inserted.length === 1
          && event.data.target === "next-step" && event.data.removedCount === undefined
          && event.data.outcome === undefined && event.data.start === 0
          && state.activeTurn?.admitted === true
          && digest(inserted[0]) === permit.messageDigest
          && sameGraph(permit.agent, state.graph, permit.epoch)) {
          permit.insertEvent = event;
          permit.phase = "complete";
          permit.used = true;
          state.activeTurn.steeredIds.add(permit.itemId);
          return true;
        }
        if (permit?.kind === "queue-edit" && permit.state === state
          && permit.agent === state.agent && permit.generation === state.generation
          && !permit.used && inserted.length === 1
          && event.data.target === "next-turn" && event.data.start === permit.index
          && event.data.removedCount === 1 && event.data.outcome === "canceled"
          && sameGraph(permit.agent, state.graph, permit.epoch)) {
          const original = permit.agent.inbox?.nextTurn?.[permit.index];
          const replacement = inserted[0];
          const admitted = state.admittedMessages.get(permit.itemId);
          if (!original || digest(original) !== permit.originalDigest
            || admitted?.digest !== permit.originalDigest
            || admitted.requestId !== permit.targetRequestId
            || replacement?.id !== permit.itemId
            || digest(replacement.content) !== permit.contentDigest
            || Object.keys(replacement).sort().join(",") !== Object.keys(original).sort().join(",")
            || Object.keys(original).some((key) => key !== "content"
              && digest(replacement[key]) !== digest(original[key]))) {
            return deny(event, "queue-edit-message-mismatch");
          }
          const result = permit.onAdmission({event, preparation: permit.preparation});
          if (result && typeof result.then === "function") {
            throw new Error("dsh-web.admission-journal-must-be-synchronous");
          }
          permit.used = true;
          permit.event = event;
          state.admittedMessages.set(permit.itemId, {...admitted, digest: digest(replacement),
            modelContext: permit.preparation.model_context,
            currentPreparation: permit.preparation,
            editRequestKey: permit.preparation.request_id});
          return true;
        }
        if (!permit || permit.state !== state || permit.generation !== state.generation
          || permit.agent !== state.agent || permit.used || inserted.length !== 1
          || event.data.target !== permit.target) return deny(event, "permit-scope-mismatch");
        if (permit.target === "next-step"
          && (state.activeTurn?.admitted !== true || permit.agent.status !== "running"
            || permit.agent.phase?.abort?.signal?.aborted === true
            || permit.agent.inbox.nextStep.length !== 0
            || event.data.start !== 0)) {
          return deny(event, "steer-turn-not-active");
        }
        if (!sameGraph(permit.agent, state.graph, permit.epoch)) {
          return deny(event, "graph-epoch-or-mount-changed");
        }
        const message = inserted[0];
        if (!nonempty(message?.id) || message.role !== "user"
          || message.source?.kind !== "user" || message.source.rpcId !== permit.requestId
          || digest(message.content) !== permit.contentDigest
          || state.admittedMessages.has(message.id)
          || state.committedKeys.size >= 4096 || state.admittedMessages.size >= 4096) {
          return deny(event, "message-binding-mismatch");
        }
        // The Session has validated this exact event and is about to commit
        // it. Journal intent here: failed preparation or rejected insertion
        // must not consume a gateway request key.
        if (permit.onAdmission) {
          const outcome = permit.onAdmission({preparation: permit.preparation,
            host: permit.host});
          if (outcome && typeof outcome.then === "function") {
            throw new Error("dsh-web.admission-journal-must-be-synchronous");
          }
        }
        permit.used = true;
        // Native insertion may commit even if the controller later loses its
        // ACK. Keep the request key quarantined in that uncertain state.
        state.committedKeys.add(permit.requestId);
        state.admittedMessages.set(message.id, {digest: digest(message), epoch: permit.epoch,
          requestId: permit.requestId, modelContext: permit.preparation.model_context,
          originPreparation: permit.preparation, currentPreparation: permit.preparation,
          editRequestKey: null, itemId: message.id});
        if (permit.target === "next-step") state.activeTurn.steeredIds.add(message.id);
        return true;
      }
      if (event.type === "user/message") {
        // These two pinned DSH context writers emit user-role messages
        // during an already admitted turn. They are derived Host context,
        // not extra human prompts. Source labels remain forgeable by an
        // untrusted same-process plugin, so profile closure is mandatory.
        const source = event.data?.source;
        const derivedHostContext = source?.kind === "agent-instructions" && source.form === "instructions"
          || source?.kind === "plugin" && source.plugin === "@deepseek-ai/dsh-system-prompt";
        if (derivedHostContext && event.data.role === "user"
          && state.activeTurn?.admitted === true && state.activeTurn.hostContextMessages < 8) {
          state.activeTurn.hostContextMessages += 1;
          return true;
        }
        const expected = state.admittedMessages.get(event.data?.id);
        const active = state.activeTurn;
        if (expected === undefined || !active
          || (active.requestIds.length === 0 ? !active.claimed
            : !active.claimedSteeredIds.has(event.data.id))) {
          return deny(event, "surface-unbound-message");
        }
        if (expected.digest !== digest(event.data)) return deny(event, "surface-message-mismatch");
        state.admittedMessages.delete(event.data.id);
        active.claimedSteeredIds.delete(event.data.id);
        active.admitted = true;
        active.epoch = expected.epoch;
        active.requestId = expected.requestId;
        if (!active.requestIds.includes(expected.requestId)) {
          active.requestIds.push(expected.requestId);
          active.modelContexts.push(expected.modelContext);
          active.modelBindings.push({requestId: expected.requestId,
            originPreparation: expected.originPreparation,
            currentPreparation: expected.currentPreparation,
            editRequestKey: expected.editRequestKey, itemId: expected.itemId});
        }
        return true;
      }
      return true;
    });
    sessions.set(session, state);
  }

  function activateAgent(agent, {generation} = {}) {
    const state = sessions.get(agent?.session);
    if (!state || state.disposed || agent.id !== state.session.id) {
      throw new Error("dsh-web.agent-unprotected");
    }
    if (generation !== undefined && (!Number.isSafeInteger(generation)
      || generation <= state.generation)) throw new Error("dsh-web.agent-generation-invalid");
    const graph = graphWitness(agent);
    state.agent = agent;
    state.graph = graph;
    state.generation = generation ?? state.generation + 1;
    state.pendingKeys.clear();
    state.admittedMessages.clear();
    state.activeTurn = null;
    state.committedTerminal = null;
  }

  function disposeSession(session) {
    const state = sessions.get(session);
    if (!state) return;
    state.disposed = true;
    state.agent = null;
    state.graph = null;
    state.pendingKeys.clear();
    state.admittedMessages.clear();
    state.activeTurn = null;
    state.committedTerminal = null;
  }

  function terminalForCommittedEvent(session, event) {
    const state = sessions.get(session);
    const terminal = state?.committedTerminal;
    if (!terminal || terminal.event !== event || event.type !== "turn/end") return null;
    state.committedTerminal = null;
    return {requestIds: [...terminal.requestIds]};
  }

  async function admitPrompt({agent, request, invoke, on_admission}) {
    const state = sessions.get(agent?.session);
    const content = textContent(request?.content);
    if (!state || state.disposed || state.agent !== agent || !nonempty(request?.requestId)
      || request.sessionId !== agent.id || !["queue", "steer"].includes(request.mode)
      || content === null || typeof invoke !== "function"
      || (on_admission !== undefined && typeof on_admission !== "function")) {
      throw new Error("dsh-web.prompt-unqualified");
    }
    if (state.pendingKeys.has(request.requestId) || state.committedKeys.has(request.requestId)) {
      throw new Error("dsh-web.prompt-request-replayed");
    }
    const generation = state.generation;
    const beforeGraph = graphWitness(agent);
    if (!sameGraph(agent, state.graph, beforeGraph?.epoch ?? null)) {
      throw new Error("dsh-web.graph-binding-changed");
    }
    const pendingToken = {};
    state.pendingKeys.set(request.requestId, pendingToken);
    try {
      const host = await verify_host_binding({agent, request, generation});
      if (!host || host.native_session_id !== agent.id || host.agent_generation !== generation
        || !nonempty(host.host_principal)) throw new Error("dsh-web.host-binding-unverified");
      const preparation = await prepare({session_id: agent.id,
        request_id: request.requestId, content});
      if (!validPreparationFor(preparation, agent.id, request.requestId, content)) {
        throw new Error("dsh-web.are-preparation-invalid");
      }
      if (preparation.objective_binding && (preparation.objective_binding.binding_id !== host.binding_id
        || preparation.objective_binding.writer_ref !== host.writer_ref
        || preparation.objective_binding.generation !== host.agent_generation)) {
        throw new Error("dsh-web.objective-preparation-host-mismatch");
      }
      if (state.disposed || state.agent !== agent || state.generation !== generation) {
        throw new Error("dsh-web.agent-generation-changed");
      }
      const currentHost = await verify_host_binding({agent, request, generation});
      if (!currentHost || digest(currentHost) !== digest(host)) {
        throw new Error("dsh-web.host-binding-changed");
      }
      if (!sameGraph(agent, state.graph, beforeGraph?.epoch ?? null)) {
        throw new Error("dsh-web.graph-binding-changed");
      }
      const permit = {state, agent, generation, requestId: request.requestId,
        epoch: beforeGraph?.epoch ?? null,
        target: request.mode === "steer" ? "next-step" : "next-turn",
        contentDigest: preparation.content_digest, preparation, host,
        onAdmission: on_admission, used: false};
      const accepted = await scope.run(permit, invoke);
      if (accepted?.accepted !== true || !permit.used) {
        throw new Error("dsh-web.native-append-not-confirmed");
      }
      state.committedKeys.add(request.requestId);
      return {accepted, preparation};
    } finally {
      if (state.pendingKeys.get(request.requestId) === pendingToken) state.pendingKeys.delete(request.requestId);
    }
  }

  async function admitQueueRemove({agent, request, targetRequestId, index, invoke, on_admission}) {
    const state = sessions.get(agent?.session);
    if (!state || state.disposed || state.agent !== agent || !nonempty(request?.sessionId)
      || request.sessionId !== agent.id || !nonempty(request?.itemId)
      || request.action?.kind !== "remove" || Object.keys(request.action).length !== 1
      || !nonempty(targetRequestId) || !Number.isSafeInteger(index) || index < 0
      || typeof invoke !== "function" || typeof on_admission !== "function"
      || state.admittedMessages.get(request.itemId)?.requestId !== targetRequestId) {
      throw new Error("dsh-web.queue-remove-unqualified");
    }
    const generation = state.generation;
    const graph = graphWitness(agent);
    if (!sameGraph(agent, state.graph, graph?.epoch ?? null)) {
      throw new Error("dsh-web.graph-binding-changed");
    }
    const host = await verify_host_binding({agent, request, generation});
    if (!host || host.native_session_id !== agent.id || host.agent_generation !== generation
      || !nonempty(host.host_principal) || state.agent !== agent || state.generation !== generation
      || !sameGraph(agent, state.graph, graph?.epoch ?? null)) {
      throw new Error("dsh-web.host-binding-unverified");
    }
    const currentHost = await verify_host_binding({agent, request, generation});
    if (!currentHost || digest(currentHost) !== digest(host)
      || state.agent !== agent || state.generation !== generation
      || !sameGraph(agent, state.graph, graph?.epoch ?? null)) {
      throw new Error("dsh-web.host-binding-changed");
    }
    const permit = {kind: "queue-remove", state, agent, generation, epoch: graph?.epoch ?? null,
      itemId: request.itemId, targetRequestId, index, onAdmission: on_admission,
      used: false, event: null};
    const accepted = await scope.run(permit, invoke);
    if (accepted?.accepted !== true || !permit.used) {
      throw new Error("dsh-web.queue-remove-native-append-not-confirmed");
    }
    return {accepted, event: permit.event};
  }

  async function admitQueueEdit({agent, request, targetRequestId, editRequestId,
    index, invoke, on_admission}) {
    const state = sessions.get(agent?.session);
    const content = textContent(request?.action?.content);
    if (!state || state.disposed || state.agent !== agent || !nonempty(request?.sessionId)
      || request.sessionId !== agent.id || !nonempty(request?.itemId)
      || request.action?.kind !== "edit"
      || Object.keys(request.action).sort().join(",") !== "content,kind"
      || content === null || !nonempty(targetRequestId) || !nonempty(editRequestId)
      || !Number.isSafeInteger(index) || index < 0
      || typeof invoke !== "function" || typeof on_admission !== "function"
      || state.admittedMessages.get(request.itemId)?.requestId !== targetRequestId) {
      throw new Error("dsh-web.queue-edit-unqualified");
    }
    const original = agent.inbox?.nextTurn?.[index];
    const admitted = state.admittedMessages.get(request.itemId);
    if (original?.id !== request.itemId || digest(original) !== admitted.digest) {
      throw new Error("dsh-web.queue-edit-original-changed");
    }
    const generation = state.generation;
    const graph = graphWitness(agent);
    if (!sameGraph(agent, state.graph, graph?.epoch ?? null)) {
      throw new Error("dsh-web.graph-binding-changed");
    }
    const host = await verify_host_binding({agent, request, generation});
    if (!host || host.native_session_id !== agent.id || host.agent_generation !== generation
      || !nonempty(host.host_principal)) throw new Error("dsh-web.host-binding-unverified");
    const preparation = await prepare({session_id: agent.id,
      request_id: editRequestId, content});
    if (!validPreparationFor(preparation, agent.id, editRequestId, content)) {
      throw new Error("dsh-web.are-preparation-invalid");
    }
    if (preparation.objective_binding && (preparation.objective_binding.binding_id !== host.binding_id
      || preparation.objective_binding.writer_ref !== host.writer_ref
      || preparation.objective_binding.generation !== host.agent_generation)) {
      throw new Error("dsh-web.objective-preparation-host-mismatch");
    }
    const currentHost = await verify_host_binding({agent, request, generation});
    if (!currentHost || digest(currentHost) !== digest(host)
      || state.agent !== agent || state.generation !== generation
      || !sameGraph(agent, state.graph, graph?.epoch ?? null)) {
      throw new Error("dsh-web.host-binding-changed");
    }
    const permit = {kind: "queue-edit", state, agent, generation, epoch: graph?.epoch ?? null,
      itemId: request.itemId, targetRequestId, index, originalDigest: admitted.digest,
      contentDigest: preparation.content_digest, preparation,
      onAdmission: on_admission, used: false, event: null};
    const accepted = await scope.run(permit, invoke);
    if (accepted?.accepted !== true || !permit.used) {
      throw new Error("dsh-web.queue-edit-native-append-not-confirmed");
    }
    return {accepted, event: permit.event, preparation};
  }

  async function admitQueueSteer({agent, request, targetRequestId,
    index, invoke, on_admission}) {
    const state = sessions.get(agent?.session);
    const admitted = state?.admittedMessages.get(request?.itemId);
    const message = agent?.inbox?.nextTurn?.[index];
    if (!state || state.disposed || state.agent !== agent || !nonempty(request?.sessionId)
      || request.sessionId !== agent.id || !nonempty(request?.itemId)
      || request.action?.kind !== "steer" || Object.keys(request.action).length !== 1
      || !nonempty(targetRequestId) || !Number.isSafeInteger(index) || index < 0
      || typeof invoke !== "function" || typeof on_admission !== "function"
      || admitted?.requestId !== targetRequestId || message?.id !== request.itemId
      || digest(message) !== admitted.digest || state.activeTurn?.admitted !== true
      || agent.status !== "running" || agent.phase?.abort?.signal?.aborted === true
      || agent.inbox.nextStep.length !== 0) {
      throw new Error("dsh-web.queue-steer-unqualified");
    }
    const generation = state.generation;
    const graph = graphWitness(agent);
    if (!sameGraph(agent, state.graph, graph?.epoch ?? null)) {
      throw new Error("dsh-web.graph-binding-changed");
    }
    const host = await verify_host_binding({agent, request, generation});
    if (!host || host.native_session_id !== agent.id || host.agent_generation !== generation
      || !nonempty(host.host_principal)) throw new Error("dsh-web.host-binding-unverified");
    const currentHost = await verify_host_binding({agent, request, generation});
    if (!currentHost || digest(currentHost) !== digest(host)
      || state.agent !== agent || state.generation !== generation
      || !sameGraph(agent, state.graph, graph?.epoch ?? null)
      || state.activeTurn?.admitted !== true) {
      throw new Error("dsh-web.host-binding-changed");
    }
    const permit = {kind: "queue-steer", state, agent, generation,
      epoch: graph?.epoch ?? null, itemId: request.itemId,
      targetRequestId, messageDigest: admitted.digest, index,
      onAdmission: on_admission, phase: "remove", used: false,
      removeEvent: null, insertEvent: null};
    const accepted = await scope.run(permit, invoke);
    if (accepted?.accepted !== true || !permit.used || permit.phase !== "complete") {
      throw new Error("dsh-web.queue-steer-native-append-not-confirmed");
    }
    return {accepted, removeEvent: permit.removeEvent, insertEvent: permit.insertEvent};
  }

  function assertModelDispatch(agent) {
    const state = sessions.get(agent?.session);
    if (!state || state.disposed || state.agent !== agent
      || state.activeTurn?.admitted !== true
      || !sameGraph(agent, state.graph, state.activeTurn.epoch)) {
      throw new Error("dsh-web.model-dispatch-unqualified");
    }
    return true;
  }

  function modelContextForDispatch(agent) {
    assertModelDispatch(agent);
    const active = sessions.get(agent.session).activeTurn;
    if (active.modelContexts.length !== active.requestIds.length
      || active.modelContexts.length < 1
      || active.modelContexts.some((value) => !nonempty(value))) {
      throw new Error("dsh-web.model-context-unqualified");
    }
    let modelContext = active.modelContexts[0];
    if (active.modelContexts.length > 1) {
      if (active.modelContexts.length > 16) throw new Error("dsh-web.model-context-too-many");
      const contexts = active.modelContexts.map((value) => {
        const parsed = JSON.parse(value);
        return parsed.schema_version === 'are.dsh-web-model-context/v3' ? reconstructDshPlannedModelContext(parsed) : parsed;
      });
      const owned = contexts[0].schema_version === "are.dsh-web-model-context/v2";
      const items = new Map();
      for (const context of contexts) {
        if (context.schema_version !== `are.dsh-web-model-context/v${owned ? 2 : 1}`
          || !nonempty(context.context_envelope_digest)
          || !Array.isArray(context.selected_items)) {
          throw new Error("dsh-web.model-context-unqualified");
        }
        for (const item of context.selected_items) {
          if (!nonempty(item?.item_digest)
            || items.has(item.item_digest) && digest(items.get(item.item_digest)) !== digest(item)) {
            throw new Error("dsh-web.model-context-item-invalid");
          }
          items.set(item.item_digest, item);
        }
      }
      // A batch is not a single objective. Unselected owned contexts use the
      // original row format. Selected plans use the lossless shared template
      // below; both retain every original preparation's exact byte digest.
      modelContext = JSON.stringify({schema_version: owned
        ? "are.dsh-web-model-context-batch/v1" : "are.dsh-web-model-context/v1",
        request_contexts: contexts.map((context, index) => owned ? {
          source_context_schema: context.schema_version,
          model_context_digest: digest(active.modelContexts[index]),
          context_envelope_digest: context.context_envelope_digest,
          route_id: context.route_id,
          selected_item_digests: context.selected_items.map(item => item.item_digest),
          objective: context.objective,
        } : {route_id: context.route_id,
          context_envelope_digest: context.context_envelope_digest}),
        selected_items: [...items.values()]});
      if (owned && contexts.some(context => context.objective?.plan_context !== undefined)) {
        modelContext = JSON.stringify(composeDshPlannedModelContextBatch(active.modelContexts));
      }
    }
    if (Buffer.byteLength(modelContext) > 32 * 1024) {
      throw new Error("dsh-web.model-context-too-large");
    }
    return modelContext;
  }

  function modelBindingsForDispatch(agent) {
    assertModelDispatch(agent);
    const active = sessions.get(agent.session).activeTurn;
    if (active.modelBindings.length !== active.requestIds.length
      || active.modelBindings.length < 1) throw new Error("dsh-web.model-binding-unqualified");
    return active.modelBindings.map((binding) => ({...binding}));
  }

  return Object.freeze({installSession, activateAgent, disposeSession, admitPrompt,
    admitQueueRemove, admitQueueEdit, admitQueueSteer,
    terminalForCommittedEvent,
    assertModelDispatch, modelContextForDispatch, modelBindingsForDispatch});
}
