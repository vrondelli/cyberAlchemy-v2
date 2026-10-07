import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {digestValue} from "../src/canonical.mjs";
import {createGatewayBackedConversationBindingContract} from "../src/conversation-binding-contract.mjs";
import {createFileGatewaySessionStore} from "../src/gateway-session-store.mjs";

const consumerId = "codex:binding-fixture";
const storeId = "gateway-store:conversation-binding-fixture";
const threadId = "owned-binding-thread";

function hostAssertion(thread = threadId) {
  const ref = (value) => digestValue(value);
  return {principal_kind: "account", principal_ref: ref("account-fixture"),
    host_instance_ref: ref("host-fixture"), client_instance_ref: ref("client-fixture"),
    workspace_ref: ref("workspace-fixture"), backend_adapter_id: "codex-app-server/v1",
    backend_thread_ref: ref(thread), writer_ref: ref("writer-fixture"),
    creation_receipt_digest: ref("native-creation-fixture")};
}

function openedStore(path) {
  return createFileGatewaySessionStore({path, store_id: storeId});
}

function startOwnedSession(store) {
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("fixture-resume-token")}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
}

function contract(store, verdict, assertion = hostAssertion()) {
  return createGatewayBackedConversationBindingContract({session_store: store,
    consumer_id: consumerId, verify_host_context: (input) => input === verdict ? assertion : null,
    verify_release: () => null, now: () => 1_000});
}

test("gateway writer durably owns binding events across compaction and restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-binding-gateway-"));
  const path = join(directory, "sessions.jsonl");
  const verdict = Symbol("host-owned assertion");
  let store;
  try {
    store = openedStore(path);
    startOwnedSession(store);
    const first = contract(store, verdict);
    const bound = await first.bindNewThread({host_context: verdict, ttl_ms: 5_000});
    await first.activate({binding_id: bound.binding_id, host_context: verdict});
    assert.equal(store.getSession(consumerId).conversation_binding_events.length, 2);
    const inspected = store.inspect().sessions.find((session) => session.consumer_id === consumerId);
    assert.equal(inspected.conversation_binding_event_count, 2);
    assert.equal(Object.hasOwn(inspected, "conversation_binding_events"), false,
      "observation indexes must not expose principal or workspace binding records");
    assert.equal((await first.authorizeTurn({binding_id: bound.binding_id,
      host_context: verdict})).backend_thread_ref, digestValue(threadId));

    const stale = contract(store, verdict);
    await first.drain({binding_id: bound.binding_id, host_context: verdict});
    await assert.rejects(stale.authorizeTurn({binding_id: bound.binding_id,
      host_context: verdict}), /binding.store-drift/u);
    assert.equal(store.compact().ok, true);
    store.close();
    store = openedStore(path);
    const resumed = contract(store, verdict);
    assert.equal(resumed.get(bound.binding_id).status, "draining");
    await assert.rejects(resumed.authorizeTurn({binding_id: bound.binding_id,
      host_context: verdict}), /binding.not-active/u);
    assert.equal(store.getSession(consumerId).conversation_binding_events.length, 3);
  } finally {
    store?.close();
    await rm(directory, {recursive: true, force: true});
  }
});

test("uncertain native publication remains quarantined after gateway restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-binding-quarantine-"));
  const path = join(directory, "sessions.jsonl");
  const verdict = Symbol("host-owned creation");
  let store;
  try {
    store = openedStore(path);
    startOwnedSession(store);
    const owner = contract(store, verdict);
    const bound = await owner.bindNewThread({host_context: verdict, ttl_ms: 5_000});
    await owner.quarantine({binding_id: bound.binding_id, host_context: verdict,
      reason_code: "native-publication-unconfirmed"});
    assert.equal(store.getSession(consumerId).conversation_binding_events.at(-1).kind, "quarantined");
    assert.equal(store.compact().ok, true);
    store.close();
    store = openedStore(path);
    const recovered = contract(store, verdict);
    assert.equal(recovered.get(bound.binding_id).status, "quarantined");
    await assert.rejects(recovered.authorizeTurn({binding_id: bound.binding_id,
      host_context: verdict}), /binding.not-active/u);
  } finally {
    store?.close();
    await rm(directory, {recursive: true, force: true});
  }
});

test("released writer handover is durably replayed through gateway compaction", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-binding-handover-"));
  const path = join(directory, "sessions.jsonl");
  const first = Symbol("first host");
  const second = Symbol("verified resumed host");
  const predecessor = hostAssertion();
  const successor = {...predecessor, host_instance_ref: digestValue("resumed-host"),
    client_instance_ref: digestValue("resumed-client"),
    writer_ref: digestValue("resumed-writer"),
    creation_receipt_digest: digestValue("native-resume-receipt")};
  let store;
  try {
    store = openedStore(path);
    startOwnedSession(store);
    const options = () => ({session_store: store, consumer_id: consumerId,
      verify_host_context: (context) => context === first ? predecessor
        : context === second ? successor : null,
      verify_release: () => ({backend_thread_ref: predecessor.backend_thread_ref,
        writer_ref: predecessor.writer_ref, outcome_reconciled: true,
        proof_digest: digestValue("terminal-watermark")}),
      verify_handover: () => ({backend_thread_ref: predecessor.backend_thread_ref,
        previous_writer_ref: predecessor.writer_ref,
        next_writer_ref: successor.writer_ref, outcome_reconciled: true,
        proof_digest: digestValue("native-resume-cursor")}),
      now: () => 1_000});
    const owner = createGatewayBackedConversationBindingContract(options());
    const bound = await owner.bindNewThread({host_context: first, ttl_ms: 5_000});
    await owner.activate({binding_id: bound.binding_id, host_context: first});
    await owner.drain({binding_id: bound.binding_id, host_context: first});
    await owner.release({binding_id: bound.binding_id, host_context: first,
      release_context: first});
    const next = await owner.handoverReleasedThread({prior_binding_id: bound.binding_id,
      host_context: second, handover_context: second, ttl_ms: 5_000});
    await owner.activate({binding_id: next.binding_id, host_context: second});
    assert.equal(store.getSession(consumerId).conversation_binding_events.at(-2).kind, "handed-over");
    assert.equal(store.compact().ok, true);
    store.close();
    store = openedStore(path);
    const recovered = createGatewayBackedConversationBindingContract(options());
    assert.equal(recovered.get(bound.binding_id).status, "released");
    assert.equal(recovered.get(next.binding_id).generation, 2);
    assert.equal((await recovered.authorizeTurn({binding_id: next.binding_id,
      host_context: second, generation: 2})).ok, true);
  } finally {
    store?.close();
    await rm(directory, {recursive: true, force: true});
  }
});

test("unowned native thread and failed append never produce an authorizing binding", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-binding-denial-"));
  const path = join(directory, "sessions.jsonl");
  const verdict = Symbol("host-owned assertion");
  let store;
  try {
    store = openedStore(path);
    startOwnedSession(store);
    const wrongThread = contract(store, verdict, hostAssertion("foreign-thread"));
    await assert.rejects(wrongThread.bindNewThread({host_context: verdict,
      ttl_ms: 5_000}), /binding.persistence-indeterminate/u);
    assert.equal(store.getSession(consumerId).conversation_binding_events.length, 0);
    await assert.rejects(wrongThread.bindNewThread({host_context: verdict,
      ttl_ms: 5_000}), /binding.persistence-indeterminate/u);

    const owner = contract(store, verdict);
    store.close();
    await assert.rejects(owner.bindNewThread({host_context: verdict,
      ttl_ms: 5_000}), /binding.persistence-indeterminate/u);
    store = openedStore(path);
    assert.equal(store.getSession(consumerId).conversation_binding_events.length, 0);
  } finally {
    store?.close();
    await rm(directory, {recursive: true, force: true});
  }
});

test("gateway binding journal reuses one writer for a DSH adapter without granting Web ingress", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-dsh-binding-gateway-"));
  const path = join(directory, "sessions.jsonl");
  const dshConsumer = "dsh:binding-fixture";
  const dshAdapter = "deepseek-harness-headless/v1";
  const dshThread = "dsh-thread-binding-fixture";
  const verdict = Symbol("dsh-host-owned assertion fixture");
  const assertion = {...hostAssertion(dshThread), backend_adapter_id: dshAdapter};
  let store;
  try {
    store = openedStore(path);
    assert.equal(store.append({event_kind: "session-started", consumer_id: dshConsumer,
      content: {lane: "interaction-bound", backend_adapter_id: dshAdapter,
        resume_token_digest: digestValue("dsh-fixture-resume-token")}}).ok, true);
    assert.equal(store.append({event_kind: "thread-bound", consumer_id: dshConsumer,
      content: {thread_ref: `backend-thread:${digestValue(dshThread)}`}}).ok, true);
    const makeContract = (host = assertion) => createGatewayBackedConversationBindingContract({
      session_store: store, consumer_id: dshConsumer,
      verify_host_context: (input) => input === verdict ? host : null,
      verify_release: () => null, now: () => 1_000,
    });
    const owner = makeContract();
    const bound = await owner.bindNewThread({host_context: verdict, ttl_ms: 5_000});
    await owner.activate({binding_id: bound.binding_id, host_context: verdict});
    assert.equal((await owner.authorizeTurn({binding_id: bound.binding_id,
      host_context: verdict})).backend_thread_ref, digestValue(dshThread));
    assert.equal(store.getSession(dshConsumer).conversation_binding_events.length, 2);

    await assert.rejects(makeContract({...assertion, writer_ref: digestValue("second-writer")})
      .authorizeTurn({binding_id: bound.binding_id, host_context: verdict}),
    /binding.host-identity-mismatch/u);
    await assert.rejects(makeContract({...assertion, backend_adapter_id: "codex-app-server/v1"})
      .authorizeTurn({binding_id: bound.binding_id, host_context: verdict}),
    /binding.host-identity-mismatch/u);
    assert.equal(store.getSession(dshConsumer).conversation_binding_events.length, 2);
    assert.equal(store.compact().ok, true);
    store.close();
    store = openedStore(path);
    const resumed = makeContract();
    assert.equal((await resumed.authorizeTurn({binding_id: bound.binding_id,
      host_context: verdict})).backend_thread_ref, digestValue(dshThread));
  } finally {
    store?.close();
    await rm(directory, {recursive: true, force: true});
  }
});

test("an inner binding alteration is rejected even if outer gateway hashes are repaired", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-binding-tamper-"));
  const path = join(directory, "sessions.jsonl");
  const verdict = Symbol("host-owned assertion");
  let store;
  try {
    store = openedStore(path);
    startOwnedSession(store);
    const owner = contract(store, verdict);
    await owner.bindNewThread({host_context: verdict, ttl_ms: 5_000});
    store.close();
    store = null;
    const records = (await readFile(path, "utf8")).trimEnd().split("\n").map(JSON.parse);
    const bindingRecord = records.find((event) => event.event_kind === "conversation-binding-event");
    bindingRecord.content.binding_event.binding.workspace_ref = digestValue("forged-workspace");
    let previous = null;
    for (const record of records) {
      record.previous_event_digest = previous;
      const {event_digest: _digest, ...material} = record;
      record.event_digest = digestValue(material);
      previous = record.event_digest;
    }
    await writeFile(path, `${records.map((event) => JSON.stringify(event)).join("\n")}\n`, {mode: 0o600});
    assert.throws(() => openedStore(path), /conversation-binding-invalid/u);
  } finally {
    store?.close();
    await rm(directory, {recursive: true, force: true});
  }
});
