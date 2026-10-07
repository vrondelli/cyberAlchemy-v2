import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`benchmark-screen.${reason}`); };
const finite = value => typeof value === "number" && Number.isFinite(value);

/** Screen a complete paired experiment. A screen is a fast decision, not a confirmation claim. */
export function screenPairedRows({objective, hypothesis, task_ids, rows, primary_metric, secondary_metrics = [], thresholds = {}, source_sha256 = null}) {
  need(typeof objective === "string" && objective.length > 0, "objective");
  need(typeof hypothesis === "string" && hypothesis.length > 0, "hypothesis");
  need(Array.isArray(task_ids) && task_ids.length > 0 && new Set(task_ids).size === task_ids.length && task_ids.every(id => typeof id === "string" && id.length > 0), "task-ids");
  need(typeof primary_metric === "string" && primary_metric.length > 0, "primary-metric");
  need(source_sha256 === null || /^[a-f0-9]{64}$/.test(source_sha256), "source-digest");
  need(Array.isArray(secondary_metrics) && new Set(secondary_metrics).size === secondary_metrics.length && secondary_metrics.every(key => typeof key === "string" && key !== primary_metric), "secondary-metrics");
  need(finite(thresholds.minimum_primary_gain ?? 0) && (thresholds.minimum_primary_gain ?? 0) >= 0 && finite(thresholds.minimum_token_reduction ?? 0) && (thresholds.minimum_token_reduction ?? 0) >= 0 && (thresholds.minimum_token_reduction ?? 0) <= 1 && finite(thresholds.maximum_elapsed_ratio ?? 1) && (thresholds.maximum_elapsed_ratio ?? 1) > 0, "thresholds");
  need(Array.isArray(rows) && rows.length === task_ids.length * 2, "row-denominator");
  const byKey = new Map();
  for (const row of rows) {
    need(task_ids.includes(row?.task_id) && ["control", "treatment"].includes(row?.arm), "row-identity");
    const key = `${row.task_id}:${row.arm}`; need(!byKey.has(key), "duplicate-row"); byKey.set(key, row);
    need(typeof row.valid === "boolean" && row.metrics && typeof row.metrics === "object", "row-shape");
    for (const metric of [primary_metric, ...secondary_metrics]) need(finite(row.metrics[metric]) && row.metrics[metric] >= 0 && row.metrics[metric] <= 1, `metric:${metric}`);
    need(Number.isSafeInteger(row.total_tokens) && row.total_tokens >= 0 && typeof row.unknown_usage === "boolean", "row-usage");
    need(row.elapsed_ms === null || (Number.isSafeInteger(row.elapsed_ms) && row.elapsed_ms >= 0), "row-elapsed");
  }
  for (const task of task_ids) for (const arm of ["control", "treatment"]) need(byKey.has(`${task}:${arm}`), "missing-row");
  const totals = {};
  for (const arm of ["control", "treatment"]) {
    const armRows = task_ids.map(id => byKey.get(`${id}:${arm}`));
    totals[arm] = {
      valid: armRows.filter(row => row.valid).length,
      unknown_usage: armRows.some(row => row.unknown_usage),
      total_tokens: armRows.reduce((sum, row) => sum + row.total_tokens, 0),
      sum_task_elapsed_ms: armRows.every(row => row.elapsed_ms !== null) ? armRows.reduce((sum, row) => sum + row.elapsed_ms, 0) : null,
      metrics: Object.fromEntries([primary_metric, ...secondary_metrics].map(metric => [metric, armRows.reduce((sum, row) => sum + row.metrics[metric], 0) / task_ids.length]))
    };
    need(Number.isSafeInteger(totals[arm].total_tokens), "token-overflow");
  }
  const valid = totals.control.valid === task_ids.length && totals.treatment.valid === task_ids.length && !totals.control.unknown_usage && !totals.treatment.unknown_usage;
  const primary_gain = totals.treatment.metrics[primary_metric] - totals.control.metrics[primary_metric];
  const secondary_gains = Object.fromEntries(secondary_metrics.map(metric => [metric, totals.treatment.metrics[metric] - totals.control.metrics[metric]]));
  const token_reduction = totals.control.total_tokens > 0 ? 1 - totals.treatment.total_tokens / totals.control.total_tokens : null;
  const elapsed_ratio = totals.control.sum_task_elapsed_ms > 0 && totals.treatment.sum_task_elapsed_ms !== null ? totals.treatment.sum_task_elapsed_ms / totals.control.sum_task_elapsed_ms : null;
  const gates = {
    complete_known_usage: valid,
    primary_gain: primary_gain >= (thresholds.minimum_primary_gain ?? 0),
    secondary_nonregression: Object.values(secondary_gains).every(gain => gain >= 0),
    token_reduction: token_reduction !== null && token_reduction >= (thresholds.minimum_token_reduction ?? 0),
    elapsed: elapsed_ratio === null ? null : elapsed_ratio <= (thresholds.maximum_elapsed_ratio ?? 1)
  };
  const rejected = Object.entries(gates).some(([, pass]) => pass === false);
  return {
    schema_version: "are.benchmark-fast-screen-result/v1", objective, hypothesis, task_ids, source_sha256, primary_metric, secondary_metrics,
    thresholds: {minimum_primary_gain: thresholds.minimum_primary_gain ?? 0, minimum_token_reduction: thresholds.minimum_token_reduction ?? 0, maximum_elapsed_ratio: thresholds.maximum_elapsed_ratio ?? 1},
    totals, deltas: {primary_gain, secondary_gains, token_reduction, elapsed_ratio}, gates,
    decision: rejected ? "reject" : source_sha256 === null ? "needs-source-binding" : gates.elapsed === null ? "needs-elapsed-measurement" : "candidate-for-confirmation",
    claim_ceiling: "Paired development screen only; confirmation requires a separately fixed cohort, fresh matched control and independent result check.", authority_effect: "none"
  };
}

export function screenDiscoveryResult(source, options) {
  need(Array.isArray(source?.outcomes) && source.outcomes.length > 0, "discovery-source");
  const task_ids = [...new Set(source.outcomes.map(row => row.task_id))];
  const rows = source.outcomes.map(row => ({task_id: row.task_id, arm: row.arm, valid: row.complete === true && row.metrics_valid === true && row.window_admission_valid === true, metrics: row.metrics, total_tokens: row.usage?.total_tokens, unknown_usage: row.usage?.unknown_usage === true || row.usage?.unknown_usage_calls > 0, elapsed_ms: null}));
  return screenPairedRows({objective: options.objective, hypothesis: options.hypothesis, task_ids, rows, primary_metric: "span_f1", secondary_metrics: ["file_f1"], thresholds: options.thresholds, source_sha256: options.source_sha256});
}

if (process.argv[1] === import.meta.filename) {
  const [inputPath, outputPath, objective, hypothesis] = process.argv.slice(2);
  need(inputPath && outputPath, "usage: screen.mjs INPUT OUTPUT [OBJECTIVE HYPOTHESIS]");
  const bytes = readFileSync(resolve(inputPath)), input = JSON.parse(bytes);
  const result = input.schema_version === "are.benchmark-fast-screen-input/v1"
    ? screenPairedRows({...input, source_sha256: hash(bytes)})
    : screenDiscoveryResult(input, {objective: objective ?? "ContextBench accuracy, tokens and elapsed time", hypothesis: hypothesis ?? input.experiment_id, source_sha256: hash(bytes), thresholds: {minimum_primary_gain: 0.05, minimum_token_reduction: 0.15, maximum_elapsed_ratio: 1}});
  writeFileSync(resolve(outputPath), `${JSON.stringify(result, null, 2)}\n`, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({decision: result.decision, gates: result.gates, output: resolve(outputPath)}));
}
