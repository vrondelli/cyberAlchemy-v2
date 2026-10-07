import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";
import test from "node:test";
import {digestValue} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {createGatewayBackedConversationBindingContract}
  from "../../codex-app-server-wrapper/src/conversation-binding-contract.mjs";
import {verifyReasoningStateLog, recoverReasoningStateLedger, appendReasoningPlanContext} from "../../reasoning-state-runtime/index.mjs";
import {createDshOwnedPreparationRuntime} from "../src/web-owned-preparation.mjs";
import {createDshWebGatewayJournalWorker} from "../src/web-gateway-journal-worker.mjs";
import {validPreparationFor, createDshWebPromptPermitBroker,
  prepareAreRepositoryWebPrompt} from "../src/web-prompt-permit.mjs";
import {hostPlanFixture, fullHostPlanFixture, advanceHostPlanFixture, replaceHostPlanFixture} from "./fixtures/host-plan-selection.mjs";
import {composeDshPlannedModelContextBatch, reconstructDshPlannedModelContextBatch}
  from "../src/web-model-context-batch.mjs";
import {compactDshPlannedModelContext, reconstructDshPlannedModelContext} from '../src/web-model-context-batch.mjs';
import {projectDshWebActivity} from "../src/web-adapter-observation.mjs";

const adapter = "deepseek-harness-web/are-v1";
const requirements = ["Overview", "Adapters", "Threads", "Decisions", "Evolution",
  "Evidence/Diagnostics", "Appearance"];
const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Session} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-session")).href);
const {createUserMessage} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href);
async function fixture(seed = null, selectPlan = null) {
  const home = mkdtempSync(join(tmpdir(), "are-dsh-objectives-"));
  const path = join(home, "gateway.jsonl");
  const plan = selectPlan?.(home) ?? null;
  const open = () => createDshWebGatewayJournalWorker({path,
    store_id: "owned-preparation-test", requirement_seed: seed, plan_selection: plan?.descriptor ?? null});
  let worker = await open();
  const consumer = "host:test";
  const sessionId = "native-session-a";
  const owner = {};
  const assertion = {backend_adapter_id: adapter,
    backend_thread_ref: digestValue({adapter, session_id: sessionId}),
    principal_kind: "local-host", principal_ref: digestValue("host-principal"),
    workspace_ref: plan?.binding_workspace_ref ?? (plan ? digestValue({workspace: home, preset_id: "are-read-only"})
      : digestValue("workspace")), host_instance_ref: digestValue("host-instance"),
    client_instance_ref: digestValue("web-client"), writer_ref: digestValue("writer"),
    creation_receipt_digest: digestValue("native-create")};
  assert.equal(worker.append({event_kind: "session-started", consumer_id: consumer,
    content: {lane: "interaction-bound", backend_adapter_id: adapter,
      resume_token_digest: digestValue("private-capability")}}).ok, true);
  assert.equal(worker.append({event_kind: "thread-bound", consumer_id: consumer,
    content: {thread_ref: `backend-thread:${assertion.backend_thread_ref}`}}).ok, true);
  const bindings = createGatewayBackedConversationBindingContract({session_store: worker,
    consumer_id: consumer, verify_host_context: context => context === owner ? assertion : null,
    verify_release: () => null});
  const bound = await bindings.bindNewThread({host_context: owner, ttl_ms: 60_000});
  await bindings.activate({binding_id: bound.binding_id, host_context: owner});
  const input = (id, text) => ({session_id: sessionId, request_id: id,
    content: [{type: "text", text}], owned_binding: {consumer_id: consumer,
      binding_id: bound.binding_id, generation: 1, writer_ref: assertion.writer_ref}});
  return {input, home, path, bindings, owner, assertion, plan,
    worker: () => worker,
    reopen: async () => {await worker.close(); worker = await open();},
    close: async () => {await worker.close(); rmSync(home, {recursive: true, force: true});}};
}

test("explicit Host parent plan is checkpointed with all seven panels and survives private-worker restart", async () => {
  const h = await fixture(null, hostPlanFixture);
  try {
    const firstInput = h.input("plan-first", "explain ARE routing architecture");
    const first = await h.worker().prepare(firstInput);
    assert.equal(validPreparationFor(first, firstInput.session_id, firstInput.request_id, firstInput.content), true);
    const projection = JSON.parse(first.model_context).objective;
    assert.equal(first.objective_binding.schema_version, "are.dsh-objective-binding/v2");
    assert.equal(first.objective_binding.plan_context_digest, projection.plan_context.plan_context_digest);
    assert.equal(projection.plan_context.active_slice_id, "panel-1");
    assert.equal(projection.plan_context.feature_obligations.length, 7);
    assert.deepEqual(projection.plan_context.unresolved_decisions, h.plan.selection.unresolved_decisions);
    assert.deepEqual(projection.requirement_snapshot.requirements, [...requirements].sort());
    let log = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    assert.equal(log.ok, true);
    const events = log.value.records.filter(x => x.record_kind === "reasoning-state-event").map(x => x.value);
    const plan = events.find(x => x.event_kind === "plan-context-recorded");
    const preflight = events.find(x => x.event_kind === "dsh-owned-preflight-prepared");
    assert.equal(preflight.content.plan_event_digest, plan.event_digest);
    assert.equal(preflight.content.plan_context_digest, plan.content.plan_context_digest);
    await h.reopen();
    const nextInput = h.input("plan-continue", "continue");
    const next = await h.worker().prepare(nextInput);
    assert.equal(validPreparationFor(next, nextInput.session_id, nextInput.request_id, nextInput.content), true);
    assert.deepEqual(JSON.parse(next.model_context).objective.plan_context, projection.plan_context);
    assert.equal(next.objective_binding.scope_digest, first.objective_binding.scope_digest);
    log = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    assert.equal(log.ok, true);
    assert.equal(log.value.records.filter(x => x.record_kind === "reasoning-state-event" && x.value.event_kind === "plan-context-recorded").length, 1);
    const before = log.value.records.length;
    writeFileSync(join(h.home, "parent-plan.md"), "changed parent after startup");
    await assert.rejects(h.worker().prepare(h.input("drifted-plan", "continue")), /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, before);
  } finally {await h.close();}
});

for (const full of [false, true]) test(`latest plan-head read is bound, checkpointed, content-free and write-free across unresolved prompt and restart (full=${full})`, async () => {
  const h = await fixture(null, full ? fullHostPlanFixture : hostPlanFixture);
  try {
    const {session_id, owned_binding} = h.input('read-only-no-prompt', 'unused');
    const input = {session_id, owned_binding};
    assert.equal(h.worker().readPlan(input).status, 'not-retained');
    await assert.rejects(h.worker().prepare(h.input('unresolved-read', 'continue')), /gateway-preparation-denied/);
    const before = readFileSync(`${h.path}.objectives.jsonl`);
    const storeBefore = h.worker().inspect();
    const head = h.worker().readPlan(input);
    assert.equal(head.status, 'checkpoint-retained');
    assert.equal(head.sources, 'verified-at-read');
    assert.equal(head.selection_relation, 'matches-startup');
    assert.equal(head.plan_progress.obligation_count, full ? 30 : 7);
    assert.equal(head.plan_progress.open_decision_count, h.plan.selection.unresolved_decisions.length);
    assert.deepEqual(h.worker().readPlan(input), head);
    assert.deepEqual(readFileSync(`${h.path}.objectives.jsonl`), before);
    assert.deepEqual(h.worker().inspect(), storeBefore);
    assert.equal(h.worker().getSession('host:test').host_observations.length, 0);
    assert.equal(h.worker().getSession('host:test').requests.length, 0);
    assert.doesNotMatch(JSON.stringify(head), /Overview|parent-plan\.md|backend-thread:|unused|obligation_id/);
    for (const changed of [{session_id: 'foreign'}, {owned_binding: {...owned_binding, generation: 2}},
      {owned_binding: {...owned_binding, writer_ref: digestValue('foreign')}}, {request_id: 'fake'}, {content: []}]) {
      assert.throws(() => h.worker().readPlan({...input, ...changed}), /dsh-web.objective-/);
    }
    await h.reopen();
    assert.deepEqual(h.worker().readPlan(input), head);
    const source = join(h.home, h.plan.selection.parent_plan_ref);
    const original = readFileSync(source);
    writeFileSync(source, 'source drift after checkpoint');
    const drifted = h.worker().readPlan(input);
    assert.equal(drifted.sources, 'unverified-at-read');
    assert.deepEqual(drifted.plan_progress, head.plan_progress);
    assert.equal(drifted.checkpoint_digest, head.checkpoint_digest);
    writeFileSync(source, original);
    assert.deepEqual(h.worker().readPlan(input), head);
    const missingSource = `${source}.temporarily-missing`;
    renameSync(source, missingSource);
    try {
      const unavailable = h.worker().readPlan(input);
      assert.equal(unavailable.sources, 'unverified-at-read');
      assert.deepEqual(unavailable.plan_progress, head.plan_progress);
      assert.equal(unavailable.checkpoint_digest, head.checkpoint_digest);
      assert.deepEqual(readFileSync(`${h.path}.objectives.jsonl`), before);
      assert.deepEqual(h.worker().inspect(), storeBefore);
    } finally {renameSync(missingSource, source);}
    assert.deepEqual(h.worker().readPlan(input), head);
    const resumedBindings = createGatewayBackedConversationBindingContract({session_store: h.worker(),
      consumer_id: 'host:test', verify_host_context: context => context === h.owner ? h.assertion : null,
      verify_release: () => null});
    await resumedBindings.drain({binding_id: owned_binding.binding_id, host_context: h.owner});
    assert.throws(() => h.worker().readPlan(input), /binding-not-current/);
  } finally {await h.close();}
});

test('latest plan-head read refuses an uncheckpointed successor instead of falling back to the earlier head', async () => {
  const h = await fixture(null, hostPlanFixture);
  const recovered = recoverReasoningStateLedger({path: join(h.home, 'plan-read-tail.jsonl'), ledger_id: 'plan-read-tail'});
  try {
    const runtime = createDshOwnedPreparationRuntime({session_store: h.worker(), ledger: recovered.ledger,
      plan_selection: h.plan.descriptor});
    await assert.rejects(runtime.prepare(h.input('unresolved-tail', 'continue')), /objective-preparation-denied/);
    const {session_id, owned_binding} = h.input('not-a-prompt', 'unused');
    assert.equal(runtime.readPlan({session_id, owned_binding}).status, 'checkpoint-retained');
    const head = recovered.ledger.snapshot().findLast(row => row.event_kind === 'plan-context-recorded');
    const {schema_version: _schema, authority_effect: _authority, identity_scope: _identity,
      plan_context_digest: digest, ...template} = head.content;
    assert.equal(appendReasoningPlanContext(recovered.ledger, {...template,
      previous_plan_context_digest: digest, active_slice_id: template.feature_obligations[1].obligation_id},
    {expected_thread_ref: template.thread_ref, source_digests: Object.fromEntries(
      template.source_refs.map(row => [row.source_ref, row.source_digest]))}).ok, true);
    assert.throws(() => runtime.readPlan({session_id, owned_binding}), /plan-head-uncheckpointed/);
  } finally {recovered.ledger.close(); await h.close();}
});

test("a selected plan survives an unresolved first prompt without becoming model admission", async () => {
  const h = await fixture(null, hostPlanFixture);
  try {
    await assert.rejects(h.worker().prepare(h.input("unresolved-first", "continue")), /gateway-preparation-denied/);
    const log = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    assert.equal(log.ok, true);
    const events = log.value.records.filter(x => x.record_kind === "reasoning-state-event");
    assert.deepEqual(events.map(x => x.value.event_kind), ["plan-context-recorded"]);
    assert.equal(h.worker().getSession("host:test").host_observations.length, 0);
    await h.reopen();
    const input = h.input("resolved-first", "explain ARE routing architecture");
    const prepared = await h.worker().prepare(input);
    assert.equal(validPreparationFor(prepared, input.session_id, input.request_id, input.content), true);
    assert.equal(JSON.parse(prepared.model_context).objective.plan_context.feature_obligations.length, 7);
  } finally {await h.close();}
});

test("plan projection cannot be stripped, forged or transplanted to another backend thread", async () => {
  const h = await fixture(null, hostPlanFixture);
  try {
    const input = h.input("bound-plan", "explain ARE routing architecture");
    const first = await h.worker().prepare(input);
    for (const mutate of [
      context => {delete context.objective.plan_context;},
      context => {context.objective.plan_context.active_slice_id = "panel-2";},
      context => {context.objective.plan_context.thread_ref = "backend-thread:foreign";},
    ]) {
      const context = JSON.parse(first.model_context); mutate(context);
      const model_context = JSON.stringify(context);
      const {createHash} = await import("node:crypto");
      const changed = {...first, model_context, model_context_digest: createHash("sha256").update(JSON.stringify(model_context)).digest("hex")};
      assert.equal(validPreparationFor(changed, input.session_id, input.request_id, input.content), false);
    }
    await h.worker().close();
    await assert.rejects(createDshWebGatewayJournalWorker({path: h.path,
      store_id: "owned-preparation-test"}), /retained-plan-selection-required/);
  } finally {await h.close();}
});

test("a fresh Host cannot silently replace the active slice of a retained parent plan", async () => {
  const h = await fixture(null, hostPlanFixture);
  try {
    await h.worker().prepare(h.input("retained-plan", "explain ARE routing architecture"));
    const before = verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length;
    writeFileSync(h.plan.path, JSON.stringify({...h.plan.selection, active_slice_id: "panel-2"}));
    const {loadDshHostPlanSelection} = await import("../src/web-host-plan-selection.mjs");
    h.plan.descriptor = loadDshHostPlanSelection({workspace: h.home, selection_path: h.plan.path}).descriptor;
    await h.reopen();
    await assert.rejects(h.worker().prepare(h.input("changed-plan", "continue")), /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, before);
  } finally {await h.close();}
});

for (const full of [false, true]) test(`checked Host plan advancement preserves all requirements and restarts idempotently (full=${full})`, async () => {
  const h = await fixture(null, full ? fullHostPlanFixture : hostPlanFixture);
  try {
    const prepare = async (id, text) => {
      try {
        const input = h.input(id, text), prepared = await h.worker().prepare(input);
        assert.equal(validPreparationFor(prepared, input.session_id, input.request_id, input.content), true);
        const context = JSON.parse(prepared.model_context);
        return (context.schema_version === 'are.dsh-web-model-context/v3'
          ? reconstructDshPlannedModelContext(context) : context).objective;
      }
      catch (error) {throw new Error(`Plan advancement stage ${id} failed`, {cause: error});}
    };
    const first = await prepare("advance-first", "explain ARE routing architecture");
    const added = await prepare("advance-add", "Add latency to the requirements.");
    const nextSlice = first.plan_context.feature_obligations.find(row => row.obligation_id !== first.plan_context.active_slice_id
      && row.status !== "completed").obligation_id;
    const next = advanceHostPlanFixture(h.home, h.plan, first.plan_context, {active_slice_id: nextSlice});
    Object.assign(h.plan, next);
    await h.reopen();
    const {session_id, owned_binding} = h.input('advance-read', 'unused');
    const beforeAdvance = h.worker().readPlan({session_id, owned_binding});
    assert.equal(beforeAdvance.selection_relation, 'different-from-startup');
    assert.equal(beforeAdvance.plan_context_digest, first.plan_context.plan_context_digest);
    const advanced = await prepare("advance-next", "continue");
    const afterAdvance = h.worker().readPlan({session_id, owned_binding});
    assert.equal(afterAdvance.selection_relation, 'matches-startup');
    assert.equal(afterAdvance.plan_context_digest, advanced.plan_context.plan_context_digest);
    assert.equal(advanced.plan_context.previous_plan_context_digest, first.plan_context.plan_context_digest);
    assert.equal(advanced.plan_context.active_slice_id, nextSlice);
    assert.deepEqual(advanced.plan_context.feature_obligations, first.plan_context.feature_obligations);
    assert.deepEqual(advanced.requirement_snapshot.requirements, added.requirement_snapshot.requirements);
    assert.equal(advanced.active_objective.objective_id, first.active_objective.objective_id);
    await h.reopen();
    const resumed = await prepare("advance-resumed", "continue");
    assert.deepEqual(resumed.plan_context, advanced.plan_context);
    const log = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    assert.equal(log.ok, true);
    assert.equal(log.value.records.filter(row => row.record_kind === "reasoning-state-event"
      && row.value.event_kind === "plan-context-recorded").length, 2);
    const appliedSelection = {...h.plan};
    Object.assign(h.plan, advanceHostPlanFixture(h.home, h.plan, advanced.plan_context,
      {active_slice_id: first.plan_context.active_slice_id}));
    await h.reopen();
    const third = await prepare("advance-third", "continue");
    assert.equal(third.plan_context.previous_plan_context_digest, advanced.plan_context.plan_context_digest);
    assert.deepEqual(third.requirement_snapshot.requirements, added.requirement_snapshot.requirements);
    const beforeStale = verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length;
    Object.assign(h.plan, advanceHostPlanFixture(h.home, appliedSelection, first.plan_context,
      {active_slice_id: nextSlice}));
    await h.reopen();
    await assert.rejects(h.worker().prepare(h.input("advance-stale-replay", "continue")), /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, beforeStale);
  } finally {await h.close();}
});

test("plan advancement rejects stale, foreign and obligation-changing predecessors before recording interpretation", async () => {
  const h = await fixture(null, hostPlanFixture);
  try {
    const first = JSON.parse((await h.worker().prepare(h.input("advance-bound", "explain ARE routing architecture"))).model_context).objective;
    const original = {...h.plan};
    const before = verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length;
    const variants = [
      {previous: {...first.plan_context, plan_context_digest: "0".repeat(64)}},
      {previous: {...first.plan_context, thread_ref: `backend-thread:${"0".repeat(64)}`}},
      {changes: {feature_obligations: h.plan.selection.feature_obligations.slice(1)}},
      {changes: {feature_obligations: h.plan.selection.feature_obligations.map(row => ({...row, summary: `${row.summary} changed`}))}},
      {changes: {active_slice_id: first.plan_context.active_slice_id}},
    ];
    for (const [index, variant] of variants.entries()) {
      Object.assign(h.plan, advanceHostPlanFixture(h.home, original, variant.previous ?? first.plan_context,
        {active_slice_id: "panel-2", ...variant.changes}));
      await h.reopen();
      await assert.rejects(h.worker().prepare(h.input(`advance-invalid-${index}`, "continue")), /gateway-preparation-denied/);
      assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, before);
    }
  } finally {await h.close();}
});

for (const full of [false, true]) test(`explicit Host replacement accounts three objectives and survives private restart (full=${full})`, async () => {
  const h = await fixture(null, full ? fullHostPlanFixture : hostPlanFixture);
  try {
    const preparations = new Map();
    const prepare = async (id, text) => {
      try {
        const input = h.input(id, text), prepared = await h.worker().prepare(input);
        assert.equal(validPreparationFor(prepared, input.session_id, input.request_id, input.content), true);
        preparations.set(id, prepared);
        const context = JSON.parse(prepared.model_context);
        return (context.schema_version === 'are.dsh-web-model-context/v3'
          ? reconstructDshPlannedModelContext(context) : context).objective;
      }
      catch (error) {
        const last = verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value?.records
          .filter(row => row.record_kind === 'reasoning-state-event').at(-1)?.value.event_kind;
        throw new Error(`Replacement stage ${id} failed after ${last ?? 'no retained event'} ${JSON.stringify(error.size_diagnostic ?? null)}`, {cause: error});
      }
    };
    const first = await prepare('replace-first', 'explain ARE routing architecture');
    await prepare('replace-second', 'New task: Research runtime recovery.');
    await prepare('replace-third', 'New task: Research adapter lifecycle.');
    const added = await prepare('replace-manual', 'Add latency to the requirements.');
    if (full) {
      const raw = preparations.get('replace-second').model_context, compact = JSON.parse(raw);
      assert.equal(compact.schema_version, 'are.dsh-web-model-context/v3');
      const expanded = reconstructDshPlannedModelContext(compact);
      assert.ok(Buffer.byteLength(JSON.stringify(expanded)) > 32768);
      assert.ok(Buffer.byteLength(raw) <= 32768);
      assert.equal(JSON.stringify(compactDshPlannedModelContext(expanded)), raw);
      const prepared = preparations.get('replace-second');
      assert.equal(prepared.plan_progress.obligation_count, 30);
      assert.equal(prepared.plan_progress.completed_count + prepared.plan_progress.open_count
        + prepared.plan_progress.active_count + prepared.plan_progress.deferred_count, 30);
      assert.equal(prepared.plan_progress.posture, 'checkpointed-declaration');
      assert.equal(prepared.plan_progress.open_decision_count, expanded.objective.plan_context.unresolved_decisions.length);
      const tampered = structuredClone(prepared);
      tampered.plan_progress.open_decision_count = 0;
      assert.equal(validPreparationFor(tampered, prepared.session_id, prepared.request_id,
        [{type: 'text', text: 'New task: Research runtime recovery.'}]), false);
      const legacyRules = 'Req [id] resolves in shared_plan.feature_obligations; restore objective.plan_context=shared_plan. {are_shared_value:i}=shared_values[i] verbatim (nonrecursive); {are_string_parts:[...]} joins resolved parts without separators. No completion/authority.';
      const legacy = compactDshPlannedModelContext(expanded, {projection_rules: legacyRules});
      assert.deepEqual(reconstructDshPlannedModelContext(legacy), expanded);
      const legacyInputs = [JSON.stringify(legacy), raw];
      assert.deepEqual(reconstructDshPlannedModelContextBatch(composeDshPlannedModelContextBatch(legacyInputs))
        .map(context => JSON.stringify(context)), legacyInputs);
      const inputs = ['replace-second', 'replace-third'].map(id => preparations.get(id).model_context);
      const batch = composeDshPlannedModelContextBatch(inputs);
      assert.equal(batch.schema_version, 'are.dsh-web-model-context-batch/v3');
      assert.ok(Buffer.byteLength(JSON.stringify(batch)) <= 32768);
      assert.deepEqual(reconstructDshPlannedModelContextBatch(batch).map(context => JSON.stringify(context)), inputs);
      for (const mutate of [value => {value.extra = true;}, value => {value.projection_rules = 'omit obligations';},
        value => {value.selected_items[0] = '@9999';},
        value => {value.selected_items[0] = '~' + 'A'.repeat(42) + 'B';},
        value => {value.shared_values[0] = '@0'; value.selected_items[0] = '@0';},
        value => {value.shared_values[0] = '@1'; value.selected_items[0] = '@0';},
        value => {value.selected_items[0] = {object: [['same', 'same'], [1, 2]]};},
        value => {value.selected_items[0] = {delta: [{literal: {x: 1}}, [0, 1, 0, 2]]};},
        value => {value.selected_items[0] = {delta: [{literal: {x: 1}}, [1, 2]]};}]) {
        const changed = structuredClone(batch); mutate(changed);
        assert.throws(() => reconstructDshPlannedModelContextBatch(changed));
      }
      // Source data that resembles codec syntax must remain literal, including
      // reserved object keys, scalar references, and prototype-like JSON keys.
      const literalContext = structuredClone(expanded);
      const literalItem = {...literalContext.selected_items[0], content: {
        markers: ['@0', '~' + 'A'.repeat(43), {ref: 0}, {literal: '@1'}, {object: [[], []]},
          {parts: ['a', 'b']}, {json: {x: 1}}, {delta: [null, []]},
          JSON.parse('{"__proto__":{"literal":"@2"},"constructor":"@3"}')],
        repeated_json: JSON.stringify({a: 'Verbatim multiline source value.\n'.repeat(40), b: '@9'}),
      }};
      literalItem.item_digest = digestValue(literalItem.content);
      literalContext.selected_items = [literalItem];
      const literalWire = JSON.stringify(literalContext);
      const mixedInputs = [raw, literalWire];
      const mixedBatch = composeDshPlannedModelContextBatch(mixedInputs);
      assert.deepEqual(reconstructDshPlannedModelContextBatch(mixedBatch).map(context => JSON.stringify(context)), mixedInputs);
      for (const mutate of [value => {value.extra = true;}, value => {value.projection_rules = 'omit obligations';},
        value => {value.objective.requirement_snapshot.requirements[0] = ['foreign'];},
        value => {value.selected_items[0] = {are_shared_value: 9999};},
        value => {value.expanded_context_digest = '0'.repeat(64);}]) {
        const changed = structuredClone(compact); mutate(changed);
        assert.throws(() => reconstructDshPlannedModelContext(changed));
      }
    }
    const removedSummary = h.plan.selection.feature_obligations.at(-1).summary;
    const log = () => verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    const before = log().value.records.filter(row => row.record_kind === 'reasoning-state-event'
      && row.value.event_kind === 'objective-transition-resolved').at(-1).value.content.requirement_continuity;
    assert.equal(before.snapshots.length, 3);
    const parent = 'Explicit replacement parent retaining the whole integration and UI scope.\n';
    const {createHash} = await import('node:crypto');
    const hash = createHash('sha256').update(parent).digest('hex');
    writeFileSync(join(h.home, 'replacement-parent.md'), parent);
    const obligations = h.plan.selection.feature_obligations.map((row, index, all) => index === all.length - 1
      ? {...row, summary: 'Preserve full-scope requirements and verified replacement evidence.'} : row);
    Object.assign(h.plan, replaceHostPlanFixture(h.home, h.plan, first.plan_context, before,
      {parent_plan_ref: 'replacement-parent.md', parent_plan_digest: hash,
        source_refs: h.plan.selection.source_refs.map(row => row.source_ref === h.plan.selection.parent_plan_ref
          ? {source_ref: 'replacement-parent.md', source_digest: hash} : row), feature_obligations: obligations}));
    assert.ok(statSync(h.plan.path).size <= 16384);
    await h.reopen();
    const {session_id, owned_binding} = h.input('replace-read', 'unused');
    assert.equal(h.worker().readPlan({session_id, owned_binding}).selection_relation, 'different-from-startup');
    const oldSource = join(h.home, first.plan_context.parent_plan_ref), oldBytes = readFileSync(oldSource);
    writeFileSync(oldSource, 'The retained predecessor source drifted, while the new startup sources still match.');
    const predecessorRead = h.worker().readPlan({session_id, owned_binding});
    assert.equal(predecessorRead.sources, 'unverified-at-read');
    assert.equal(predecessorRead.plan_context_digest, first.plan_context.plan_context_digest);
    writeFileSync(oldSource, oldBytes);
    const replaced = await prepare('replace-applied', 'continue');
    assert.equal(h.worker().readPlan({session_id, owned_binding}).plan_context_digest, replaced.plan_context.plan_context_digest);
    assert.equal(replaced.plan_context.previous_plan_context_digest, first.plan_context.plan_context_digest);
    assert.equal(replaced.plan_context.parent_plan_ref, 'replacement-parent.md');
    assert.equal(replaced.plan_context.feature_obligations.length, full ? 30 : 7);
    assert.equal(replaced.active_objective.objective_id, added.active_objective.objective_id);
    assert.ok(replaced.requirement_snapshot.requirements.includes('latency'));
    const migration = log().value.records.find(row => row.record_kind === 'reasoning-state-event'
      && row.value.event_kind === 'plan-requirements-migrated').value;
    assert.equal(migration.content.migration.schema_version, 'are.plan-requirement-migration/v2');
    assert.ok(Buffer.byteLength(JSON.stringify(migration.content.migration)) <= 32768);
    assert.equal(migration.content.migration.next_continuity.snapshots.length, 3);
    for (const snapshot of migration.content.migration.next_continuity.snapshots) {
      assert.ok(obligations.every(row => snapshot.requirements.includes(row.summary)));
      assert.ok(!snapshot.requirements.includes(removedSummary));
    }
    await h.reopen();
    const resumed = await prepare('replace-reopened', 'continue');
    assert.deepEqual(resumed.plan_context, replaced.plan_context);
    assert.deepEqual(resumed.requirement_snapshot.requirements, replaced.requirement_snapshot.requirements);
    assert.equal(log().value.records.filter(row => row.record_kind === 'reasoning-state-event'
      && row.value.event_kind === 'plan-requirements-migrated').length, 1);
  } finally {await h.close();}
});

test("an advancing startup selection cannot initialize a thread with no retained predecessor", async () => {
  const h = await fixture(null, home => {
    const original = hostPlanFixture(home);
    return advanceHostPlanFixture(home, original, {thread_ref: `backend-thread:${"a".repeat(64)}`,
      plan_context_digest: "b".repeat(64)}, {active_slice_id: "panel-2"});
  });
  try {
    await assert.rejects(h.worker().prepare(h.input("advance-without-history", "explain ARE routing architecture")), /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, 0);
  } finally {await h.close();}
});

test("a verified plan from a different bound workspace cannot record interpretation or selection", async () => {
  const h = await fixture(null, home => ({...hostPlanFixture(home),
    binding_workspace_ref: digestValue("another-workspace")}));
  try {
    await assert.rejects(h.worker().prepare(h.input("foreign-workspace-plan", "explain ARE routing architecture")),
      /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, 0);
  } finally {await h.close();}
});

test("private gateway checkpoints owned objective and continuing route/context through reopen", async () => {
  const h = await fixture({requirements, source_ref: "fixture:explicit-seven-panel-host-plan"});
  try {
    const first = await h.worker().prepare(h.input("first", "explain ARE routing architecture"));
    assert.equal(first.schema_version, "are.dsh-web-prompt-preparation/v2");
    assert.equal(validPreparationFor(first, "native-session-a", "first", h.input("first", "explain ARE routing architecture").content), true);
    await h.reopen();
    const nextInput = h.input("next", "continue");
    const next = await h.worker().prepare(nextInput);
    assert.equal(validPreparationFor(next, nextInput.session_id, nextInput.request_id, nextInput.content), true);
    const firstContext = JSON.parse(first.model_context), nextContext = JSON.parse(next.model_context);
    assert.equal(next.route_id, "CA2-ROUTE-UNDERSTAND");
    assert.equal(nextContext.objective.transition, "continue");
    assert.equal(nextContext.objective.active_objective.objective_id,
      firstContext.objective.active_objective.objective_id);
    assert.deepEqual(nextContext.objective.requirement_snapshot.requirements,
      [...requirements].sort((a,b) => a.localeCompare(b)));
    assert.notEqual(next.objective_binding.checkpoint_digest, first.objective_binding.checkpoint_digest);
    assert.equal(next.objective_binding.scope_digest, first.objective_binding.scope_digest);
    assert.notEqual(next.objective_binding.request_ref_digest, first.objective_binding.request_ref_digest);
    const verified = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    assert.equal(verified.ok, true);
    assert.equal(verified.value.records.at(-1).value.checkpoint_digest, next.objective_binding.checkpoint_digest);
    assert.equal(statSync(`${h.path}.objectives.jsonl`).mode & 0o777, 0o600);
    await assert.rejects(h.worker().prepare(nextInput), /gateway-preparation-denied/);
    await assert.rejects(h.worker().prepare({...nextInput, content: [{type: "text", text: "different"}]}),
      /gateway-preparation-denied/);
  } finally {await h.close();}
});

test("gateway refuses foreign or inactive bindings without recording an objective", async () => {
  const h = await fixture();
  try {
    const input = h.input("foreign", "explain this architecture");
    for (const override of [{binding_id: "unowned"}, {writer_ref: digestValue("foreign")}, {generation: 2}]) {
      await assert.rejects(h.worker().prepare({...input, owned_binding: {...input.owned_binding, ...override}}),
        /gateway-preparation-denied/);
    }
    const firstLog = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    assert.equal(firstLog.value.records.length, 0);
    await h.bindings.drain({binding_id: input.owned_binding.binding_id, host_context: h.owner});
    await assert.rejects(h.worker().prepare(input), /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, 0);
  } finally {await h.close();}
});

test("owned refinement, interruption, suspended return and replacement preserve seven requirements across restart", async () => {
  const h = await fixture({requirements, source_ref: "fixture:seven-panel-parent-plan"});
  const prepare = async (id, text, expectedRequirements = requirements) => {
    const input = h.input(id, text);
    const prepared = await h.worker().prepare(input).catch(cause => {
      throw new Error(`owned transition failed at ${id}`, {cause});
    });
    assert.equal(validPreparationFor(prepared, input.session_id, input.request_id, input.content), true);
    const context = JSON.parse(prepared.model_context);
    assert.deepEqual(context.objective.requirement_snapshot.requirements,
      [...expectedRequirements].sort());
    const log = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    assert.equal(log.ok, true);
    assert.equal(log.value.records.at(-1).value.checkpoint_digest, prepared.objective_binding.checkpoint_digest);
    return {prepared, context};
  };
  try {
    const initial = await prepare("initial", "explain ARE routing architecture");
    const refined = await prepare("refined", "Add latency to the requirements.", [...requirements, "latency"]);
    assert.equal(refined.context.objective.transition, "refine");
    assert.equal(refined.context.objective.active_objective.objective_id,
      initial.context.objective.active_objective.objective_id);
    assert.equal(refined.context.objective.active_objective.revision, 2);
    const reduced = await prepare("reduced", "Remove latency from the requirements.");
    assert.equal(reduced.context.objective.transition, "refine");
    assert.equal(reduced.context.objective.active_objective.objective_id,
      initial.context.objective.active_objective.objective_id);
    assert.equal(reduced.context.objective.active_objective.revision, 3);
    const interrupt = await prepare("interrupt", "Before that, explain ARE gateways");
    assert.equal(interrupt.context.objective.transition, "interrupt");
    assert.notEqual(interrupt.context.objective.active_objective.objective_id,
      initial.context.objective.active_objective.objective_id);
    await h.reopen();
    const returned = await prepare("returned", "Resume previous task");
    assert.equal(returned.context.objective.transition, "continue");
    assert.equal(returned.context.objective.active_objective.objective_id,
      initial.context.objective.active_objective.objective_id);
    assert.equal(returned.context.objective.active_objective.revision, 3);
    assert.notEqual(returned.prepared.objective_binding.checkpoint_digest,
      refined.prepared.objective_binding.checkpoint_digest);
    const replaced = await prepare("replaced", "Instead, explain ARE diagnostics");
    assert.equal(replaced.context.objective.transition, "replace");
    assert.notEqual(replaced.context.objective.active_objective.objective_id,
      initial.context.objective.active_objective.objective_id);
    await h.reopen();
    const continued = await prepare("continued", "continue");
    assert.equal(continued.context.objective.active_objective.objective_id,
      replaced.context.objective.active_objective.objective_id);
  } finally {await h.close();}
});

test("unaccounted free-form refinement cannot silently discard the Host requirement set", async () => {
  const h = await fixture({requirements, source_ref: "fixture:seven-panel-parent-plan"});
  try {
    const first = await h.worker().prepare(h.input("initial", "explain ARE routing architecture"));
    const before = verifyReasoningStateLog(`${h.path}.objectives.jsonl`);
    await assert.rejects(h.worker().prepare(h.input("unaccounted", "Also compare latency")),
      /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length,
      before.value.records.length);
    await h.reopen();
    const next = await h.worker().prepare(h.input("continue", "continue"));
    const a = JSON.parse(first.model_context).objective, b = JSON.parse(next.model_context).objective;
    assert.equal(b.active_objective.objective_id, a.active_objective.objective_id);
    assert.equal(b.active_objective.revision, 1);
    assert.deepEqual(b.requirement_snapshot.requirements, a.requirement_snapshot.requirements);
  } finally {await h.close();}
});

for (const selectedPlan of [false, true, "full"]) {
test(`owned steering batches retain every objective and requirement binding without v1 downgrade ${selectedPlan === "full" ? "with all 30 integration/UI obligations" : selectedPlan ? "with parent-plan selection" : "without plan selection"}`, async () => {
  const h = selectedPlan ? await fixture(null, selectedPlan === "full" ? fullHostPlanFixture : hostPlanFixture)
    : await fixture({requirements, source_ref: "fixture:seven-panel-parent-plan"});
  try {
    const firstInput = h.input("first", "explain ARE routing architecture");
    const secondInput = h.input("second", "Add latency to the requirements.");
    const first = await h.worker().prepare(firstInput), second = await h.worker().prepare(secondInput);
    const prepared = new Map([["first", first], ["second", second]]);
    const session = Session.create(firstInput.session_id);
    const agent = {id: session.id, session, status: "running",
      phase: {abort: {signal: {aborted: false}}}, inbox: {nextTurn: [], nextStep: []}};
    const broker = createDshWebPromptPermitBroker({prepare: input => prepared.get(input.request_id),
      verify_host_binding: async () => ({host_principal: "trusted-local-host",
        native_session_id: agent.id, agent_generation: 1,
        binding_id: firstInput.owned_binding.binding_id, writer_ref: firstInput.owned_binding.writer_ref})});
    broker.installSession(session); broker.activateAgent(agent);
    async function consume(input, mode) {
      let message;
      await broker.admitPrompt({agent,
        request: {sessionId: session.id, requestId: input.request_id, content: input.content, mode},
        invoke: () => {
          message = createUserMessage({content: input.content, source: {kind: "user", rpcId: input.request_id}});
          const target = mode === "steer" ? "next-step" : "next-turn";
          session.append("agent/inbox/spliced", {target, start: 0, inserted: [message]});
          (mode === "steer" ? agent.inbox.nextStep : agent.inbox.nextTurn).push(message);
          return {accepted: true};
        }});
      if (mode === "queue") session.append("turn/start", {turn: 1});
      session.append("agent/inbox/spliced", {target: mode === "steer" ? "next-step" : "next-turn",
        start: 0, removedCount: 1, inserted: []});
      (mode === "steer" ? agent.inbox.nextStep : agent.inbox.nextTurn).shift();
      session.append("user/message", message, {surfaceOp: "append"});
    }
    await consume(firstInput, "queue"); await consume(secondInput, "steer");
    const batch = JSON.parse(broker.modelContextForDispatch(agent));
    assert.equal(batch.schema_version, `are.dsh-web-model-context-batch/v${selectedPlan ? 2 : 1}`);
    assert.equal(batch.request_contexts.length, 2);
    assert.equal(new Set(batch.selected_items.map(item => item.item_digest)).size, batch.selected_items.length);
    const recovered = selectedPlan ? reconstructDshPlannedModelContextBatch(batch) : batch.request_contexts.map(row => ({
      schema_version: row.source_context_schema, context_envelope_digest: row.context_envelope_digest,
      route_id: row.route_id, selected_items: row.selected_item_digests
        .map(digest => batch.selected_items.find(item => item.item_digest === digest)), objective: row.objective}));
    for (const [index, original] of [first, second].entries()) {
      const row = batch.request_contexts[index];
      const reconstructed = JSON.stringify(recovered[index]);
      assert.equal(reconstructed, original.model_context);
      assert.equal(row.model_context_digest, original.model_context_digest);
      assert.equal(recovered[index].objective.objective_binding_digest, original.objective_binding.binding_digest);
    }
    const count = selectedPlan === "full" ? 30 : 7;
    assert.equal(recovered[0].objective.requirement_snapshot.requirements.length, count);
    assert.equal(recovered[1].objective.requirement_snapshot.requirements.length, count + 1);
    if (selectedPlan) {
      assert.deepEqual(recovered[0].objective.plan_context, recovered[1].objective.plan_context);
      assert.equal(recovered[1].objective.plan_context.feature_obligations.length, count);
      assert.ok(Buffer.byteLength(JSON.stringify(batch)) <= 32768);
      for (const mutate of [
        value => {value.extra = true;},
        value => {value.shared_plan.active_slice_id = "foreign";},
        value => {value.selected_items.push(value.selected_items[0]);},
        value => {value.context_template.selected_items[0] = "missing";},
        value => {value.context_template.objective.requirement_snapshot.requirements[0] = ["foreign"];},
        value => {value.request_contexts[1].model_context_digest = "f".repeat(64);},
        value => {value.request_contexts[1].replacements = {fields: {unknown: {replace: true}}};},
        value => {value.request_contexts[1].replacements = {replace: {}, fields: {}};},
        value => {value.projection_rules = "x".repeat(32769);},
      ]) {
        const bad = structuredClone(batch); mutate(bad);
        assert.throws(() => reconstructDshPlannedModelContextBatch(bad), /model-context-batch-invalid/);
      }
      assert.throws(() => composeDshPlannedModelContextBatch(Array(17).fill(first.model_context)), /model-context-batch-invalid/);
      const otherPlan = JSON.parse(second.model_context); delete otherPlan.objective.plan_context;
      assert.throws(() => composeDshPlannedModelContextBatch([first.model_context, JSON.stringify(otherPlan)]), /model-context-batch-invalid/);
    }
    const legacy = h.input("legacy", "explain ARE diagnostics");
    prepared.set("legacy", prepareAreRepositoryWebPrompt({session_id: session.id,
      request_id: legacy.request_id, content: legacy.content}));
    await consume(legacy, "steer");
    assert.throws(() => broker.modelContextForDispatch(agent), /model-context-unqualified/);
  } finally {await h.close();}
});
}

test("the full integration/UI candidate composes three distinct objectives without losing bytes or raising the resource ceiling", async () => {
  const h = await fixture(null, fullHostPlanFixture);
  try {
    const prompts = ["explain ARE routing architecture", "New task: explain the steered followup",
      "New task: explain the direct steering followup"];
    const preparations = [];
    for (const [index, text] of prompts.entries()) preparations.push(await h.worker().prepare(h.input(`full-${index}`, text)));
    const contexts = preparations.map(item => item.model_context);
    const batch = composeDshPlannedModelContextBatch(contexts);
    assert.ok(Buffer.byteLength(JSON.stringify(batch)) <= 32768);
    const recovered = reconstructDshPlannedModelContextBatch(batch);
    assert.deepEqual(recovered.map(item => JSON.stringify(item)), contexts);
    assert.equal(new Set(recovered.map(item => item.objective.active_objective.objective_id)).size, 3);
    assert.ok(recovered.every(item => item.objective.requirement_snapshot.requirements.length === 30));
    assert.ok(recovered.every(item => item.objective.plan_context.feature_obligations.length === 30));
    assert.equal(batch.shared_plan.unresolved_decisions.length, 7);
    assert.equal(batch.shared_plan.source_refs.length, 11);
    const sixteen = composeDshPlannedModelContextBatch(Array(16).fill(contexts[0]));
    assert.deepEqual(reconstructDshPlannedModelContextBatch(sixteen).map(item => JSON.stringify(item)), Array(16).fill(contexts[0]));
    const large = contexts.map((text, index) => {
      const value = JSON.parse(text);
      value.selected_items.push({item_digest: digestValue(`large-${index}`), content: "x".repeat(500)});
      assert.ok(Buffer.byteLength(JSON.stringify(value)) <= 32768);
      return JSON.stringify(value);
    });
    assert.throws(() => composeDshPlannedModelContextBatch(large), /model-context-too-large/);
    assert.throws(() => composeDshPlannedModelContextBatch([contexts[0], " " + contexts[1]]), /model-context-batch-invalid/);
  } finally {await h.close();}
});

test("owned preparation is closed and its model objective/checkpoint join cannot be tampered", async () => {
  const h = await fixture();
  try {
    const input = h.input("first", "explain ARE routing architecture");
    await assert.rejects(h.worker().prepare({...input, browser_requirements: requirements}), /gateway-preparation-denied/);
    const prepared = await h.worker().prepare(input);
    const context = JSON.parse(prepared.model_context);
    assert.equal(context.objective.requirement_snapshot, null);
    const bad = {...prepared, objective_binding: {...prepared.objective_binding, checkpoint_digest: "f".repeat(64)}};
    assert.equal(validPreparationFor(bad, input.session_id, input.request_id, input.content), false);
    assert.equal(validPreparationFor(prepared, "other-session", input.request_id, input.content), false);
    assert.equal(validPreparationFor(prepared, input.session_id, "other-request", input.content), false);
  } finally {await h.close();}
});

test("unresolved first-turn referent and cross-request seed metadata record no objective", async () => {
  const h = await fixture();
  try {
    await assert.rejects(h.worker().prepare(h.input("unresolved", "explain this architecture")),
      /gateway-preparation-denied/);
    await assert.rejects(h.worker().prepare(h.input("continue", "continue")),
      /gateway-preparation-denied/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, 0);
  } finally {await h.close();}
});

test("gateway startup rejects an uncheckpointed objective tail instead of truncating it", async () => {
  const h = await fixture();
  try {
    await h.worker().close();
    const restored = recoverReasoningStateLedger({path: `${h.path}.objectives.jsonl`,
      ledger_id: "dsh-objectives:owned-preparation-test"});
    assert.equal(restored.ok, true);
    assert.equal(restored.ledger.append({event_kind: "test-uncheckpointed-tail",
      idempotency_key: "tail", content: {authority_effect: "none"}}).ok, true);
    restored.ledger.close();
    await assert.rejects(h.reopen(), /objective-recovery-failed:reasoning.log-uncheckpointed-tail/);
    assert.equal(verifyReasoningStateLog(`${h.path}.objectives.jsonl`).value.records.length, 1);
  } finally {await h.close();}
});

test("failed native-preflight checkpoint returns no preparation and stops successor writes", async () => {
  const h = await fixture();
  const recovered = recoverReasoningStateLedger({path: join(h.home, "fault-probe.jsonl"),
    ledger_id: "checkpoint-fault-probe"});
  try {
    const ledger = recovered.ledger;
    const runtime = createDshOwnedPreparationRuntime({session_store: h.worker(), ledger: {
      ...ledger, checkpoint: input => input.checkpoint_kind === "before-model-request"
        ? {ok: false, reason_codes: ["fixture.checkpoint-failed"]} : ledger.checkpoint(input),
    }});
    await assert.rejects(runtime.prepare(h.input("first", "explain ARE routing architecture")),
      /objective-preflight-checkpoint-failed/);
    const observations = h.worker().getSession("host:test").host_observations;
    assert.equal(observations.length, 1);
    const observation = observations[0];
    assert.equal(observation.kind, "dsh-objective-interpretation-observed");
    const log = verifyReasoningStateLog(join(h.home, "fault-probe.jsonl"));
    assert.equal(log.ok, true);
    const checkpoint = log.value.records.find(row => row.record_kind === "reasoning-state-checkpoint"
      && row.value.checkpoint_digest === observation.checkpoint_digest);
    assert.ok(checkpoint);
    assert.equal(checkpoint.value.checkpoint_kind, "manual");
    assert.equal(checkpoint.value.subject_digest, observation.resolution_digest);
    const interpretation = log.value.records.find(row => row.record_kind === "reasoning-state-event"
      && row.value.event_digest === observation.interpretation_event_digest);
    assert.equal(interpretation.value.event_kind, "objective-transition-resolved");
    assert.equal(interpretation.value.content.resolution.next_state.state_digest,
      observation.objective_state_digest);
    const project = () => projectDshWebActivity({agent_records: [{status: "active",
      thread_ref: observation.thread_ref}], host_observations: h.worker().getSession("host:test").host_observations});
    assert.equal(project().agents[0].are_interpretation.status, "checkpoint-retained-no-admission-retained");
    assert.equal(project().agents[0].are_preparation, undefined);
    assert.equal(project().retained_model_entry_count, 0);
    assert.equal(h.worker().getSession("host:test").requests.length, 0);
    assert.equal(h.worker().compact().ok, true);
    await h.reopen();
    assert.deepEqual(h.worker().getSession("host:test").host_observations, observations);
    assert.equal(project().agents[0].are_interpretation.checkpoint_digest, observation.checkpoint_digest);
    const count = ledger.inspect().event_count;
    await assert.rejects(runtime.prepare(h.input("second", "continue")), /objective-ledger-faulted/);
    const {session_id, owned_binding} = h.input('faulted-read', 'unused');
    assert.throws(() => runtime.readPlan({session_id, owned_binding}), /objective-ledger-faulted/);
    assert.equal(ledger.inspect().event_count, count);
  } finally {recovered.ledger.close(); await h.close();}
});

test("post-interpretation source drift retains a selected-plan reference but no admission or preflight", async () => {
  const h = await fixture(null, hostPlanFixture);
  const path = join(h.home, "interpretation-drift-probe.jsonl");
  const recovered = recoverReasoningStateLedger({path, ledger_id: "interpretation-drift-probe"});
  try {
    const runtime = createDshOwnedPreparationRuntime({session_store: h.worker(),
      ledger: recovered.ledger, plan_selection: h.plan.descriptor});
    const preparing = runtime.prepare(h.input("source-drift", "explain ARE routing architecture"));
    // Exact source bytes change after pre-interpretation verification, during
    // the awaited shared lifecycle, before the second source verification.
    writeFileSync(join(h.home, "parent-plan.md"), "changed during interpretation");
    await assert.rejects(preparing, /host-plan-selection-invalid-or-drifted/);
    const log = verifyReasoningStateLog(path);
    assert.equal(log.ok, true);
    assert.deepEqual(log.value.records.filter(row => row.record_kind === "reasoning-state-event")
      .map(row => row.value.event_kind), ["plan-context-recorded", "objective-transition-resolved"]);
    const observation = h.worker().getSession("host:test").host_observations[0];
    assert.equal(observation.kind, "dsh-objective-interpretation-observed");
    assert.match(observation.plan_context_digest, /^[0-9a-f]{64}$/u);
    const projected = projectDshWebActivity({agent_records: [{status: "active",
      thread_ref: observation.thread_ref}], host_observations: [observation]});
    assert.equal(projected.agents[0].are_interpretation.plan_context_digest, observation.plan_context_digest);
    assert.equal(projected.agents[0].are_interpretation.requirements, "continuity-reference-retained");
    assert.equal(projected.agents[0].are_interpretation.schema_version, 'are.dsh-objective-interpretation-summary/v2');
    assert.equal(projected.agents[0].are_interpretation.plan_progress.obligation_count, 7);
    assert.deepEqual(projected.agents[0].are_interpretation.plan_progress, observation.plan_progress);
    assert.equal(observation.plan_progress.posture, 'checkpointed-declaration');
    assert.equal(h.worker().getSession("host:test").requests.length, 0);
    assert.doesNotMatch(JSON.stringify(projected), /changed during interpretation|explain ARE routing architecture|Overview/);
  } finally {recovered.ledger.close(); await h.close();}
});

for (const replace of [false, true]) test(`failed ${replace ? 'replacement' : 'advancement'} checkpoint cannot interpret a prompt or return a preparation`, async () => {
  const h = await fixture(null, hostPlanFixture);
  const recovered = recoverReasoningStateLedger({path: join(h.home, "plan-fault-probe.jsonl"),
    ledger_id: "plan-advancement-fault-probe"});
  try {
    const ledger = recovered.ledger;
    const initial = createDshOwnedPreparationRuntime({session_store: h.worker(), ledger,
      plan_selection: h.plan.descriptor});
    const first = JSON.parse((await initial.prepare(h.input("fault-first", "explain ARE routing architecture"))).model_context).objective;
    const continuity = ledger.snapshot().filter(row => row.event_kind === 'objective-transition-resolved')
      .at(-1).content.requirement_continuity;
    const advanced = replace ? replaceHostPlanFixture(h.home, h.plan, first.plan_context, continuity,
      {feature_obligations: h.plan.selection.feature_obligations.map((row, index, all) => index === all.length - 1
        ? {...row, summary: `${row.summary} successor`} : row)})
      : advanceHostPlanFixture(h.home, h.plan, first.plan_context, {active_slice_id: "panel-2"});
    const before = ledger.snapshot().filter(row => row.event_kind === "objective-transition-resolved").length;
    // Test-only sink fault: preserve the registered ledger identity so the
    // real shared plan-context append/seal/checkpoint path is exercised.
    const sink = ledger._state.sink;
    ledger._state.sink = {...sink, append: record => record.record_kind === "reasoning-state-checkpoint"
      ? {ok: false, reason_codes: ["fixture.checkpoint-failed"]} : sink.append(record)};
    const runtime = createDshOwnedPreparationRuntime({session_store: h.worker(), ledger,
      plan_selection: advanced.descriptor});
    await assert.rejects(runtime.prepare(h.input("fault-advance", "continue")), replace
      ? /objective-plan-replacement-denied/ : /objective-plan-checkpoint-failed/);
    assert.equal(ledger.snapshot().filter(row => row.event_kind === "objective-transition-resolved").length, before);
    const count = ledger.inspect().event_count;
    await assert.rejects(runtime.prepare(h.input("fault-after", "continue")), /objective-ledger-faulted/);
    assert.equal(ledger.inspect().event_count, count);
    ledger.close();
    const failedRecovery = recoverReasoningStateLedger({path: join(h.home, "plan-fault-probe.jsonl"),
      ledger_id: "plan-advancement-fault-probe"});
    assert.equal(failedRecovery.ok, false);
    assert.ok(failedRecovery.reason_codes.includes("reasoning.log-uncheckpointed-tail"));
  } finally {recovered.ledger.close(); await h.close();}
});

test("a valid prepared objective cannot borrow a different Host binding permit", async () => {
  const h = await fixture();
  try {
    const input = h.input("first", "explain ARE routing architecture");
    const prepared = await h.worker().prepare(input);
    const session = Session.create(input.session_id);
    const agent = {id: session.id, session};
    const broker = createDshWebPromptPermitBroker({prepare: () => prepared,
      verify_host_binding: async () => ({host_principal: "trusted-local-host",
        native_session_id: agent.id, agent_generation: 1,
        binding_id: "a-different-active-binding", writer_ref: input.owned_binding.writer_ref})});
    broker.installSession(session); broker.activateAgent(agent);
    let invoked = false;
    await assert.rejects(broker.admitPrompt({agent, request: {sessionId: input.session_id,
      requestId: input.request_id, mode: "queue", content: input.content}, invoke: () => {
        invoked = true; return {accepted: true};
      }}), /objective-preparation-host-mismatch/);
    assert.equal(invoked, false);
  } finally {await h.close();}
});
