// Independent, exact-scope G01 r9 freeze/pair/seal/native-score audit.
// --check is read-only and may inspect a partial campaign. --write requires
// all 24 terminal pair results and creates one immutable VPS HASH-AUDIT.json.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

const root = "/opt/are/evolution-runtime/g01-product-replication-r9";
const definitionPath = "/opt/are/evolution-runtime/g01-product-replication-input-r12/DEFINITION.json";
const definitionSha = "9780e1365055b3b9acd6634e3236b6e298cafceb1810fc911b06f5328e433ee2";
const freezeSha = "4851c65ab0c129b50d080cf416574c35eeba4a0b074f89497cee96a798c65c47";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const bytes = path => readFileSync(path);
const read = path => JSON.parse(bytes(path));
const need = (value, reason) => {if (!value) throw Error(`g01-r9-audit.${reason}`);};
const mode = process.argv[2];
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");

const freezePath = join(root, "CAMPAIGN-FREEZE.json");
need(sha(bytes(definitionPath)) === definitionSha && sha(bytes(freezePath)) === freezeSha,
  "frozen-input-drift");
const definition = read(definitionPath), freeze = read(freezePath);
need(definition.schema_version === "are.g01-campaign-definition/v1" &&
  freeze.schema_version === "are.g01-campaign-freeze/v1" &&
  freeze.status === "frozen-before-dispatch" && freeze.definition_path === definitionPath &&
  freeze.definition_sha256 === definitionSha &&
  definition.ordered_tasks?.length === 24 && freeze.ordered_tasks?.length === 24 &&
  freeze.sources?.length === 404 && freeze.source_tree_file_count === 404 &&
  freeze.source_tree_sha256 === definition.source_tree_sha256 &&
  freeze.abstention_policy === "explicit-no-final-context-zero-r1" &&
  freeze.context_limit === 8000 && freeze.model === "glm-5.3-flash" &&
  definition.status === "pre-dispatch",
  "campaign-binding");
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
      sha(bytes(binding.freeze_path)) === binding.freeze_sha256, `arm-freeze:${task.slug}:${arm}`);
    const armFreeze = read(binding.freeze_path);
    need(armFreeze.non_tool_terminal_after_convergence === freeze.non_tool_terminal_after_convergence &&
      sha(bytes(armFreeze.config_path)) === armFreeze.config_sha256,
      `arm-config:${task.slug}:${arm}`);
  }
  const resultPath = join(pairRoot, "PAIR-RESULT.json");
  if (!existsSync(resultPath)) {
    rows.push({slug: task.slug, instance_id: task.instance_id, status: "pending"});
    continue;
  }
  const result = read(resultPath), resultSha = sha(bytes(resultPath));
  need(result.schema === "are.g01-fast-live-pair-result/v1" &&
    result.task_sha256 === task.source_only_task_sha256 &&
    ["scored", "unscored", "scoring_error"].includes(result.status),
    `pair-result:${task.slug}`);
  if (result.status !== "scored") {
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
const audit = {schema_version: "are.g01-r9-independent-receipt-audit/v1",
  status: terminalPairs === 24 ? "terminal-receipts-verified" : "partial-receipts-verified",
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
console.log(JSON.stringify({status: audit.status, planned_pairs: 24,
  terminal_pairs: terminalPairs, scored_pairs: scoredPairs,
  invalid_pairs: audit.invalid_pairs, pending_pairs: audit.pending_pairs}));
