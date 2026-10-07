import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {createDshWebPreparationWorker, createDshWebPromptPermitBroker,
  prepareAreRepositoryWebPrompt} from "../src/web-prompt-permit.mjs";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Session} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-session")).href);
const {createUserMessage} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href);

function setup(id = "are-web-permit-detached") {
  const session = Session.create(id);
  const agent = {id, session};
  const broker = createDshWebPromptPermitBroker({verify_host_binding: async ({agent: current, generation}) => ({
    host_principal: "disposable-test-host", native_session_id: current.id, agent_generation: generation,
  })});
  broker.installSession(session);
  broker.activateAgent(agent);
  return {session, agent, broker};
}

function request(sessionId, requestId = "are-web-request", text = "explain this architecture", mode = "queue") {
  return {sessionId, requestId, mode, content: [{type: "text", text}]};
}

function insert(session, req) {
  const message = createUserMessage({content: req.content, source: {kind: "user", rpcId: req.requestId}});
  const event = session.append("agent/inbox/spliced", {
    target: req.mode === "steer" ? "next-step" : "next-turn", start: 0, inserted: [message],
  });
  return {message, event};
}

function claim(session) {
  return session.append("agent/inbox/spliced", {
    target: "next-turn", start: 0, removedCount: 1, inserted: [],
  });
}

test("a resumed binding starts prompt admission at its journal generation", async () => {
  const session = Session.create("are-web-resumed-generation");
  const agent = {id: session.id, session};
  const broker = createDshWebPromptPermitBroker({verify_host_binding: async ({generation}) => ({
    host_principal: "resumed-local-host", native_session_id: agent.id,
    agent_generation: generation,
  })});
  broker.installSession(session);
  broker.activateAgent(agent, {generation: 2});
  assert.throws(() => broker.activateAgent(agent, {generation: 2}), /agent-generation-invalid/u);
  const req = request(session.id, "resumed-prompt");
  const accepted = await broker.admitPrompt({agent, request: req, invoke: () => {
    insert(session, req);
    return {accepted: true};
  }});
  assert.equal(accepted.accepted.accepted, true);
});

test("real ARE route/context preparation is bound to the exact text request", () => {
  const prepared = prepareAreRepositoryWebPrompt({session_id: "dsh-test-session",
    request_id: "dsh-test-request", content: [{type: "text", text: "explain this architecture"}]});
  assert.equal(prepared.schema_version, "are.dsh-web-prompt-preparation/v1");
  assert.equal(prepared.route_id, "CA2-ROUTE-UNDERSTAND");
  assert.match(prepared.route_receipt_digest, /^[0-9a-f]{64}$/u);
  assert.match(prepared.context_result_digest, /^[0-9a-f]{64}$/u);
  assert.match(prepared.context_envelope_digest, /^[0-9a-f]{64}$/u);
  assert.match(prepared.model_context_digest, /^[0-9a-f]{64}$/u);
  const modelContext = JSON.parse(prepared.model_context);
  assert.equal(modelContext.schema_version, "are.dsh-web-model-context/v1");
  assert.equal(modelContext.context_envelope_digest, prepared.context_envelope_digest);
  assert.ok(modelContext.selected_items.length > 0);
  assert.equal(modelContext.selected_items.some((item) => item.item_kind === "request"), false);
  assert.ok(Buffer.byteLength(prepared.model_context) <= 32 * 1024);
  assert.throws(() => prepareAreRepositoryWebPrompt({session_id: "dsh-test-session",
    request_id: "dsh-test-request", content: [{type: "image", url: "example"}]}),
  /prompt-preparation-input-invalid/u);
});

test("separate ARE preparation worker matches local preparation and fails closed after exit", async () => {
  const input = {session_id: "dsh-worker-test", request_id: "worker-request",
    content: [{type: "text", text: "explain this architecture"}]};
  const worker = await createDshWebPreparationWorker();
  try {
    assert.deepEqual(await worker.prepare(input), prepareAreRepositoryWebPrompt(input));
    await assert.rejects(worker.prepare({...input, content: [{type: "image", url: "invalid"}]}),
      /preparation-worker-denied/u);
  } finally { await worker.close(); }
  await assert.rejects(worker.prepare(input), /preparation-worker-unavailable/u);
  const session = Session.create(input.session_id);
  const agent = {id: session.id, session};
  const broker = createDshWebPromptPermitBroker({
    prepare: (value) => worker.prepare(value),
    verify_host_binding: async ({generation}) => ({host_principal: "worker-test-host",
      native_session_id: agent.id, agent_generation: generation}),
  });
  broker.installSession(session);
  broker.activateAgent(agent);
  let nativeInvoked = false;
  await assert.rejects(broker.admitPrompt({agent,
    request: request(agent.id, input.request_id), invoke: () => {
      nativeInvoked = true;
      return {accepted: true};
    }}), /preparation-worker-unavailable/u);
  assert.equal(nativeInvoked, false);
  assert.equal(session.snapshotEvents().length, 0);
});

test("tampered worker context is refused before native prompt append", async () => {
  const tamperCases = [
    (value) => ({...value, model_context_digest: "0".repeat(64)}),
    (value) => {
      const modelContext = JSON.stringify({...JSON.parse(value.model_context),
        route_id: "different-route"});
      return {...value, model_context: modelContext,
        model_context_digest: createHash("sha256").update(JSON.stringify(modelContext)).digest("hex")};
    },
    (value) => ({...value, extra: true}),
  ];
  for (const [index, tamper] of tamperCases.entries()) {
    const session = Session.create(`are-web-tampered-${index}`);
    const agent = {id: session.id, session};
    const broker = createDshWebPromptPermitBroker({
      prepare: async (input) => tamper(prepareAreRepositoryWebPrompt(input)),
      verify_host_binding: async ({generation}) => ({host_principal: "worker-test-host",
        native_session_id: agent.id, agent_generation: generation}),
    });
    broker.installSession(session);
    broker.activateAgent(agent);
    let nativeInvoked = false;
    await assert.rejects(broker.admitPrompt({agent,
      request: request(agent.id, "tampered-context"), invoke: () => {
        nativeInvoked = true;
        return {accepted: true};
      }}), /are-preparation-invalid/u);
    assert.equal(nativeInvoked, false);
    assert.equal(session.snapshotEvents().length, 0);
  }
});

test("one ARE-prepared request admits only its own exact Session insertion", async () => {
  const {session, agent, broker} = setup();
  const req = request(session.id);
  assert.throws(() => insert(session, req), /session append admission denied/u);
  let message;
  const accepted = await broker.admitPrompt({agent, request: req, invoke: () => {
    assert.throws(() => insert(session, {...req, requestId: "wrong-key"}), /session append admission denied/u);
    assert.throws(() => insert(session, {...req, content: [{type: "text", text: "other"}]}),
      /session append admission denied/u);
    ({message} = insert(session, req));
    return {accepted: true};
  }});
  assert.equal(accepted.accepted.accepted, true);
  assert.equal(accepted.preparation.route_id, "CA2-ROUTE-UNDERSTAND");
  assert.throws(() => insert(session, req), /session append admission denied/u);
  assert.throws(() => session.append("user/message", createUserMessage({content: req.content,
    source: {kind: "user", rpcId: "other"}}), {surfaceOp: "append"}), /session append admission denied/u);
  assert.throws(() => claim(session), /session append admission denied/u);
  session.append("turn/start", {turn: 1});
  assert.throws(() => session.append("agent/inbox/spliced", {
    target: "next-turn", start: 0, removedCount: 1, inserted: [], outcome: "canceled",
  }), /session append admission denied/u);
  claim(session);
  assert.throws(() => claim(session), /session append admission denied/u);
  session.append("user/message", message, {surfaceOp: "append"});
  assert.throws(() => session.append("user/message", message, {surfaceOp: "append"}),
    /session append admission denied/u);
  await assert.rejects(broker.admitPrompt({agent, request: req, invoke: () => ({accepted: true})}),
    /prompt-request-replayed/u);
});

test("queue removal requires one scoped permit for the exact pending prompt", async () => {
  const {session, agent, broker} = setup("are-web-queue-removal");
  const req = request(session.id, "remove-target");
  let message;
  await broker.admitPrompt({agent, request: req, invoke: () => {
    ({message} = insert(session, req));
    return {accepted: true};
  }});
  agent.inbox = {nextTurn: [message]};
  const removal = {sessionId: session.id, itemId: message.id, action: {kind: "remove"}};
  const append = () => session.append("agent/inbox/spliced", {
    target: "next-turn", start: 0, removedCount: 1, inserted: [], outcome: "canceled",
  });
  assert.throws(append, /session append admission denied/u);
  let admissions = 0;
  const result = await broker.admitQueueRemove({agent, request: removal,
    targetRequestId: req.requestId, index: 0,
    on_admission: () => { admissions += 1; },
    invoke: () => { append(); return {accepted: true}; }});
  assert.equal(result.accepted.accepted, true);
  assert.equal(result.event.type, "agent/inbox/spliced");
  assert.equal(admissions, 1);
  assert.throws(append, /session append admission denied/u);
  await assert.rejects(broker.admitQueueRemove({agent, request: removal,
    targetRequestId: req.requestId, index: 0,
    on_admission: () => {}, invoke: () => ({accepted: true})}),
  /queue-remove-unqualified/u);
});

test("queue editing re-prepares the replacement text and preserves the owned item identity", async () => {
  const {session, agent, broker} = setup("are-web-queue-edit");
  const req = request(session.id, "edit-target");
  let message;
  await broker.admitPrompt({agent, request: req, invoke: () => {
    ({message} = insert(session, req));
    return {accepted: true};
  }});
  agent.inbox = {nextTurn: [message]};
  const edit = {sessionId: session.id, itemId: message.id,
    action: {kind: "edit", content: [{type: "text", text: "explain revised architecture"}]}};
  const replacement = {...message, content: edit.action.content};
  const append = (inserted) => session.append("agent/inbox/spliced", {
    target: "next-turn", start: 0, removedCount: 1, inserted: [inserted], outcome: "canceled",
  });
  assert.throws(() => append(replacement), /session append admission denied/u);
  let preparation;
  const result = await broker.admitQueueEdit({agent, request: edit,
    targetRequestId: req.requestId, editRequestId: "queue-edit-1", index: 0,
    on_admission: ({preparation: prepared}) => { preparation = prepared; },
    invoke: () => {
      assert.throws(() => append({...replacement, id: "wrong"}),
        /session append admission denied/u);
      append(replacement);
      agent.inbox.nextTurn[0] = replacement;
      return {accepted: true};
    }});
  assert.equal(result.accepted.accepted, true);
  assert.equal(preparation.request_id, "queue-edit-1");
  assert.equal(preparation.content_digest, result.preparation.content_digest);
  assert.throws(() => append(replacement), /session append admission denied/u);
  const removal = {sessionId: session.id, itemId: message.id, action: {kind: "remove"}};
  await broker.admitQueueRemove({agent, request: removal, targetRequestId: req.requestId,
    index: 0, on_admission: () => {}, invoke: () => {
      session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
        removedCount: 1, inserted: [], outcome: "canceled"});
      agent.inbox.nextTurn.length = 0;
      return {accepted: true};
    }});
});

test("scoped queue steering carries both admitted prompts to one terminal", async () => {
  const {session, agent, broker} = setup("are-web-queue-steer");
  const first = request(session.id, "first-in-turn");
  const second = request(session.id, "steered-second", "explain the queued followup");
  let firstMessage;
  await broker.admitPrompt({agent, request: first, invoke: () => {
    ({message: firstMessage} = insert(session, first));
    return {accepted: true};
  }});
  agent.inbox = {nextTurn: [firstMessage], nextStep: []};
  agent.status = "running";
  agent.phase = {abort: {signal: {aborted: false}}};
  session.append("turn/start", {turn: 1});
  claim(session);
  agent.inbox.nextTurn.shift();
  session.append("user/message", firstMessage, {surfaceOp: "append"});
  let secondMessage;
  await broker.admitPrompt({agent, request: second, invoke: () => {
    ({message: secondMessage} = insert(session, second));
    agent.inbox.nextTurn.push(secondMessage);
    return {accepted: true};
  }});
  const steer = {sessionId: session.id, itemId: secondMessage.id, action: {kind: "steer"}};
  let intents = 0;
  const moved = await broker.admitQueueSteer({agent, request: steer,
    targetRequestId: second.requestId, index: 0,
    on_admission: () => { intents += 1; },
    invoke: () => {
      session.append("agent/inbox/spliced", {target: "next-turn", start: 0,
        removedCount: 1, inserted: [], outcome: "canceled"});
      agent.inbox.nextTurn.shift();
      session.append("agent/inbox/spliced", {target: "next-step", start: 0,
        inserted: [secondMessage]});
      agent.inbox.nextStep.push(secondMessage);
      return {accepted: true};
    }});
  assert.equal(moved.accepted.accepted, true);
  assert.equal(intents, 1);
  assert.equal(moved.removeEvent.type, "agent/inbox/spliced");
  assert.equal(moved.insertEvent.type, "agent/inbox/spliced");
  assert.throws(() => session.append("user/message", secondMessage, {surfaceOp: "append"}),
    /session append admission denied/u);
  session.append("agent/inbox/spliced", {target: "next-step", start: 0,
    removedCount: 1, inserted: []});
  agent.inbox.nextStep.shift();
  session.append("user/message", secondMessage, {surfaceOp: "append"});
  assert.equal(broker.assertModelDispatch(agent), true);
  const modelContext = JSON.parse(broker.modelContextForDispatch(agent));
  assert.equal(modelContext.request_contexts.length, 2);
  assert.ok(Buffer.byteLength(JSON.stringify(modelContext)) <= 32 * 1024);
  const terminal = session.append("turn/end", {turn: 1, reason: {kind: "completed"}});
  assert.deepEqual(broker.terminalForCommittedEvent(session, terminal)?.requestIds,
    [first.requestId, second.requestId]);
});

test("async preparation and Agent replacement cannot lend a permit to another generation", async () => {
  const {session, agent, broker} = setup("are-web-generation");
  const req = request(session.id, "generation-request");
  const delayed = createDshWebPromptPermitBroker({
    verify_host_binding: async ({agent: current, generation}) => {
      return {host_principal: "test", native_session_id: current.id, agent_generation: generation};
    },
  });
  // The patched API is one-shot: a competing owner cannot silently replace it.
  assert.throws(() => delayed.installSession(session), /already installed/u);
  const candidate = broker.admitPrompt({agent, request: req, invoke: () => {
    insert(session, req);
    return {accepted: true};
  }});
  broker.activateAgent({id: session.id, session});
  await assert.rejects(candidate, /agent-generation-changed/u);
  assert.equal(session.snapshotEvents().length, 0);
});

test("post-append ACK loss quarantines the consumed request key", async () => {
  const {session, agent, broker} = setup("are-web-uncertain");
  const req = request(session.id, "uncertain-request");
  await assert.rejects(broker.admitPrompt({agent, request: req, invoke: () => {
    insert(session, req);
    throw new Error("lost-ack");
  }}), /lost-ack/u);
  assert.equal(session.snapshotEvents().length, 1);
  await assert.rejects(broker.admitPrompt({agent, request: req, invoke: () => ({accepted: true})}),
    /prompt-request-replayed/u);
});

test("rejected native append leaves the exact request key retryable", async () => {
  const {session, agent, broker} = setup("are-web-native-append-denial");
  const req = request(session.id, "native-denied-request");
  await assert.rejects(broker.admitPrompt({agent, request: req, invoke: () =>
    insert(session, {...req, content: [{type: "text", text: "different native content"}]})}),
  /session append admission denied/u);
  assert.equal(session.snapshotEvents().length, 0);
  const result = await broker.admitPrompt({agent, request: req, invoke: () => {
    insert(session, req);
    return {accepted: true};
  }});
  assert.equal(result.accepted.accepted, true);
  assert.equal(session.snapshotEvents().length, 1);
});

test("derived pinned Host context needs an actually admitted user message in the active turn", async () => {
  const {session, agent, broker} = setup("are-web-host-context");
  const req = request(session.id, "host-context-request");
  let admitted;
  await broker.admitPrompt({agent, request: req, invoke: () => {
    ({message: admitted} = insert(session, req));
    return {accepted: true};
  }});
  session.append("turn/start", {turn: 1});
  claim(session);
  const instruction = createUserMessage({content: [{type: "text", text: "test instruction"}],
    source: {kind: "agent-instructions", form: "instructions", changes: []}});
  assert.throws(() => session.append("user/message", instruction, {surfaceOp: "append"}),
    /session append admission denied/u);
  session.append("user/message", admitted, {surfaceOp: "append"});
  session.append("user/message", instruction, {surfaceOp: "append"});
  const systemPrompt = createUserMessage({content: [{type: "text", text: "test system context"}],
    source: {kind: "plugin", plugin: "@deepseek-ai/dsh-system-prompt"}});
  session.append("user/message", systemPrompt, {surfaceOp: "append"});
  const unknownPlugin = createUserMessage({content: [{type: "text", text: "untrusted"}],
    source: {kind: "plugin", plugin: "unreviewed-plugin"}});
  assert.throws(() => session.append("user/message", unknownPlugin, {surfaceOp: "append"}),
    /session append admission denied/u);
  session.append("turn/end", {turn: 1, reason: {kind: "completed"}});
  assert.throws(() => session.append("user/message", instruction, {surfaceOp: "append"}),
    /session append admission denied/u);
});

test("missing Host witness and unsupported content never reach native append", async () => {
  const session = Session.create("are-web-host-missing");
  const agent = {id: session.id, session};
  const broker = createDshWebPromptPermitBroker({verify_host_binding: async () => null});
  broker.installSession(session);
  broker.activateAgent(agent);
  const req = request(session.id, "missing-host-request");
  await assert.rejects(broker.admitPrompt({agent, request: req, invoke: () => insert(session, req)}),
    /host-binding-unverified/u);
  await assert.rejects(broker.admitPrompt({agent, request: {...req, requestId: "image-request",
    content: [{type: "image", url: "ignored"}]}, invoke: () => ({accepted: true})}),
  /prompt-unqualified/u);
  assert.equal(session.snapshotEvents().length, 0);
});

test("steering permit cannot be consumed by a queued insertion", async () => {
  const {session, agent, broker} = setup("are-web-steer-target");
  const first = request(session.id, "first-before-steer");
  let firstMessage;
  await broker.admitPrompt({agent, request: first, invoke: () => {
    ({message: firstMessage} = insert(session, first));
    return {accepted: true};
  }});
  agent.inbox = {nextTurn: [firstMessage], nextStep: []};
  agent.status = "running";
  agent.phase = {abort: {signal: {aborted: false}}};
  session.append("turn/start", {turn: 1});
  claim(session);
  agent.inbox.nextTurn.shift();
  session.append("user/message", firstMessage, {surfaceOp: "append"});
  const req = request(session.id, "steer-request", "explain this architecture", "steer");
  await broker.admitPrompt({agent, request: req, invoke: () => {
    const message = createUserMessage({content: req.content,
      source: {kind: "user", rpcId: req.requestId}});
    assert.throws(() => session.append("agent/inbox/spliced", {
      target: "next-turn", start: 0, inserted: [message],
    }), /session append admission denied/u);
    insert(session, req);
    return {accepted: true};
  }});
  const insertions = session.snapshotEvents().filter((event) =>
    event.type === "agent/inbox/spliced" && event.data.inserted.length > 0);
  assert.equal(insertions.length, 2);
  assert.equal(insertions.at(-1).data.target, "next-step");
  const steeredMessage = insertions.at(-1).data.inserted[0];
  agent.inbox.nextStep.push(steeredMessage);
  session.append("agent/inbox/spliced", {target: "next-step", start: 0,
    removedCount: 1, inserted: []});
  agent.inbox.nextStep.shift();
  session.append("user/message", steeredMessage, {surfaceOp: "append"});
  const terminal = session.append("turn/end", {turn: 1, reason: {kind: "completed"}});
  assert.deepEqual(broker.terminalForCommittedEvent(session, terminal)?.requestIds,
    [first.requestId, req.requestId]);
});

test("concurrent prompt scopes cannot borrow each other's prepared key", async () => {
  const {session, agent, broker} = setup("are-web-parallel");
  const first = request(session.id, "parallel-first");
  const second = request(session.id, "parallel-second");
  let arrived = 0;
  let release;
  const barrier = new Promise((resolve) => { release = resolve; });
  const run = (own, other) => broker.admitPrompt({agent, request: own, invoke: async () => {
    arrived += 1;
    if (arrived === 2) release();
    await barrier;
    assert.throws(() => insert(session, other), /session append admission denied/u);
    insert(session, own);
    return {accepted: true};
  }});
  const [a, b] = await Promise.all([run(first, second), run(second, first)]);
  assert.equal(a.accepted.accepted, true);
  assert.equal(b.accepted.accepted, true);
  assert.equal(session.snapshotEvents().length, 2);
});

test("qualified broker binds the exact standing mount and current graph epoch at native append", async () => {
  const session = Session.create("are-web-graph-bound");
  const agent = {id: session.id, session};
  const mount = {presetId: "are-read-only"};
  const graph = {state: "qualified", boot_nonce: "boot-one", epoch: 3, mount,
    session_id: session.id};
  const broker = createDshWebPromptPermitBroker({
    assert_graph_binding: () => ({...graph}),
    verify_host_binding: async ({generation}) => ({host_principal: "local-host",
      native_session_id: session.id, agent_generation: generation}),
  });
  broker.installSession(session);
  broker.activateAgent(agent);
  const oldEpoch = request(session.id, "old-epoch");
  await assert.rejects(broker.admitPrompt({agent, request: oldEpoch, invoke: () => {
    graph.epoch += 1;
    insert(session, oldEpoch);
    return {accepted: true};
  }}), /session append admission denied/u);
  assert.equal(session.snapshotEvents().length, 0);
  const oldMount = request(session.id, "old-mount");
  await assert.rejects(broker.admitPrompt({agent, request: oldMount, invoke: () => {
    graph.mount = {presetId: "are-read-only"};
    insert(session, oldMount);
    return {accepted: true};
  }}), /session append admission denied/u);
  assert.equal(session.snapshotEvents().length, 0);
  await assert.rejects(broker.admitPrompt({agent, request: request(session.id, "mount-still-changed"),
    invoke: () => ({accepted: true})}), /graph-binding-changed/u);
});

test("qualified broker rejects graph drift during asynchronous ARE preparation", async () => {
  const session = Session.create("are-web-graph-preparation");
  const agent = {id: session.id, session};
  const mount = {};
  const graph = {state: "qualified", boot_nonce: "boot-one", epoch: 1, mount,
    session_id: session.id};
  const broker = createDshWebPromptPermitBroker({
    assert_graph_binding: () => ({...graph}),
    verify_host_binding: async ({generation}) => ({host_principal: "local-host",
      native_session_id: session.id, agent_generation: generation}),
    prepare: async (input) => {
      const prepared = prepareAreRepositoryWebPrompt(input);
      graph.state = "revoked";
      return prepared;
    },
  });
  broker.installSession(session);
  broker.activateAgent(agent);
  let invoked = false;
  await assert.rejects(broker.admitPrompt({agent, request: request(session.id, "drift-in-prepare"),
    invoke: () => { invoked = true; return {accepted: true}; }}), /graph-binding-changed/u);
  assert.equal(invoked, false);
  assert.equal(session.snapshotEvents().length, 0);
});

test("model dispatch requires a consumed admitted message in the same graph epoch", async () => {
  const session = Session.create("are-web-model-epoch");
  const agent = {id: session.id, session};
  const graph = {state: "qualified", boot_nonce: "boot-one", epoch: 2,
    mount: {}, session_id: session.id};
  const broker = createDshWebPromptPermitBroker({
    assert_graph_binding: () => ({...graph}),
    verify_host_binding: async ({generation}) => ({host_principal: "local-host",
      native_session_id: session.id, agent_generation: generation}),
  });
  broker.installSession(session);
  broker.activateAgent(agent);
  assert.throws(() => broker.assertModelDispatch(agent), /model-dispatch-unqualified/u);
  const req = request(session.id, "model-epoch-request");
  let admitted;
  await broker.admitPrompt({agent, request: req, invoke: () => {
    ({message: admitted} = insert(session, req));
    return {accepted: true};
  }});
  session.append("turn/start", {turn: 1});
  claim(session);
  assert.throws(() => broker.assertModelDispatch(agent), /model-dispatch-unqualified/u);
  session.append("user/message", admitted, {surfaceOp: "append"});
  assert.equal(broker.assertModelDispatch(agent), true);
  graph.epoch += 1;
  assert.throws(() => broker.assertModelDispatch(agent), /model-dispatch-unqualified/u);
});
