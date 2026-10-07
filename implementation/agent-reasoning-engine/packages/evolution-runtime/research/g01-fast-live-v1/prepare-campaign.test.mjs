import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {test} from "node:test";
import {prepareCampaign} from "./prepare-campaign.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const repo = resolve(import.meta.dirname, "../../../../../..");

test("prepares source-only pair plans and campaign freeze without scoring", () => {
  const temp = mkdtempSync(join(tmpdir(), "g01-campaign-test-"));
  try {
    const instanceId = "test__go__maintenance__bugfix__12345678";
    const taskPath = join(temp, `${instanceId}.json`);
    writeFileSync(taskPath, JSON.stringify({instance_id: instanceId, original_inst_id: "original", repo: "cli/cli", repo_url: "https://example.invalid/cli", language: "go",
      base_commit: "a".repeat(40), problem_statement: "Find the affected source", source: "fixture"}));
    const configPath = join(temp, "base.json");
    writeFileSync(configPath, JSON.stringify({context_limit: 8000, total_tokens_per_arm: 96000, model: "fixture-model",
      tasks: [{id: "contextbench-1", instance_id: "old", cell_template: {instance_id: "old"}}]}));
    const definitionPath = join(temp, "DEFINITION.json");
    const definition = {schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch", root: join(temp, "campaign"), source_root: repo,
      base_config_path: configPath, control_arm: "intent-anchor-convergence-r3", candidate_arm: "intent-anchor-terminal-shortlist-adaptive-r1",
      transport_reliability: "bounded-view-and-output-cap-r1", non_tool_terminal_after_convergence: true,
      late_bind_delivered_base: true,
      scorer: {image: "are-contextbench-scorer:g01-r1", repo: temp, upstream: temp, cache: temp},
      ordered_tasks: [{slug: "go-fixture", instance_id: instanceId, repo: "cli/cli", task_path: taskPath, repository_cache: temp}],
      decision_rule: "All reported", claim_ceiling: "Fixture only"};
    const definitionBytes = Buffer.from(JSON.stringify(definition));
    writeFileSync(definitionPath, definitionBytes);
    const result = prepareCampaign({definitionPath, definitionSha256: sha(definitionBytes)});
    assert.equal(result.ordered_tasks.length, 1);
    assert.equal(sha(readFileSync(result.campaign_path)), result.campaign_sha256);
    const pair = result.ordered_tasks[0];
    assert.equal(sha(readFileSync(pair.pair_plan_path)), pair.pair_plan_sha256);
    const plan = JSON.parse(readFileSync(pair.pair_plan_path));
    const campaign = JSON.parse(readFileSync(result.campaign_path));
    assert.ok(campaign.sources.some(source => source.path.endsWith("/source-neighborhood-live-r1.mjs") && source.sha256 === sha(readFileSync(source.path))));
    assert.equal(plan.control_arm, "intent-anchor-convergence-r3");
    assert.equal(plan.candidate_arm, "intent-anchor-terminal-shortlist-adaptive-r1");
    assert.equal(plan.transport_reliability, "bounded-view-and-output-cap-r1");
    assert.equal(plan.non_tool_terminal_after_convergence, true);
    assert.equal(plan.late_bind_delivered_base, true);
    for (const name of ["control", "candidate"]) {
      const freeze = plan.arms[name];
      assert.equal(sha(readFileSync(freeze.freeze_path)), freeze.freeze_sha256);
      const frozen = JSON.parse(readFileSync(freeze.freeze_path));
      assert.equal(frozen.task_sha256, sha(readFileSync(taskPath)));
      assert.equal(frozen.transport_reliability, "bounded-view-and-output-cap-r1");
      assert.equal(JSON.parse(readFileSync(frozen.config_path)).transport_reliability, "bounded-view-and-output-cap-r1");
      assert.equal(frozen.non_tool_terminal_after_convergence, true);
      assert.equal(JSON.parse(readFileSync(frozen.config_path)).non_tool_terminal_after_convergence, true);
      assert.equal(frozen.late_bind_delivered_base, true);
      assert.equal(JSON.parse(readFileSync(frozen.config_path)).late_bind_delivered_base, true);
    }
    assert.throws(() => prepareCampaign({definitionPath, definitionSha256: sha(definitionBytes)}));
  } finally { rmSync(temp, {recursive: true, force: true}); }
});

test("pins a span-refinement rule only on the candidate arm", () => {
  const temp = mkdtempSync(join(tmpdir(), "g01-campaign-refinement-test-"));
  try {
    const instanceId = "test__go__maintenance__bugfix__12345678", taskPath = join(temp, `${instanceId}.json`);
    writeFileSync(taskPath, JSON.stringify({instance_id: instanceId, original_inst_id: "original", repo: "cli/cli", repo_url: "https://example.invalid/cli", language: "go",
      base_commit: "a".repeat(40), problem_statement: "Find the affected source", source: "fixture"}));
    const configPath = join(temp, "base.json");
    writeFileSync(configPath, JSON.stringify({context_limit: 8000, total_tokens_per_arm: 96000, model: "fixture-model",
      tasks: [{id: "contextbench-1", instance_id: "old", cell_template: {instance_id: "old"}}]}));
    const definitionPath = join(temp, "DEFINITION.json");
    const definition = {schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch", root: join(temp, "campaign"), source_root: repo,
      base_config_path: configPath, control_arm: "intent-anchor-convergence-r3", candidate_arm: "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
      span_refinement_policy: "source-only-go-selected-subspan-r1", scorer: {image: "are-contextbench-scorer:g01-r1", repo: temp, upstream: temp, cache: temp},
      ordered_tasks: [{slug: "go-fixture", instance_id: instanceId, repo: "cli/cli", task_path: taskPath, repository_cache: temp}],
      decision_rule: "All reported", claim_ceiling: "Fixture only"};
    const bytes = Buffer.from(JSON.stringify(definition)); writeFileSync(definitionPath, bytes);
    const result = prepareCampaign({definitionPath, definitionSha256: sha(bytes)}), campaign = JSON.parse(readFileSync(result.campaign_path));
    assert.equal(campaign.span_refinement_policy, definition.span_refinement_policy);
    const plan = JSON.parse(readFileSync(result.ordered_tasks[0].pair_plan_path));
    assert.equal(plan.span_refinement_policy, definition.span_refinement_policy);
    const control = JSON.parse(readFileSync(plan.arms.control.freeze_path)), candidate = JSON.parse(readFileSync(plan.arms.candidate.freeze_path));
    assert.equal(control.span_refinement_policy, undefined);
    assert.equal(candidate.span_refinement_policy, definition.span_refinement_policy);
    assert.ok(candidate.sources.some(x => x.path.endsWith("/span-refinement-r1.mjs") && x.sha256 === sha(readFileSync(x.path))));
  } finally { rmSync(temp, {recursive: true, force: true}); }
});

test("admits a symmetric 160K arm template without changing its budget", () => {
  const temp = mkdtempSync(join(tmpdir(), "g01-campaign-160k-test-"));
  try {
    const instanceId = "test__python__maintenance__bugfix__12345678";
    const taskPath = join(temp, `${instanceId}.json`);
    writeFileSync(taskPath, JSON.stringify({instance_id: instanceId, original_inst_id: "original",
      repo: "example/repo", repo_url: "https://example.invalid/repo", language: "python",
      base_commit: "b".repeat(40), problem_statement: "Find the affected source", source: "fixture"}));
    const configPath = join(temp, "base.json");
    writeFileSync(configPath, JSON.stringify({context_limit: 8000, total_tokens_per_arm: 160000,
      model: "fixture-model", tasks: [{id: "contextbench-1", instance_id: "old",
        cell_template: {instance_id: "old", limits: {total_tokens: 160000}}}]}));
    const definitionPath = join(temp, "DEFINITION.json");
    const definition = {schema_version: "are.g01-campaign-definition/v1", status: "pre-dispatch",
      root: join(temp, "campaign"), source_root: repo, base_config_path: configPath,
      control_arm: "intent-anchor-convergence-r3",
      candidate_arm: "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
      scorer: {image: "are-contextbench-scorer:g01-r1", repo: temp, upstream: temp, cache: temp},
      ordered_tasks: [{slug: "python-fixture", instance_id: instanceId, repo: "example/repo",
        task_path: taskPath, repository_cache: temp}],
      decision_rule: "All reported", claim_ceiling: "Fixture only"};
    const bytes = Buffer.from(JSON.stringify(definition));
    writeFileSync(definitionPath, bytes);
    const result = prepareCampaign({definitionPath, definitionSha256: sha(bytes)});
    const plan = JSON.parse(readFileSync(result.ordered_tasks[0].pair_plan_path));
    for (const name of ["control", "candidate"]) {
      const freeze = JSON.parse(readFileSync(plan.arms[name].freeze_path));
      const config = JSON.parse(readFileSync(freeze.config_path));
      assert.equal(config.context_limit, 8000);
      assert.equal(config.total_tokens_per_arm, 160000);
      assert.equal(config.tasks[0].cell_template.limits.total_tokens, 160000);
    }
  } finally {rmSync(temp, {recursive: true, force: true});}
});
