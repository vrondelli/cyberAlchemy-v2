import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {createFileGatewaySessionStore} from "../../codex-app-server-wrapper/src/gateway-session-store.mjs";
import {digestValue} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {createGatewayBackedConversationBindingContract}
  from "../../codex-app-server-wrapper/src/conversation-binding-contract.mjs";
import {createDshWebHostOwner, DSH_WEB_BACKEND_ADAPTER_ID,
  DSH_WEB_HOST_OWNER_SYMBOL} from "../src/web-host-owner.mjs";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Session} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-session")).href);
const {createUserMessage} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href);

const counts = {"bootstrap-isolate": 0, "bootstrap-loader": 0,
  "host-nested": 0, "host-primary": 0, "preset-nested": 0,
  "preset-primary": 1, unknown: 0};

function harness({failThreadBound = false, failPublication = false,
  failDispatchIntent = false, failNativeBeforeAppend = false,
  failCancelIntent = false, failQueueRemoveIntent = false, failQueueEditIntent = false,
  failQueueSteerIntent = false,
  tamperResume = false, pauseResume, afterNativePrompt, afterNativeCancel} = {}) {
  const dir = mkdtempSync(join(tmpdir(), "are-dsh-web-owner-"));
  const store = createFileGatewaySessionStore({path: join(dir, "gateway.jsonl")});
  let nextFiber = 9;
  const preset = {selected_id: "are-read-only"};
  const manifest = {host_loader_rows: [], preset, model_tool_names: [],
    structure: {creation_delta: {active_fiber_count: 1, counts},
      creation_delta_warm: {active_fiber_count: 1, counts}}};
  const authority = {};
  const graph = {
    state: "capturing-boot", epoch: 1,
    assertCurrent() { if (this.state === "revoked") throw Error("epoch.revoked"); },
    snapshot() { return {state: this.state, serving: this.state === "qualified",
      boot_nonce: "a".repeat(32), epoch: this.epoch}; },
    qualificationReceipt() { return {material_digest: "b".repeat(64)}; },
    beginAgentConstruction(expected, candidate) {
      assert.deepEqual(expected, manifest.structure.creation_delta);
      assert.equal(candidate, authority);
      this.state = "checking-agent";
      return {};
    },
    commitAgentConstruction(_token, actual) {
      assert.deepEqual(actual, manifest.structure.creation_delta);
      this.epoch += 1;
      this.state = "qualified";
      return this.snapshot();
    },
    revoke() { this.state = "revoked"; },
  };
  const sessions = new Map();
  const pending = new Map();
  const pendingStep = new Map();
  const durableSessions = new Map();
  const agents = new Map();
  const workspaces = new Map();
  const cancelled = [];
  const listeners = new Map();
  let hiddenModelMethod = null;
  let factory;
  const root = {
    on(name, listener) {
      const group = listeners.get(name) ?? [];
      group.push(listener);
      listeners.set(name, group);
    },
    get(name) {
      if (name !== "sessionPersistence") return undefined;
      return {async open(id, mode) {
        assert.equal(mode, "read");
        const session = durableSessions.get(id);
        if (!session) throw new Error("fixture.session-not-persisted");
        return {header: {...session.header, delegationDepth: session.header.delegationDepth ?? 0},
          async read() { return {events: session.snapshotEvents()}; },
          async close() {}};
      }};
    },
    agentDefaultModel: {currentSelection: () => ({provider: "local", model: "test-model"})},
    sessions: {
      installAppendAdmissionFactoryV1(value) { assert.equal(factory, undefined); factory = value; },
      get(id) { return sessions.get(id); },
      list() { return [...sessions.values()]; },
      async flush() { return true; },
    },
    agents: {
      get(id) { return agents.get(id); },
      async resume(options) {
        await pauseResume?.();
        const session = durableSessions.get(options.resumeSessionId);
        const selectedOwner = root[DSH_WEB_HOST_OWNER_SYMBOL];
        selectedOwner.assertNativeResumeOpen(options.resumeSessionId);
        selectedOwner.assertNativeResumeLoaded({sessionId: options.resumeSessionId,
          header: {...session.header, delegationDepth: session.header.delegationDepth ?? 0},
          events: [...session.snapshotEvents(), ...(tamperResume
            ? [{type: "session/end-seed", seq: session.snapshotEvents().length, data: {}}] : [])],
          closers: []});
        throw new Error("fixture.resume-after-cursor-check");
      },
      async create(options) {
        const session = Session.create(options.sessionId, undefined,
          {version: 3, id: options.sessionId, createdAt: Date.now(),
            isSeeded: false, ...options.meta});
        factory(session);
        const agent = {id: options.sessionId, session, inbox: {
          get nextTurn() { return pending.get(options.sessionId) ?? []; },
          get nextStep() { return pendingStep.get(options.sessionId) ?? []; },
        }, ctx: {mount: {
          presetId: "are-read-only", fiber: {uid: nextFiber++}},
          tools: {schemas: () => []}}};
        await options.setup(agent.ctx, agent);
        if (failPublication) throw new Error("fixture.native-publication-failed");
        sessions.set(agent.id, session);
        durableSessions.set(agent.id, session);
        agents.set(agent.id, agent);
        return {agent, async dispose() { agents.delete(agent.id); sessions.delete(agent.id); }};
      },
    },
  };
  root.root = root;
  root.workspaceRegistry = {
    async create(path) {
      const existing = [...workspaces.values()].find((item) => item.path === path);
      if (existing) return existing;
      const selected = {id: "workspace-local", path, title: "Local workspace",
        sessionIds: [], createdAt: "2026-10-05T00:00:00.000Z",
        updatedAt: "2026-10-05T00:00:00.000Z",
        async attachSession(sessionId) { this.sessionIds.unshift(sessionId); }};
      workspaces.set(selected.id, selected);
      return selected;
    },
    get(id) { return workspaces.get(id); },
    list() { return [...workspaces.values()]; },
  };
  const observe_graph = ({agent, other_agents = []}) => {
    const current = new Set(other_agents.map((item) => item.ctx.mount.fiber));
    const categories = new Map();
    for (const fiber of current) categories.set(fiber, "preset-primary");
    if (agent) {
      current.add(agent.ctx.mount.fiber);
      categories.set(agent.ctx.mount.fiber, "preset-primary");
    }
    return {active: current, categories, value: {host_loader_rows: [], unknown: [],
      preset: agent ? preset : null, model_tool_names: []}};
  };
  const ownerStore = {...store, getSession(id) {
    const session = store.getSession(id);
    return !session || hiddenModelMethod === null ? session : {...session,
      requests: session.requests.filter((request) => request.method !== hiddenModelMethod)};
  }, append(args) {
    if (failThreadBound && args.event_kind === "thread-bound") {
      return {ok: false, reason_codes: ["fixture.thread-bound-failed"]};
    }
    if (failDispatchIntent && args.event_kind === "dispatch-intent") {
      return {ok: false, reason_codes: ["fixture.dispatch-intent-failed"]};
    }
    if (failCancelIntent && args.event_kind === "dispatch-intent"
      && args.content?.method === "dsh/web-cancel") {
      return {ok: false, reason_codes: ["fixture.cancel-intent-failed"]};
    }
    if (failQueueRemoveIntent && args.event_kind === "dispatch-intent"
      && args.content?.method === "dsh/web-queue-remove") {
      return {ok: false, reason_codes: ["fixture.queue-remove-intent-failed"]};
    }
    if (failQueueEditIntent && args.event_kind === "dispatch-intent"
      && args.content?.method === "dsh/web-queue-edit") {
      return {ok: false, reason_codes: ["fixture.queue-edit-intent-failed"]};
    }
    if (failQueueSteerIntent && args.event_kind === "dispatch-intent"
      && args.content?.method === "dsh/web-queue-steer") {
      return {ok: false, reason_codes: ["fixture.queue-steer-intent-failed"]};
    }
    return store.append(args);
  }};
  const owner = createDshWebHostOwner({graph, session_store: ownerStore,
    consumer_id: "dsh:web-host-test", workspace_path: dir,
    standing_mount_for: (ctx) => ctx.mount, observe_graph, manifest,
    agent_construction_authority: authority,
    ...(afterNativePrompt ? {after_native_prompt: afterNativePrompt} : {}),
    ...(afterNativeCancel ? {after_native_cancel: afterNativeCancel} : {})});
  owner.hostPrepare(root);
  owner.installSessionFactory(root.sessions);
  graph.state = "qualified";
  const controller = {ctx: root, agents: {
    composeAgent: async () => ({agentPreset: "are-read-only",
      setup: async () => {}}),
    agentOptions: () => ({provider: "test", model: "test"}),
  }, listState: {summaryFor: (session) => ({sessionId: session.id,
    updatedAt: session.header.createdAt, running: false, blank: true,
    cwd: "/private/host/path", projections: {values: {pluginPrivate: "do not expose"}}})},
  commands: {cancel: (request) => { cancelled.push(request.sessionId); return {accepted: true}; },
    updateQueue: (request) => {
      const queue = pending.get(request.sessionId) ?? [];
      const index = queue.findIndex((message) => message.id === request.itemId);
      if (index < 0) throw new Error("fixture.queue-item-not-found");
      if (request.action.kind === "edit") {
        const replacement = {...queue[index], content: request.action.content};
        sessions.get(request.sessionId).append("agent/inbox/spliced", {
          target: "next-turn", start: index, removedCount: 1,
          inserted: [replacement], outcome: "canceled"});
        queue.splice(index, 1, replacement);
      } else if (request.action.kind === "steer") {
        sessions.get(request.sessionId).append("agent/inbox/spliced", {
          target: "next-turn", start: index, removedCount: 1,
          inserted: [], outcome: "canceled"});
        const [message] = queue.splice(index, 1);
        sessions.get(request.sessionId).append("agent/inbox/spliced", {
          target: "next-step", start: 0, inserted: [message]});
        pendingStep.set(request.sessionId, [message]);
      } else {
        sessions.get(request.sessionId).append("agent/inbox/spliced", {
          target: "next-turn", start: index, removedCount: 1, inserted: [], outcome: "canceled"});
        queue.splice(index, 1);
      }
      return {accepted: true};
    },
    prompt: async (request) => {
    if (failNativeBeforeAppend) throw new Error("fixture.native-prompt-before-append-failed");
    const session = sessions.get(request.sessionId);
    const message = createUserMessage({content: request.content,
      source: {kind: "user", rpcId: request.requestId}});
    session.append("agent/inbox/spliced", {target: request.mode === "steer" ? "next-step" : "next-turn", start: 0,
      inserted: [message]});
    if (request.mode === "steer") pendingStep.set(request.sessionId, [message]);
    else {
      const queue = pending.get(request.sessionId) ?? [];
      queue.push(message);
      pending.set(request.sessionId, queue);
    }
    return {accepted: true};
  }}};
  owner.registerController(controller);
  return {dir, store, owner, graph, controller, sessions, agents, root, cancelled,
    hideModelIntent(method) { hiddenModelMethod = method; },
    emitSessionEvent(session, event) {
      for (const listener of listeners.get("session/event") ?? []) listener(session, event);
    },
    close() { store.close(); rmSync(dir, {recursive: true, force: true}); }};
}

test("Host owner binds and activates only a fresh native Agent before prompt admission", async () => {
  const h = harness();
  try {
    await assert.rejects(h.owner.create(h.controller, {sessionId: "caller-id"}),
      /create-request-not-fresh/u);
    await assert.rejects(h.owner.create(h.controller, {cwd: "/tmp"}),
      /create-request-not-fresh/u);
    await assert.rejects(h.root.agents.create({sessionId: "session-direct-writer",
      meta: {cwd: h.dir}, setup: async () => {}}), /creation-permit-invalid/u);
    const {workspaceId} = await h.owner.ensureWorkspace();
    await assert.rejects(h.owner.create(h.controller, {workspaceId: "foreign"}),
      /create-request-not-fresh/u);
    const created = await h.owner.create(h.controller, {});
    assert.match(created.sessionId, /^session-[0-9a-f-]+$/u);
    const bound = h.store.getSession("dsh:web-host-test");
    assert.equal(bound.backend_adapter_id, DSH_WEB_BACKEND_ADAPTER_ID);
    assert.equal(bound.thread_refs.length, 1);
    assert.equal(bound.conversation_binding_events.length, 2);
    assert.equal(bound.conversation_binding_events[0].kind, "bound");
    assert.equal(bound.conversation_binding_events[1].kind, "activated");
    const request = {sessionId: created.sessionId, requestId: "host-owned-prompt",
      mode: "queue", content: [{type: "text", text: "explain this architecture"}]};
    assert.deepEqual(await h.owner.prompt(h.controller, request), {accepted: true});
    const prepared = h.store.getSession("dsh:web-host-test").host_observations.find((item) =>
      item.kind === "dsh-are-preparation-observed");
    assert.equal(prepared.thread_ref, bound.thread_refs[0]);
    assert.match(prepared.route_id, /^CA2-ROUTE-/u);
    assert.equal(prepared.authority_effect, "none");
    assert.doesNotMatch(JSON.stringify(prepared), /explain this architecture|selected_items/u);
    const wrongRequest = {...prepared, request_digest: "f".repeat(64)};
    delete wrongRequest.observation_digest;
    wrongRequest.observation_digest = digestValue(wrongRequest);
    assert.deepEqual(h.store.append({event_kind: "host-observation",
      consumer_id: "dsh:web-host-test", content: {observation: wrongRequest}}).reason_codes,
    ["gateway.session-store-dsh-preparation-unbound"]);
    assert.deepEqual(h.store.append({event_kind: "host-observation",
      consumer_id: "dsh:web-host-test", content: {observation: prepared}}).reason_codes,
    ["gateway.session-store-dsh-preparation-unbound"]);
    const session = h.sessions.get(created.sessionId);
    const inserted = session.snapshotEvents()
      .filter((event) => event.type === "agent/inbox/spliced");
    assert.equal(inserted.length, 1);
    const loop = {ctx: {root: h.root}, id: created.sessionId, session};
    assert.throws(() => h.owner.assertModelDispatch(loop), /model-dispatch-unqualified/u);
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    session.append("user/message", inserted[0].data.inserted[0], {surfaceOp: "append"});
    assert.equal(h.owner.assertModelDispatch(loop), true);
    const modelContextText = h.owner.modelContextForDispatch(loop);
    const modelContext = JSON.parse(modelContextText);
    assert.equal(modelContext.schema_version, "are.dsh-web-model-context/v1");
    assert.ok(modelContext.selected_items.length > 0);
    assert.equal(modelContext.selected_items.some((item) => item.item_kind === "request"), false);
    h.hideModelIntent("dsh/web-prompt");
    assert.throws(() => h.owner.modelContextForDispatch(loop), /model-prompt-intent-missing/u);
    h.hideModelIntent(null);
    const modelRequest = {messages: [{role: "system", source: {kind: "plugin",
      plugin: "@cyberalchemy/are"}, content: [{type: "text", text: modelContextText}]},
    {role: "user", content: [{type: "text", text: "explain this architecture"}]}]};
    assert.throws(() => h.owner.recordModelEntry(loop, {...modelRequest,
      messages: [{...modelRequest.messages[0], content: [{type: "text", text: "changed"}]},
        modelRequest.messages[1]]}), /model-request-context-mismatch/u);
    const entryDigest = h.owner.recordModelEntry(loop, modelRequest);
    const entry = h.store.getSession("dsh:web-host-test").host_observations.find((item) =>
      item.observation_digest === entryDigest);
    assert.equal(entry.kind, "dsh-model-entry-intent");
    assert.equal(entry.request_key_digests.length, 1);
    assert.deepEqual(entry.preparation_bindings, [{
      request_key_digest: prepared.request_key_digest,
      request_digest: prepared.request_digest}]);
    for (const preparation_bindings of [[], [{request_key_digest: "f".repeat(64),
      request_digest: prepared.request_digest}], [{request_key_digest: prepared.request_key_digest,
      request_digest: "f".repeat(64)}]]) {
      const invalid = {...entry, preparation_bindings};
      delete invalid.observation_digest;
      invalid.observation_digest = digestValue(invalid);
      assert.equal(h.store.append({event_kind: "host-observation",
        consumer_id: "dsh:web-host-test", content: {observation: invalid}}).ok, false);
    }
    assert.equal(entry.context_digest, digestValue(modelContextText));
    assert.doesNotMatch(JSON.stringify(entry), /explain this architecture|selected_items/u);
    session.append("turn/end", {turn: 1, reason: {kind: "completed"}});
    const second = await h.owner.create(h.controller, {workspaceId});
    assert.notEqual(second.sessionId, created.sessionId);
    assert.equal(h.store.getSession("dsh:web-host-test").conversation_binding_events.length, 4);
    assert.deepEqual(await h.owner.prompt(h.controller, {...request,
      requestId: "first-after-second"}), {accepted: true});
    await assert.rejects(h.owner.prompt(h.controller, {...request, requestId: "steer",
      mode: "steer"}), /prompt-steer-turn-unqualified/u);
    assert.equal(h.store.compact().ok, true);
    h.store.close();
    const reopened = createFileGatewaySessionStore({path: join(h.dir, "gateway.jsonl")});
    try {
      const restored = reopened.getSession("dsh:web-host-test");
      assert.equal(restored.host_observations.find((item) =>
        item.observation_digest === entryDigest)?.kind, "dsh-model-entry-intent");
      assert.deepEqual(restored.host_observations.find((item) =>
        item.observation_digest === entryDigest)?.preparation_bindings,
      entry.preparation_bindings);
      assert.equal(restored.host_observations.find((item) =>
        item.observation_digest === prepared.observation_digest)?.route_id,
      prepared.route_id);
      assert.equal(restored.requests.some((item) => item.method === "dsh/web-prompt"
        && item.binding_digest === entry.request_digests[0]), true);
    } finally { reopened.close(); }
  } finally { h.close(); }
});

test("Host shutdown closes new mutation admission before draining sessions", async () => {
  const h = harness();
  try {
    h.graph.state = "qualified";
    await h.owner.ensureWorkspace();
    assert.deepEqual(await h.owner.beginShutdown(), {active_admissions: 0});
    assert.throws(() => h.owner.create(h.controller, {}), /dsh-web.host-stopping/);
    assert.throws(() => h.owner.resumeReleasedSession("session-00000000-0000-0000-0000-000000000000"),
      /dsh-web.host-stopping/);
    assert.deepEqual(h.owner.liveAgentsSnapshot(), []);
  } finally { h.close(); }
});

test("owned queued prompt removal is observed, durable, and release-reconciled", async () => {
  const h = harness();
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await h.owner.prompt(h.controller, {sessionId, requestId: "remove-me", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]});
    const session = h.sessions.get(sessionId);
    const itemId = session.snapshotEvents().find((event) =>
      event.type === "agent/inbox/spliced").data.inserted[0].id;
    await assert.rejects(h.owner.updateQueue(h.controller, {sessionId, itemId,
      action: {kind: "edit", content: []}}), /queue-edit-unqualified/u);
    assert.deepEqual(await h.owner.updateQueue(h.controller, {sessionId, itemId,
      action: {kind: "edit", content: [{type: "text", text: "explain the edited queue"}]}}),
    {accepted: true});
    const edited = h.store.getSession("dsh:web-host-test");
    assert.equal(edited.requests.find((request) => request.method === "dsh/web-queue-edit")?.status,
      "complete");
    assert.equal(edited.host_observations.filter((item) =>
      item.kind === "dsh-queue-edit-observed").length, 1);
    const preparations = edited.host_observations.filter((item) =>
      item.kind === "dsh-are-preparation-observed");
    assert.equal(preparations.length, 2);
    const editIntent = edited.requests.find((request) => request.method === "dsh/web-queue-edit");
    assert.equal(preparations[1].request_digest, editIntent.binding_digest);
    assert.equal(preparations[1].request_key_digest, digestValue(editIntent.request_key));
    assert.deepEqual(await h.owner.updateQueue(h.controller, {sessionId, itemId,
      action: {kind: "remove"}}), {accepted: true});
    const current = h.store.getSession("dsh:web-host-test");
    const removal = current.requests.find((request) => request.method === "dsh/web-queue-remove");
    const observation = current.host_observations.find((item) =>
      item.kind === "dsh-queue-remove-observed");
    assert.equal(removal.status, "complete");
    assert.equal(observation.request_digest, removal.binding_digest);
    assert.equal(observation.item_id_digest, digestValue(itemId));
    assert.equal(observation.event_digest, digestValue(session.snapshotEvents().at(-1)));
    await assert.rejects(h.owner.updateQueue(h.controller, {sessionId, itemId,
      action: {kind: "remove"}}), /queue-remove-item-unqualified/u);
    const agent = h.agents.get(sessionId);
    assert.equal((await h.owner.disposeNativeAgent(agent)).binding_status, "draining");
    assert.equal((await h.owner.releaseDrainedAgent(agent)).binding_status, "released");
    const released = h.store.getSession("dsh:web-host-test");
    const prompt = released.requests.find((item) => item.method === "dsh/web-prompt");
    const bound = released.conversation_binding_events.find((item) => item.kind === "bound");
    const lateMaterial = {kind: "dsh-model-entry-intent", thread_ref: prompt.thread_ref,
      turn_ref: digestValue("late model attempt"),
      request_key_digests: [digestValue(prompt.request_key)],
      request_digests: [prompt.binding_digest], context_digest: digestValue("late context"),
      model_messages_digest: digestValue("late messages"), native_event_seq: 1,
      binding_id_digest: digestValue(bound.binding.binding_id)};
    assert.deepEqual(h.store.append({event_kind: "host-observation",
      consumer_id: "dsh:web-host-test", content: {observation: {...lateMaterial,
        observation_digest: digestValue(lateMaterial)}}}).reason_codes,
    ["gateway.session-store-dsh-model-entry-unbound"]);
    assert.equal(h.store.compact().ok, true);
  } finally { h.close(); }
});

test("queue removal intent failure leaves the native pending item untouched", async () => {
  const h = harness({failQueueRemoveIntent: true});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await h.owner.prompt(h.controller, {sessionId, requestId: "keep-me", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]});
    const session = h.sessions.get(sessionId);
    const itemId = session.snapshotEvents().find((event) =>
      event.type === "agent/inbox/spliced").data.inserted[0].id;
    const before = session.snapshotEvents().length;
    await assert.rejects(h.owner.updateQueue(h.controller, {sessionId, itemId,
      action: {kind: "remove"}}), /queue-remove-intent-failed/u);
    assert.equal(session.snapshotEvents().length, before);
    assert.equal(h.agents.get(sessionId).inbox.nextTurn[0].id, itemId);
    assert.equal(h.store.getSession("dsh:web-host-test").requests
      .filter((request) => request.method === "dsh/web-queue-remove").length, 0);
  } finally { h.close(); }
});

test("queue edit intent failure leaves the original native text untouched", async () => {
  const h = harness({failQueueEditIntent: true});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await h.owner.prompt(h.controller, {sessionId, requestId: "keep-original", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]});
    const session = h.sessions.get(sessionId);
    const itemId = session.snapshotEvents().find((event) =>
      event.type === "agent/inbox/spliced").data.inserted[0].id;
    const before = session.snapshotEvents().length;
    await assert.rejects(h.owner.updateQueue(h.controller, {sessionId, itemId,
      action: {kind: "edit", content: [{type: "text", text: "explain changed architecture"}]}}),
    /queue-edit-intent-failed/u);
    assert.equal(session.snapshotEvents().length, before);
    assert.deepEqual(h.agents.get(sessionId).inbox.nextTurn[0].content,
      [{type: "text", text: "explain this architecture"}]);
    assert.equal(h.store.getSession("dsh:web-host-test").requests
      .filter((request) => request.method === "dsh/web-queue-edit").length, 0);
  } finally { h.close(); }
});

test("model entry requires the durable edited-context intent", async () => {
  const h = harness();
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await h.owner.prompt(h.controller, {sessionId, requestId: "edit-model-entry",
      mode: "queue", content: [{type: "text", text: "explain this architecture"}]});
    const session = h.sessions.get(sessionId);
    const original = session.snapshotEvents().find((event) =>
      event.type === "agent/inbox/spliced").data.inserted[0];
    await h.owner.updateQueue(h.controller, {sessionId, itemId: original.id,
      action: {kind: "edit", content: [{type: "text", text: "explain revised architecture"}]}});
    const edited = h.agents.get(sessionId).inbox.nextTurn[0];
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    session.append("user/message", edited, {surfaceOp: "append"});
    const loop = {ctx: {root: h.root}, id: sessionId, session};
    const modelContextText = h.owner.modelContextForDispatch(loop);
    assert.equal(JSON.parse(modelContextText).schema_version,
      "are.dsh-web-model-context/v1");
    const modelRequest = {messages: [{role: "system", source: {kind: "plugin",
      plugin: "@cyberalchemy/are"}, content: [{type: "text", text: modelContextText}]},
    {role: "user", content: edited.content}]};
    const entryDigest = h.owner.recordModelEntry(loop, modelRequest);
    const snapshot = h.store.getSession("dsh:web-host-test");
    const entry = snapshot.host_observations.find((item) =>
      item.observation_digest === entryDigest);
    const edit = snapshot.requests.find((item) => item.method === "dsh/web-queue-edit");
    assert.equal(entry.kind, "dsh-model-entry-intent");
    assert.deepEqual(entry.preparation_bindings, [{
      request_key_digest: digestValue(edit.request_key), request_digest: edit.binding_digest}]);
    const stale = {...entry, preparation_bindings: [{
      request_key_digest: entry.request_key_digests[0], request_digest: entry.request_digests[0]}]};
    delete stale.observation_digest;
    stale.observation_digest = digestValue(stale);
    assert.deepEqual(h.store.append({event_kind: "host-observation",
      consumer_id: "dsh:web-host-test", content: {observation: stale}}).reason_codes,
    ["gateway.session-store-dsh-model-entry-unbound"]);
    assert.equal(h.store.compact().ok, true);
    h.hideModelIntent("dsh/web-queue-edit");
    assert.throws(() => h.owner.modelContextForDispatch(loop), /model-edit-intent-missing/u);
  } finally { h.close(); }
});

test("queued and direct steering retain all prompt terminals through cancellation", async () => {
  const h = harness();
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    const first = {sessionId, requestId: "steer-first", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]};
    await h.owner.prompt(h.controller, first);
    const session = h.sessions.get(sessionId);
    const firstMessage = session.snapshotEvents().find((event) =>
      event.type === "agent/inbox/spliced").data.inserted[0];
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    h.agents.get(sessionId).inbox.nextTurn.shift();
    session.append("user/message", firstMessage, {surfaceOp: "append"});
    const agent = h.agents.get(sessionId);
    agent.status = "running";
    agent.phase = {abort: {signal: {aborted: false}}};
    const second = {sessionId, requestId: "steer-second", mode: "queue",
      content: [{type: "text", text: "explain the queued followup"}]};
    await h.owner.prompt(h.controller, second);
    const secondMessage = agent.inbox.nextTurn[0];
    assert.deepEqual(await h.owner.updateQueue(h.controller, {sessionId,
      itemId: secondMessage.id, action: {kind: "steer"}}), {accepted: true});
    assert.equal(agent.inbox.nextTurn.length, 0);
    assert.equal(agent.inbox.nextStep[0].id, secondMessage.id);
    session.append("agent/inbox/spliced", {target: "next-step", start: 0,
      removedCount: 1, inserted: []});
    agent.inbox.nextStep.shift();
    session.append("user/message", secondMessage, {surfaceOp: "append"});
    const third = {sessionId, requestId: "steer-third", mode: "steer",
      content: [{type: "text", text: "explain the direct steering followup"}]};
    assert.deepEqual(await h.owner.prompt(h.controller, third), {accepted: true});
    const thirdMessage = agent.inbox.nextStep[0];
    await assert.rejects(h.owner.prompt(h.controller, {...third,
      requestId: "steer-fourth"}), /prompt-steer-turn-unqualified/u);
    assert.equal(agent.inbox.nextStep.length, 1);
    session.append("agent/inbox/spliced", {target: "next-step", start: 0,
      removedCount: 1, inserted: []});
    agent.inbox.nextStep.shift();
    session.append("user/message", thirdMessage, {surfaceOp: "append"});
    assert.deepEqual(h.owner.cancel(h.controller, {sessionId}), {accepted: true});
    assert.deepEqual(h.cancelled, [sessionId]);
    assert.throws(() => h.owner.cancel(h.controller, {sessionId}),
      /cancel-target-already-requested/u);
    session.append("turn/end", {turn: 1, reason: {kind: "aborted"}});
    const terminal = session.snapshotEvents().at(-1);
    const requests = h.store.getSession("dsh:web-host-test").requests;
    for (const requestId of [first.requestId, second.requestId, third.requestId]) {
      const target = requests.find((item) => item.request_key === `${sessionId}:${requestId}`);
      const material = {kind: "dsh-turn-terminal-observed", thread_ref: target.thread_ref,
        turn_ref: digestValue({session_id: sessionId, turn: 1}),
        request_key_digest: digestValue(target.request_key), request_digest: target.binding_digest,
        event_digest: digestValue(terminal), turn_status: "interrupted"};
      const observation = {...material, observation_digest: digestValue(material)};
      assert.equal(h.store.append({event_kind: "host-observation", consumer_id: "dsh:web-host-test",
        content: {observation}}).ok, true);
    }
    const snapshot = h.store.getSession("dsh:web-host-test");
    assert.equal(snapshot.requests.find((item) => item.method === "dsh/web-queue-steer")?.status,
      "complete");
    assert.equal(snapshot.host_observations.filter((item) =>
      item.kind === "dsh-queue-steer-observed").length, 1);
    assert.equal(snapshot.host_observations.filter((item) =>
      item.kind === "dsh-turn-terminal-observed").length, 3);
    const cancellation = snapshot.requests.find((item) => item.method === "dsh/web-cancel");
    assert.equal(cancellation.target_request_key, `${sessionId}:${first.requestId}`);
    assert.equal((await h.owner.disposeNativeAgent(agent)).binding_status, "draining");
    assert.equal((await h.owner.releaseDrainedAgent(agent)).binding_status, "released");
    assert.equal(h.store.compact().ok, true);
  } finally { h.close(); }
});

test("queue steer intent failure leaves both native inboxes untouched", async () => {
  const h = harness({failQueueSteerIntent: true});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await h.owner.prompt(h.controller, {sessionId, requestId: "active", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]});
    const session = h.sessions.get(sessionId);
    const firstMessage = h.agents.get(sessionId).inbox.nextTurn[0];
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    h.agents.get(sessionId).inbox.nextTurn.shift();
    session.append("user/message", firstMessage, {surfaceOp: "append"});
    const agent = h.agents.get(sessionId);
    agent.status = "running";
    agent.phase = {abort: {signal: {aborted: false}}};
    await h.owner.prompt(h.controller, {sessionId, requestId: "queued", mode: "queue",
      content: [{type: "text", text: "explain the queued followup"}]});
    const itemId = agent.inbox.nextTurn[0].id;
    const before = session.snapshotEvents().length;
    await assert.rejects(h.owner.updateQueue(h.controller, {sessionId, itemId,
      action: {kind: "steer"}}), /queue-steer-intent-failed/u);
    assert.equal(session.snapshotEvents().length, before);
    assert.equal(agent.inbox.nextTurn[0].id, itemId);
    assert.equal(agent.inbox.nextStep.length, 0);
  } finally { h.close(); }
});

test("lost prompt ACK stays uncertain without native consumption", async () => {
  const h = harness({afterNativePrompt: () => { throw new Error("fixture.prompt-ack-lost"); }});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    const prompt = {sessionId, requestId: "uncertain-prompt", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]};
    await assert.rejects(h.owner.prompt(h.controller, prompt), /fixture.prompt-ack-lost/u);
    const session = h.sessions.get(sessionId);
    assert.equal(session.snapshotEvents().filter((event) =>
      event.type === "agent/inbox/spliced").length, 1);
    const request = h.store.getSession("dsh:web-host-test").requests.find((item) =>
      item.request_key === `${sessionId}:${prompt.requestId}`);
    assert.equal(request.status, "outcome-unknown");
    const listed = h.owner.list(h.controller, {}).items.find((item) => item.sessionId === sessionId);
    assert.deepEqual(listed.projections.values.arePromptOutcomes,
      [{requestKeyDigest: digestValue(request.request_key),
        disposition: "uncertain", terminal: null}]);
    assert.doesNotMatch(JSON.stringify(listed), /explain this architecture|uncertain-prompt/u);
    h.controller.controlState = {async *control() {
      yield {type: "baseline", value: {queues: {}, jobs: {}, projections: {}}};
    }};
    const control = h.owner.control(h.controller, new AbortController().signal);
    const baseline = (await control.next()).value;
    assert.deepEqual(baseline.value.projections[sessionId].values.arePromptOutcomes,
      listed.projections.values.arePromptOutcomes);
    assert.doesNotMatch(JSON.stringify(baseline), /explain this architecture|uncertain-prompt/u);
    await control.return();
    await assert.rejects(h.owner.prompt(h.controller, prompt), /prompt-request-replayed/u);
    const agent = h.agents.get(sessionId);
    assert.equal((await h.owner.disposeNativeAgent(agent)).binding_status, "draining");
    await assert.rejects(h.owner.releaseDrainedAgent(agent), /release-outcome-unreconciled/u);
  } finally { h.close(); }
});

test("Web cancel is journaled before native abort and reconciles only with its prompt terminal", async () => {
  const h = harness();
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await assert.rejects(Promise.resolve().then(() => h.owner.cancel(h.controller,
      {sessionId})), /cancel-active-prompt-unverified/u);
    assert.deepEqual(h.cancelled, []);
    const prompt = {sessionId, requestId: "cancel-target", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]};
    assert.deepEqual(await h.owner.prompt(h.controller, prompt), {accepted: true});
    const session = h.sessions.get(sessionId);
    const inserted = session.snapshotEvents().find((event) => event.type === "agent/inbox/spliced");
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    session.append("user/message", inserted.data.inserted[0], {surfaceOp: "append"});
    assert.deepEqual(h.owner.cancel(h.controller, {sessionId}), {accepted: true});
    assert.deepEqual(h.cancelled, [sessionId]);
    assert.throws(() => h.owner.cancel(h.controller, {sessionId}),
      /cancel-target-already-requested/u);
    assert.deepEqual(h.cancelled, [sessionId]);
    const requests = h.store.getSession("dsh:web-host-test").requests;
    const target = requests.find((request) => request.method === "dsh/web-prompt");
    const cancellation = requests.find((request) => request.method === "dsh/web-cancel");
    assert.equal(cancellation.status, "complete");
    assert.equal(cancellation.target_request_key, target.request_key);
    assert.equal(cancellation.target_request_digest, target.binding_digest);
    assert.deepEqual(cancellation.response, {accepted: true});
    session.append("turn/end", {turn: 1, reason: {kind: "aborted"}});
    const agent = h.agents.get(sessionId);
    assert.equal((await h.owner.disposeNativeAgent(agent)).binding_status, "draining");
    await assert.rejects(h.owner.releaseDrainedAgent(agent), /release-outcome-unreconciled/u);
    const terminal = session.snapshotEvents().at(-1);
    const material = {kind: "dsh-turn-terminal-observed", thread_ref: target.thread_ref,
      turn_ref: digestValue({session_id: sessionId, turn: 1}),
      request_key_digest: digestValue(target.request_key), request_digest: target.binding_digest,
      event_digest: digestValue(terminal), turn_status: "interrupted"};
    const observation = {...material, observation_digest: digestValue(material)};
    assert.equal(h.store.append({event_kind: "host-observation", consumer_id: "dsh:web-host-test",
      content: {observation}}).ok, true);
    assert.equal((await h.owner.releaseDrainedAgent(agent)).binding_status, "released");
    assert.equal(h.store.compact().ok, true);
    h.store.close();
    const reopened = createFileGatewaySessionStore({path: join(h.dir, "gateway.jsonl")});
    try {
      const durable = reopened.getSession("dsh:web-host-test");
      const durableCancel = durable.requests.find((request) => request.method === "dsh/web-cancel");
      assert.equal(durableCancel.status, "complete");
      assert.equal(durableCancel.target_request_key, target.request_key);
      assert.equal(durableCancel.target_request_digest, target.binding_digest);
      assert.ok(durable.host_observations.some((item) =>
        item.observation_digest === observation.observation_digest));
      assert.equal(durable.conversation_binding_events.at(-1).kind, "released");
    } finally { reopened.close(); }
  } finally { h.close(); }
});

test("cancel intent failure never reaches the native Agent", async () => {
  const h = harness({failCancelIntent: true});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await h.owner.prompt(h.controller, {sessionId, requestId: "cancel-failed-intent",
      mode: "queue", content: [{type: "text", text: "explain this architecture"}]});
    const session = h.sessions.get(sessionId);
    const inserted = session.snapshotEvents().find((event) => event.type === "agent/inbox/spliced");
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    session.append("user/message", inserted.data.inserted[0], {surfaceOp: "append"});
    assert.throws(() => h.owner.cancel(h.controller, {sessionId}), /cancel-intent-failed/u);
    assert.deepEqual(h.cancelled, []);
    assert.deepEqual(h.store.getSession("dsh:web-host-test").requests
      .filter((request) => request.method === "dsh/web-cancel"), []);
  } finally { h.close(); }
});

test("native cancel with a lost ACK remains uncertain without a terminal observation", async () => {
  const h = harness({afterNativeCancel: () => { throw new Error("fixture.cancel-ack-lost"); }});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    await h.owner.prompt(h.controller, {sessionId, requestId: "uncertain-cancel-target",
      mode: "queue", content: [{type: "text", text: "explain this architecture"}]});
    const session = h.sessions.get(sessionId);
    const inserted = session.snapshotEvents().find((event) => event.type === "agent/inbox/spliced");
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    session.append("user/message", inserted.data.inserted[0], {surfaceOp: "append"});
    assert.throws(() => h.owner.cancel(h.controller, {sessionId}), /fixture.cancel-ack-lost/u);
    assert.deepEqual(h.cancelled, [sessionId]);
    const cancellation = h.store.getSession("dsh:web-host-test").requests
      .find((request) => request.method === "dsh/web-cancel");
    assert.equal(cancellation.status, "outcome-unknown");
    const agent = h.agents.get(sessionId);
    assert.equal((await h.owner.disposeNativeAgent(agent)).binding_status, "draining");
    await assert.rejects(h.owner.releaseDrainedAgent(agent), /release-outcome-unreconciled/u);
  } finally { h.close(); }
});

test("Host workspace setup rejects inherited unbound Sessions before Web can announce them", async () => {
  const h = harness();
  try {
    h.sessions.set("foreign", {id: "foreign"});
    await assert.rejects(h.owner.ensureWorkspace(), /host-sessions-not-fresh/u);
    assert.equal(h.root.workspaceRegistry.list().length, 0);
  } finally { h.close(); }
});

test("Workspace Web stream projects only the fixed Host workspace", async () => {
  const h = harness();
  try {
    await h.owner.ensureWorkspace();
    const controller = {ctx: h.root, feed: {async *follow() {
      yield {type: "baseline", value: {items: [], archivedSessionIds: []}};
    }}};
    h.owner.registerWorkspaceController(controller);
    const stream = h.owner.workspaceFollow(controller, new AbortController().signal);
    const baseline = (await stream.next()).value;
    assert.equal(baseline.type, "baseline");
    assert.deepEqual(baseline.value.archivedSessionIds, []);
    assert.deepEqual(baseline.value.items.map((item) => item.workspaceId),
      ["workspace-local"]);
    assert.deepEqual(baseline.value.items[0].sessionIds, []);
    await stream.return();
  } finally { h.close(); }
});

test("Model catalog exposes only the Host-selected route", () => {
  const h = harness();
  try {
    assert.deepEqual(h.owner.modelCatalog(h.controller), {
      default: {provider: "local", model: "test-model"},
      routableProviders: ["local"],
      groups: [{id: "local", name: "local", models: [{id: "test-model", name: "test-model"}]}],
      failures: [],
    });
  } finally { h.close(); }
});

test("Web search matches only projected public text in owned Sessions", async () => {
  const h = harness();
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    h.sessions.get(sessionId).snapshotEvents = () => [
      {type: "assistant/message", seq: 0, time: 10, surfaceOp: "append",
        data: {turn: 1, step: 1, message: {id: "reply-1", role: "assistant",
          source: {kind: "model", provider: "local", model: "test-model"},
          content: [{type: "reasoning", text: "private keyword"},
            {type: "text", text: "public answer"}]}}},
      {type: "user/message", seq: 1, time: 11, surfaceOp: "append",
        data: {id: "user-1", role: "user", source: {kind: "user"},
          content: [{type: "text", text: "visible question"}]}},
    ];
    assert.deepEqual(h.owner.search(h.controller, {query: "private"}),
      {items: [], hasMore: false});
    assert.deepEqual(h.owner.search(h.controller, {query: "ANSWER"}),
      {items: [{sessionId, snippet: "public answer"}], hasMore: false});
    assert.deepEqual(h.owner.search(h.controller, {query: "question"}),
      {items: [{sessionId, snippet: "visible question"}], hasMore: false});
    assert.throws(() => h.owner.search(h.controller, {query: "  "}),
      /search-query-invalid/u);
  } finally { h.close(); }
});

test("pre-insertion failure leaves no gateway prompt intent or native inbox entry", async () => {
  for (const options of [{failNativeBeforeAppend: true}, {failDispatchIntent: true}]) {
    const h = harness(options);
    try {
      const {sessionId} = await h.owner.create(h.controller, {});
      await assert.rejects(h.owner.prompt(h.controller, {sessionId, requestId: "first",
        mode: "queue", content: [{type: "text", text: "explain this architecture"}]}));
      assert.deepEqual(h.store.getSession("dsh:web-host-test").requests, []);
      assert.equal(h.sessions.get(sessionId).snapshotEvents()
        .filter((event) => event.type === "agent/inbox/spliced").length, 0);
      assert.equal(h.graph.state, "qualified");
    } finally {h.close();}
  }
});

test("only a durably stopped and reconciled Agent can release its writer", async () => {
  const clean = harness();
  try {
    const {sessionId} = await clean.owner.create(clean.controller, {});
    const agent = clean.agents.get(sessionId);
    await assert.rejects(clean.owner.releaseDrainedAgent(agent), /release-not-drained/u);
    assert.equal((await clean.owner.disposeNativeAgent(agent)).binding_status, "draining");
    assert.equal((await clean.owner.releaseDrainedAgent(agent)).binding_status, "released");
    assert.equal(clean.store.getSession("dsh:web-host-test").conversation_binding_events.at(-1).kind,
      "released");
    const releaseObservation = clean.store.getSession("dsh:web-host-test").host_observations
      .find((observation) => observation.kind === "dsh-session-release-observed");
    assert.equal(releaseObservation.native_session_id_digest.length, 64);
    assert.equal(releaseObservation.native_event_count, agent.session.snapshotEvents().length);
    assert.equal(clean.store.compact().ok, true);
  } finally {clean.close();}

  const uncertain = harness();
  try {
    const {sessionId} = await uncertain.owner.create(uncertain.controller, {});
    await uncertain.owner.prompt(uncertain.controller, {sessionId, requestId: "queued",
      mode: "queue", content: [{type: "text", text: "explain this architecture"}]});
    const agent = uncertain.agents.get(sessionId);
    await uncertain.owner.disposeNativeAgent(agent);
    await assert.rejects(uncertain.owner.releaseDrainedAgent(agent),
      /release-outcome-unreconciled/u);
    assert.equal(uncertain.store.getSession("dsh:web-host-test")
      .conversation_binding_events.at(-1).kind, "draining");
  } finally {uncertain.close();}
});

test("changed native history cannot hand over a released writer", async () => {
  const h = harness({tamperResume: true});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    const agent = h.agents.get(sessionId);
    await h.owner.disposeNativeAgent(agent);
    await h.owner.releaseDrainedAgent(agent);
    await assert.rejects(h.owner.resumeReleasedSession(sessionId),
      /native-resume-cursor-mismatch/u);
    assert.equal(h.store.getSession("dsh:web-host-test").conversation_binding_events
      .filter((event) => event.kind === "handed-over").length, 0);
    assert.equal(h.graph.state, "revoked");
  } finally { h.close(); }
});

test("a second Host resume attempt cannot overlap the first for one Session", async () => {
  let entered;
  let continueResume;
  const arrived = new Promise((resolve) => { entered = resolve; });
  const paused = new Promise((resolve) => { continueResume = resolve; });
  const h = harness({pauseResume: async () => { entered(); await paused; }});
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    const agent = h.agents.get(sessionId);
    await h.owner.disposeNativeAgent(agent);
    await h.owner.releaseDrainedAgent(agent);
    const first = h.owner.resumeReleasedSession(sessionId);
    await arrived;
    await assert.rejects(h.owner.resumeReleasedSession(sessionId),
      /resume-native-id-already-live/u);
    assert.equal(h.store.getSession("dsh:web-host-test").conversation_binding_events
      .filter((event) => event.kind === "handed-over").length, 0);
    continueResume();
    await assert.rejects(first, /fixture.resume-after-cursor-check/u);
  } finally {
    continueResume();
    h.close();
  }
});

test("read-only Web list shows only this Host's live bound Agents", async () => {
  const h = harness();
  try {
    assert.deepEqual(h.owner.list(h.controller, {}), {items: []});
    const created = await h.owner.create(h.controller, {});
    const foreign = {id: "foreign-session", session: {id: "foreign-session"}};
    h.agents.set(foreign.id, foreign);
    const listed = h.owner.list(h.controller, {});
    assert.deepEqual(listed.items.map((item) => item.sessionId), [created.sessionId]);
    assert.deepEqual(Object.keys(listed.items[0]).sort(),
      ["blank", "projections", "running", "sessionId", "updatedAt"]);
    assert.deepEqual(listed.items[0].projections.values,
      {modelSelection: {next: null}});
    assert.throws(() => h.owner.list(h.controller, {cursor: "caller-cursor"}),
      /list-unqualified/u);
  } finally { h.close(); }
});

test("Web history reads only owned sessions and never exports raw reasoning or projections", async () => {
  const h = harness();
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    const assistant = {type: "assistant/message", seq: 1, time: 20, surfaceOp: "append",
      data: {turn: 1, step: 1, stream: [{private: "hidden stream"}],
        message: {id: "reply-1", role: "assistant",
          source: {kind: "model", provider: "local", model: "test", replayState: "hidden"},
          content: [{type: "reasoning", text: "hidden thought"},
            {type: "text", text: "visible reply"}]}}};
    h.controller.history = {
      async page() { return {records: [{type: "event", event: assistant}], hasMore: false}; },
      async *follow() {
        yield {type: "snapshot", header: {version: 3, id: sessionId,
          createdAt: 10, cwd: "/private/path", isSeeded: false}, cursor: 0,
        records: [], hasMore: false, projections: {asOfSeq: 0, values: {private: "hidden"}},
        assistantStream: {activeAttempt: {stream: ["hidden"]}}};
        yield {type: "event", event: assistant};
      },
    };
    const request = {address: {kind: "session", sessionId}, throughSeq: 1};
    const page = await h.owner.page(h.controller, request);
    assert.match(JSON.stringify(page), /visible reply/u);
    assert.doesNotMatch(JSON.stringify(page), /hidden/u);
    const frames = [];
    for await (const frame of h.owner.follow(h.controller,
      {address: request.address, assistantStream: true})) frames.push(frame);
    assert.deepEqual(frames.map((frame) => frame.type), ["snapshot", "event"]);
    assert.deepEqual(frames[0].assistantStream, {revision: 0});
    assert.doesNotMatch(JSON.stringify(frames), /hidden|private\/path/u);
    await assert.rejects(h.owner.page(h.controller,
      {address: {kind: "session", sessionId: "foreign"}, throughSeq: 1}),
    /history-unbound/u);
    await assert.rejects(h.owner.page(h.controller,
      {address: {kind: "subagent", parentSessionId: sessionId}, throughSeq: 1}),
    /history-unqualified/u);
  } finally { h.close(); }
});

test("Web control stream retains only owned session identity and empty status views", async () => {
  const h = harness();
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    h.controller.controlState = {async *control() {
      yield {type: "baseline", value: {queues: {[sessionId]: [{content: "private"}]},
        jobs: {[sessionId]: [{command: "private"}]},
        projections: {[sessionId]: {asOfSeq: 1, values: {private: "hidden"}}}}};
      yield {type: "queue", sessionId, items: [{content: "private"}]};
      yield {type: "projection", sessionId, key: "private", value: "hidden", seq: 1};
      yield {type: "jobs", sessionId: "foreign", jobs: [{command: "private"}]};
    }};
    const frames = [];
    for await (const frame of h.owner.control(h.controller, new AbortController().signal)) {
      frames.push(frame);
    }
    assert.deepEqual(frames.map((frame) => frame.type), ["baseline", "queue"]);
    assert.deepEqual(JSON.parse(JSON.stringify(frames[0].value)),
      {queues: {[sessionId]: []}, jobs: {[sessionId]: []},
        projections: {[sessionId]: {asOfSeq: -1,
          values: {modelSelection: {next: null}}}}});
    assert.deepEqual(frames[1], {type: "queue", sessionId, items: []});
    assert.doesNotMatch(JSON.stringify(frames), /private|hidden|foreign/u);
  } finally { h.close(); }
});

test("Web control stream publishes a newly journaled prompt outcome without private content", async () => {
  const h = harness();
  const abort = new AbortController();
  let control;
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    h.controller.controlState = {async *control(signal) {
      yield {type: "baseline", value: {queues: {}, jobs: {}, projections: {}}};
      await new Promise((resolve) => signal.addEventListener("abort", resolve, {once: true}));
    }};
    control = h.owner.control(h.controller, abort.signal);
    assert.equal((await control.next()).value.type, "baseline");
    await h.owner.prompt(h.controller, {sessionId, requestId: "private-rpc-id",
      mode: "queue", content: [{type: "text", text: "explain this architecture"}]});
    const frame = (await control.next()).value;
    assert.equal(frame.type, "projection");
    assert.equal(frame.sessionId, sessionId);
    assert.equal(frame.key, "arePromptOutcomes");
    assert.equal(frame.value[0].disposition, "accepted");
    assert.equal(frame.value[0].terminal, null);
    assert.equal(frame.seq, h.sessions.get(sessionId).snapshotEvents().at(-1).seq);
    assert.doesNotMatch(JSON.stringify(frame), /private-rpc-id|explain this architecture/u);
    const session = h.sessions.get(sessionId);
    const inserted = session.snapshotEvents().find((event) => event.type === "agent/inbox/spliced")
      .data.inserted[0];
    session.append("turn/start", {turn: 1});
    session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
      removedCount: 1, inserted: []});
    session.append("user/message", inserted, {surfaceOp: "append"});
    const terminal = session.append("turn/end", {turn: 1, reason: {kind: "completed"}});
    h.emitSessionEvent(session, terminal);
    const finished = (await control.next()).value;
    assert.equal(finished.type, "projection");
    assert.equal(finished.key, "arePromptOutcomes");
    assert.equal(finished.value[0].terminal, "completed");
    assert.ok(finished.seq > frame.seq);
    assert.doesNotMatch(JSON.stringify(finished), /private-rpc-id|explain this architecture/u);
  } finally {
    abort.abort();
    await control?.return();
    h.close();
  }
});

test("Host owner fails closed before publication when the first durable claim fails", async () => {
  const h = harness({failThreadBound: true});
  try {
    await assert.rejects(h.owner.create(h.controller, {}), /thread-bound-failed/u);
    assert.equal(h.graph.state, "revoked");
    assert.equal(h.store.getSession("dsh:web-host-test").conversation_binding_events.length, 0);
  } finally { h.close(); }
});

test("a late extra tool revokes the Host before a prompt reaches native append", async () => {
  const h = harness();
  try {
    const created = await h.owner.create(h.controller, {});
    const agent = h.root.agents.get(created.sessionId);
    agent.ctx.tools.schemas = () => [{name: "unreviewed_tool"}];
    await assert.rejects(h.owner.prompt(h.controller, {sessionId: created.sessionId,
      requestId: "late-tool", mode: "queue",
      content: [{type: "text", text: "explain this architecture"}]}),
    /agent-tool-catalog-drift/u);
    assert.equal(h.graph.state, "revoked");
    assert.equal(agent.session.snapshotEvents().filter((event) =>
      event.type === "agent/inbox/spliced").length, 0);
  } finally { h.close(); }
});

test("bound but unpublished Agent remains inactive after a native publication failure", async () => {
  const h = harness({failPublication: true});
  try {
    await assert.rejects(h.owner.create(h.controller, {}), /native-publication-failed/u);
    assert.equal(h.graph.state, "revoked");
    const events = h.store.getSession("dsh:web-host-test").conversation_binding_events;
    assert.equal(events.length, 2);
    assert.equal(events[0].kind, "bound");
    assert.equal(events[1].kind, "quarantined");
  } finally { h.close(); }
});

test("a later Host refuses an unreconciled native writer before startup", async () => {
  const h = harness();
  let reopened;
  try {
    await h.owner.create(h.controller, {});
    const eventCount = h.store.inspect().event_count;
    h.store.close();
    reopened = createFileGatewaySessionStore({path: join(h.dir, "gateway.jsonl")});
    const owner = createDshWebHostOwner({graph: {state: "capturing-boot",
      assertCurrent() {}}, session_store: reopened,
    consumer_id: "dsh:web-host-test", workspace_path: h.dir,
    standing_mount_for: () => null, observe_graph: () => null,
    manifest: {structure: {creation_delta: {}}, preset: {}},
    agent_construction_authority: {}});
    const laterRoot = {};
    laterRoot.root = laterRoot;
    assert.throws(() => owner.hostPrepare(laterRoot), /prior-writer-unreconciled/u);
    assert.equal(reopened.inspect().event_count, eventCount,
      "a rejected Host must not append a new session-started event");
  } finally {
    reopened?.close();
    h.close();
  }
});

test("a later Host refuses a claimed-only native thread before startup", async () => {
  const h = harness();
  let reopened;
  try {
    assert.equal(h.store.append({event_kind: "thread-bound", consumer_id: "dsh:web-host-test",
      content: {thread_ref: `backend-thread:${"a".repeat(64)}`}}).ok, true);
    const eventCount = h.store.inspect().event_count;
    h.store.close();
    reopened = createFileGatewaySessionStore({path: join(h.dir, "gateway.jsonl")});
    const owner = createDshWebHostOwner({graph: {state: "capturing-boot",
      assertCurrent() {}}, session_store: reopened,
    consumer_id: "dsh:web-host-test", workspace_path: h.dir,
    standing_mount_for: () => null, observe_graph: () => null,
    manifest: {structure: {creation_delta: {}}, preset: {}},
    agent_construction_authority: {}});
    const laterRoot = {};
    laterRoot.root = laterRoot;
    assert.throws(() => owner.hostPrepare(laterRoot), /prior-claim-unreconciled/u);
    assert.equal(reopened.inspect().event_count, eventCount);
  } finally {
    reopened?.close();
    h.close();
  }
});

test("a later Host refuses an active handed-over generation before startup", async () => {
  const h = harness();
  let reopened;
  try {
    const {sessionId} = await h.owner.create(h.controller, {});
    const agent = h.agents.get(sessionId);
    await h.owner.disposeNativeAgent(agent);
    await h.owner.releaseDrainedAgent(agent);
    const prior = h.store.getSession("dsh:web-host-test").conversation_binding_events[0].binding;
    const successor = {backend_adapter_id: prior.backend_adapter_id,
      backend_thread_ref: prior.backend_thread_ref, principal_kind: prior.principal_kind,
      principal_ref: prior.principal_ref, workspace_ref: prior.workspace_ref,
      host_instance_ref: "c".repeat(64), client_instance_ref: "d".repeat(64),
      writer_ref: "e".repeat(64), creation_receipt_digest: "f".repeat(64)};
    const context = {};
    const contract = createGatewayBackedConversationBindingContract({session_store: h.store,
      consumer_id: "dsh:web-host-test",
      verify_host_context: (value) => value === context ? successor : null,
      verify_release: () => null,
      verify_handover: () => ({backend_thread_ref: prior.backend_thread_ref,
        previous_writer_ref: prior.writer_ref, next_writer_ref: successor.writer_ref,
        outcome_reconciled: true, proof_digest: "a".repeat(64)})});
    const handed = await contract.handoverReleasedThread({prior_binding_id: prior.binding_id,
      host_context: context, handover_context: context, ttl_ms: 60_000});
    await contract.activate({binding_id: handed.binding_id, host_context: context});
    const eventCount = h.store.inspect().event_count;
    h.store.close();
    reopened = createFileGatewaySessionStore({path: join(h.dir, "gateway.jsonl")});
    const owner = createDshWebHostOwner({graph: {state: "capturing-boot",
      assertCurrent() {}}, session_store: reopened,
    consumer_id: "dsh:web-host-test", workspace_path: h.dir,
    standing_mount_for: () => null, observe_graph: () => null,
    manifest: {structure: {creation_delta: {}}, preset: {}},
    agent_construction_authority: {}});
    const laterRoot = {};
    laterRoot.root = laterRoot;
    assert.throws(() => owner.hostPrepare(laterRoot), /prior-writer-unreconciled/u);
    assert.equal(reopened.inspect().event_count, eventCount);
  } finally {
    reopened?.close();
    h.close();
  }
});

test("a later fresh Host can start after an uncertain writer was quarantined", async () => {
  const h = harness({failPublication: true});
  let reopened;
  try {
    await assert.rejects(h.owner.create(h.controller, {}), /native-publication-failed/u);
    h.store.close();
    reopened = createFileGatewaySessionStore({path: join(h.dir, "gateway.jsonl")});
    const owner = createDshWebHostOwner({graph: {state: "capturing-boot",
      assertCurrent() {}}, session_store: reopened,
    consumer_id: "dsh:web-host-test", workspace_path: h.dir,
    standing_mount_for: () => null, observe_graph: () => null,
    manifest: {structure: {creation_delta: {}}, preset: {}},
    agent_construction_authority: {}});
    const laterRoot = {};
    laterRoot.root = laterRoot;
    assert.doesNotThrow(() => owner.hostPrepare(laterRoot));
    assert.equal(reopened.getSession("dsh:web-host-test").status, "active");
    assert.equal(reopened.getSession("dsh:web-host-test").conversation_binding_events.at(-1).kind,
      "quarantined");
  } finally {
    reopened?.close();
    h.close();
  }
});
