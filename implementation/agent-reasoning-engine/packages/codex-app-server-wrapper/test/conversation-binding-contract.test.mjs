import assert from "node:assert/strict";
import test from "node:test";

import {digestValue} from "../src/canonical.mjs";
import {createConversationBindingContract} from "../src/conversation-binding-contract.mjs";

function ref(value) { return digestValue(value); }

function assertion(overrides = {}) {
  return {principal_kind: "account", principal_ref: ref("account-a"),
    host_instance_ref: ref("host-a"), client_instance_ref: ref("client-a"),
    workspace_ref: ref("workspace-a"), backend_adapter_id: "codex-app-server/v1",
    backend_thread_ref: ref("thread-a"), writer_ref: ref("writer-a"),
    creation_receipt_digest: ref("native-thread-start-a"), ...overrides};
}

function harness() {
  let time = 1_000;
  const assertions = new Map();
  const releases = new Map();
  const create = (initial_events = []) => createConversationBindingContract({
    verify_host_context: (context) => assertions.get(context),
    verify_release: (context) => releases.get(context),
    initial_events, now: () => time,
  });
  return {create, assertions, releases, setTime: (value) => { time = value; }};
}

test("candidate contract requires Host-owned verifiers and rejects caller labels as identity", async () => {
  assert.throws(() => createConversationBindingContract(), /trusted-verifiers-required/u);
  const h = harness();
  const contract = h.create();
  await assert.rejects(contract.bindNewThread({host_context: {consumer_id: "codex:desktop-wsl"},
    ttl_ms: 5_000}), /host-assertion-invalid/u);
  const trusted = Symbol("host-verified-context");
  h.assertions.set(trusted, assertion({principal_ref: "caller-account-label"}));
  await assert.rejects(contract.bindNewThread({host_context: trusted, ttl_ms: 5_000}), /host-assertion-invalid/u);
  assert.equal(contract.events().length, 0);
});

test("one native thread has one writer even after release; unowned resume is denied", async () => {
  const h = harness();
  const first = Symbol("first host verdict");
  const second = Symbol("second host verdict");
  h.assertions.set(first, assertion());
  h.assertions.set(second, assertion({writer_ref: ref("writer-b"),
    client_instance_ref: ref("client-b")}));
  const contract = h.create();
  const bound = await contract.bindNewThread({host_context: first, ttl_ms: 5_000});
  assert.notEqual(bound.conversation_id, bound.binding_id);
  await assert.rejects(contract.authorizeTurn({binding_id: "unowned", host_context: first}), /binding.unowned/u);
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id, host_context: first}), /not-active/u);
  await contract.activate({binding_id: bound.binding_id, host_context: first});
  assert.equal((await contract.authorizeTurn({binding_id: bound.binding_id, host_context: first})).ok, true);
  await contract.drain({binding_id: bound.binding_id, host_context: first});
  const release = Symbol("reconciled host outcome");
  h.releases.set(release, {backend_thread_ref: bound.backend_thread_ref, writer_ref: bound.writer_ref,
    outcome_reconciled: true, proof_digest: ref("terminal-watermark")});
  await contract.release({binding_id: bound.binding_id, host_context: first, release_context: release});
  await assert.rejects(contract.bindNewThread({host_context: second, ttl_ms: 5_000}), /writer-conflict/u);
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id, host_context: first}), /not-active/u);
});

test("a verified competing writer is rejected and quarantines an active binding", async () => {
  const h = harness();
  const first = Symbol("first host verdict");
  const second = Symbol("second host verdict");
  h.assertions.set(first, assertion());
  h.assertions.set(second, assertion({writer_ref: ref("writer-b")}));
  const contract = h.create();
  const bound = await contract.bindNewThread({host_context: first, ttl_ms: 5_000});
  await contract.activate({binding_id: bound.binding_id, host_context: first});
  await assert.rejects(contract.bindNewThread({host_context: second, ttl_ms: 5_000}), /writer-conflict/u);
  assert.equal(contract.get(bound.binding_id).status, "quarantined");
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id, host_context: first}), /not-active/u);
  assert.equal(h.create(contract.events()).get(bound.binding_id).status, "quarantined");
});

test("Host can durably quarantine an uncertain bound writer before activation", async () => {
  const h = harness();
  const owner = Symbol("uncertain native creation");
  h.assertions.set(owner, assertion());
  const contract = h.create();
  const bound = await contract.bindNewThread({host_context: owner, ttl_ms: 5_000});
  await assert.rejects(contract.quarantine({binding_id: bound.binding_id,
    host_context: owner, reason_code: ""}), /quarantine-reason-invalid/u);
  await contract.quarantine({binding_id: bound.binding_id,
    host_context: owner, reason_code: "native-publication-unconfirmed"});
  assert.equal(contract.get(bound.binding_id).status, "quarantined");
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id,
    host_context: owner}), /not-active/u);
  const recovered = h.create(contract.events());
  assert.equal(recovered.get(bound.binding_id).status, "quarantined");
  await assert.rejects(recovered.activate({binding_id: bound.binding_id,
    host_context: owner}), /transition-invalid/u);
});

test("identity, generation, expiry, and uncertain release fail before a turn or writer transfer", async () => {
  const h = harness();
  const owner = Symbol("owner");
  const foreign = Symbol("foreign");
  h.assertions.set(owner, assertion());
  h.assertions.set(foreign, assertion({workspace_ref: ref("workspace-b")}));
  const contract = h.create();
  const bound = await contract.bindNewThread({host_context: owner, ttl_ms: 1_000});
  await contract.activate({binding_id: bound.binding_id, host_context: owner});
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id,
    host_context: foreign}), /host-identity-mismatch/u);
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id,
    host_context: owner, generation: 2}), /generation-mismatch/u);
  h.setTime(2_000);
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id,
    host_context: owner}), /binding.expired/u);
  await contract.drain({binding_id: bound.binding_id, host_context: owner});
  const unproven = Symbol("unproven release");
  h.releases.set(unproven, {backend_thread_ref: bound.backend_thread_ref, writer_ref: bound.writer_ref,
    outcome_reconciled: false, proof_digest: ref("unknown-delivery")});
  await assert.rejects(contract.release({binding_id: bound.binding_id, host_context: owner,
    release_context: unproven}), /release-unverified/u);
  assert.equal(contract.get(bound.binding_id).status, "draining");
});

test("release rejects a journal head that changes while its proof is awaited", async () => {
  const host = Symbol("owner");
  const releaseContext = Symbol("release");
  let resolveProof;
  let markProofRequested;
  const proofRequested = new Promise((resolve) => { markProofRequested = resolve; });
  let journalHead = "before";
  const contract = createConversationBindingContract({
    verify_host_context: (context) => context === host ? assertion() : null,
    verify_release: () => new Promise((resolve) => {
      resolveProof = resolve;
      markProofRequested();
    }),
    verify_release_current: (context) => context === releaseContext && journalHead === "before",
    now: () => 1_000,
  });
  const bound = await contract.bindNewThread({host_context: host, ttl_ms: 5_000});
  await contract.activate({binding_id: bound.binding_id, host_context: host});
  await contract.drain({binding_id: bound.binding_id, host_context: host});
  const pending = contract.release({binding_id: bound.binding_id,
    host_context: host, release_context: releaseContext});
  await proofRequested;
  journalHead = "new-request";
  resolveProof({backend_thread_ref: bound.backend_thread_ref, writer_ref: bound.writer_ref,
    outcome_reconciled: true, proof_digest: ref("old-journal-head")});
  await assert.rejects(pending, /release-stale/u);
  assert.equal(contract.get(bound.binding_id).status, "draining");
  assert.equal(contract.events().at(-1).kind, "draining");
});

test("released native thread handover preserves conversation and advances one writer generation", async () => {
  const first = Symbol("first owner");
  const second = Symbol("second owner");
  const handoverContext = Symbol("verified native resume");
  const original = assertion();
  const successor = assertion({host_instance_ref: ref("host-b"),
    client_instance_ref: ref("client-b"), writer_ref: ref("writer-b"),
    creation_receipt_digest: ref("native-session-resume-b")});
  let head = "released-watermark";
  const assertions = new Map([[first, original], [second, successor]]);
  const options = {verify_host_context: (context) => assertions.get(context),
    verify_release: () => ({backend_thread_ref: original.backend_thread_ref,
      writer_ref: original.writer_ref, outcome_reconciled: true,
      proof_digest: ref("terminal-idle")}),
    verify_handover: (context) => context === handoverContext
      ? {backend_thread_ref: original.backend_thread_ref,
        previous_writer_ref: original.writer_ref, next_writer_ref: successor.writer_ref,
        outcome_reconciled: true, proof_digest: ref("native-resume-and-cursor")}
      : null,
    verify_handover_current: () => head === "released-watermark",
    now: () => 1_000};
  const contract = createConversationBindingContract(options);
  const bound = await contract.bindNewThread({host_context: first, ttl_ms: 5_000});
  await contract.activate({binding_id: bound.binding_id, host_context: first});
  await assert.rejects(contract.handoverReleasedThread({prior_binding_id: bound.binding_id,
    host_context: second, handover_context: handoverContext, ttl_ms: 5_000}), /prior-not-released/u);
  await contract.drain({binding_id: bound.binding_id, host_context: first});
  await contract.release({binding_id: bound.binding_id, host_context: first, release_context: first});
  head = "advanced";
  await assert.rejects(contract.handoverReleasedThread({prior_binding_id: bound.binding_id,
    host_context: second, handover_context: handoverContext, ttl_ms: 5_000}), /handover-stale/u);
  head = "released-watermark";
  const next = await contract.handoverReleasedThread({prior_binding_id: bound.binding_id,
    host_context: second, handover_context: handoverContext, ttl_ms: 5_000});
  assert.equal(next.conversation_id, bound.conversation_id);
  assert.equal(next.backend_thread_ref, bound.backend_thread_ref);
  assert.equal(next.generation, 2);
  assert.equal(next.status, "bound");
  await assert.rejects(contract.authorizeTurn({binding_id: next.binding_id,
    host_context: second, generation: 2}), /not-active/u);
  await contract.activate({binding_id: next.binding_id, host_context: second});
  assert.equal((await contract.authorizeTurn({binding_id: next.binding_id,
    host_context: second, generation: 2})).writer_ref, successor.writer_ref);
  await assert.rejects(contract.authorizeTurn({binding_id: bound.binding_id,
    host_context: first}), /not-active/u);
  await assert.rejects(contract.handoverReleasedThread({prior_binding_id: bound.binding_id,
    host_context: second, handover_context: handoverContext, ttl_ms: 5_000}), /handover-invalid/u);
  const replayed = createConversationBindingContract({...options, initial_events: contract.events()});
  assert.equal(replayed.get(next.binding_id).generation, 2);
  assert.equal((await replayed.authorizeTurn({binding_id: next.binding_id,
    host_context: second, generation: 2})).ok, true);
});

test("candidate event replay preserves ownership and rejects tampering", async () => {
  const h = harness();
  const owner = Symbol("owner");
  h.assertions.set(owner, assertion());
  const contract = h.create();
  const bound = await contract.bindNewThread({host_context: owner, ttl_ms: 5_000});
  await contract.activate({binding_id: bound.binding_id, host_context: owner});
  const events = contract.events();
  const recovered = h.create(events);
  assert.equal(recovered.get(bound.binding_id).status, "active");
  const externallyOwned = structuredClone(events);
  const isolated = h.create(externallyOwned);
  externallyOwned[0].binding.workspace_ref = ref("mutable-caller-data");
  assert.equal(isolated.get(bound.binding_id).workspace_ref, bound.workspace_ref);
  assert.equal(isolated.events()[0].event_digest, events[0].event_digest);
  assert.equal((await recovered.authorizeTurn({binding_id: bound.binding_id,
    host_context: owner})).backend_thread_ref, bound.backend_thread_ref);
  await assert.rejects(recovered.bindNewThread({host_context: owner, ttl_ms: 5_000}), /writer-conflict/u);
  const corrupt = structuredClone(events);
  corrupt[0].binding.workspace_ref = ref("forged-workspace");
  assert.throws(() => h.create(corrupt), /event-invalid/u);
  const incomplete = structuredClone(events);
  incomplete[1].previous_event_digest = ref("foreign-head");
  assert.throws(() => h.create(incomplete), /event-invalid/u);
});
