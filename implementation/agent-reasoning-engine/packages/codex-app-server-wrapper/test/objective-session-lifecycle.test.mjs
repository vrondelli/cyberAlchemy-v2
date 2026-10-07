import assert from "node:assert/strict";
import test from "node:test";
import {createReasoningStateLedger} from "../../reasoning-state-runtime/index.mjs";
import {createOwnedObjectiveLifecycle} from "../src/objective-session-lifecycle.mjs";
import {createCodexObjectiveLifecycle} from "../src/objective-lifecycle.mjs";
import {semanticModulePort} from "./semantic-module-fixture.mjs";
import {materializeRequirementSnapshot} from "../../request-intent-runtime/index.mjs";

const research = "Research context management approaches.";
const request = (id, text, scope = "dsh-session-1") => ({
  consumer_ref: "dsh:local-host", scope_ref: scope, thread_ref: scope,
  request_ref: `dsh-web:${id}`, request: text,
});
const lifecycle = ledger => createOwnedObjectiveLifecycle({ledger,
  configuration: {enabled: true}, module_port: semanticModulePort()});

test("normalized native requests preserve objective continuity without Codex wire fields", async () => {
  const ledger = createReasoningStateLedger();
  const owned = lifecycle(ledger);
  const first = await owned.prepare(request(1, research));
  const next = await owned.prepare(request(2, "do next"));
  assert.equal(first.ok, true);
  assert.equal(next.ok, true);
  assert.equal(next.resolution.transition, "continue");
  assert.equal(next.resolution.next_state.active_objective.objective_id,
    first.resolution.next_state.active_objective.objective_id);
  const events = ledger.snapshot().filter(event => event.event_kind === "objective-transition-resolved");
  assert.equal(events.length, 2);
  assert.equal(events[0].content.thread_id, "dsh-session-1");
  assert.equal(events[0].content.resolution.request_ref, "dsh-web:1");
  assert.ok(!JSON.stringify(owned.inspect()).includes(research));
});

test("normalized recovery rejects replay, changed bytes and cross-conversation continuation", async () => {
  const ledger = createReasoningStateLedger();
  await lifecycle(ledger).prepare(request(1, research));
  const restored = lifecycle(ledger);
  assert.deepEqual((await restored.prepare(request(1, research))).reason_codes,
    ["objective.request-already-recorded-dispatch-not-retried"]);
  assert.deepEqual((await restored.prepare(request(1, "Research another topic."))).reason_codes,
    ["objective.request-identity-conflict"]);
  assert.equal((await restored.prepare(request(2, "do next", "other-session"))).ok, false);
  assert.equal((await restored.prepare(request(2, "do next"))).ok, true);
});

test("the normalized boundary rejects raw protocol packets, unknown fields and oversized text", async () => {
  const owned = lifecycle(createReasoningStateLedger());
  for (const input of [null, {params: {threadId: "x"}},
    {...request(1, research), browserClaim: "owned"},
    {...request(1, research), scope_ref: ""}, request(1, "x".repeat(256 * 1024 + 1))]) {
    assert.deepEqual((await owned.prepare(input)).reason_codes, ["objective.owned-request-invalid"]);
  }
  assert.deepEqual(owned.inspect(), []);
});

test("Codex facade and normalized entry produce identical durable transition material", async () => {
  const codexLedger = createReasoningStateLedger();
  const nativeLedger = createReasoningStateLedger();
  const codex = createCodexObjectiveLifecycle({ledger: codexLedger, profile_id: "parity",
    configuration: {enabled: true}, module_port: semanticModulePort()});
  const owned = lifecycle(nativeLedger);
  for (const [id, text] of [[1, research], [2, "do next"]]) {
    const wire = {id, params: {threadId: "thread-1", input: [{type: "text", text}]}};
    const a = await codex.prepare(wire, {consumer_ref: "consumer-1"});
    const b = await owned.prepare({consumer_ref: "consumer-1",
      scope_ref: JSON.stringify(["parity", "thread-1"]), thread_ref: "thread-1",
      request_ref: `codex-objective:${id}`, request: text});
    assert.equal(a.ok, true);
    assert.deepEqual(a.resolution, b.resolution);
  }
  const contents = ledger => ledger.snapshot()
    .filter(event => event.event_kind === "objective-transition-resolved").map(event => event.content);
  assert.deepEqual(contents(codexLedger), contents(nativeLedger));
});

test("normalized continuation retains all seven explicitly seeded UI obligations", async () => {
  const requirements = ["Overview", "Adapters", "Threads", "Decisions", "Evolution",
    "Evidence/Diagnostics", "Appearance"];
  const ledger = createReasoningStateLedger();
  const create = () => createOwnedObjectiveLifecycle({ledger,
    configuration: {enabled: true, requirement_tracking: true}, module_port: semanticModulePort(),
    requirement_seed_provider: input => materializeRequirementSnapshot({
      consumer_ref: input.state.consumer_ref, scope_ref: input.state.scope_ref,
      objective_id: input.state.active_objective.objective_id,
      objective_state_digest: input.state.state_digest, requirements,
      source_refs: [input.request_ref, "fixture:explicit-seven-page-seed"],
    })});
  const first = await create().prepare(request(1, research));
  const next = await create().prepare(request(2, "do next"));
  assert.equal(first.ok, true);
  assert.equal(next.ok, true);
  assert.deepEqual(next.requirement_continuity.snapshots[0].requirements,
    [...requirements].sort((a, b) => a.localeCompare(b)));
  assert.deepEqual(next.requirement_continuity.snapshots[0].requirements,
    first.requirement_continuity.snapshots[0].requirements);
  assert.equal(next.requirement_continuity.previous_continuity_digest,
    first.requirement_continuity.continuity_digest);
});

test("one conversation cannot race its predecessor while independent scopes remain usable", async () => {
  const owned = lifecycle(createReasoningStateLedger());
  const first = owned.prepare(request(1, research));
  const blocked = await owned.prepare(request(2, research));
  assert.deepEqual(blocked.reason_codes, ["objective.scope-preparation-inflight"]);
  assert.equal((await owned.prepare(request(1, research, "other-session"))).ok, true);
  assert.equal((await first).ok, true);
  assert.equal((await owned.prepare(request(2, "do next"))).ok, true);
});

test("a shared ledger fault also stops a different scope already being interpreted", async () => {
  const ledger = createReasoningStateLedger();
  const owned = lifecycle({...ledger,
    checkpoint: () => ({ok: false, reason_codes: ["fixture.checkpoint-failure"]})});
  const first = owned.prepare(request(1, research));
  const second = owned.prepare(request(1, research, "other-session"));
  assert.deepEqual((await first).reason_codes, ["fixture.checkpoint-failure"]);
  assert.deepEqual((await second).reason_codes, ["objective.ledger-write-failed-restart-required"]);
  assert.equal(ledger.snapshot().filter(event => event.event_kind === "objective-transition-resolved").length, 1);
  assert.deepEqual(owned.inspect(), []);
});
