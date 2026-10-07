// Independent, exact-scope G01 r11-r15 and r17 freeze/pair/seal/native-score audit.
// --check may inspect a partial campaign; --write requires all 24 terminal
// pair results. --terminal seals only the exact r15 or r17 safety stop.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, readdirSync, statSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

const revision = process.argv[3] ?? "r11";
const campaigns = {
  r11: {input: "r14", definition: "adbaaf8355c8887a18e31360858780fd395a5dfd1cd8838c6a83a5ae10a0e89f",
    freeze: "8614ceff2338089f98630ea30c1ed887db55d004de6c77cbddb7a50098048081", sources: 407},
  r12: {input: "r15", definition: "d7410c9e5a8ad346f9c6a312d02bda6282b0893a79e0c3017304fa564c70c7c4",
    freeze: "b47ba1b2ea0a540f085758a84cc45599c9fdf6a124e18c144b6e9a8f2c4f6ee4", sources: 408},
  r13: {input: "r16", definition: "28cab225e56e73b9b36c0a09520a30f8d835910d0b3230a38cc7c5345de4ba58",
    freeze: "0f67532e8a8367d4f8b275c07db638c23405a12fa865dc66904ae2a44ec2007d", sources: 412},
  r14: {input: "r17", definition: "ca7b9dc4c9fd9537e63f14f8c644c54ebba63d29b044c3406ed956737f101efb",
    freeze: "9dedcda5586e059bda95adfd08decd9c452006d1c53b64361fb8150a6a827754", sources: 412},
  r15: {input: "r15-overlay-r2", definition: "0ff88d4ff39237d62ecafb66c5ee96d06ba3cc750a58b36ad1b69daf033bc6bf",
    freeze: "d68a1ab13122f5a0e4887e5e3fb41fbabe43c6265b301e7f88b4418424819eda", sources: 413},
  r17: {input: "r17-r16cohort", definition: "b08037525f086b21043cb545be99ee23c8c0db93fb50f6016f4541c9243c822c",
    freeze: "31c9b1e0c1bbe533852e9577b17f9308a78a104dd1814b33a98af030145558b7", sources: 415}
};
const scope = campaigns[revision];
const root = `/opt/are/evolution-runtime/g01-product-replication-${revision}`;
const definitionPath = `/opt/are/evolution-runtime/g01-product-replication-input-${scope?.input}/DEFINITION.json`;
const definitionSha = scope?.definition;
const freezeSha = scope?.freeze;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = path => readFileSync(path);
const read = path => JSON.parse(bytes(path));
const need = (value, reason) => {if (!value) throw Error(`g01-${revision}-audit.${reason}`);};
const mode = process.argv[2];
need(scope && ["--check", "--write", "--terminal"].includes(mode) &&
  (process.argv.length === 3 || process.argv.length === 4), "arguments");

const freezePath = join(root, "CAMPAIGN-FREEZE.json");
need(sha(bytes(definitionPath)) === definitionSha && sha(bytes(freezePath)) === freezeSha,
  "frozen-input-drift");
const definition = read(definitionPath), freeze = read(freezePath);
need(definition.schema_version === "are.g01-campaign-definition/v1" &&
  freeze.schema_version === "are.g01-campaign-freeze/v1" &&
  freeze.status === "frozen-before-dispatch" && freeze.definition_path === definitionPath &&
  freeze.definition_sha256 === definitionSha &&
  definition.ordered_tasks?.length === 24 && freeze.ordered_tasks?.length === 24 &&
  freeze.sources?.length === scope.sources && freeze.source_tree_file_count === scope.sources &&
  freeze.source_tree_sha256 === definition.source_tree_sha256 &&
  freeze.abstention_policy === "explicit-no-final-context-zero-r1" &&
  freeze.context_limit === 8000 && freeze.model === "glm-5.3-flash" &&
  definition.status === "pre-dispatch", "campaign-binding");
for (const source of freeze.sources) need(sha(bytes(source.path)) === source.sha256,
  `source-drift:${source.path}`);

const rows = [];
for (const [index, spec] of definition.ordered_tasks.entries()) {
  const task = freeze.ordered_tasks[index];
  need(task.slug === spec.slug && task.instance_id === spec.instance_id &&
    task.repo === spec.repo && task.source_only_task_sha256 === sha(bytes(spec.task_path)) &&
    task.pair_plan_path === join(root, task.slug, "PAIR-PLAN.json") &&
    task.pair_plan_sha256 === sha(bytes(task.pair_plan_path)),
    `task-binding:${spec.slug}`);
  const pairRoot = dirname(task.pair_plan_path), plan = read(task.pair_plan_path);
  need(plan.schema_version === "are.g01-fast-live-pair-plan/v1" && plan.root === pairRoot &&
    plan.abstention_policy === freeze.abstention_policy &&
    plan.control_arm === freeze.control_arm && plan.candidate_arm === freeze.candidate_arm,
    `pair-plan:${task.slug}`);
  for (const arm of ["control", "candidate"]) {
    const binding = plan.arms?.[arm];
    need(binding?.freeze_path === join(pairRoot, `${arm.toUpperCase()}-FREEZE.json`) &&
      sha(bytes(binding.freeze_path)) === binding.freeze_sha256,
      `arm-freeze:${task.slug}:${arm}`);
    const armFreeze = read(binding.freeze_path);
    need(armFreeze.non_tool_terminal_after_convergence === freeze.non_tool_terminal_after_convergence &&
      sha(bytes(armFreeze.config_path)) === armFreeze.config_sha256,
      `arm-config:${task.slug}:${arm}`);
    const config = read(armFreeze.config_path);
    const template = config.tasks?.[0]?.cell_template;
    need(config.model === "glm-5.3-flash" && config.context_limit === 8000 &&
      config.total_tokens_per_arm === 160000 && template?.limits?.total_tokens === 160000 &&
      template?.provider_profile?.model_timeout_ms === 240000 &&
      template?.provider_profile?.index_tokenizer_transport_attempts === 1 &&
      template?.provider_profile?.request_tokenizer_transport_attempts === 1,
      `arm-no-retry-protocol:${task.slug}:${arm}`);
  }
  const resultPath = join(pairRoot, "PAIR-RESULT.json");
  if (!existsSync(resultPath)) {
    if (revision === "r15") need(!existsSync(join(pairRoot, "control", "runs")) &&
      !existsSync(join(pairRoot, "candidate", "runs")), `unattempted:${task.slug}`);
    rows.push({slug: task.slug, instance_id: task.instance_id, status: "pending"});
    continue;
  }
  const result = read(resultPath), resultSha = sha(bytes(resultPath));
  need(result.schema === "are.g01-fast-live-pair-result/v1" &&
    result.task_sha256 === task.source_only_task_sha256 &&
    ["scored", "unscored", "scoring_error"].includes(result.status),
    `pair-result:${task.slug}`);
  if (result.status !== "scored") {
    if (revision === "r17") {
      need(result.status === "unscored" && index === 4 && task.slug === "task-05" &&
        !existsSync(join(pairRoot, "PREDICTION-SEAL.json")),
      `unscored-shape:${task.slug}`);
      for (const arm of ["control", "candidate"]) {
        const output = join(pairRoot, arm, "runs", "00");
        const raw = read(join(output, "result.json"));
        const events = readFileSync(join(output, "events.jsonl"), "utf8")
          .trim().split("\n").map(JSON.parse);
        need(readdirSync(join(pairRoot, arm, "runs")).sort().join() === "00" &&
          result.arms?.[arm]?.status === "dispatch_error" &&
          result.arms[arm].error?.includes("source-index.failed") &&
          raw.status === "orchestration_error" && raw.error === "source-index.failed" &&
          events[0]?.kind === "source-index-failure" &&
          events[0].error === "source-index.failed" &&
          events[0].evidence?.report?.error ===
            (arm === "control" ? "worker-deadline" : "worker-exit--9") &&
          events[0].model_calls === 0 &&
          !existsSync(join(output, "prediction.json")) &&
          !existsSync(join(output, "native-score.json")),
        `unscored-arm:${task.slug}:${arm}`);
      }
    }
    if (revision === "r14") {
      need(result.status === "unscored" && task.slug === "python-sphinx-765e5e14" &&
        result.arms?.control?.status === "final_context_selected" &&
        result.arms?.candidate?.status === "run_error" &&
        result.arms?.candidate?.error === "intent-anchor-episode.non-tool-corrections-exhausted" &&
        !existsSync(join(pairRoot, "PREDICTION-SEAL.json")),
      `unscored-shape:${task.slug}`);
      for (const arm of ["control", "candidate"]) {
        const output = join(pairRoot, arm, "runs", "00");
        const raw = read(join(output, "result.json"));
        need(readdirSync(join(pairRoot, arm, "runs")).sort().join() === "00" &&
          raw.status === result.arms[arm].status &&
          (raw.error ?? null) === result.arms[arm].error &&
          existsSync(join(output, "started.json")) &&
          existsSync(join(output, "completed.json")) &&
          !existsSync(join(output, "native-score.json")) &&
          existsSync(join(output, "prediction.json")) === (arm === "control"),
        `unscored-arm:${task.slug}:${arm}`);
      }
    }
    if (revision === "r15") {
      need(result.status === "unscored" && index === 1 && task.slug === "task-02" &&
        !existsSync(join(pairRoot, "PREDICTION-SEAL.json")), `unscored-shape:${task.slug}`);
      for (const arm of ["control", "candidate"]) {
        const output = join(pairRoot, arm, "runs", "00"), raw = read(join(output, "result.json"));
        need(result.arms?.[arm]?.status === "run_error" &&
          result.arms[arm].error === "intent-anchor-integration.no-delivered-confirmed-read" &&
          raw.status === result.arms[arm].status && raw.error === result.arms[arm].error &&
          !existsSync(join(output, "native-score.json")) &&
          !existsSync(join(output, "prediction.json")), `unscored-arm:${task.slug}:${arm}`);
      }
    }
    rows.push({slug: task.slug, instance_id: task.instance_id, status: result.status,
      pair_result_sha256: resultSha});
    continue;
  }
  const sealPath = join(pairRoot, "PREDICTION-SEAL.json"), seal = read(sealPath);
  need(seal.status === "sealed-before-native-scoring" &&
    seal.scoring_status_at_seal === "not-started" &&
    seal.task_sha256 === task.source_only_task_sha256,
    `pre-score-seal:${task.slug}`);
  const f1 = metric => metric.coverage + metric.precision > 0 ?
    2 * metric.coverage * metric.precision / (metric.coverage + metric.precision) : 0;
  for (const arm of ["control", "candidate"]) {
    const scored = result[arm], output = join(pairRoot, arm, "runs", "00");
    need(readdirSync(join(pairRoot, arm, "runs")).sort().join() === "00",
      `single-attempt:${task.slug}:${arm}`);
    need(Number.isFinite(scored?.known_model_tokens) && scored.known_model_tokens > 0 &&
      Number.isFinite(scored.duration_seconds) && scored.duration_seconds > 0 &&
      Number.isFinite(scored.span_f1) && Number.isFinite(scored.file_f1),
      `cost-or-quality:${task.slug}:${arm}`);
    if (scored.scoring_basis === "pinned-native") {
      const predictionPath = join(output, "prediction.json");
      const scorePath = join(output, "native-score.json"), native = read(scorePath);
      need(sha(bytes(predictionPath)) === seal[`${arm}_prediction_sha256`] &&
        scored.prediction_sha256 === seal[`${arm}_prediction_sha256`] &&
        sha(bytes(scorePath)) === scored.native_score_sha256 &&
        statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs &&
        Math.abs(f1(native.native.final.span) - scored.span_f1) < 1e-12 &&
        Math.abs(f1(native.native.final.file) - scored.file_f1) < 1e-12,
        `native-score:${task.slug}:${arm}`);
    } else {
      need(scored.scoring_basis === "policy-abstention-zero" &&
        scored.span_f1 === 0 && scored.file_f1 === 0 &&
        scored.prediction_sha256 === null && scored.native_score_sha256 === null &&
        sha(bytes(join(output, "result.json"))) === seal[`${arm}_result_sha256`] &&
        !existsSync(join(output, "prediction.json")) &&
        !existsSync(join(output, "native-score.json")),
        `policy-abstention:${task.slug}:${arm}`);
    }
  }
  rows.push({slug: task.slug, instance_id: task.instance_id, status: "scored",
    pair_result_sha256: resultSha, prediction_seal_sha256: sha(bytes(sealPath)),
    control: result.control, candidate: result.candidate});
}

const scoredPairs = rows.filter(row => row.status === "scored").length;
const terminalPairs = rows.filter(row => row.status !== "pending").length;
if (revision === "r14") need(terminalPairs === 13 && scoredPairs === 12 &&
  rows[12].status === "unscored" && rows.slice(13).every(row => row.status === "pending"),
  "terminal-denominator");
if (revision === "r15" && mode === "--terminal") need(terminalPairs === 2 &&
  scoredPairs === 1 && rows[0].status === "scored" &&
  rows[1].status === "unscored" && rows.slice(2).every(row => row.status === "pending"),
"terminal-denominator");
if (revision === "r17" && mode === "--terminal") need(terminalPairs === 5 &&
  scoredPairs === 4 && rows.slice(0, 4).every(row => row.status === "scored") &&
  rows[4].status === "unscored" && rows.slice(5).every(row => row.status === "pending") &&
  freeze.ordered_tasks.slice(5).every(task => {
    const pairRoot = dirname(task.pair_plan_path);
    return !existsSync(join(pairRoot, "control", "runs")) &&
      !existsSync(join(pairRoot, "candidate", "runs"));
  }), "terminal-denominator");
const audit = {schema_version: `are.g01-${revision}-independent-receipt-audit/v1`,
  status: mode === "--terminal" ? "terminal-failed-receipts-verified" :
    terminalPairs === 24 ? "terminal-receipts-verified" : "partial-receipts-verified",
  definition_sha256: definitionSha, campaign_freeze_sha256: freezeSha,
  planned_pairs: 24, terminal_pairs: terminalPairs, scored_pairs: scoredPairs,
  invalid_pairs: terminalPairs - scoredPairs, pending_pairs: 24 - terminalPairs,
  sources_verified: freeze.sources.length, rows,
  claim_ceiling: "Frozen source, pair, pre-score seal and native-metric integrity only; superiority additionally requires all 24 scored, label audit and frozen interval gates",
  authority_effect: "none"};
if (mode === "--write") {
  need(terminalPairs === 24, "campaign-not-terminal");
  writeFileSync(join(root, "HASH-AUDIT.json"), `${JSON.stringify(audit, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
}
if (mode === "--terminal") {
  need(["r15", "r17"].includes(revision), "terminal-scope");
  writeFileSync(join(root, "TERMINAL-RECEIPT-AUDIT.json"),
    `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, planned_pairs: 24,
  terminal_pairs: terminalPairs, scored_pairs: scoredPairs,
  invalid_pairs: audit.invalid_pairs, pending_pairs: audit.pending_pairs}));
