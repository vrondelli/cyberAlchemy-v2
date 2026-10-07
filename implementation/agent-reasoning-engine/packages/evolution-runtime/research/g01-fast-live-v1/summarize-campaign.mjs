// Verify frozen G01 pair receipts and calculate the predeclared aggregate rule.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => { if (!condition) throw new Error(`g01-summary.${reason}`); };
const readJson = path => JSON.parse(readFileSync(path));
const absolute = path => typeof path === "string" && path.startsWith("/") && resolve(path) === path;

export function summarizeCampaign({freezePath, freezeSha256, save = true}) {
  need(absolute(freezePath) && /^[a-f0-9]{64}$/.test(freezeSha256), "arguments");
  const bytes = readFileSync(freezePath);
  need(sha(bytes) === freezeSha256, "freeze-drift");
  const freeze = JSON.parse(bytes);
  need(freeze.schema_version === "are.g01-campaign-freeze/v1" && freeze.status === "frozen-before-dispatch" && Array.isArray(freeze.ordered_tasks), "freeze-shape");
  need(freeze.abstention_policy === undefined || freeze.abstention_policy === "explicit-no-final-context-zero-r1", "abstention-policy");
  need(sha(readFileSync(freeze.definition_path)) === freeze.definition_sha256, "definition-drift");
  const rows = freeze.ordered_tasks.map(task => {
    need(sha(readFileSync(task.pair_plan_path)) === task.pair_plan_sha256, `${task.slug}-plan-drift`);
    const root = dirname(task.pair_plan_path), resultPath = join(root, "PAIR-RESULT.json");
    if (!existsSync(resultPath)) return {slug: task.slug, instance_id: task.instance_id, status: "pending"};
    const result = readJson(resultPath);
    need(result.schema === "are.g01-fast-live-pair-result/v1" && result.task_sha256 === task.source_only_task_sha256, `${task.slug}-result-binding`);
    const plan = readJson(task.pair_plan_path);
    need(plan.abstention_policy === freeze.abstention_policy, `${task.slug}-policy-drift`);
    if (result.status !== "scored") return {slug: task.slug, instance_id: task.instance_id, status: result.status, error: result.error ?? null, arms: result.arms ?? null};
    if (freeze.abstention_policy) need(result.metric_kind === "native-or-predeclared-abstention-zero" && result.abstention_policy === freeze.abstention_policy, `${task.slug}-metric-kind`);
    else need(result.metric_kind === undefined, `${task.slug}-unexpected-metric-kind`);
    const seal = readJson(join(root, "PREDICTION-SEAL.json"));
    need(seal.status === "sealed-before-native-scoring" && seal.scoring_status_at_seal === "not-started", `${task.slug}-seal`);
    for (const name of ["control", "candidate"]) {
      const out = join(root, name, "runs", "00");
      if (result[name].scoring_basis === "policy-abstention-zero") {
        need(Boolean(freeze.abstention_policy) && result[name].prediction_sha256 === null && result[name].native_score_sha256 === null, `${task.slug}-${name}-abstention-policy`);
        need(sha(readFileSync(join(out, "result.json"))) === seal[`${name}_result_sha256`] && result[name].result_sha256 === seal[`${name}_result_sha256`], `${task.slug}-${name}-abstention-drift`);
        need(!existsSync(join(out, "prediction.json")) && !existsSync(join(out, "native-score.json")) && result[name].span_f1 === 0 && result[name].file_f1 === 0, `${task.slug}-${name}-abstention-score`);
        const attempt = readJson(join(out, "result.json"));
        need(attempt.status === "run_error" && attempt.error === "instrument.no-final-context", `${task.slug}-${name}-abstention-result`);
      } else {
        need(result[name].scoring_basis === undefined || result[name].scoring_basis === "pinned-native", `${task.slug}-${name}-scoring-basis`);
        need(sha(readFileSync(join(out, "prediction.json"))) === seal[`${name}_prediction_sha256`], `${task.slug}-${name}-prediction-drift`);
        need(result[name].prediction_sha256 === seal[`${name}_prediction_sha256`], `${task.slug}-${name}-result-prediction-drift`);
        need(sha(readFileSync(join(out, "native-score.json"))) === result[name].native_score_sha256, `${task.slug}-${name}-score-drift`);
      }
    }
    return {slug: task.slug, instance_id: task.instance_id, status: "scored", control: result.control, candidate: result.candidate, matched_gates: result.matched_gates};
  });
  const complete = rows.every(row => row.status !== "pending"), scored = rows.filter(row => row.status === "scored");
  const metric = (arm, key, mode) => {
    const total = scored.reduce((sum, row) => sum + row[arm][key], 0);
    return mode === "mean" ? total / scored.length : total;
  };
  const aggregate = scored.length ? {
    control: {macro_span_f1: metric("control", "span_f1", "mean"), macro_file_f1: metric("control", "file_f1", "mean"),
      known_model_tokens: metric("control", "known_model_tokens"), duration_seconds: metric("control", "duration_seconds")},
    candidate: {macro_span_f1: metric("candidate", "span_f1", "mean"), macro_file_f1: metric("candidate", "file_f1", "mean"),
      known_model_tokens: metric("candidate", "known_model_tokens"), duration_seconds: metric("candidate", "duration_seconds")}
  } : null;
  const spanRegressions = scored.filter(row => row.candidate.span_f1 < row.control.span_f1).map(row => row.slug);
  const gates = {all_pairs_scored: scored.length === rows.length,
    macro_span_f1_improved: aggregate !== null && aggregate.candidate.macro_span_f1 > aggregate.control.macro_span_f1,
    macro_file_f1_improved: aggregate !== null && aggregate.candidate.macro_file_f1 > aggregate.control.macro_file_f1,
    total_known_model_tokens_reduced: aggregate !== null && aggregate.candidate.known_model_tokens < aggregate.control.known_model_tokens,
    total_duration_reduced: aggregate !== null && aggregate.candidate.duration_seconds < aggregate.control.duration_seconds,
    at_most_one_span_regression: spanRegressions.length <= 1};
  gates.campaign_pass = complete && Object.values(gates).every(Boolean);
  const summary = {schema_version: "are.g01-campaign-result/v1", status: complete ? "complete" : "pending", campaign_freeze_sha256: freezeSha256,
    ...(freeze.abstention_policy ? {metric_kind: "native-or-predeclared-abstention-zero", abstention_policy: freeze.abstention_policy,
      policy_abstention_arms: scored.reduce((sum, row) => sum + Number(row.control.scoring_basis === "policy-abstention-zero") + Number(row.candidate.scoring_basis === "policy-abstention-zero"), 0)} : {}),
    scored_pairs: scored.length, planned_pairs: rows.length, aggregate, span_regressions: spanRegressions, gates, rows,
    decision_rule: freeze.decision_rule, claim_ceiling: freeze.claim_ceiling};
  if (save) {
    need(complete, "campaign-incomplete");
    writeFileSync(join(dirname(freezePath), "CAMPAIGN-RESULT.json"), JSON.stringify(summary, null, 2) + "\n", {flag: "wx", mode: 0o600});
  }
  return summary;
}

if (process.argv[1] === import.meta.filename) {
  try { const result = summarizeCampaign({freezePath: process.argv[2], freezeSha256: process.argv[3]});
    console.log(JSON.stringify({status: result.status, scored_pairs: result.scored_pairs, gates: result.gates, claim_ceiling: result.claim_ceiling})); }
  catch (error) { console.error(JSON.stringify({status: "summary_error", error: String(error.message)})); process.exitCode = 2; }
}
