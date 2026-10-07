import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {INTENT_ANCHOR_ARM, SOURCE_NEIGHBORHOOD_ARM, SEARCH_FOLLOWTHROUGH_ARM, OBJECTIVE_SEARCH_ARM, API_SEARCH_ARM, buildIntentAnchorCell, runIntentAnchorArm} from "./intent-anchor-arm-r3.mjs";
import {runIntentAnchorNativeEpisode} from "./intent-anchor-native-driver-r3.mjs";
import {runPreparedIntentAnchorTask} from "./discovery-v1/orchestrate-intent-anchor-r3.mjs";
import {comparisonLiveClientFactory} from "./ranked-source-live-client-r1.mjs";
import {createSecretReference} from "../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "intent-anchor-wiring-")), task_path = join(root, "task.json");
  const task = {instance_id: "fixture", original_inst_id: "fixture", repo: "fixture", repo_url: "https://example.invalid/source.git", language: "javascript", base_commit: "a".repeat(40), problem_statement: "Parser fails. Documentation differs.", source: "fixture"};
  const bytes = JSON.stringify(task); writeFileSync(task_path, bytes);
  const config = {model: "glm-5.3-flash", context_limit: 8000, total_tokens_per_arm: 96000, credential_path: "fixture", python: "fixture", scorer: "fixture", upstream: "fixture", source_manifest: "fixture", scoring_cache: "fixture", tasks: [{id: "contextbench-1", instance_id: task.instance_id, task_path, task_sha256: sha(bytes), repository_cache: root, base_commit: task.base_commit, cell_template: {instance_id: task.instance_id, context_limit: 8000, limits: {total_tokens: 96000, maximum_calls: 96, output_cap: 2048, finalization_reserve_tokens: 14000, output_deferral: true}, provider_profile: {reasoning_effort: "low", token_margin: 512, index_tokenizer_maximum_calls: 512, request_budget: "contextbench-deferral-v1", request_tokenizer_maximum_calls: 291, model_timeout_ms: 120000}}}]};
  return {root, config, clean: () => rmSync(root, {recursive: true, force: true})};
}

test("R3 cell has distinct identity and exact 8K phase budget", () => {
  const f = fixture();
  try {
    const cell = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: INTENT_ANCHOR_ARM});
    assert.equal(cell.comparison_arm, INTENT_ANCHOR_ARM); assert.equal(cell.context_projection, INTENT_ANCHOR_ARM);
    assert.equal(cell.context_limit, 8000); assert.equal(cell.limits.total_tokens, 96000); assert.equal(cell.limits.maximum_calls, 96); assert.equal(cell.limits.output_cap, 2048);
    assert.deepEqual(cell.phase_contract, {exploration_tokens: 88000, exploration_calls: 95, finalization_tokens: 8000, finalization_calls: 1});
    const neighborhood = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: SOURCE_NEIGHBORHOOD_ARM});
    assert.equal(neighborhood.comparison_arm, SOURCE_NEIGHBORHOOD_ARM);
    assert.equal(neighborhood.context_projection, SOURCE_NEIGHBORHOOD_ARM);
    assert.notEqual(neighborhood.cell_id, cell.cell_id);
    assert.deepEqual(neighborhood.phase_contract, cell.phase_contract);
    const followthrough = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: SEARCH_FOLLOWTHROUGH_ARM});
    assert.equal(followthrough.comparison_arm, SEARCH_FOLLOWTHROUGH_ARM);
    assert.notEqual(followthrough.cell_id, neighborhood.cell_id);
    const objectiveSearch = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: OBJECTIVE_SEARCH_ARM});
    assert.equal(objectiveSearch.comparison_arm, OBJECTIVE_SEARCH_ARM);
    assert.notEqual(objectiveSearch.cell_id, followthrough.cell_id);
    const apiSearch = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: API_SEARCH_ARM});
    assert.equal(apiSearch.comparison_arm, API_SEARCH_ARM);
    assert.notEqual(apiSearch.cell_id, objectiveSearch.cell_id);
    const capped = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: "intent-anchor-terminal-shortlist-cap12-r1"});
    assert.equal(capped.comparison_arm, "intent-anchor-terminal-shortlist-cap12-r1");
    assert.notEqual(capped.cell_id, cell.cell_id);
    assert.throws(() => buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: "ranked-source-hints"}), /candidate-only/);
  } finally { f.clean(); }
});
test("160k exposed diagnostic derives a matched control cell and phase allocation", () => {
  const f = fixture();
  try {
    f.config.total_tokens_per_arm = 160000;
    f.config.tasks[0].cell_template.limits.total_tokens = 160000;
    const cell = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: INTENT_ANCHOR_ARM});
    assert.equal(cell.context_limit, 8000);
    assert.equal(cell.limits.total_tokens, 160000);
    assert.deepEqual(cell.phase_contract, {exploration_tokens: 152000, exploration_calls: 95, finalization_tokens: 8000, finalization_calls: 1});
  } finally { f.clean(); }
});
test("160k exposed diagnostic reaches the client without relaxing 8k or admitting arbitrary caps", () => {
  const f = fixture();
  try {
    f.config.total_tokens_per_arm = 160000;
    f.config.tasks[0].cell_template.limits.total_tokens = 160000;
    const signal = new AbortController().signal;
    const factory = comparisonLiveClientFactory({credential_path: "unused", signal,
      persistence: {atomicJson: () => {}}, before_dispatch: async () => true,
      credential_override: {registry: {consume: async () => {throw Error("unexpected-secret-access");}},
        reference: createSecretReference({provider_id: "fixture", locator: "unused"})}, candidate_arm: INTENT_ANCHOR_ARM});
    const cell = buildIntentAnchorCell({config: f.config, task_id: "contextbench-1", arm: INTENT_ANCHOR_ARM});
    cell.provider_profile.index_tokenizer_transport_attempts = 1;
    cell.provider_profile.request_tokenizer_transport_attempts = 1;
    cell.provider_profile.request_tokenizer_maximum_calls = 291;
    const client = factory.create_client({cell, signal});
    assert.equal(typeof client.measure_index, "function");
    assert.throws(() => factory.create_client({cell: {...cell, context_limit: 8192}, signal}), /common-budget/);
    assert.throws(() => factory.create_client({cell: {...cell, limits: {...cell.limits, total_tokens: 128000}}, signal}), /common-budget/);
  } finally { f.clean(); }
});

test("arm binds task and R3 cell through the provider-free executor seam", async () => {
  const f = fixture();
  try {
    const controller = new AbortController(); let factoryCalls = 0;
    const result = await runIntentAnchorArm({config: f.config, task_id: "contextbench-1", arm: INTENT_ANCHOR_ARM, signal: controller.signal,
      create_client: async ({signal}) => { factoryCalls++; assert.equal(signal, controller.signal); return {receipts: [], index_receipts: []}; }},
    {execute_candidate: async options => {
      assert.equal(options.cell.comparison_arm, INTENT_ANCHOR_ARM); assert.equal(options.task_path, f.config.tasks[0].task_path);
      await options.create_client({cell: options.cell}); assert.equal(await options.before_model_dispatch(), true);
      return {status: "fixture", receipts: [], index_tokenizer_receipts: []};
    }});
    assert.equal(result.status, "fixture"); assert.equal(factoryCalls, 1);
  } finally { f.clean(); }
});

test("native driver and orchestrator reject predecessor arm identities before effects", async () => {
  await assert.rejects(runIntentAnchorNativeEpisode({arm: "ranked-source-hints", native: {client: {index_receipts: []}}}), /unknown-arm/);
  const persistence = Object.fromEntries(["writeJson", "append", "atomicJson", "createLock", "removeLock"].map(name => [name, () => { throw new Error(`unexpected-effect:${name}`); }]));
  await assert.rejects(runPreparedIntentAnchorTask({cell: {context_limit: 8000, limits: {total_tokens: 96000, maximum_calls: 96, output_cap: 2048}, phase_contract: {exploration_tokens: 88000, finalization_tokens: 8000}, comparison_arm: "ranked-source-hints", context_projection: "ranked-source-hints"}, persistence,
    source_out: "/tmp/never-source", evidence_root: "/tmp/never-evidence", admit_source: async () => true}), /comparison-arm/);
});
