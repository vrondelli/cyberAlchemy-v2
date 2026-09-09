import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";

import {loadCounterbalancedHoldout, runScorerExperiment} from "./scorer-experiment.mjs";
import {createResearchHypothesis} from "../../../packages/evolution-runtime/index.mjs";
import {SCORER_STRATEGIES, selectScorerStrategy} from "./scorer-strategies.mjs";

export const SCORER_LOOP_SCHEMA = "are.scorer-experiment-loop/v1";
export const DEFAULT_GAIN_PROTECTED_CHECKS = Object.freeze([
  "treatment_agreement",
  "false_negative_reduction",
  "false_positive_regression",
  "safety",
]);

function canonical(value) { return JSON.stringify(value); }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }

function strategyKey(strategy) {
  return strategy.strategy_id.replace(/^strategy:/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase();
}

function readMetric(result, path) {
  return path.split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, result);
}

function normalizeGainTrigger(trigger) {
  if (trigger === null || trigger === undefined) return null;
  if (!trigger || typeof trigger.metric !== "string" || trigger.metric.length === 0) throw new TypeError("gain_trigger.metric must be a non-empty metric path.");
  if (trigger.direction !== "lower" && trigger.direction !== "higher") throw new TypeError("gain_trigger.direction must be lower or higher.");
  const minimumDelta = trigger.minimum_delta ?? 0;
  if (!Number.isFinite(minimumDelta) || minimumDelta < 0) throw new TypeError("gain_trigger.minimum_delta must be a non-negative number.");
  const maxNoGainAttempts = trigger.max_no_gain_attempts ?? 1;
  if (!Number.isSafeInteger(maxNoGainAttempts) || maxNoGainAttempts < 1) throw new TypeError("gain_trigger.max_no_gain_attempts must be a positive integer.");
  const protectedChecks = trigger.protected_checks ?? DEFAULT_GAIN_PROTECTED_CHECKS;
  if (!Array.isArray(protectedChecks) || protectedChecks.some((check) => typeof check !== "string" || check.length === 0)) throw new TypeError("gain_trigger.protected_checks must be an array of check names.");
  return Object.freeze({metric: trigger.metric, direction: trigger.direction, minimum_delta: minimumDelta, max_no_gain_attempts: maxNoGainAttempts, protected_checks: Object.freeze([...protectedChecks])});
}

function assessGain(result, trigger, state) {
  const value = readMetric(result, trigger.metric);
  const protectedChecksPassed = trigger.protected_checks.every((check) => result.checks?.[check] === true);
  if (!Number.isFinite(value)) return {status: "invalid", metric: trigger.metric, value: null, best_value: state.bestValue, delta: null, protected_checks_passed: protectedChecksPassed};
  if (state.bestValue === null) return {status: protectedChecksPassed ? "baseline" : "blocked", metric: trigger.metric, value, best_value: value, delta: null, protected_checks_passed: protectedChecksPassed};
  const delta = trigger.direction === "lower" ? state.bestValue - value : value - state.bestValue;
  const gained = protectedChecksPassed && delta > 0 && delta >= trigger.minimum_delta;
  return {status: gained ? "gain" : protectedChecksPassed ? "no-gain" : "blocked", metric: trigger.metric, value, best_value: state.bestValue, delta, protected_checks_passed: protectedChecksPassed};
}

export function createStrategyHypothesis({parent, strategy, failedAttempt = null, attemptNumber}) {
  if (!parent || typeof parent.record_id !== "string" || typeof parent.hypothesis_key !== "string") throw new TypeError("A sealed parent hypothesis is required.");
  if (!strategy || typeof strategy.strategy_id !== "string" || typeof strategy.treatment_ref !== "string") throw new TypeError("A scorer strategy is required.");
  if (failedAttempt !== null && typeof failedAttempt.experiment_id !== "string") throw new TypeError("A failed experiment attempt is required.");
  const rootKey = parent.hypothesis_key.split("-STRATEGY-")[0].split("-LATENCY-")[0];
  return createResearchHypothesis({
    hypothesis_key: `${rootKey}-STRATEGY-${strategyKey(strategy)}-${String(attemptNumber).padStart(2, "0")}`,
    statement: strategy.statement,
    mechanism: strategy.mechanism,
    falsifier: "The strategy fails to meet the registered scorer quality, safety, determinism, or latency criteria.",
    scope: parent.scope,
    metrics: parent.metrics,
    provenance_refs: [...(parent.provenance_refs ?? []), parent.record_id, ...(failedAttempt ? [failedAttempt.experiment_id] : [])],
    parent_hypothesis_ref: parent.record_id,
    supersedes_experiment_ref: failedAttempt?.experiment_id,
    strategy_ref: strategy.strategy_id,
    implementation_pattern: strategy.implementation_pattern,
    implementation_ref: strategy.implementation_ref,
    experiment_template: {
      ...parent.experiment_template,
      treatment_ref: strategy.treatment_ref,
    },
  });
}

export function createSuccessorHypothesis({parent, failedAttempt, treatment_ref, attemptNumber, strategy = null}) {
  return createStrategyHypothesis({
    parent,
    failedAttempt,
    attemptNumber,
    strategy: strategy ?? {
      strategy_id: `strategy:${treatment_ref}`,
      treatment_ref,
      implementation_pattern: "unspecified",
      implementation_ref: "unbound",
      statement: "A scorer implementation variant can preserve quality and safety while improving the registered target.",
      mechanism: "Apply the declared scorer treatment and measure it against the registered holdout.",
    },
  });
}

export function runScorerLoop({holdout, hypothesis = null, strategy_catalog = null, repetitions = 3, maxAttempts = 15, treatment_ref = "scorer:declared-concept-equivalence/candidate-v3", experiment_id = "research-experiment:declared-concept-equivalence-v3-candidate", success_criteria = {}, gain_trigger = null, runExperiment = runScorerExperiment} = {}) {
  if (!holdout || !Array.isArray(holdout.rows)) throw new TypeError("The registered counterbalanced holdout is required.");
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 15) throw new TypeError("maxAttempts must be an integer from 1 through 15.");
  const gainTrigger = normalizeGainTrigger(gain_trigger);
  const catalog = strategy_catalog ?? [{strategy_id: `strategy:${treatment_ref}`, treatment_ref, implementation_pattern: "unspecified", implementation_ref: "unbound", statement: "A scorer implementation variant can preserve quality and safety while improving the registered target.", mechanism: "Apply the declared scorer treatment and measure it against the registered holdout."}];
  const attempts = [];
  const hypothesisChain = hypothesis ? [hypothesis] : [];
  let currentHypothesis = hypothesis;
  let pendingFailure = null;
  let stopReason = "max-attempts";
  let bestAttempt = null;
  let bestValue = null;
  let gainAttempts = 0;
  let noGainAttempts = 0;
  for (let index = 1; index <= maxAttempts; index += 1) {
    const strategy = selectScorerStrategy(catalog, index);
    if (currentHypothesis) {
      currentHypothesis = createStrategyHypothesis({parent: currentHypothesis, strategy, failedAttempt: pendingFailure, attemptNumber: index});
      hypothesisChain.push(currentHypothesis);
    }
    const result = runExperiment({holdout, repetitions, success_criteria, treatment_ref: strategy.treatment_ref, experiment_id: `${experiment_id}-attempt-${String(index).padStart(2, "0")}`});
    const gain = gainTrigger ? assessGain(result, gainTrigger, {bestValue}) : null;
    const attempt = {...result, hypothesis_ref: currentHypothesis?.record_id ?? null, hypothesis_key: currentHypothesis?.hypothesis_key ?? null, strategy_id: strategy.strategy_id, implementation_pattern: strategy.implementation_pattern, implementation_ref: strategy.implementation_ref};
    if (gain) attempt.gain = gain;
    attempts.push(attempt);
    if (gain) {
      if (gain.status === "invalid") {
        stopReason = "gain-metric-missing";
        break;
      }
      if (gain.status === "blocked") {
        stopReason = "protected-check-failed";
        break;
      }
      if (gain.status === "baseline") {
        bestValue = gain.value;
        bestAttempt = index;
      } else if (gain.status === "gain") {
        bestValue = gain.value;
        bestAttempt = index;
        gainAttempts += 1;
        noGainAttempts = 0;
      } else if (gain.status === "no-gain") {
        noGainAttempts += 1;
        if (noGainAttempts >= gainTrigger.max_no_gain_attempts) {
          stopReason = "no-gain";
          break;
        }
      }
    }
    if (result.status === "PASS") {
      stopReason = "PASS";
      break;
    }
    pendingFailure = result;
  }
  const passed = attempts.find((attempt) => attempt.status === "PASS");
  const material = {
    schema_version: SCORER_LOOP_SCHEMA,
    loop_id: `${experiment_id}-loop`,
    candidate_experiment_id: experiment_id,
    treatment_ref,
    dataset_ref: holdout.dataset_id,
    dataset_revision: holdout.dataset_revision,
    dataset_digest: holdout.source_digest,
    repetitions,
    max_attempts: maxAttempts,
    strategies: catalog,
    gain_trigger: gainTrigger,
    attempts,
    hypothesis_chain: hypothesisChain,
    attempts_run: attempts.length,
    best_attempt: bestAttempt,
    best_value: bestValue,
    gain_attempts: gainAttempts,
    no_gain_attempts: noGainAttempts,
    stop_reason: passed ? "PASS" : stopReason,
    final_status: passed ? "PASS" : "FAIL",
    authority_effect: "none",
    claim_limit: "Repeated local scorer experiment evidence only; no scorer activation or engine authority.",
  };
  return Object.freeze({...material, loop_digest: digest(canonical(material))});
}

export function loadLoopHoldout(path) {
  return loadCounterbalancedHoldout(path);
}

export function readLoopFixture(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
