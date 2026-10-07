import assert from "node:assert/strict";
import test from "node:test";
import {digestValue} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {createConversationBindingContract}
  from "../../codex-app-server-wrapper/src/conversation-binding-contract.mjs";
import {createDshOwnedObjectiveNormalizer} from "../src/web-objective-binding.mjs";
import {createReasoningStateLedger} from "../../reasoning-state-runtime/index.mjs";
import {createOwnedObjectiveLifecycle}
  from "../../codex-app-server-wrapper/src/objective-session-lifecycle.mjs";
import {semanticModulePort}
  from "../../codex-app-server-wrapper/test/semantic-module-fixture.mjs";

const adapter = "deepseek-harness-web/are-v1";
async function fixture() {
  let time = 1000;
  let faulted = false;
  const assertions = new Map();
  const owner = {};
  const assertion = {
    backend_adapter_id: adapter, backend_thread_ref: digestValue({adapter, session_id: "native-a"}),
    principal_kind: "local-host", principal_ref: digestValue("principal"),
    host_instance_ref: digestValue("host-a"), client_instance_ref: digestValue("client-a"),
    workspace_ref: digestValue("workspace"), writer_ref: digestValue("writer-a"),
    creation_receipt_digest: digestValue("created-a"),
  };
  assertions.set(owner, assertion);
  const contract = createConversationBindingContract({
    verify_host_context: context => assertions.get(context), now: () => time,
    verify_release: (_context, binding) => ({backend_thread_ref: binding.backend_thread_ref,
      writer_ref: binding.writer_ref, outcome_reconciled: true, proof_digest: digestValue("released")}),
    verify_handover: (_context, prior, next) => ({backend_thread_ref: prior.backend_thread_ref,
      previous_writer_ref: prior.writer_ref, next_writer_ref: next.writer_ref,
      outcome_reconciled: true, proof_digest: digestValue("native-resume")}),
  });
  const bound = await contract.bindNewThread({host_context: owner, ttl_ms: 5000});
  await contract.activate({binding_id: bound.binding_id, host_context: owner});
  let session = {status: "active", backend_adapter_id: adapter,
    thread_refs: [`backend-thread:${assertion.backend_thread_ref}`],
    conversation_binding_events: contract.events()};
  const normalize = createDshOwnedObjectiveNormalizer({backend_adapter_id: adapter,
    now: () => time, session_store: {
      hasFaultedSession: () => faulted,
      getSession: id => id === "gateway-owner" ? session : null,
    }});
  const input = {consumer_id: "gateway-owner", binding_id: bound.binding_id,
    generation: 1, writer_ref: assertion.writer_ref, session_id: "native-a",
    request_id: "prompt-a", content: [{type: "text", text: "  explain this architecture  "}]};
  return {normalize, input, contract, bound, owner, assertion, assertions,
    setTime: value => {time = value;}, setFault: () => {faulted = true;},
    setSession: value => {session = value;}, getSession: () => session,
    sync: () => {session.conversation_binding_events = contract.events();}};
}

test("DSH normalization joins owned journal and retains exact text, without a dispatch grant", async () => {
  const h = await fixture();
  const result = h.normalize(h.input);
  assert.equal(result.objective_request.request, "  explain this architecture  ");
  assert.equal(result.objective_request.thread_ref, `backend-thread:${h.assertion.backend_thread_ref}`);
  assert.equal(result.binding_evidence.authority_effect, "none");
  assert.equal(result.binding_evidence.binding_head_digest, h.contract.events().at(-1).event_digest);
  assert.equal(Object.isFrozen(result.objective_request), true);
  assert.doesNotMatch(JSON.stringify(result.binding_evidence), /explain this architecture/);
});

test("caller labels, mismatched writer/generation/session, and browser metadata cannot supply identity", async () => {
  const h = await fixture();
  for (const extra of [{consumer_id: "browser-cookie"}, {binding_id: "caller-label"},
    {writer_ref: digestValue("foreign")}, {generation: 2}, {session_id: "native-b"},
    {principal_ref: h.assertion.principal_ref}, {content: [{type: "image", url: "local"}]},
    {content: [{type: "text", text: ""}]}, {content: [{type: "text", text: "x".repeat(262144)}]}]) {
    assert.throws(() => h.normalize({...h.input, ...extra}), /objective-(input-invalid|session-not-active|binding-not-current)/);
  }
});

test("inactive, expired, future-clock, missing thread and faulted journal refuse interpretation", async () => {
  for (const mutation of [h => h.setTime(6000), h => h.setTime(999), h => h.setFault(),
    h => h.setSession({...h.getSession(), status: "closed"}),
    h => h.setSession({...h.getSession(), thread_refs: []})]) {
    const h = await fixture(); mutation(h);
    assert.throws(() => h.normalize(h.input), /dsh-web.objective-/);
  }
  const h = await fixture();
  await h.contract.drain({binding_id: h.bound.binding_id, host_context: h.owner}); h.sync();
  assert.throws(() => h.normalize(h.input), /binding-not-current/);
});

test("tampered journal chain is rejected rather than trusting latest active label", async () => {
  const h = await fixture();
  const events = structuredClone(h.contract.events());
  events[0].binding.principal_ref = digestValue("forged");
  h.setSession({...h.getSession(), conversation_binding_events: events});
  assert.throws(() => h.normalize(h.input), /binding.event-invalid/);
});

test("verified released-session handover preserves objective scope but rejects the old writer", async () => {
  const h = await fixture();
  const before = h.normalize(h.input);
  await h.contract.drain({binding_id: h.bound.binding_id, host_context: h.owner});
  await h.contract.release({binding_id: h.bound.binding_id, host_context: h.owner, release_context: {}});
  const nextOwner = {};
  h.assertions.set(nextOwner, {...h.assertion, writer_ref: digestValue("writer-b"),
    host_instance_ref: digestValue("host-b"), client_instance_ref: digestValue("client-b")});
  h.setTime(2000);
  const next = await h.contract.handoverReleasedThread({prior_binding_id: h.bound.binding_id,
    host_context: nextOwner, handover_context: {}, ttl_ms: 5000});
  await h.contract.activate({binding_id: next.binding_id, host_context: nextOwner}); h.sync();
  assert.throws(() => h.normalize(h.input), /binding-not-current/);
  const after = h.normalize({...h.input, binding_id: next.binding_id,
    generation: next.generation, writer_ref: next.writer_ref});
  assert.deepEqual(after.objective_request, before.objective_request);
  assert.notDeepEqual(after.binding_evidence, before.binding_evidence);
});

test("a distinct Host queue-edit request keeps the scope without overwriting prompt identity", async () => {
  const h = await fixture();
  const original = h.normalize(h.input).objective_request;
  const edited = h.normalize({...h.input, request_id: "queue-edit-a-1",
    content: [{type: "text", text: "continue"}]}).objective_request;
  assert.equal(original.scope_ref, edited.scope_ref);
  assert.notEqual(original.request_ref, edited.request_ref);
  assert.equal(original.request, "  explain this architecture  ");
  assert.equal(edited.request, "continue");
});

test("journal-derived inputs restore the shared lifecycle and deny duplicate interpretation replay", async () => {
  const h = await fixture();
  const ledger = createReasoningStateLedger();
  const lifecycle = () => createOwnedObjectiveLifecycle({ledger,
    configuration: {enabled: true}, module_port: semanticModulePort()});
  const input = {...h.input, content: [{type: "text", text: "Research context management approaches."}]};
  const firstRequest = h.normalize(input).objective_request;
  const first = await lifecycle().prepare(firstRequest);
  assert.equal(first.ok, true);
  const restored = lifecycle();
  const replay = await restored.prepare(firstRequest);
  assert.deepEqual(replay.reason_codes, ["objective.request-already-recorded-dispatch-not-retried"]);
  const next = await restored.prepare(h.normalize({...input, request_id: "next",
    content: [{type: "text", text: "do next"}]}).objective_request);
  assert.equal(next.ok, true);
  assert.equal(next.resolution.transition, "continue");
  assert.equal(next.resolution.previous_state_digest, first.resolution.next_state.state_digest);
  assert.equal(next.resolution.next_state.active_objective.objective_id,
    first.resolution.next_state.active_objective.objective_id);
});
