// Freeze source-only matched G01 pairs from one campaign JSON before dispatch.
// This writes plans and hashes only; it never reads gold, calls a model, or scores.
import {createHash} from "node:crypto";
import {lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from "node:fs";
import {basename, join, relative, resolve} from "node:path";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => { if (!condition) throw new Error(`g01-campaign.${reason}`); };
const absolute = value => typeof value === "string" && value.startsWith("/") && resolve(value) === value;
const save = (path, value) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
  return hash(bytes);
};

export function bindSourceTree(sourceRoot) {
  const root = resolve(sourceRoot), rows = [];
  const walk = directory => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name), status = lstatSync(path);
      need(!status.isSymbolicLink(), "source-tree-symlink");
      if (status.isDirectory()) {if (name !== "__pycache__") walk(path);}
      else {
        need(status.isFile(), "source-tree-nonfile");
        if (/\.py[co]$/.test(name)) continue; // Runtime-generated Python bytecode is not source.
        const rel = relative(root, path);
        rows.push({relative_path: rel, path, sha256: hash(readFileSync(path))});
      }
    }
  };
  walk(root);
  rows.sort((a, b) => a.relative_path < b.relative_path ? -1 : a.relative_path > b.relative_path ? 1 : 0);
  return {file_count: rows.length,
    tree_sha256: hash(rows.map(row => `${row.relative_path}\0${row.sha256}\n`).join("")),
    sources: rows.map(({path, sha256}) => ({path, sha256}))};
}

const sourceFiles = [
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-terminal-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/late-bind-delivered-base-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-convergence-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-episode-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-hints-views-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/source-neighborhood-live-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/distinctive-source-acquisition-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-native-driver-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-arm-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-live-client-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-transport-ledger-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-integration-r3.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_hints_r3.py",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_worker_r2.py",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_supervisor_r1.py",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-worker-r1.mjs",
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/recovery-generation-process.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-campaign.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/summarize-campaign.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs",
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/overlay-source-layout-r1.mjs"
];

export function prepareCampaign({definitionPath, definitionSha256}) {
  need(absolute(definitionPath) && /^[a-f0-9]{64}$/.test(definitionSha256), "arguments");
  const definitionBytes = readFileSync(definitionPath);
  need(hash(definitionBytes) === definitionSha256, "definition-drift");
  const definition = JSON.parse(definitionBytes);
  need(definition.schema_version === "are.g01-campaign-definition/v1" && definition.status === "pre-dispatch", "definition-shape");
  const {root, source_root: sourceRoot, source_scratch_root: scratchRoot, base_config_path: baseConfigPath, scorer, ordered_tasks: tasks} = definition;
  need([root, sourceRoot, baseConfigPath, scorer?.repo, scorer?.upstream, scorer?.cache].every(absolute), "paths");
  need(scratchRoot === undefined || (absolute(scratchRoot) &&
    /^g01-product-replication-r[0-9]+$/.test(basename(root)) &&
    scratchRoot === join("/tmp", `are-${basename(root)}-source`)), "source-scratch-root");
  const overlay = definition.source_checkout_layout;
  let residency = null;
  if (overlay !== undefined) {
    const overlayModes = {
      "g01-r15-r2-single-lower-overlay-r1": {campaigns: ["g01-product-replication-r15"], residency: "g01-r15-r2-single-checkout-residency-r1"},
      "g01-r16-r2-single-lower-overlay-r1": {campaigns: ["g01-product-replication-r16", "g01-product-replication-r17"], residency: "g01-r16-r2-single-checkout-residency-r1"}
    };
    const selected = overlayModes[overlay.mode];
    need(Object.keys(overlay).sort().join(",") === "mode,residency_receipt_sha256" &&
      selected !== undefined &&
      /^[a-f0-9]{64}$/.test(overlay.residency_receipt_sha256) &&
      selected.campaigns.includes(basename(root)) && scratchRoot !== undefined,
    "source-checkout-layout");
    const path = `/opt/are/evolution-runtime/${selected.residency}/RESIDENCY-PROBE.json`;
    const bytes = readFileSync(path);
    need(hash(bytes) === overlay.residency_receipt_sha256, "residency-receipt-drift");
    residency = JSON.parse(bytes);
    need(residency.status === "passed-retained-source-only" && residency.task_count === 24 &&
      residency.model_calls === 0 && residency.gold_loaded === false &&
      tasks.length === 24 && residency.rows?.length === 24 &&
      tasks.every((task, index) => residency.rows[index].ordinal === index + 1 &&
        residency.rows[index].instance_id === task.instance_id &&
        residency.rows[index].base_commit === task.base_commit), "residency-task-binding");
  }
  need(scorer.image === "are-contextbench-scorer:g01-r1", "scorer");
  need(definition.control_arm === "intent-anchor-convergence-r3" && ["intent-anchor-terminal-shortlist-adaptive-r1", "intent-anchor-terminal-shortlist-objective-r1", "intent-anchor-terminal-shortlist-distinctive-r1", "intent-anchor-terminal-shortlist-distinctive-early-r1", "intent-anchor-terminal-shortlist-distinctive-conditional-r1", "intent-anchor-terminal-shortlist-distinctive-identifier-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1"].includes(definition.candidate_arm), "arms");
  need(definition.abstention_policy === undefined || definition.abstention_policy === "explicit-no-final-context-zero-r1", "abstention-policy");
  need(definition.transport_reliability === undefined || definition.transport_reliability === "bounded-view-and-output-cap-r1", "transport-reliability");
  need(definition.non_tool_terminal_after_convergence === undefined || definition.non_tool_terminal_after_convergence === true, "non-tool-terminal-policy");
  need(definition.late_bind_delivered_base === undefined || definition.late_bind_delivered_base === true, "late-bind-delivered-base-policy");
  need(definition.span_refinement_policy === undefined || (definition.span_refinement_policy === "source-only-go-selected-subspan-r1" && definition.candidate_arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1"), "span-refinement-policy");
  need(!definition.transport_reliability || definition.candidate_arm !== "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1", "incompatible-reasoning-policies");
  need(Array.isArray(tasks) && tasks.length > 0 && tasks.every(task => absolute(task.task_path) && absolute(task.repository_cache) && /^[a-z0-9-]+$/.test(task.slug)), "tasks");
  need(new Set(tasks.map(task => task.slug)).size === tasks.length && new Set(tasks.map(task => task.instance_id)).size === tasks.length, "duplicate-task");
  need(typeof definition.decision_rule === "string" && definition.decision_rule.length > 0 && typeof definition.claim_ceiling === "string" && definition.claim_ceiling.length > 0, "claim");
  const base = JSON.parse(readFileSync(baseConfigPath));
  need(base.context_limit === 8000 && [96000, 160000].includes(base.total_tokens_per_arm) && base.tasks?.[0], "template");
  const pinnedSourceFiles = [...sourceFiles, ...(definition.span_refinement_policy ? ["implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/span-refinement-r1.mjs"] : [])];
  const sources = definition.source_tree_sha256 === undefined ? pinnedSourceFiles.map(pathRelative => {
    const path = join(sourceRoot, pathRelative);
    return {path, sha256: hash(readFileSync(path))};
  }) : (() => {
    need(/^[a-f0-9]{64}$/.test(definition.source_tree_sha256) &&
      Number.isSafeInteger(definition.source_tree_file_count) && definition.source_tree_file_count > 0,
    "source-tree-binding-shape");
    const tree = bindSourceTree(sourceRoot);
    need(tree.tree_sha256 === definition.source_tree_sha256 &&
      tree.file_count === definition.source_tree_file_count, "source-tree-drift");
    need(pinnedSourceFiles.every(relativePath => tree.sources.some(row => row.path === join(sourceRoot, relativePath))),
      "source-tree-required-file-missing");
    return tree.sources;
  })();
  mkdirSync(root, {recursive: false, mode: 0o700});
  const frozenTasks = [];
  for (const [taskIndex, taskSpec] of tasks.entries()) {
    need(basename(taskSpec.task_path) === `${taskSpec.instance_id}.json`, "task-name");
    const taskBytes = readFileSync(taskSpec.task_path), task = JSON.parse(taskBytes);
    const allowed = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
    need(Object.keys(task).length === allowed.length && allowed.every(key => typeof task[key] === "string" && task[key].length > 0), "source-only-task");
    need(task.instance_id === taskSpec.instance_id && task.repo === taskSpec.repo && /^[a-f0-9]{40}$/.test(task.base_commit), "task-identity");
    const pairRoot = join(root, taskSpec.slug);
    mkdirSync(pairRoot, {mode: 0o700});
    const template = base.tasks[0], taskId = "contextbench-fresh";
    const row = {...template, id: taskId, instance_id: task.instance_id, base_commit: task.base_commit, task_path: taskSpec.task_path,
      task_sha256: hash(taskBytes), repository_cache: taskSpec.repository_cache,
      cell_template: {...template.cell_template, instance_id: task.instance_id}};
    const config = {...base, experiment_id: `g01-aggregate-${taskSpec.slug}-r1`, tasks: [row], ...(definition.transport_reliability ? {transport_reliability: definition.transport_reliability} : {}), ...(definition.non_tool_terminal_after_convergence ? {non_tool_terminal_after_convergence: true} : {}), ...(definition.late_bind_delivered_base ? {late_bind_delivered_base: true} : {})};
    const configPath = join(pairRoot, "CONFIG.json"), configSha256 = save(configPath, config);
    const common = {schema_version: "are.g01-fast-live-freeze/v1", status: "frozen-before-dispatch", config_path: configPath,
      config_sha256: configSha256, task_id: taskId, task_sha256: row.task_sha256,
      candidate_view_path: null, candidate_view_sha256: null,
      sources: [...sources, {path: taskSpec.task_path, sha256: row.task_sha256}], claim_ceiling: definition.claim_ceiling,
      ...(definition.transport_reliability ? {transport_reliability: definition.transport_reliability} : {}),
      ...(definition.non_tool_terminal_after_convergence ? {non_tool_terminal_after_convergence: true} : {}),
      ...(definition.late_bind_delivered_base ? {late_bind_delivered_base: true} : {}),
      ...(overlay ? {source_checkout_layout: {...overlay, ordinal: taskIndex + 1}} : {}),
      open_questions: ["Does this fixed arm improve the predeclared aggregate G01 campaign?"]};
    const arms = {};
    for (const [name, arm] of [["control", definition.control_arm], ["candidate", definition.candidate_arm]]) {
      const freezePath = join(pairRoot, `${name.toUpperCase()}-FREEZE.json`);
      const freezeSha256 = save(freezePath, {...common, arm, output_root: join(pairRoot, name),
        ...(scratchRoot ? {source_out: join(scratchRoot, taskSpec.slug, name, "source", "00")} : {}),
        ...(name === "candidate" && definition.span_refinement_policy ? {span_refinement_policy: definition.span_refinement_policy} : {})});
      arms[name] = {freeze_path: freezePath, freeze_sha256: freezeSha256};
    }
    const pairPlanPath = join(pairRoot, "PAIR-PLAN.json");
    const pairPlanSha256 = save(pairPlanPath, {schema_version: "are.g01-fast-live-pair-plan/v1", status: "frozen-before-dispatch",
      root: pairRoot, control_arm: definition.control_arm, candidate_arm: definition.candidate_arm, arms, scorer,
      ...(definition.abstention_policy ? {abstention_policy: definition.abstention_policy} : {}),
      ...(definition.transport_reliability ? {transport_reliability: definition.transport_reliability} : {}),
      ...(definition.non_tool_terminal_after_convergence ? {non_tool_terminal_after_convergence: true} : {}),
      ...(definition.late_bind_delivered_base ? {late_bind_delivered_base: true} : {}),
      ...(definition.span_refinement_policy ? {span_refinement_policy: definition.span_refinement_policy} : {}), claim_ceiling: definition.claim_ceiling});
    frozenTasks.push({slug: taskSpec.slug, instance_id: task.instance_id, repo: task.repo, base_commit: task.base_commit,
      source_only_task_sha256: row.task_sha256, pair_plan_path: pairPlanPath, pair_plan_sha256: pairPlanSha256});
  }
  const campaign = {schema_version: "are.g01-campaign-freeze/v1", status: "frozen-before-dispatch", definition_path: definitionPath,
    definition_sha256: definitionSha256, control_arm: definition.control_arm, candidate_arm: definition.candidate_arm,
    ...(definition.source_tree_sha256 ? {source_tree_sha256: definition.source_tree_sha256,
      source_tree_file_count: definition.source_tree_file_count} : {}),
    ...(definition.abstention_policy ? {abstention_policy: definition.abstention_policy} : {}),
    ...(definition.transport_reliability ? {transport_reliability: definition.transport_reliability} : {}),
    ...(definition.non_tool_terminal_after_convergence ? {non_tool_terminal_after_convergence: true} : {}),
    ...(definition.late_bind_delivered_base ? {late_bind_delivered_base: true} : {}),
    ...(overlay ? {source_checkout_layout: overlay} : {}),
    ...(definition.span_refinement_policy ? {span_refinement_policy: definition.span_refinement_policy} : {}),
    model: base.model, context_limit: base.context_limit, decision_rule: definition.decision_rule, claim_ceiling: definition.claim_ceiling,
    sources, ordered_tasks: frozenTasks};
  const campaignPath = join(root, "CAMPAIGN-FREEZE.json"), campaignSha256 = save(campaignPath, campaign);
  return {campaign_path: campaignPath, campaign_sha256: campaignSha256, ordered_tasks: frozenTasks};
}

if (process.argv[1] === import.meta.filename) {
  try { console.log(JSON.stringify(prepareCampaign({definitionPath: process.argv[2], definitionSha256: process.argv[3]}))); }
  catch (error) { console.error(JSON.stringify({status: "prepare_error", error: String(error.message)})); process.exitCode = 2; }
}
