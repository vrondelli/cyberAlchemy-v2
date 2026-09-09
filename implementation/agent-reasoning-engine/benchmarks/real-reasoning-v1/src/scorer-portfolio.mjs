import {createHash} from "node:crypto";

import {loadCounterbalancedHoldout, runScorerExperiment} from "./scorer-experiment.mjs";
import {createStrategyHypothesis, DEFAULT_GAIN_PROTECTED_CHECKS} from "./scorer-loop.mjs";

export const SCORER_PORTFOLIO_SCHEMA = "are.scorer-experiment-portfolio/v1";

function canonical(value) { return JSON.stringify(value); }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function readMetric(result, path) { return path.split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, result); }

function validateStrategies(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) throw new TypeError("A non-empty scorer strategy catalog is required.");
  const ids = new Set();
  for (const strategy of catalog) {
    if (!strategy || typeof strategy.strategy_id !== "string" || typeof strategy.treatment_ref !== "string" || typeof strategy.implementation_ref !== "string") throw new TypeError("Invalid scorer strategy declaration.");
    if (ids.has(strategy.strategy_id)) throw new TypeError(`Duplicate scorer strategy: ${strategy.strategy_id}`);
    ids.add(strategy.strategy_id);
  }
  return catalog;
}

function validatePositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer.`);
}

function validateTarget(target_metric, direction) {
  if (typeof target_metric !== "string" || target_metric.length === 0) throw new TypeError("target_metric must be a non-empty metric path.");
  if (direction !== "lower" && direction !== "higher") throw new TypeError("target_direction must be lower or higher.");
}

function validateTimingOrder(value) {
  if (!["alternating", "baseline-first", "treatment-first"].includes(value)) throw new TypeError("timing_order must be alternating, baseline-first, or treatment-first.");
}

function protectedChecks(result, checks) {
  return checks.every((check) => result.checks?.[check] === true);
}

function evidence(result, target_metric, checks) {
  const value = readMetric(result, target_metric);
  return {
    experiment_id: result.experiment_id ?? null,
    status: result.status ?? "UNKNOWN",
    metric: target_metric,
    value: Number.isFinite(value) ? value : null,
    protected_checks_passed: protectedChecks(result, checks),
    result,
  };
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)] ?? null;
}

function aggregateEvidence(records, target_metric, checks) {
  const values = records.map((record) => record.value);
  const finite = values.length > 0 && values.every((value) => Number.isFinite(value));
  return {
    experiment_ids: records.map((record) => record.experiment_id),
    status: records.every((record) => record.status === "PASS") ? "PASS" : "FAIL",
    metric: target_metric,
    value: finite ? median(values) : null,
    min_value: finite ? Math.min(...values) : null,
    max_value: finite ? Math.max(...values) : null,
    values,
    replication_count: records.length,
    protected_checks_passed: records.length > 0 && records.every((record) => record.protected_checks_passed),
    result: records.map((record) => record.result),
    protected_checks: [...checks],
  };
}

function eligible(item) {
  return item.value !== null && item.protected_checks_passed;
}

function improves(value, reference, direction) {
  if (!Number.isFinite(value) || !Number.isFinite(reference)) return false;
  return direction === "lower" ? value < reference : value > reference;
}

function compareEvidence(left, right, direction) {
  const delta = direction === "lower" ? left.value - right.value : right.value - left.value;
  return delta || left.strategy_id.localeCompare(right.strategy_id);
}

function defaultStrategy(strategy) {
  return {
    ...strategy,
    statement: strategy.statement ?? "A declared scorer implementation variant can preserve quality and safety while improving the registered target.",
    mechanism: strategy.mechanism ?? "Apply the declared scorer treatment and measure it against the registered holdout.",
  };
}

function branchStatus(screening, screeningRank, survivorLimit) {
  if (!eligible(screening)) return {status: "rejected", reason: screening.value === null ? "screening-target-metric-missing" : "screening-protected-check-failed"};
  if (screeningRank > survivorLimit) return {status: "screened-out", reason: "screening-rank-cutoff"};
  return {status: "screened-in", reason: null};
}

export function runScorerPortfolio({holdout, confirmation_holdout = null, hypothesis = null, strategy_catalog, screening_repetitions = 1, full_repetitions = 3, full_replications = 3, confirmation_repetitions = null, confirmation_replications = null, max_survivors = 2, warmup_samples = 250, timing_order = "alternating", target_metric = "deltas.p95_latency_regression_ratio", target_direction = "lower", experiment_id = "research-experiment:declared-concept-equivalence-portfolio", success_criteria = {}, protected_checks = DEFAULT_GAIN_PROTECTED_CHECKS, runExperiment = runScorerExperiment} = {}) {
  if (!holdout || !Array.isArray(holdout.rows)) throw new TypeError("The registered screening holdout is required.");
  if (confirmation_holdout !== null && (!confirmation_holdout || !Array.isArray(confirmation_holdout.rows))) throw new TypeError("The confirmation holdout must be a registered holdout when provided.");
  const catalog = validateStrategies(strategy_catalog);
  validatePositiveInteger(screening_repetitions, "screening_repetitions");
  validatePositiveInteger(full_repetitions, "full_repetitions");
  validatePositiveInteger(full_replications, "full_replications");
  const confirmationRepetitions = confirmation_repetitions ?? full_repetitions;
  const confirmationReplications = confirmation_replications ?? full_replications;
  validatePositiveInteger(confirmationRepetitions, "confirmation_repetitions");
  validatePositiveInteger(confirmationReplications, "confirmation_replications");
  validatePositiveInteger(max_survivors, "max_survivors");
  if (!Number.isSafeInteger(warmup_samples) || warmup_samples < 0) throw new TypeError("warmup_samples must be a non-negative integer.");
  validateTimingOrder(timing_order);
  if (max_survivors > catalog.length) throw new TypeError("max_survivors cannot exceed the strategy catalog size.");
  validateTarget(target_metric, target_direction);
  if (!Array.isArray(protected_checks) || protected_checks.some((check) => typeof check !== "string" || check.length === 0)) throw new TypeError("protected_checks must be an array of check names.");

  const hypothesisChain = hypothesis ? [hypothesis] : [];
  const branches = catalog.map((declaredStrategy, index) => {
    const strategy = defaultStrategy(declaredStrategy);
    const branchHypothesis = hypothesis ? createStrategyHypothesis({parent: hypothesis, strategy, attemptNumber: index + 1}) : null;
    if (branchHypothesis) hypothesisChain.push(branchHypothesis);
    const attemptId = `${experiment_id}-screen-${String(index + 1).padStart(2, "0")}`;
    const result = runExperiment({holdout, repetitions: screening_repetitions, warmup_samples, timing_order, success_criteria, treatment_ref: strategy.treatment_ref, experiment_id: attemptId});
    const screening = evidence(result, target_metric, protected_checks);
    return {
      branch_id: `branch-${String(index + 1).padStart(2, "0")}`,
      strategy_id: strategy.strategy_id,
      treatment_ref: strategy.treatment_ref,
      implementation_pattern: strategy.implementation_pattern ?? "unspecified",
      implementation_ref: strategy.implementation_ref,
      hypothesis_ref: branchHypothesis?.record_id ?? null,
      hypothesis_key: branchHypothesis?.hypothesis_key ?? null,
      screening,
      full: null,
      full_runs: [],
      confirmation: null,
      status: "screening",
      status_reason: null,
    };
  });

  const eligibleScreening = branches.filter((branch) => eligible(branch.screening)).sort((left, right) => compareEvidence({...left.screening, strategy_id: left.strategy_id}, {...right.screening, strategy_id: right.strategy_id}, target_direction));
  const survivorIds = new Set(eligibleScreening.slice(0, max_survivors).map((branch) => branch.branch_id));
  for (const [position, branch] of branches.entries()) {
    const rank = eligibleScreening.findIndex((candidate) => candidate.branch_id === branch.branch_id) + 1;
    const decision = branchStatus(branch.screening, rank || Number.MAX_SAFE_INTEGER, max_survivors);
    branch.status = decision.status;
    branch.status_reason = decision.reason;
    if (!survivorIds.has(branch.branch_id)) continue;
    const attemptId = `${experiment_id}-full-${String(position + 1).padStart(2, "0")}`;
    for (let replication = 1; replication <= full_replications; replication += 1) {
      const result = runExperiment({holdout, repetitions: full_repetitions, warmup_samples, timing_order, success_criteria, treatment_ref: branch.treatment_ref, experiment_id: `${attemptId}-r${String(replication).padStart(2, "0")}`});
      branch.full_runs.push(evidence(result, target_metric, protected_checks));
    }
    branch.full = aggregateEvidence(branch.full_runs, target_metric, protected_checks);
    branch.status = eligible(branch.full) && improves(branch.full.value, branch.screening.value, target_direction) ? "full-evaluated" : "full-rejected";
    branch.status_reason = branch.status === "full-evaluated" ? null : branch.full.value === null ? "full-target-metric-missing" : !branch.full.protected_checks_passed ? "full-protected-check-failed" : "full-not-improved-over-screening";
  }

  const fullCandidates = branches.filter((branch) => branch.status === "full-evaluated").sort((left, right) => compareEvidence({...left.full, strategy_id: left.strategy_id}, {...right.full, strategy_id: right.strategy_id}, target_direction));
  let winner = fullCandidates[0] ?? null;
  if (winner && confirmation_holdout) {
    const position = branches.findIndex((branch) => branch.branch_id === winner.branch_id) + 1;
    const confirmationRuns = [];
    for (let replication = 1; replication <= confirmationReplications; replication += 1) {
      const result = runExperiment({holdout: confirmation_holdout, repetitions: confirmationRepetitions, warmup_samples, timing_order, success_criteria, treatment_ref: winner.treatment_ref, experiment_id: `${experiment_id}-confirm-${String(position).padStart(2, "0")}-r${String(replication).padStart(2, "0")}`});
      confirmationRuns.push(evidence(result, target_metric, protected_checks));
    }
    winner.confirmation_runs = confirmationRuns;
    winner.confirmation = aggregateEvidence(confirmationRuns, target_metric, protected_checks);
    if (!eligible(winner.confirmation) || !improves(winner.confirmation.value, winner.full.value, target_direction)) {
      winner.status = "confirmation-failed";
      winner.status_reason = winner.confirmation.value === null ? "confirmation-target-metric-missing" : !winner.confirmation.protected_checks_passed ? "confirmation-protected-check-failed" : "confirmation-not-improved-over-full";
      winner = null;
    } else {
      winner.status = "confirmed-relative-best";
    }
  } else if (winner) {
    winner.status = "provisional-relative-best";
    winner.status_reason = "confirmation-holdout-not-provided";
  }

  const material = {
    schema_version: SCORER_PORTFOLIO_SCHEMA,
    portfolio_id: `${experiment_id}-portfolio`,
    candidate_experiment_id: experiment_id,
    screening_dataset_ref: holdout.dataset_id,
    screening_dataset_revision: holdout.dataset_revision,
    screening_dataset_digest: holdout.source_digest,
    confirmation_dataset_ref: confirmation_holdout?.dataset_id ?? null,
    confirmation_dataset_revision: confirmation_holdout?.dataset_revision ?? null,
    confirmation_dataset_digest: confirmation_holdout?.source_digest ?? null,
    target: {metric: target_metric, direction: target_direction, protected_checks: [...protected_checks]},
    screening_repetitions,
    full_repetitions,
    full_replications,
    confirmation_repetitions: confirmationRepetitions,
    confirmation_replications: confirmationReplications,
    max_survivors,
    warmup_samples,
    timing_order,
    improvement_policy: "Each full-stage aggregate must improve strictly over its branch screening metric; a confirmation aggregate must improve strictly over the full-stage aggregate.",
    strategies: catalog,
    branches,
    hypothesis_chain: hypothesisChain,
    screening_count: branches.length,
    survivor_count: branches.filter((branch) => branch.status === "full-evaluated" || branch.status === "full-rejected" || branch.status === "provisional-relative-best" || branch.status === "confirmed-relative-best").length,
    full_evaluation_count: branches.filter((branch) => branch.full !== null).length,
    winner: winner ? {branch_id: winner.branch_id, hypothesis_ref: winner.hypothesis_ref, hypothesis_key: winner.hypothesis_key, strategy_id: winner.strategy_id, treatment_ref: winner.treatment_ref, value: winner.confirmation?.value ?? winner.full.value, stage: winner.confirmation ? "confirmation" : "full", status: winner.status} : null,
    stop_reason: winner ? "winner-selected" : fullCandidates.length === 0 ? eligibleScreening.length === 0 ? "no-screening-survivor" : "no-full-survivor" : "confirmation-failed",
    final_status: winner ? winner.status === "confirmed-relative-best" ? "CONFIRMED" : "PROVISIONAL" : "FAIL",
    authority_effect: "none",
    claim_limit: "Portfolio comparison evidence only; no scorer activation, semantic correctness, or engine authority.",
  };
  return Object.freeze({...material, portfolio_digest: digest(canonical(material))});
}

export function loadPortfolioHoldout(path) { return loadCounterbalancedHoldout(path); }

function displayMetric(value) { return Number.isFinite(value) ? value.toFixed(4) : "-"; }

export function formatPortfolioSummary(report) {
  if (!report || typeof report !== "object") throw new TypeError("A portfolio report is required.");
  const lines = [
    `portfolio ${report.candidate_experiment_id ?? "unknown"}`,
    `status=${report.final_status ?? "UNKNOWN"} stop=${report.stop_reason ?? "unknown"} screened=${report.screening_count ?? 0} full=${report.full_evaluation_count ?? 0} winner=${report.winner?.strategy_id ?? "none"}`,
  ];
  for (const branch of report.branches ?? []) {
    lines.push(`  ${branch.strategy_id ?? branch.branch_id ?? "unknown"}: screen=${displayMetric(branch.screening?.value)} full=${displayMetric(branch.full?.value)} status=${branch.status ?? "unknown"}${branch.status_reason ? ` reason=${branch.status_reason}` : ""}`);
  }
  return lines.join("\n");
}

export function partitionPortfolioHoldout(holdout, predicate, partition_id) {
  if (!holdout || !Array.isArray(holdout.rows) || typeof predicate !== "function" || typeof partition_id !== "string" || partition_id.length === 0) throw new TypeError("A holdout, partition predicate, and partition identity are required.");
  const rows = holdout.rows.filter(predicate);
  if (rows.length === 0 || rows.length === holdout.rows.length) throw new TypeError("A confirmation partition must be non-empty and leave a screening complement.");
  const bytes = `${rows.map((row) => canonical(row)).join("\n")}\n`;
  return Object.freeze({dataset_id: holdout.dataset_id, dataset_revision: `${holdout.dataset_revision}:${partition_id}`, source_digest: digest(bytes), partition_id, rows: Object.freeze(rows)});
}
