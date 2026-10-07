import {AsyncLocalStorage} from "node:async_hooks";
import {randomBytes, randomUUID} from "node:crypto";
import {realpathSync} from "node:fs";

import {digestValue} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {projectDshObjectiveCheckpoint} from "../../codex-app-server-wrapper/src/gateway-session-store.mjs";
import {validDshPlanHeadSummary, emptyDshPlanHeadSummary}
  from '../../codex-app-server-wrapper/src/dsh-objective-checkpoint-observation.mjs';
import {createConversationBindingContract, createGatewayBackedConversationBindingContract}
  from "../../codex-app-server-wrapper/src/conversation-binding-contract.mjs";
import {canonicalJson, dshGraphCreationDelta} from "./dsh-graph-manifest.mjs";
import {projectDshWebHistoryEvent, projectDshWebHistoryPage,
  projectDshWebHistorySnapshot} from "./web-history-projection.mjs";
import {createDshWebPromptPermitBroker} from "./web-prompt-permit.mjs";

export const DSH_WEB_HOST_OWNER_SYMBOL = Symbol.for("are.dsh-web-host-owner/v1");
export const DSH_WEB_BACKEND_ADAPTER_ID = "deepseek-harness-web/are-v1";

function requireValue(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function appendPreparationObservation({session_store, consumer_id, thread_ref,
  request_key, request_digest, preparation}) {
  const material = {kind: "dsh-are-preparation-observed", thread_ref, turn_ref: null,
    request_key_digest: digestValue(request_key), request_digest,
    route_id: preparation.route_id,
    route_receipt_digest: preparation.route_receipt_digest,
    context_result_digest: preparation.context_result_digest,
    context_envelope_digest: preparation.context_envelope_digest,
    model_context_digest: preparation.model_context_digest,
    ...(preparation.schema_version === "are.dsh-web-prompt-preparation/v2"
      ? {objective_checkpoint: projectDshObjectiveCheckpoint(preparation.objective_binding, preparation.plan_progress)} : {}),
    authority_effect: "none"};
  const observation = {...material, observation_digest: digestValue(material)};
  const result = session_store.append({event_kind: "host-observation", consumer_id,
    content: {observation}});
  if (!result.ok) throw new Error(`dsh-web.preparation-observation-failed:${result.reason_codes.join("+")}`);
}

function createControlQueue() {
  const items = [];
  let waiting;
  let closed = false;
  let failure;
  return {
    push(item) {
      if (closed) return;
      if (items.length >= 1024) {
        this.close(new Error("dsh-web.control-backpressure-exceeded"));
        return;
      }
      items.push(item);
      waiting?.();
    },
    close(error) {
      closed = true;
      failure = error;
      waiting?.();
    },
    async next() {
      while (items.length === 0 && !closed) await new Promise((resolve) => { waiting = resolve; });
      waiting = undefined;
      if (items.length > 0) return items.shift();
      if (failure) throw failure;
      return null;
    },
  };
}

/**
 * Fresh-only, single-local-Host DSH Web owner. It must be installed by the
 * pinned runProfile hostPrepare hook before the configuration tree mounts.
 * Browser-supplied identity, cwd, preset, resume and fork are not accepted.
 */
export function createDshWebHostOwner({graph, session_store, consumer_id,
  workspace_path, preset_id = "are-read-only", standing_mount_for,
  observe_graph, manifest, agent_construction_authority,
  prepare_web_prompt, after_native_prompt, after_native_cancel,
  ttl_ms = 60 * 60 * 1000} = {}) {
  if (!graph || typeof graph.assertCurrent !== "function"
    || !session_store?.inspect()?.durability?.startsWith("append-only-file-fsync")
    || typeof session_store.append !== "function"
    || typeof consumer_id !== "string" || consumer_id.length === 0
    || typeof workspace_path !== "string" || workspace_path.length === 0
    || typeof standing_mount_for !== "function" || typeof observe_graph !== "function"
    || !manifest?.structure?.creation_delta || !manifest?.preset
    || !agent_construction_authority
    || (after_native_prompt !== undefined && typeof after_native_prompt !== "function")
    || (after_native_cancel !== undefined && typeof after_native_cancel !== "function")) {
    throw new TypeError("dsh-web.host-owner-input-invalid");
  }
  const workspace = realpathSync(workspace_path);
  const capability = Object.freeze({});
  const capabilityNonce = randomBytes(32).toString("hex");
  const creationScope = new AsyncLocalStorage();
  const records = new WeakMap();
  const liveAgents = new Set();
  const terminalTasks = new Set();
  const assertions = new WeakMap();
  const releaseContexts = new WeakMap();
  const handoverContexts = new WeakMap();
  const resumingSessionIds = new Set();
  const cancellingSessionIds = new Set();
  const acceptedCancelRecoveries = new Map();
  const activeAdmissions = new Set();
  const controlStreams = new Set();
  let shuttingDown = false;
  let root;
  let binding;
  let owner;
  let registeredController;
  let registeredWorkspaceController;
  let factoryInstalled = false;
  let workspaceId;

  function notifyPromptOutcome(agent) {
    for (const stream of controlStreams) stream.push({kind: "outcome", sessionId: agent.id});
  }

  function currentWorkspace() {
    const registry = root?.workspaceRegistry;
    const selected = workspaceId && registry?.get(workspaceId);
    if (!selected || selected.path !== workspace || realpathSync(selected.path) !== workspace
      || registry.list().length !== 1 || registry.list()[0] !== selected) {
      throw new Error("dsh-web.host-workspace-changed");
    }
    return selected;
  }

  async function ensureWorkspace() {
    if (!root || graph.state !== "qualified" || workspaceId) {
      throw new Error("dsh-web.host-workspace-setup-invalid");
    }
    graph.assertCurrent();
    // Native Web broadcasts session additions independently of our filtered
    // list endpoint. A fresh Host must not inherit a Session that ARE did not
    // bind, even if that Session would be hidden from list/page/follow.
    if (!root.sessions || typeof root.sessions.list !== "function"
      || root.sessions.list().length !== 0) {
      throw new Error("dsh-web.host-sessions-not-fresh");
    }
    const registry = root.workspaceRegistry;
    if (!registry || typeof registry.create !== "function" || typeof registry.list !== "function"
      || typeof registry.get !== "function" || registry.list().some((item) => item.path !== workspace)) {
      throw new Error("dsh-web.host-workspace-registry-unqualified");
    }
    const selected = await registry.create(workspace);
    workspaceId = selected.id;
    currentWorkspace();
    return {workspaceId};
  }

  function currentGraph(agent, requireActive = true) {
    graph.assertCurrent();
    const snapshot = graph.snapshot();
    if (snapshot.state !== "qualified" || snapshot.serving !== true) {
      throw new Error("dsh-web.graph-not-qualified");
    }
    const mount = requireValue(standing_mount_for(agent.ctx), "dsh-web.agent-mount-missing");
    if (mount.presetId !== preset_id) throw new Error("dsh-web.agent-preset-mismatch");
    const toolNames = agent.ctx.tools.schemas(agent).map((tool) => tool.name).sort();
    if (!same(toolNames, manifest.model_tool_names)) {
      graph.revoke("agent.tool-catalog-drift", {kind: "agent.tools", subject: agent.id});
      throw new Error("dsh-web.agent-tool-catalog-drift");
    }
    const record = records.get(agent);
    if (requireActive && (!record?.active || record.mount !== mount
      || binding.get(record.binding_id)?.status !== "active")) {
      throw new Error("dsh-web.agent-binding-inactive");
    }
    return {state: snapshot.state, boot_nonce: snapshot.boot_nonce,
      epoch: snapshot.epoch, mount, session_id: agent.id};
  }

  const broker = createDshWebPromptPermitBroker({
    ...(prepare_web_prompt === undefined ? {} : {prepare: async (input) => {
      const agent = root?.agents.get(input.session_id);
      const record = agent && records.get(agent);
      if (!record?.active) throw new Error("dsh-web.objective-preparation-unowned");
      const prepared = await prepare_web_prompt({...input, owned_binding: {
        consumer_id, binding_id: record.binding_id, generation: record.generation,
        writer_ref: record.assertion.writer_ref}});
      if (typeof session_store.prepare === "function"
        && prepared?.schema_version !== "are.dsh-web-prompt-preparation/v2") {
        throw new Error("dsh-web.objective-preparation-downgrade-denied");
      }
      return prepared;
    }}),
    assert_graph_binding: (agent) => currentGraph(agent),
    verify_host_binding: async ({agent, generation}) => {
      const record = records.get(agent);
      if (!record?.active || record.generation !== generation) return null;
      currentGraph(agent);
      await binding.authorizeTurn({binding_id: record.binding_id,
        host_context: record.host_context, generation: record.generation});
      return {host_principal: record.assertion.principal_ref,
        native_session_id: agent.id, agent_generation: generation,
        binding_id: record.binding_id, writer_ref: record.assertion.writer_ref};
    },
  });

  function hostPrepare(ctx) {
    if (root || ctx?.root !== ctx || graph.state !== "capturing-boot"
      || ctx[DSH_WEB_HOST_OWNER_SYMBOL] !== undefined) {
      throw new Error("dsh-web.host-prepare-invalid");
    }
    const prior = session_store.getSession(consumer_id);
    const priorBoundRefs = new Set(prior?.conversation_binding_events
      ?.filter((event) => ["bound", "handed-over"].includes(event.kind))
      .map((event) => `backend-thread:${event.binding.backend_thread_ref}`) ?? []);
    if (prior?.thread_refs?.some((threadRef) => !priorBoundRefs.has(threadRef))) {
      throw new Error("dsh-web.prior-claim-unreconciled");
    }
    if (prior?.conversation_binding_events?.length > 0) {
      const recovered = createConversationBindingContract({
        verify_host_context: () => null, verify_release: () => null,
        initial_events: prior.conversation_binding_events});
      const unresolved = recovered.events()
        .filter((event) => ["bound", "handed-over"].includes(event.kind))
        .some((event) => !["released", "quarantined"]
          .includes(recovered.get(event.binding.binding_id)?.status));
      if (unresolved) throw new Error("dsh-web.prior-writer-unreconciled");
    }
    const started = session_store.append({event_kind: "session-started",
      consumer_id, content: {lane: "interaction-bound",
        backend_adapter_id: DSH_WEB_BACKEND_ADAPTER_ID,
        resume_token_digest: digestValue({capabilityNonce, consumer_id})}});
    if (!started.ok) throw new Error(`dsh-web.gateway-session-start-failed:${started.reason_codes.join("+")}`);
    binding = createGatewayBackedConversationBindingContract({session_store,
      consumer_id, verify_host_context: (context) => assertions.get(context),
      verify_handover: (context, prior, assertion) => {
        const permit = handoverContexts.get(context);
        if (!permit || creationScope.getStore() !== permit || !permit.loaded
          || !permit.used || permit.prior_binding_id !== prior.binding_id
          || permit.cursor.binding_id_digest !== digestValue(prior.binding_id)
          || permit.cursor.thread_ref !== `backend-thread:${prior.backend_thread_ref}`
          || permit.cursor.native_session_id_digest !== digestValue(permit.session_id)
          || session_store.inspect().head_event_digest !== permit.gateway_head_digest) {
          return null;
        }
        return {backend_thread_ref: prior.backend_thread_ref,
          previous_writer_ref: prior.writer_ref,
          next_writer_ref: assertion.writer_ref,
          outcome_reconciled: true,
          proof_digest: digestValue({prior_binding_id: prior.binding_id,
            previous_writer_ref: prior.writer_ref,
            next_writer_ref: assertion.writer_ref,
            release_observation_digest: permit.cursor.observation_digest,
            native_history_digest: permit.cursor.native_history_digest,
            gateway_head_digest: permit.gateway_head_digest})};
      },
      verify_handover_current: (context) => {
        const permit = handoverContexts.get(context);
        return !!permit && creationScope.getStore() === permit
          && permit.loaded && permit.used
          && session_store.inspect().head_event_digest === permit.gateway_head_digest;
      },
      verify_release_current: (context) => {
        const evidence = releaseContexts.get(context);
        return !!evidence
          && session_store.inspect().head_event_digest === evidence.gateway_head_digest;
      },
      verify_release: (context, bound) => {
        const evidence = releaseContexts.get(context);
        if (!evidence || evidence.binding_id !== bound.binding_id
          || evidence.backend_thread_ref !== bound.backend_thread_ref
          || evidence.writer_ref !== bound.writer_ref
          || !session_store.getSession(consumer_id)?.host_observations?.some((observation) =>
            observation.kind === "dsh-session-release-observed"
            && observation.observation_digest === evidence.release_observation_digest
            && observation.binding_id_digest === digestValue(bound.binding_id))
          || session_store.inspect().head_event_digest !== evidence.gateway_head_digest) {
          return null;
        }
        return {backend_thread_ref: bound.backend_thread_ref,
          writer_ref: bound.writer_ref, outcome_reconciled: true,
          proof_digest: digestValue(evidence)};
      }});
    Object.defineProperty(ctx, DSH_WEB_HOST_OWNER_SYMBOL, {value: owner,
      configurable: false, writable: false});
    root = ctx;
    ctx.on?.("agent/disposed", ({agent}) => {
      liveAgents.delete(agent);
      const record = records.get(agent);
      if (record) record.active = false;
      broker.disposeSession(agent.session);
    });
    ctx.on?.("session/event", (session, event) => {
      const terminal = broker.terminalForCommittedEvent(session, event);
      if (!terminal) return;
      const agent = ctx.agents.get(session.id);
      const record = agent && records.get(agent);
      if (!record || !record.active) {
        graph.revoke("dsh-turn.terminal-owner-missing", {kind: "session", subject: session.id});
        return;
      }
      const task = (async () => {
        // The native event is committed before observers run, but the JSONL
        // persistence observer may execute after this one. Let every
        // synchronous observer enqueue before requesting its flush barrier.
        await Promise.resolve();
        if (await ctx.sessions.flush(session) !== true) {
          throw new Error("dsh-web.native-terminal-not-durable");
        }
        for (const requestId of terminal.requestIds) {
          const requestKey = `${session.id}:${requestId}`;
          const request = session_store.getSession(consumer_id)?.requests
            ?.find((item) => item.request_key === requestKey);
          if (!request || request.method !== "dsh/web-prompt"
            || request.thread_ref !== `backend-thread:${record.assertion.backend_thread_ref}`) {
            throw new Error("dsh-web.terminal-request-unbound");
          }
          const reason = event.data.reason.kind;
          const status = reason === "completed" ? "completed"
            : reason === "aborted" || reason === "interrupted" ? "interrupted" : "failed";
          const material = {kind: "dsh-turn-terminal-observed",
            thread_ref: request.thread_ref,
            turn_ref: digestValue({session_id: session.id, turn: event.data.turn}),
            request_key_digest: digestValue(requestKey), request_digest: request.binding_digest,
            event_digest: digestValue(event), turn_status: status};
          const observation = {...material, observation_digest: digestValue(material)};
          const appended = session_store.append({event_kind: "host-observation", consumer_id,
            content: {observation}});
          if (!appended.ok) {
            throw new Error(`dsh-web.terminal-journal-failed:${appended.reason_codes.join("+")}`);
          }
          if (request.status === "outcome-unknown") {
            const recovered = session_store.append({event_kind: "dispatch-outcome", consumer_id,
              content: {request_key: requestKey, response: {accepted: true,
                recovered_from_terminal_observation_digest: observation.observation_digest}}});
            if (!recovered.ok) {
              throw new Error(`dsh-web.prompt-recovery-journal-failed:${recovered.reason_codes.join("+")}`);
            }
          }
          const pendingCancels = session_store.getSession(consumer_id).requests.filter((item) =>
            item.method === "dsh/web-cancel" && item.status === "outcome-unknown"
            && item.target_request_key === requestKey
            && item.target_request_digest === request.binding_digest
            && item.thread_ref === request.thread_ref);
          for (const cancellation of pendingCancels) {
            const witness = acceptedCancelRecoveries.get(cancellation.request_key);
            if (!witness?.uncertain || witness.agent !== agent
              || witness.binding_id !== record.binding_id
              || witness.target_request_key !== requestKey) continue;
            const recovered = session_store.append({event_kind: "dispatch-outcome", consumer_id,
              content: {request_key: cancellation.request_key, response: {accepted: true,
                recovered_from_terminal_observation_digest: observation.observation_digest}}});
            if (!recovered.ok) {
              throw new Error(`dsh-web.cancel-recovery-journal-failed:${recovered.reason_codes.join("+")}`);
            }
            acceptedCancelRecoveries.delete(cancellation.request_key);
          }
        }
        notifyPromptOutcome(agent);
      })();
      terminalTasks.add(task);
      void task.catch((error) => {
        graph.revoke("dsh-turn.terminal-observation-failed",
          {kind: "session", subject: session.id, reason: String(error)});
      }).finally(() => terminalTasks.delete(task));
    });
  }

  function installSessionFactory(store) {
    if (!root || factoryInstalled || !store
      || typeof store.installAppendAdmissionFactoryV1 !== "function") {
      throw new Error("dsh-web.session-factory-owner-invalid");
    }
    store.installAppendAdmissionFactoryV1((session) => {
      const permit = creationScope.getStore();
      if (!permit || permit.capability !== capability || permit.used
        || permit.session_id !== session.id
        || (permit.kind === "resume" && permit.loaded !== true)
        || session.header.cwd !== workspace || graph.state !== "checking-agent") {
        throw new Error("dsh-web.creation-permit-invalid");
      }
      permit.used = true;
      broker.installSession(session);
    });
    factoryInstalled = true;
  }

  function registerController(controller) {
    if (!root || controller?.ctx?.root !== root || registeredController) {
      throw new Error("dsh-web.controller-owner-conflict");
    }
    registeredController = controller;
  }

  function registerWorkspaceController(controller) {
    if (!root || controller?.ctx?.root !== root || registeredWorkspaceController) {
      throw new Error("dsh-web.workspace-controller-owner-conflict");
    }
    registeredWorkspaceController = controller;
  }

  function workspaceView(controller) {
    if (!root || controller !== registeredWorkspaceController || graph.state !== "qualified") {
      throw new Error("dsh-web.workspace-read-unqualified");
    }
    graph.assertCurrent();
    const selected = currentWorkspace();
    const sessionIds = [];
    for (const agent of liveAgents) {
      if (root.agents.get(agent.id) !== agent) throw new Error("dsh-web.workspace-agent-changed");
      currentGraph(agent);
      if (selected.sessionIds.includes(agent.id)) sessionIds.push(agent.id);
    }
    return {workspaceId: selected.id, path: selected.path, title: selected.title,
      sessionIds, createdAt: selected.createdAt, updatedAt: selected.updatedAt};
  }

  async function* workspaceFollow(controller, signal) {
    if (controller !== registeredWorkspaceController) {
      throw new Error("dsh-web.workspace-controller-owner-mismatch");
    }
    const native = controller.feed.follow(signal);
    for await (const frame of native) {
      const selected = workspaceView(controller);
      if (frame.type === "baseline") {
        yield {type: "baseline", value: {items: [selected], archivedSessionIds: []}};
      } else if (frame.type === "upsert") {
        if (frame.workspace.workspaceId !== selected.workspaceId) {
          throw new Error("dsh-web.workspace-foreign-increment");
        }
        yield {type: "upsert", workspace: selected};
      } else if (frame.type === "order") {
        yield {type: "order", workspaceIds: [selected.workspaceId]};
      } else if (frame.type === "archived") {
        yield {type: "archived", archivedSessionIds: []};
      } else {
        throw new Error("dsh-web.workspace-increment-unqualified");
      }
    }
  }

  async function create(controller, request) {
    if (!root || !factoryInstalled) throw new Error("dsh-web.host-factory-not-ready");
    if (controller !== registeredController) throw new Error("dsh-web.controller-owner-mismatch");
    const keys = request && typeof request === "object" && !Array.isArray(request)
      ? Object.keys(request) : null;
    const browserWorkspace = keys?.length === 1 && keys[0] === "workspaceId"
      && request.workspaceId === workspaceId;
    if (!keys || (keys.length !== 0 && !browserWorkspace)) {
      throw new Error("dsh-web.create-request-not-fresh");
    }
    if (keys.length === 0 && !workspaceId) await ensureWorkspace();
    if (browserWorkspace) currentWorkspace();
    graph.assertCurrent();
    if (graph.state !== "qualified" || realpathSync(workspace_path) !== workspace) {
      throw new Error("dsh-web.host-not-qualified");
    }
    const sessionId = `session-${randomUUID()}`;
    if (root.sessions.get(sessionId) || root.agents.get(sessionId)) {
      throw new Error("dsh-web.native-id-collision");
    }
    const composition = await controller.agents.composeAgent(preset_id);
    if (browserWorkspace) currentWorkspace();
    if (composition.agentPreset !== preset_id) throw new Error("dsh-web.preset-resolution-changed");
    const before = observe_graph({agent: undefined, other_agents: [...liveAgents]});
    if (!same(before.value?.host_loader_rows, manifest.host_loader_rows)
      || before.value?.unknown?.length !== 0) throw new Error("dsh-web.host-graph-drift");
    const cold = same(before.value?.structure, manifest.structure.before);
    const expectedAgentDelta = cold
      ? manifest.structure.creation_delta : manifest.structure.creation_delta_warm;
    if (!expectedAgentDelta) throw new Error("dsh-web.agent-delta-profile-missing");
    const constructionToken = graph.beginAgentConstruction(expectedAgentDelta,
      agent_construction_authority);
    const permit = {capability, session_id: sessionId, used: false};
    let record;
    let published;
    try {
      published = await creationScope.run(permit, () => root.agents.create({
        sessionId, agentOptions: controller.agents.agentOptions(),
        meta: {cwd: workspace, agentPreset: preset_id},
        setup: async (agentCtx, agent) => {
          await composition.setup(agentCtx, agent);
          if (!permit.used || agent.id !== sessionId || agent.session.id !== sessionId) {
            throw new Error("dsh-web.native-creation-mismatch");
          }
          const mount = requireValue(standing_mount_for(agentCtx), "dsh-web.agent-mount-missing");
          if (mount.presetId !== preset_id) throw new Error("dsh-web.agent-preset-mismatch");
          // Publication itself installs the final Agent lifecycle fiber. Keep
          // the graph construction window open until native publication ends.
          const pendingEpoch = graph.snapshot();
          const receipt = {session_id: sessionId, boot_nonce: pendingEpoch.boot_nonce,
            graph_epoch: pendingEpoch.epoch + 1, workspace, preset_id,
            mount_fiber_uid: mount.fiber?.uid, agent_generation: 1,
            writer: "qualified-web-controller/v1"};
          const threadRef = digestValue({adapter: DSH_WEB_BACKEND_ADAPTER_ID, session_id: sessionId});
          const assertion = {backend_adapter_id: DSH_WEB_BACKEND_ADAPTER_ID,
            backend_thread_ref: threadRef, principal_kind: "local-host",
            principal_ref: digestValue({adapter: DSH_WEB_BACKEND_ADAPTER_ID,
              workspace, preset_id}),
            host_instance_ref: digestValue({boot_nonce: pendingEpoch.boot_nonce,
              material_digest: graph.qualificationReceipt()?.material_digest,
              graph_epoch: pendingEpoch.epoch + 1}),
            client_instance_ref: digestValue({boot_nonce: pendingEpoch.boot_nonce, surface: "web"}),
            workspace_ref: digestValue({workspace, preset_id}),
            writer_ref: digestValue({capabilityNonce, session_id: sessionId,
              agent_generation: 1, writer: "qualified-web-controller/v1"}),
            creation_receipt_digest: digestValue(receipt)};
          const boundThread = session_store.append({event_kind: "thread-bound", consumer_id,
            content: {thread_ref: `backend-thread:${threadRef}`}});
          if (!boundThread.ok) throw new Error(`dsh-web.thread-bound-failed:${boundThread.reason_codes.join("+")}`);
          const hostContext = Object.freeze({});
          assertions.set(hostContext, assertion);
          const bound = await binding.bindNewThread({host_context: hostContext, ttl_ms});
          record = {agent, mount, assertion, host_context: hostContext,
            binding_id: bound.binding_id, generation: 1, active: false, receipt};
          records.set(agent, record);
        },
      }));
      if (!permit.used || !record || published.agent !== record.agent
        || root.agents.get(sessionId) !== record.agent
        || root.sessions.get(sessionId) !== record.agent.session) {
        throw new Error("dsh-web.native-publication-unverified");
      }
      record.handle = published;
      const after = observe_graph({agent: record.agent, other_agents: [...liveAgents]});
      const actualDelta = dshGraphCreationDelta(before, after);
      if (!same(actualDelta, expectedAgentDelta)) {
        throw new Error(`dsh-web.agent-delta-mismatch:${canonicalJson(actualDelta)}`);
      }
      if (!same(after.value?.host_loader_rows, manifest.host_loader_rows)) {
        throw new Error("dsh-web.agent-host-rows-mismatch");
      }
      if (!same(after.value?.preset, manifest.preset)) {
        throw new Error("dsh-web.agent-preset-mismatch");
      }
      if (!same(after.value?.model_tool_names, manifest.model_tool_names)) {
        throw new Error("dsh-web.agent-tool-names-mismatch");
      }
      if (after.value?.unknown?.length !== 0) {
        throw new Error("dsh-web.agent-unknown-fibers");
      }
      graph.commitAgentConstruction(constructionToken, actualDelta);
      const graphNow = currentGraph(record.agent, false);
      if (graphNow.mount !== record.mount || graphNow.epoch !== record.receipt.graph_epoch) {
        throw new Error("dsh-web.postpublication-graph-changed");
      }
      await binding.activate({binding_id: record.binding_id, host_context: record.host_context});
      record.active = true;
      broker.activateAgent(record.agent, {generation: record.generation});
      liveAgents.add(record.agent);
      const selectedWorkspace = currentWorkspace();
      if (typeof selectedWorkspace.attachSession !== "function") {
        throw new Error("dsh-web.workspace-attach-unavailable");
      }
      await selectedWorkspace.attachSession(sessionId);
      if (!selectedWorkspace.sessionIds.includes(sessionId)) {
        throw new Error("dsh-web.workspace-attach-unconfirmed");
      }
      currentGraph(record.agent);
      return {sessionId, agentPreset: preset_id};
    } catch (error) {
      graph.revoke("agent.creation-failed", {kind: "agent.create", subject: sessionId});
      if (record) liveAgents.delete(record.agent);
      await published?.dispose?.().catch(() => {});
      if (record) {
        record.active = false;
        broker.disposeSession(record.agent.session);
        try {
          await binding.quarantine({binding_id: record.binding_id,
            host_context: record.host_context, reason_code: "dsh-web.creation-unconfirmed"});
        } catch (quarantineError) {
          throw new AggregateError([error, quarantineError],
            "dsh-web.creation-quarantine-indeterminate");
        }
      }
      throw error;
    }
  }

  /** Host-only recovery; no Web RPC delegates caller-supplied resume identity here. */
  async function resumeReleasedSession(sessionId) {
    const controller = registeredController;
    if (!root || !factoryInstalled || !controller
      || typeof sessionId !== "string" || !/^session-[0-9a-f-]{36}$/u.test(sessionId)) {
      throw new Error("dsh-web.resume-host-input-invalid");
    }
    if (root.sessions.get(sessionId) || root.agents.get(sessionId)
      || resumingSessionIds.has(sessionId)) {
      throw new Error("dsh-web.resume-native-id-already-live");
    }
    resumingSessionIds.add(sessionId);
    try {
    if (!workspaceId) await ensureWorkspace();
    currentWorkspace();
    graph.assertCurrent();
    if (graph.state !== "qualified" || realpathSync(workspace_path) !== workspace) {
      throw new Error("dsh-web.resume-host-not-qualified");
    }
    const threadRef = digestValue({adapter: DSH_WEB_BACKEND_ADAPTER_ID, session_id: sessionId});
    const claims = binding.events().filter((event) => ["bound", "handed-over"].includes(event.kind)
      && event.binding.backend_thread_ref === threadRef);
    const prior = claims.at(-1)?.binding;
    if (!prior || binding.get(prior.binding_id)?.status !== "released") {
      throw new Error("dsh-web.resume-prior-not-released");
    }
    const session = session_store.getSession(consumer_id);
    const cursor = session?.host_observations?.find((observation) =>
      observation.kind === "dsh-session-release-observed"
      && observation.binding_id_digest === digestValue(prior.binding_id)
      && observation.thread_ref === `backend-thread:${threadRef}`
      && observation.native_session_id_digest === digestValue(sessionId));
    if (!cursor || !session.thread_refs.includes(`backend-thread:${threadRef}`)
      || !requestsReconciled(session, `backend-thread:${threadRef}`)) {
      throw new Error("dsh-web.resume-cursor-unreconciled");
    }
    const composition = await controller.agents.composeAgent(preset_id);
    if (composition.agentPreset !== preset_id) throw new Error("dsh-web.preset-resolution-changed");
    const before = observe_graph({agent: undefined, other_agents: [...liveAgents]});
    if (!same(before.value?.host_loader_rows, manifest.host_loader_rows)
      || before.value?.unknown?.length !== 0) throw new Error("dsh-web.host-graph-drift");
    const cold = same(before.value?.structure, manifest.structure.before);
    const expectedAgentDelta = cold
      ? manifest.structure.creation_delta : manifest.structure.creation_delta_warm;
    if (!expectedAgentDelta) throw new Error("dsh-web.agent-delta-profile-missing");
    const constructionToken = graph.beginAgentConstruction(expectedAgentDelta,
      agent_construction_authority);
    const permit = {kind: "resume", capability, session_id: sessionId,
      prior_binding_id: prior.binding_id, cursor,
      gateway_head_digest: session_store.inspect().head_event_digest,
      used: false, loaded: false};
    let record;
    let published;
    try {
      published = await creationScope.run(permit, () => root.agents.resume({
        resumeSessionId: sessionId, agentOptions: controller.agents.agentOptions(),
        setup: async (agentCtx, agent) => {
          await composition.setup(agentCtx, agent);
          if (!permit.used || !permit.loaded || agent.id !== sessionId
            || agent.session.id !== sessionId) throw new Error("dsh-web.native-resume-mismatch");
          const restored = agent.session.snapshotEvents();
          const prefix = restored.slice(0, cursor.native_event_count);
          const suffix = restored.slice(cursor.native_event_count);
          if (digestValue(prefix) !== cursor.native_history_digest
            || (suffix.length !== 0 && (suffix.length !== 1
              || suffix[0].type !== "session/end-seed"
              || suffix[0].seq !== cursor.native_event_count
              || digestValue(suffix[0].data) !== digestValue({})))) {
            throw new Error("dsh-web.native-resume-history-changed");
          }
          const mount = requireValue(standing_mount_for(agentCtx), "dsh-web.agent-mount-missing");
          if (mount.presetId !== preset_id) throw new Error("dsh-web.agent-preset-mismatch");
          const pendingEpoch = graph.snapshot();
          const generation = prior.generation + 1;
          const receipt = {session_id: sessionId, boot_nonce: pendingEpoch.boot_nonce,
            graph_epoch: pendingEpoch.epoch + 1, workspace, preset_id,
            mount_fiber_uid: mount.fiber?.uid, agent_generation: generation,
            prior_binding_id: prior.binding_id,
            release_observation_digest: cursor.observation_digest,
            writer: "qualified-web-controller-resume/v1"};
          const assertion = {backend_adapter_id: DSH_WEB_BACKEND_ADAPTER_ID,
            backend_thread_ref: threadRef, principal_kind: "local-host",
            principal_ref: digestValue({adapter: DSH_WEB_BACKEND_ADAPTER_ID,
              workspace, preset_id}),
            host_instance_ref: digestValue({boot_nonce: pendingEpoch.boot_nonce,
              material_digest: graph.qualificationReceipt()?.material_digest,
              graph_epoch: pendingEpoch.epoch + 1}),
            client_instance_ref: digestValue({boot_nonce: pendingEpoch.boot_nonce, surface: "web"}),
            workspace_ref: digestValue({workspace, preset_id}),
            writer_ref: digestValue({capabilityNonce, session_id: sessionId,
              agent_generation: generation, writer: "qualified-web-controller-resume/v1"}),
            creation_receipt_digest: digestValue(receipt)};
          const hostContext = Object.freeze({});
          assertions.set(hostContext, assertion);
          const handoverContext = Object.freeze({});
          handoverContexts.set(handoverContext, permit);
          const handed = await binding.handoverReleasedThread({
            prior_binding_id: prior.binding_id, host_context: hostContext,
            handover_context: handoverContext, ttl_ms});
          record = {agent, mount, assertion, host_context: hostContext,
            binding_id: handed.binding_id, generation, active: false, receipt};
          records.set(agent, record);
        },
      }));
      if (!permit.used || !permit.loaded || !record || published.agent !== record.agent
        || root.agents.get(sessionId) !== record.agent
        || root.sessions.get(sessionId) !== record.agent.session) {
        throw new Error("dsh-web.native-resume-publication-unverified");
      }
      record.handle = published;
      const after = observe_graph({agent: record.agent, other_agents: [...liveAgents]});
      const actualDelta = dshGraphCreationDelta(before, after);
      if (!same(actualDelta, expectedAgentDelta)
        || !same(after.value?.host_loader_rows, manifest.host_loader_rows)
        || !same(after.value?.preset, manifest.preset)
        || !same(after.value?.model_tool_names, manifest.model_tool_names)
        || after.value?.unknown?.length !== 0) {
        throw new Error("dsh-web.resume-graph-delta-mismatch");
      }
      graph.commitAgentConstruction(constructionToken, actualDelta);
      const graphNow = currentGraph(record.agent, false);
      if (graphNow.mount !== record.mount || graphNow.epoch !== record.receipt.graph_epoch) {
        throw new Error("dsh-web.resume-postpublication-graph-changed");
      }
      await binding.activate({binding_id: record.binding_id, host_context: record.host_context});
      record.active = true;
      broker.activateAgent(record.agent, {generation: record.generation});
      liveAgents.add(record.agent);
      const selectedWorkspace = currentWorkspace();
      if (typeof selectedWorkspace.attachSession !== "function") {
        throw new Error("dsh-web.workspace-attach-unavailable");
      }
      await selectedWorkspace.attachSession(sessionId);
      if (!selectedWorkspace.sessionIds.includes(sessionId)) {
        throw new Error("dsh-web.workspace-attach-unconfirmed");
      }
      currentGraph(record.agent);
      return {sessionId, agentPreset: preset_id, binding_id: record.binding_id,
        generation: record.generation};
    } catch (error) {
      graph.revoke("agent.resume-failed", {kind: "agent.resume", subject: sessionId});
      if (record) liveAgents.delete(record.agent);
      await published?.dispose?.().catch(() => {});
      if (record) {
        record.active = false;
        broker.disposeSession(record.agent.session);
        try {
          await binding.quarantine({binding_id: record.binding_id,
            host_context: record.host_context, reason_code: "dsh-web.resume-unconfirmed"});
        } catch (quarantineError) {
          throw new AggregateError([error, quarantineError],
            "dsh-web.resume-quarantine-indeterminate");
        }
      }
      throw error;
    }
    } finally { resumingSessionIds.delete(sessionId); }
  }

  async function prompt(controller, request, signal) {
    if (!root || controller !== registeredController
      || !["queue", "steer"].includes(request?.mode)) {
      throw new Error("dsh-web.prompt-mode-unqualified");
    }
    const agent = root.agents.get(request.sessionId);
    if (!agent || !records.get(agent)?.active) throw new Error("dsh-web.prompt-unbound");
    if (request.mode === "steer") {
      const events = agent.session.snapshotEvents();
      const start = events.findLastIndex((event) => event.type === "turn/start");
      const end = events.findLastIndex((event) => event.type === "turn/end");
      if (start <= end || agent.status !== "running"
        || agent.phase?.abort?.signal?.aborted === true
        || agent.inbox.nextStep.length !== 0) {
        throw new Error("dsh-web.prompt-steer-turn-unqualified");
      }
    }
    const record = records.get(agent);
    const requestKey = `${agent.id}:${request.requestId}`;
    const result = await broker.admitPrompt({agent, request,
      on_admission: ({preparation}) => {
        const threadRef = `backend-thread:${record.assertion.backend_thread_ref}`;
        const bindingDigest = digestValue({session_id: agent.id,
          request_id: request.requestId, content_digest: preparation.content_digest,
          route_receipt_digest: preparation.route_receipt_digest,
          context_result_digest: preparation.context_result_digest,
          context_envelope_digest: preparation.context_envelope_digest,
          model_context_digest: preparation.model_context_digest,
          binding_id: record.binding_id});
        const intent = session_store.append({event_kind: "dispatch-intent", consumer_id,
          content: {request_key: requestKey, method: "dsh/web-prompt",
            binding_digest: bindingDigest, thread_ref: threadRef}});
        if (!intent.ok) {
          throw new Error(`dsh-web.prompt-intent-failed:${intent.reason_codes.join("+")}`);
        }
        appendPreparationObservation({session_store, consumer_id, thread_ref: threadRef,
          request_key: requestKey, request_digest: bindingDigest, preparation});
      },
      invoke: async () => {
        const accepted = await controller.commands.prompt(request, signal);
        if (after_native_prompt) await after_native_prompt(accepted);
        return accepted;
      }});
    const current = session_store.getSession(consumer_id)?.requests
      ?.find((item) => item.request_key === requestKey);
    if (current?.status === "complete"
      && current.response?.recovered_from_terminal_observation_digest) return result.accepted;
    const outcome = session_store.append({event_kind: "dispatch-outcome", consumer_id,
      content: {request_key: requestKey, response: {accepted: true}}});
    if (!outcome.ok) {
      throw new Error(`dsh-web.prompt-ack-journal-failed:${outcome.reason_codes.join("+")}`);
    }
    notifyPromptOutcome(agent);
    return result.accepted;
  }

  function requestsReconciled(session, threadRef) {
    const requests = session?.requests?.filter((request) => request.thread_ref === threadRef) ?? [];
    return requests.every((request) => {
      if (request.status !== "complete") return false;
      if (request.method === "dsh/web-prompt") {
        return session.host_observations.some((observation) =>
          ["dsh-turn-terminal-observed", "dsh-queue-remove-observed"].includes(observation.kind)
          && observation.thread_ref === threadRef
          && (observation.kind === "dsh-turn-terminal-observed"
            ? observation.request_digest === request.binding_digest
              && observation.request_key_digest === digestValue(request.request_key)
            : observation.target_request_digest === request.binding_digest
              && observation.target_request_key_digest === digestValue(request.request_key)));
      }
      if (request.method === "dsh/web-queue-remove") {
        return request.response?.accepted === true && session.host_observations.some((observation) =>
          observation.kind === "dsh-queue-remove-observed"
          && observation.thread_ref === threadRef
          && observation.request_digest === request.binding_digest
          && observation.request_key_digest === digestValue(request.request_key));
      }
      if (request.method === "dsh/web-queue-edit") {
        return request.response?.accepted === true && session.host_observations.some((observation) =>
          observation.kind === "dsh-queue-edit-observed"
          && observation.thread_ref === threadRef
          && observation.request_digest === request.binding_digest
          && observation.request_key_digest === digestValue(request.request_key)
          && observation.content_digest === request.content_digest);
      }
      if (request.method === "dsh/web-queue-steer") {
        return request.response?.accepted === true && session.host_observations.some((observation) =>
          observation.kind === "dsh-queue-steer-observed"
          && observation.thread_ref === threadRef
          && observation.request_digest === request.binding_digest
          && observation.request_key_digest === digestValue(request.request_key));
      }
      if (request.method === "dsh/web-cancel") {
        const target = requests.find((item) => item.request_key === request.target_request_key
          && item.method === "dsh/web-prompt"
          && item.binding_digest === request.target_request_digest);
        return request.response?.accepted === true && !!target
          && session.host_observations.some((observation) =>
            observation.kind === "dsh-turn-terminal-observed"
            && observation.thread_ref === threadRef
            && observation.request_digest === target.binding_digest
            && observation.request_key_digest === digestValue(target.request_key)
            && (request.response.recovered_from_terminal_observation_digest === undefined
              || request.response.recovered_from_terminal_observation_digest
                === observation.observation_digest));
      }
      return false;
    });
  }

  async function updateQueue(controller, request) {
    if (!root || controller !== registeredController || !request
      || Object.keys(request).sort().join(",") !== "action,itemId,sessionId"
      || !request.action || !["remove", "edit", "steer"].includes(request.action.kind)
      || (request.action.kind === "remove" && Object.keys(request.action).join(",") !== "kind")
      || (request.action.kind === "steer" && Object.keys(request.action).join(",") !== "kind")
      || (request.action.kind === "edit"
        && Object.keys(request.action).sort().join(",") !== "content,kind")
      || typeof request.sessionId !== "string" || typeof request.itemId !== "string") {
      throw new Error("dsh-web.queue-mutation-request-unqualified");
    }
    const agent = root.agents.get(request.sessionId);
    const record = agent && records.get(agent);
    if (!record?.active) throw new Error("dsh-web.queue-remove-agent-unqualified");
    currentGraph(agent);
    const pending = agent.inbox?.nextTurn;
    const index = pending?.findIndex((message) => message.id === request.itemId) ?? -1;
    const message = pending?.[index];
    if (index < 0 || message?.role !== "user" || message.source?.kind !== "user"
      || typeof message.source.rpcId !== "string") {
      throw new Error("dsh-web.queue-remove-item-unqualified");
    }
    const threadRef = `backend-thread:${record.assertion.backend_thread_ref}`;
    const targetKey = `${agent.id}:${message.source.rpcId}`;
    const snapshot = session_store.getSession(consumer_id);
    const target = snapshot?.requests?.find((item) => item.request_key === targetKey
      && item.method === "dsh/web-prompt" && item.thread_ref === threadRef
      && item.status === "complete");
    if (!target || snapshot.requests.some((item) => item.method === "dsh/web-queue-remove"
      && item.target_request_key === targetKey)) {
      throw new Error("dsh-web.queue-mutation-target-unreconciled");
    }
    if (request.action.kind === "steer") {
      const eventsBefore = agent.session.snapshotEvents();
      const start = eventsBefore.findLastIndex((event) => event.type === "turn/start");
      const end = eventsBefore.findLastIndex((event) => event.type === "turn/end");
      if (start <= end || agent.status !== "running" || agent.inbox.nextStep.length !== 0) {
        throw new Error("dsh-web.queue-steer-turn-unqualified");
      }
      const requestKey = `${agent.id}:queue-steer:${randomUUID()}`;
      const result = await broker.admitQueueSteer({agent, request,
        targetRequestId: message.source.rpcId, index,
        on_admission: () => {
          const intent = session_store.append({event_kind: "dispatch-intent", consumer_id,
            content: {request_key: requestKey, method: "dsh/web-queue-steer",
              thread_ref: threadRef, item_id: request.itemId,
              target_request_key: targetKey, target_request_digest: target.binding_digest,
              binding_digest: digestValue({binding_id: record.binding_id,
                target_request_key: targetKey, target_request_digest: target.binding_digest,
                item_id_digest: digestValue(request.itemId), request_key: requestKey,
                turn_start_digest: digestValue(eventsBefore[start])})}});
          if (!intent.ok) throw new Error(`dsh-web.queue-steer-intent-failed:${intent.reason_codes.join("+")}`);
        },
        invoke: () => controller.commands.updateQueue(request)});
      const eventsAfter = agent.session.snapshotEvents();
      if (eventsAfter.length < eventsBefore.length + 2
        || !eventsAfter.slice(eventsBefore.length).some((event) => same(event, result.removeEvent))
        || !eventsAfter.slice(eventsBefore.length).some((event) => same(event, result.insertEvent))
        || agent.inbox.nextTurn.some((item) => item.id === request.itemId)
        || agent.inbox.nextStep[0]?.id !== request.itemId) {
        throw new Error("dsh-web.queue-steer-native-events-unverified");
      }
      if (await root.sessions.flush(agent.session) !== true) {
        throw new Error("dsh-web.queue-steer-not-durable");
      }
      const current = session_store.getSession(consumer_id).requests.find((item) =>
        item.request_key === requestKey);
      const material = {kind: "dsh-queue-steer-observed", thread_ref: threadRef,
        turn_ref: null, request_key_digest: digestValue(requestKey),
        request_digest: current.binding_digest,
        target_request_key_digest: digestValue(targetKey),
        target_request_digest: target.binding_digest,
        item_id_digest: digestValue(request.itemId),
        remove_event_digest: digestValue(result.removeEvent),
        insert_event_digest: digestValue(result.insertEvent),
        native_remove_seq: result.removeEvent.seq,
        native_insert_seq: result.insertEvent.seq};
      const observation = {...material, observation_digest: digestValue(material)};
      const observed = session_store.append({event_kind: "host-observation", consumer_id,
        content: {observation}});
      if (!observed.ok) throw new Error(`dsh-web.queue-steer-observation-failed:${observed.reason_codes.join("+")}`);
      const outcome = session_store.append({event_kind: "dispatch-outcome", consumer_id,
        content: {request_key: requestKey, response: {accepted: true}}});
      if (!outcome.ok) throw new Error(`dsh-web.queue-steer-ack-journal-failed:${outcome.reason_codes.join("+")}`);
      return result.accepted;
    }
    if (request.action.kind === "edit") {
      const requestKey = `${agent.id}:queue-edit:${randomUUID()}`;
      const eventsBefore = agent.session.snapshotEvents();
      const result = await broker.admitQueueEdit({agent, request,
        targetRequestId: message.source.rpcId, editRequestId: requestKey, index,
        on_admission: ({preparation}) => {
          const bindingDigest = digestValue({binding_id: record.binding_id,
            target_request_key: targetKey, target_request_digest: target.binding_digest,
            item_id_digest: digestValue(request.itemId), request_key: requestKey,
            content_digest: preparation.content_digest,
            route_receipt_digest: preparation.route_receipt_digest,
            context_result_digest: preparation.context_result_digest,
            context_envelope_digest: preparation.context_envelope_digest,
            model_context_digest: preparation.model_context_digest});
          const intent = session_store.append({event_kind: "dispatch-intent", consumer_id,
            content: {request_key: requestKey, method: "dsh/web-queue-edit",
              thread_ref: threadRef, item_id: request.itemId,
              target_request_key: targetKey, target_request_digest: target.binding_digest,
              content_digest: preparation.content_digest,
              binding_digest: bindingDigest}});
          if (!intent.ok) throw new Error(`dsh-web.queue-edit-intent-failed:${intent.reason_codes.join("+")}`);
          appendPreparationObservation({session_store, consumer_id, thread_ref: threadRef,
            request_key: requestKey, request_digest: bindingDigest, preparation});
        },
        invoke: () => controller.commands.updateQueue(request)});
      const eventsAfter = agent.session.snapshotEvents();
      if (eventsAfter.length <= eventsBefore.length
        || !eventsAfter.slice(eventsBefore.length).some((event) =>
          event.type === "agent/inbox/spliced" && same(event, result.event))
        || agent.inbox.nextTurn[index]?.id !== request.itemId
        || !same(agent.inbox.nextTurn[index]?.content, request.action.content)) {
        throw new Error("dsh-web.queue-edit-native-event-unverified");
      }
      if (await root.sessions.flush(agent.session) !== true) {
        throw new Error("dsh-web.queue-edit-not-durable");
      }
      const current = session_store.getSession(consumer_id).requests.find((item) =>
        item.request_key === requestKey);
      const material = {kind: "dsh-queue-edit-observed", thread_ref: threadRef,
        turn_ref: null, request_key_digest: digestValue(requestKey),
        request_digest: current.binding_digest,
        target_request_key_digest: digestValue(targetKey),
        target_request_digest: target.binding_digest,
        item_id_digest: digestValue(request.itemId),
        content_digest: result.preparation.content_digest,
        event_digest: digestValue(result.event), native_event_seq: result.event.seq};
      const observation = {...material, observation_digest: digestValue(material)};
      const observed = session_store.append({event_kind: "host-observation", consumer_id,
        content: {observation}});
      if (!observed.ok) throw new Error(`dsh-web.queue-edit-observation-failed:${observed.reason_codes.join("+")}`);
      const outcome = session_store.append({event_kind: "dispatch-outcome", consumer_id,
        content: {request_key: requestKey, response: {accepted: true}}});
      if (!outcome.ok) throw new Error(`dsh-web.queue-edit-ack-journal-failed:${outcome.reason_codes.join("+")}`);
      return result.accepted;
    }
    const requestKey = `${agent.id}:queue-remove:${randomUUID()}`;
    const eventsBefore = agent.session.snapshotEvents();
    const result = await broker.admitQueueRemove({agent, request,
      targetRequestId: message.source.rpcId, index,
      on_admission: () => {
        const intent = session_store.append({event_kind: "dispatch-intent", consumer_id,
          content: {request_key: requestKey, method: "dsh/web-queue-remove",
            thread_ref: threadRef, item_id: request.itemId,
            target_request_key: targetKey, target_request_digest: target.binding_digest,
            binding_digest: digestValue({binding_id: record.binding_id,
              target_request_key: targetKey, target_request_digest: target.binding_digest,
              item_id_digest: digestValue(request.itemId), request_key: requestKey})}});
        if (!intent.ok) throw new Error(`dsh-web.queue-remove-intent-failed:${intent.reason_codes.join("+")}`);
      },
      invoke: () => controller.commands.updateQueue(request)});
    const eventsAfter = agent.session.snapshotEvents();
    if (eventsAfter.length <= eventsBefore.length
      || !eventsAfter.slice(eventsBefore.length).some((event) =>
        event.type === "agent/inbox/spliced" && same(event, result.event))
      || agent.inbox.nextTurn.some((item) => item.id === request.itemId)) {
      throw new Error("dsh-web.queue-remove-native-event-unverified");
    }
    if (await root.sessions.flush(agent.session) !== true) {
      throw new Error("dsh-web.queue-remove-not-durable");
    }
    const current = session_store.getSession(consumer_id).requests.find((item) =>
      item.request_key === requestKey);
    const material = {kind: "dsh-queue-remove-observed", thread_ref: threadRef,
      turn_ref: null, request_key_digest: digestValue(requestKey),
      request_digest: current.binding_digest,
      target_request_key_digest: digestValue(targetKey),
      target_request_digest: target.binding_digest,
      item_id_digest: digestValue(request.itemId), event_digest: digestValue(result.event),
      native_event_seq: result.event.seq};
    const observation = {...material, observation_digest: digestValue(material)};
    const observed = session_store.append({event_kind: "host-observation", consumer_id,
      content: {observation}});
    if (!observed.ok) throw new Error(`dsh-web.queue-remove-observation-failed:${observed.reason_codes.join("+")}`);
    const outcome = session_store.append({event_kind: "dispatch-outcome", consumer_id,
      content: {request_key: requestKey, response: {accepted: true}}});
    if (!outcome.ok) throw new Error(`dsh-web.queue-remove-ack-journal-failed:${outcome.reason_codes.join("+")}`);
    return result.accepted;
  }

  function cancel(controller, request) {
    if (!root || controller !== registeredController
      || !request || Object.keys(request).sort().join(",") !== "sessionId"
      || typeof request.sessionId !== "string") {
      throw new Error("dsh-web.cancel-request-unqualified");
    }
    const agent = root.agents.get(request.sessionId);
    const record = agent && records.get(agent);
    if (!record?.active || cancellingSessionIds.has(request.sessionId)) {
      throw new Error("dsh-web.cancel-agent-unqualified");
    }
    currentGraph(agent);
    const events = agent.session.snapshotEvents();
    const start = events.findLastIndex((event) => event.type === "turn/start");
    const end = events.findLastIndex((event) => event.type === "turn/end");
    const messages = start > end ? events.slice(start + 1).filter((event) =>
      event.type === "user/message" && event.data?.source?.kind === "user"
      && typeof event.data.source.rpcId === "string") : [];
    if (messages.length === 0) {
      throw new Error("dsh-web.cancel-active-prompt-unverified");
    }
    const threadRef = `backend-thread:${record.assertion.backend_thread_ref}`;
    const snapshot = session_store.getSession(consumer_id);
    const activeRequestKeys = messages.map((message) => `${agent.id}:${message.data.source.rpcId}`);
    if (new Set(activeRequestKeys).size !== activeRequestKeys.length
      || activeRequestKeys.some((requestKey) => !snapshot?.requests?.some((item) =>
        item.request_key === requestKey && item.method === "dsh/web-prompt"
        && item.thread_ref === threadRef && item.status === "complete"))) {
      throw new Error("dsh-web.cancel-active-prompt-unverified");
    }
    // Cancellation targets the native turn. Keep its first admitted prompt as
    // the stable journal anchor even when later prompts were steered into it.
    const targetKey = `${agent.id}:${messages[0].data.source.rpcId}`;
    const target = snapshot.requests.find((item) =>
      item.request_key === targetKey && item.method === "dsh/web-prompt"
      && item.thread_ref === threadRef && item.status === "complete");
    if (!target) throw new Error("dsh-web.cancel-target-unreconciled");
    if (session_store.getSession(consumer_id).requests.some((item) =>
      item.method === "dsh/web-cancel" && item.thread_ref === threadRef
      && item.target_request_key === targetKey)) {
      throw new Error("dsh-web.cancel-target-already-requested");
    }
    const requestKey = `${agent.id}:cancel:${randomUUID()}`;
    const intent = session_store.append({event_kind: "dispatch-intent", consumer_id,
      content: {request_key: requestKey, method: "dsh/web-cancel", thread_ref: threadRef,
        target_request_key: targetKey, target_request_digest: target.binding_digest,
        binding_digest: digestValue({binding_id: record.binding_id,
          target_request_key: targetKey, target_request_digest: target.binding_digest,
          turn_start_digest: digestValue(events[start]), cancel_request_key: requestKey})}});
    if (!intent.ok) throw new Error(`dsh-web.cancel-intent-failed:${intent.reason_codes.join("+")}`);
    cancellingSessionIds.add(request.sessionId);
    try {
      const accepted = controller.commands.cancel(request);
      if (accepted?.accepted !== true) throw new Error("dsh-web.cancel-native-ack-invalid");
      acceptedCancelRecoveries.set(requestKey, {agent, binding_id: record.binding_id,
        target_request_key: targetKey, uncertain: false});
      if (after_native_cancel) after_native_cancel(accepted);
      const outcome = session_store.append({event_kind: "dispatch-outcome", consumer_id,
        content: {request_key: requestKey, response: {accepted: true}}});
      if (!outcome.ok) {
        throw new Error(`dsh-web.cancel-ack-journal-failed:${outcome.reason_codes.join("+")}`);
      }
      acceptedCancelRecoveries.delete(requestKey);
      return accepted;
    } catch (error) {
      const witness = acceptedCancelRecoveries.get(requestKey);
      if (witness) {
        witness.uncertain = true;
        // The native terminal may have been journalled while the post-cancel
        // hook was still running. Reconcile that already-durable observation
        // here; otherwise the terminal observer may have passed this cancel
        // before the witness became uncertain.
        const current = session_store.getSession(consumer_id);
        const terminal = current?.host_observations?.findLast((observation) =>
          observation.kind === "dsh-turn-terminal-observed"
          && observation.thread_ref === threadRef
          && observation.request_key_digest === digestValue(targetKey)
          && observation.request_digest === target.binding_digest);
        const pending = current?.requests?.find((item) => item.request_key === requestKey);
        if (terminal && pending?.status === "outcome-unknown") {
          const recovered = session_store.append({event_kind: "dispatch-outcome", consumer_id,
            content: {request_key: requestKey, response: {accepted: true,
              recovered_from_terminal_observation_digest: terminal.observation_digest}}});
          if (!recovered.ok) {
            throw new Error(`dsh-web.cancel-recovery-journal-failed:${recovered.reason_codes.join("+")}`);
          }
          acceptedCancelRecoveries.delete(requestKey);
        }
      }
      throw error;
    } finally { cancellingSessionIds.delete(request.sessionId); }
  }

  async function waitTerminalObservations() {
    await Promise.allSettled([...terminalTasks]);
    graph.assertCurrent();
  }

  function promptOutcomeProjection(agent) {
    const record = records.get(agent);
    if (!record?.active) throw new Error("dsh-web.prompt-outcomes-owner-missing");
    const threadRef = `backend-thread:${record.assertion.backend_thread_ref}`;
    const journal = session_store.getSession(consumer_id);
    const prompts = journal?.requests?.filter((item) =>
      item.method === "dsh/web-prompt" && item.thread_ref === threadRef).slice(-16) ?? [];
    if (prompts.length === 0) return null;
    return prompts.map((request) => {
      const requestKeyDigest = digestValue(request.request_key);
      const terminal = journal.host_observations.findLast((observation) =>
        observation.kind === "dsh-turn-terminal-observed"
        && observation.thread_ref === threadRef
        && observation.request_key_digest === requestKeyDigest
        && observation.request_digest === request.binding_digest);
      return {requestKeyDigest,
        disposition: request.status === "outcome-unknown" ? "uncertain"
          : request.response?.recovered_from_terminal_observation_digest ? "recovered" : "accepted",
        terminal: terminal?.turn_status ?? null};
    });
  }

  function list(controller, request) {
    if (!root || controller !== registeredController || !request
      || Object.keys(request).length !== 0 || graph.state !== "qualified") {
      throw new Error("dsh-web.list-unqualified");
    }
    graph.assertCurrent();
    const items = [];
    for (const agent of liveAgents) {
      if (root.agents.get(agent.id) !== agent) throw new Error("dsh-web.list-agent-changed");
      currentGraph(agent);
      const summary = controller.listState.summaryFor(agent.session);
      if (summary.sessionId !== agent.id || !Number.isSafeInteger(summary.updatedAt)
        || typeof summary.running !== "boolean" || typeof summary.blank !== "boolean") {
        throw new Error("dsh-web.list-summary-invalid");
      }
      // Keep the one Host-selected route visible to the stock browser model
      // selector without exposing native plugin projections or alternate models.
      const outcomes = promptOutcomeProjection(agent);
      items.push({sessionId: agent.id, updatedAt: summary.updatedAt,
        running: summary.running, blank: summary.blank,
        projections: {asOfSeq: agent.session.snapshotEvents().at(-1)?.seq ?? -1,
          values: {modelSelection: {next: null},
            ...(outcomes === null ? {} : {arePromptOutcomes: outcomes})}}});
    }
    items.sort((left, right) => right.updatedAt - left.updatedAt);
    return {items};
  }

  function modelCatalog(controller) {
    if (!root || controller !== registeredController || graph.state !== "qualified") {
      throw new Error("dsh-web.model-catalog-unqualified");
    }
    graph.assertCurrent();
    const selection = root.agentDefaultModel?.currentSelection?.();
    if (!selection || typeof selection.provider !== "string" || !selection.provider
      || typeof selection.model !== "string" || !selection.model
      || (selection.reasoningEffort !== undefined
        && typeof selection.reasoningEffort !== "string")) {
      throw new Error("dsh-web.default-model-unqualified");
    }
    // This profile has one Host-selected route. It does not advertise
    // alternate models that the qualified controller cannot select.
    const current = {provider: selection.provider, model: selection.model,
      ...(selection.reasoningEffort === undefined ? {}
        : {reasoningEffort: selection.reasoningEffort})};
    return {default: current, routableProviders: [selection.provider],
      groups: [{id: selection.provider, name: selection.provider,
        models: [{id: selection.model, name: selection.model}]}], failures: []};
  }

  function search(controller, request, signal) {
    if (!root || controller !== registeredController || graph.state !== "qualified") {
      throw new Error("dsh-web.search-unqualified");
    }
    const query = request?.query;
    if (typeof query !== "string" || query.trim().length === 0
      || query.length > 500 || query.includes("\0")) {
      throw new Error("dsh-web.search-query-invalid");
    }
    graph.assertCurrent();
    const needle = query.trim().toLowerCase();
    const ranked = [...liveAgents].map((agent) => {
      if (root.agents.get(agent.id) !== agent) throw new Error("dsh-web.search-agent-changed");
      currentGraph(agent);
      return {agent, updatedAt: controller.listState.summaryFor(agent.session).updatedAt};
    }).sort((left, right) => right.updatedAt - left.updatedAt);
    const items = [];
    let scanned = 0;
    for (const {agent} of ranked) {
      if (signal?.aborted) throw new Error("dsh-web.search-aborted");
      const events = agent.session.snapshotEvents();
      scanned += events.length;
      if (scanned > 50_000) throw new Error("dsh-web.search-work-budget-exceeded");
      let snippet;
      for (let index = events.length - 1; index >= 0 && snippet === undefined; index--) {
        const event = events[index];
        if (event.type !== "user/message" && event.type !== "assistant/message") continue;
        const projected = projectDshWebHistoryEvent(event);
        const blocks = projected.type === "user/message" ? projected.data.content
          : projected.type === "assistant/message" ? projected.data.message.content : [];
        for (const block of blocks) {
          const match = block.text.toLowerCase().indexOf(needle);
          if (match < 0) continue;
          const prefix = [...block.text.slice(0, match)];
          const start = prefix.slice(0, Math.max(0, prefix.length - 80)).join("").length;
          snippet = [...block.text.slice(start)].slice(0, 240).join("");
          break;
        }
      }
      if (snippet !== undefined) items.push({sessionId: agent.id, snippet});
      if (items.length > 20) break;
    }
    graph.assertCurrent();
    return {items: items.slice(0, 20), hasMore: items.length > 20};
  }

  function historyAgent(controller, request) {
    if (!root || controller !== registeredController
      || request?.address?.kind !== "session"
      || typeof request.address.sessionId !== "string") {
      throw new Error("dsh-web.history-unqualified");
    }
    const agent = root.agents.get(request.address.sessionId);
    if (!agent || !records.get(agent)?.active) throw new Error("dsh-web.history-unbound");
    currentGraph(agent);
    return agent;
  }

  async function page(controller, request, signal) {
    const agent = historyAgent(controller, request);
    if (!Number.isSafeInteger(request.throughSeq) || request.throughSeq < -1
      || (request.beforeSeq !== undefined && (!Number.isSafeInteger(request.beforeSeq)
        || request.beforeSeq < 0))
      || (request.maxMessages !== undefined && (!Number.isSafeInteger(request.maxMessages)
        || request.maxMessages < 1 || request.maxMessages > 50))) {
      throw new Error("dsh-web.page-request-invalid");
    }
    const native = await controller.history.page(request, signal);
    currentGraph(agent);
    return projectDshWebHistoryPage(native);
  }

  async function* follow(controller, request, signal) {
    const agent = historyAgent(controller, request);
    if (request.maxMessages !== undefined && (!Number.isSafeInteger(request.maxMessages)
      || request.maxMessages < 1 || request.maxMessages > 50)) {
      throw new Error("dsh-web.follow-request-invalid");
    }
    // Native assistant-stream frames can carry private reasoning. Durable
    // final text is projected below; no process-local stream is exported.
    const native = controller.history.follow({address: request.address,
      ...(request.maxMessages === undefined ? {} : {maxMessages: request.maxMessages})}, signal);
    for await (const frame of native) {
      currentGraph(agent);
      if (frame.type === "snapshot") {
        const projected = projectDshWebHistorySnapshot(frame, agent.id,
          {assistantStream: request.assistantStream === true});
        const outcomes = promptOutcomeProjection(agent);
        if (outcomes !== null) projected.projections.values.arePromptOutcomes = outcomes;
        yield projected;
      } else if (frame.type === "event") {
        yield {type: "event", event: projectDshWebHistoryEvent(frame.event)};
      } else {
        throw new Error("dsh-web.history-frame-unqualified");
      }
    }
  }

  async function* control(controller, signal) {
    if (!root || controller !== registeredController || graph.state !== "qualified") {
      throw new Error("dsh-web.control-unqualified");
    }
    const native = controller.controlState.control(signal);
    const queue = createControlQueue();
    controlStreams.add(queue);
    const producer = (async () => {
      try {
        for await (const frame of native) queue.push({kind: "native", frame});
        queue.close();
      } catch (error) { queue.close(error); }
    })();
    let baselineSent = false;
    try {
    for (;;) {
      const item = await queue.next();
      if (item === null) break;
      graph.assertCurrent();
      if (item.kind === "outcome") {
        if (!baselineSent) continue;
        const agent = root.agents.get(item.sessionId);
        if (!agent || !records.get(agent)?.active) continue;
        currentGraph(agent);
        const outcomes = promptOutcomeProjection(agent);
        const seq = agent.session.snapshotEvents().at(-1)?.seq;
        if (outcomes !== null && Number.isSafeInteger(seq) && seq >= 0) {
          yield {type: "projection", sessionId: agent.id,
            key: "arePromptOutcomes", value: outcomes, seq};
        }
        continue;
      }
      const {frame} = item;
      if (frame.type === "baseline") {
        await waitTerminalObservations();
        const queues = Object.create(null);
        const jobs = Object.create(null);
        const projections = Object.create(null);
        for (const agent of liveAgents) {
          if (root.agents.get(agent.id) !== agent) throw new Error("dsh-web.control-agent-changed");
          currentGraph(agent);
          queues[agent.id] = [];
          jobs[agent.id] = [];
          const outcomes = promptOutcomeProjection(agent);
          projections[agent.id] = {asOfSeq: agent.session.snapshotEvents().at(-1)?.seq ?? -1,
            values: {modelSelection: {next: null},
              ...(outcomes === null ? {} : {arePromptOutcomes: outcomes})}};
        }
        baselineSent = true;
        yield {type: "baseline", value: {queues, jobs, projections}};
      } else if (frame.type === "queue" || frame.type === "jobs") {
        const agent = root.agents.get(frame.sessionId);
        if (!agent || !records.get(agent)?.active) continue;
        currentGraph(agent);
        yield frame.type === "queue"
          ? {type: "queue", sessionId: agent.id, items: []}
          : {type: "jobs", sessionId: agent.id, jobs: []};
      } else if (frame.type !== "projection") {
        throw new Error("dsh-web.control-frame-unqualified");
      }
    }
    } finally {
      controlStreams.delete(queue);
      queue.close();
      void Promise.resolve(native.return?.()).catch(() => {});
      void producer.catch(() => {});
    }
  }

  async function disposeNativeAgent(agent) {
    const record = records.get(agent);
    if (!record?.active || root?.agents.get(agent.id) !== agent
      || record.handle?.agent !== agent || typeof record.handle.dispose !== "function") {
      throw new Error("dsh-web.agent-disposal-unowned");
    }
    // Fence in-flight ARE preparation synchronously, before native teardown
    // can yield to another Web request or replacement Agent.
    record.active = false;
    liveAgents.delete(agent);
    broker.disposeSession(agent.session);
    if (await root.sessions.flush(agent.session) !== true) {
      throw new Error("dsh-web.agent-disposal-not-durable");
    }
    await record.handle.dispose();
    if (root.agents.get(agent.id) === agent) throw new Error("dsh-web.agent-disposal-unconfirmed");
    await waitTerminalObservations();
    record.durableAtDispose = true;
    await binding.drain({binding_id: record.binding_id, host_context: record.host_context});
    return {session_id: agent.id, binding_status: binding.get(record.binding_id)?.status};
  }

  async function releaseDrainedAgent(agent) {
    const record = records.get(agent);
    if (!record?.durableAtDispose || record.active || liveAgents.has(agent)
      || root?.agents.get(agent.id) || root?.sessions.get(agent.id)
      || binding.get(record.binding_id)?.status !== "draining") {
      throw new Error("dsh-web.release-not-drained");
    }
    await waitTerminalObservations();
    const session = session_store.getSession(consumer_id);
    const threadRef = `backend-thread:${record.assertion.backend_thread_ref}`;
    if (!requestsReconciled(session, threadRef)) {
      throw new Error("dsh-web.release-outcome-unreconciled");
    }
    const memoryEvents = agent.session.snapshotEvents();
    const persistence = root.get?.("sessionPersistence");
    if (!persistence || typeof persistence.open !== "function") {
      throw new Error("dsh-web.release-native-persistence-unavailable");
    }
    const nativeHandle = await persistence.open(agent.id, "read");
    let durableHeader;
    let nativeEvents;
    try {
      durableHeader = nativeHandle.header;
      ({events: nativeEvents} = await nativeHandle.read(0));
    } finally { await nativeHandle.close(); }
    if (!Array.isArray(nativeEvents) || nativeEvents.length !== memoryEvents.length
      || digestValue(nativeEvents) !== digestValue(memoryEvents)
      || durableHeader?.id !== agent.id || durableHeader.cwd !== workspace
      || durableHeader.agentPreset !== preset_id || durableHeader.isSeeded !== false
      || durableHeader.delegationDepth !== 0) {
      throw new Error("dsh-web.release-native-persistence-drift");
    }
    const material = {kind: "dsh-session-release-observed", thread_ref: threadRef,
      turn_ref: null, binding_id_digest: digestValue(record.binding_id),
      native_session_id_digest: digestValue(agent.id),
      native_header_digest: digestValue(durableHeader),
      native_event_count: nativeEvents.length,
      native_history_digest: digestValue(nativeEvents),
      native_tail_digest: digestValue(nativeEvents.at(-1) ?? null)};
    const releaseObservation = {...material, observation_digest: digestValue(material)};
    const existingRelease = session.host_observations.find((observation) =>
      observation.kind === "dsh-session-release-observed"
      && observation.binding_id_digest === releaseObservation.binding_id_digest);
    if (existingRelease && existingRelease.observation_digest !== releaseObservation.observation_digest) {
      throw new Error("dsh-web.release-native-cursor-changed");
    }
    if (!existingRelease) {
      const appended = session_store.append({event_kind: "host-observation", consumer_id,
        content: {observation: releaseObservation}});
      if (!appended.ok) {
        throw new Error(`dsh-web.release-cursor-journal-failed:${appended.reason_codes.join("+")}`);
      }
    }
    const releaseContext = Object.freeze({});
    releaseContexts.set(releaseContext, {binding_id: record.binding_id,
      backend_thread_ref: record.assertion.backend_thread_ref,
      writer_ref: record.assertion.writer_ref,
      gateway_head_digest: session_store.inspect().head_event_digest,
      release_observation_digest: releaseObservation.observation_digest,
      terminal_observation_digests: session.host_observations
        .filter((observation) => observation.kind === "dsh-turn-terminal-observed"
          && observation.thread_ref === threadRef)
        .map((observation) => observation.observation_digest)});
    const released = await binding.release({binding_id: record.binding_id,
      host_context: record.host_context, release_context: releaseContext});
    return {session_id: agent.id, binding_status: released.status};
  }

  function assertModelDispatch(loop) {
    if (!root || loop?.ctx?.root !== root || graph.state !== "qualified") {
      throw new Error("dsh-web.model-owner-invalid");
    }
    const agent = root.agents.get(loop.id);
    if (!agent || agent.session !== loop.session || !records.get(agent)?.active) {
      throw new Error("dsh-web.model-agent-unbound");
    }
    currentGraph(agent);
    return broker.assertModelDispatch(agent);
  }

  function modelContextForDispatch(loop) {
    assertModelDispatch(loop);
    const agent = root.agents.get(loop.id);
    const record = records.get(agent);
    const journal = session_store.getSession(consumer_id);
    const threadRef = `backend-thread:${record.assertion.backend_thread_ref}`;
    if (!journal?.thread_refs?.includes(threadRef)) {
      throw new Error("dsh-web.model-journal-thread-missing");
    }
    for (const bound of broker.modelBindingsForDispatch(agent)) {
      const origin = bound.originPreparation;
      const current = bound.currentPreparation;
      if (!origin || !current || current.model_context_digest !== digestValue(current.model_context)
        || bound.requestId !== origin.request_id) {
        throw new Error("dsh-web.model-preparation-changed");
      }
      const targetKey = `${agent.id}:${bound.requestId}`;
      const prompt = journal.requests.find((request) => request.request_key === targetKey);
      const promptDigest = digestValue({session_id: agent.id,
        request_id: bound.requestId, content_digest: origin.content_digest,
        route_receipt_digest: origin.route_receipt_digest,
        context_result_digest: origin.context_result_digest,
        context_envelope_digest: origin.context_envelope_digest,
        model_context_digest: origin.model_context_digest,
        binding_id: record.binding_id});
      if (prompt?.method !== "dsh/web-prompt" || prompt.thread_ref !== threadRef
        || prompt.binding_digest !== promptDigest) {
        throw new Error("dsh-web.model-prompt-intent-missing");
      }
      if (bound.editRequestKey === null) {
        if (current !== origin) throw new Error("dsh-web.model-preparation-changed");
        continue;
      }
      const edit = journal.requests.find((request) => request.request_key === bound.editRequestKey);
      const editDigest = digestValue({binding_id: record.binding_id,
        target_request_key: targetKey, target_request_digest: prompt.binding_digest,
        item_id_digest: digestValue(bound.itemId), request_key: bound.editRequestKey,
        content_digest: current.content_digest,
        route_receipt_digest: current.route_receipt_digest,
        context_result_digest: current.context_result_digest,
        context_envelope_digest: current.context_envelope_digest,
        model_context_digest: current.model_context_digest});
      if (edit?.method !== "dsh/web-queue-edit" || edit.thread_ref !== threadRef
        || edit.target_request_key !== targetKey
        || edit.target_request_digest !== prompt.binding_digest
        || edit.item_id !== bound.itemId || edit.content_digest !== current.content_digest
        || edit.binding_digest !== editDigest) {
        throw new Error("dsh-web.model-edit-intent-missing");
      }
    }
    return broker.modelContextForDispatch(agent);
  }

  function recordModelEntry(loop, modelRequest) {
    const context = modelContextForDispatch(loop);
    const agent = root.agents.get(loop.id);
    const record = records.get(agent);
    const messages = modelRequest?.messages;
    const first = messages?.[0];
    if (!Array.isArray(messages) || messages.length < 2
      || first?.role !== "system" || first.source?.kind !== "plugin"
      || first.source.plugin !== "@cyberalchemy/are"
      || first.content?.length !== 1 || first.content[0]?.type !== "text"
      || first.content[0].text !== context) {
      throw new Error("dsh-web.model-request-context-mismatch");
    }
    const events = agent.session.snapshotEvents();
    const turnStart = events.findLast((event) => event.type === "turn/start");
    const turnEnd = events.findLast((event) => event.type === "turn/end");
    const tail = events.at(-1);
    if (!turnStart || turnEnd?.seq >= turnStart.seq
      || !Number.isSafeInteger(tail?.seq) || tail.seq < 0) {
      throw new Error("dsh-web.model-native-turn-missing");
    }
    const journal = session_store.getSession(consumer_id);
    const bindings = broker.modelBindingsForDispatch(agent);
    const requests = bindings.map((bound) => journal.requests.find((request) =>
      request.request_key === `${agent.id}:${bound.requestId}`));
    const preparations = bindings.map((bound, index) => bound.editRequestKey === null
      ? requests[index] : journal.requests.find((request) =>
        request.request_key === bound.editRequestKey));
    const material = {kind: "dsh-model-entry-intent",
      thread_ref: `backend-thread:${record.assertion.backend_thread_ref}`,
      turn_ref: digestValue({session_id: agent.id, turn: turnStart.data.turn}),
      request_key_digests: requests.map((request) => digestValue(request.request_key)),
      request_digests: requests.map((request) => request.binding_digest),
      preparation_bindings: preparations.map((request) => ({
        request_key_digest: digestValue(request.request_key),
        request_digest: request.binding_digest})),
      context_digest: digestValue(context),
      model_messages_digest: digestValue(messages),
      native_event_seq: tail.seq, binding_id_digest: digestValue(record.binding_id)};
    const observation = {...material, observation_digest: digestValue(material)};
    const appended = session_store.append({event_kind: "host-observation", consumer_id,
      content: {observation}});
    if (!appended.ok) {
      throw new Error(`dsh-web.model-entry-intent-failed:${appended.reason_codes.join("+")}`);
    }
    return observation.observation_digest;
  }

  function assertNativeResumeOpen(sessionId) {
    const permit = creationScope.getStore();
    if (!permit || permit.kind !== "resume" || permit.capability !== capability
      || permit.session_id !== sessionId || permit.used || permit.loaded
      || graph.state !== "checking-agent"
      || binding.get(permit.prior_binding_id)?.status !== "released"
      || session_store.inspect().head_event_digest !== permit.gateway_head_digest) {
      throw new Error("dsh-web.native-resume-not-admitted");
    }
  }

  function assertNativeResumeLoaded({sessionId, header, events, closers}) {
    assertNativeResumeOpen(sessionId);
    const permit = creationScope.getStore();
    const cursor = permit.cursor;
    if (!Array.isArray(events) || !Array.isArray(closers) || closers.length !== 0
      || header?.id !== sessionId || header.cwd !== workspace
      || header.agentPreset !== preset_id || header.isSeeded !== false
      || header.delegationDepth !== 0
      || digestValue(header) !== cursor.native_header_digest
      || events.length !== cursor.native_event_count
      || digestValue(events) !== cursor.native_history_digest
      || digestValue(events.at(-1) ?? null) !== cursor.native_tail_digest) {
      throw new Error("dsh-web.native-resume-cursor-mismatch");
    }
    permit.loaded = true;
  }

  function assertNativeSessionSeedV1(sessionId, options) {
    const permit = creationScope.getStore();
    return !!permit && permit.kind === "resume" && permit.capability === capability
      && permit.session_id === sessionId && permit.loaded && !permit.used
      && graph.state === "checking-agent"
      && binding.get(permit.prior_binding_id)?.status === "released"
      && session_store.inspect().head_event_digest === permit.gateway_head_digest
      && options?.inheritedEventCount === 0
      && digestValue(options.meta) === permit.cursor.native_header_digest
      && Array.isArray(options.seed)
      && options.seed.length === permit.cursor.native_event_count
      && digestValue(options.seed) === permit.cursor.native_history_digest;
  }

  function admitted(operation) {
    if (shuttingDown) throw new Error("dsh-web.host-stopping");
    const result = operation();
    if (result && typeof result.then === "function") {
      activeAdmissions.add(result);
      Promise.resolve(result).then(() => activeAdmissions.delete(result),
        () => activeAdmissions.delete(result));
    }
    return result;
  }

  owner = Object.freeze({hostPrepare, installSessionFactory, registerController,
    registerWorkspaceController, workspaceFollow,
    create: (...args) => admitted(() => create(...args)),
    resumeReleasedSession: (...args) => admitted(() => resumeReleasedSession(...args)),
    ensureWorkspace,
    prompt: (...args) => admitted(() => prompt(...args)),
    updateQueue: (...args) => admitted(() => updateQueue(...args)),
    cancel: (...args) => admitted(() => cancel(...args)),
    list, modelCatalog, search, page, follow, control,
    disposeNativeAgent, releaseDrainedAgent, assertModelDispatch, modelContextForDispatch,
    recordModelEntry,
    assertNativeResumeOpen, assertNativeResumeLoaded, assertNativeSessionSeedV1,
    waitTerminalObservations,
    beginShutdown: async () => {
      shuttingDown = true;
      await Promise.allSettled([...activeAdmissions]);
      if (activeAdmissions.size !== 0) throw new Error("dsh-web.admissions-not-settled");
      return {active_admissions: 0};
    },
    liveAgentsSnapshot: () => Object.freeze([...liveAgents].sort((left, right) =>
      left.id.localeCompare(right.id))),
    planHeadForObservation: agent => {
      if (typeof session_store.readPlan !== 'function') return undefined;
      try {
        const record = records.get(agent);
        if (!record?.active) throw new Error('dsh-web.plan-read-unowned');
        const result = session_store.readPlan({session_id: agent.id, owned_binding: {
          consumer_id, binding_id: record.binding_id, generation: record.generation,
          writer_ref: record.assertion.writer_ref}});
        if (!validDshPlanHeadSummary(result)) throw new Error('dsh-web.plan-read-invalid');
        return result;
      } catch { return emptyDshPlanHeadSummary('unavailable'); }
    },
    inspect: (agent) => {
      const record = records.get(agent);
      return record && {session_id: agent.id, binding_id: record.binding_id,
        status: binding.get(record.binding_id)?.status ?? "missing",
        graph_epoch: record.receipt.graph_epoch,
        thread_ref: `backend-thread:${record.assertion.backend_thread_ref}`};
    }});
  return owner;
}
