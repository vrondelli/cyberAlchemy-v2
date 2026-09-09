import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";

import {scoreLiveResponse} from "./scorer.mjs";
import {scoreConceptResponse, scoreConceptResponseFast, scoreConceptResponseFused, scoreConceptResponseIndexed, scoreConceptResponseShortCircuit, scoreConceptResponseMarkerIndexed, scoreConceptResponseSingleScan, scoreConceptResponseSelectiveScan, scoreConceptResponseLazyScan, scoreConceptResponseBoundedFast, scoreConceptResponseRegex, scoreConceptResponseBundledRegex, scoreConceptResponseAutomaton, scoreConceptResponseDecisionProjection, compileConceptResponseFast, compileConceptResponseFused, compileConceptResponseIndexed, compileConceptResponseShortCircuit, compileConceptResponseMarkerIndexed, compileConceptResponseSingleScan, compileConceptResponseSelectiveScan, compileConceptResponseLazyScan, compileConceptResponseBoundedFast, compileConceptResponseRegex, compileConceptResponseBundledRegex, compileConceptResponseAutomaton, compileConceptResponseDecisionProjection, CONCEPT_TREATMENT_ID, CONCEPT_TREATMENT_FAST_ID, CONCEPT_TREATMENT_FUSED_ID, CONCEPT_TREATMENT_INDEXED_ID, CONCEPT_TREATMENT_SHORT_CIRCUIT_ID, CONCEPT_TREATMENT_MARKER_INDEX_ID, CONCEPT_TREATMENT_SINGLE_SCAN_ID, CONCEPT_TREATMENT_SELECTIVE_SCAN_ID, CONCEPT_TREATMENT_LAZY_SCAN_ID, CONCEPT_TREATMENT_BOUNDED_FAST_ID, CONCEPT_TREATMENT_REGEX_ID, CONCEPT_TREATMENT_BUNDLED_REGEX_ID, CONCEPT_TREATMENT_AUTOMATON_ID, CONCEPT_TREATMENT_DECISION_PROJECTION_ID} from "./concept-scorer.mjs";

export const HOLDOUT_DATASET_ID = "holdout:literal-versus-intent-counterbalanced-v1";
export const BASELINE_SCORER_ID = "scorer:exact-required-term/v1";
export const OPTIMIZED_EXPERIMENT_ID = "research-experiment:declared-concept-equivalence-v2-candidate";

function canonical(value) { return JSON.stringify(value); }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))] ?? 0;
}
function validRow(row) {
  return row && row.schema_version === "are.scorer-holdout-case/v1" && typeof row.case_id === "string" && row.scenario && row.response && typeof row.gold_label === "boolean";
}

export function loadCounterbalancedHoldout(path) {
  const bytes = readFileSync(path);
  const rows = bytes.toString("utf8").split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
  if (rows.length === 0 || rows.some((row) => !validRow(row))) throw new TypeError("Invalid counterbalanced holdout row.");
  const ordered = [...rows].sort((left, right) => left.case_id.localeCompare(right.case_id));
  if (new Set(ordered.map((row) => row.case_id)).size !== ordered.length) throw new TypeError("Duplicate counterbalanced holdout case.");
  return Object.freeze({dataset_id: HOLDOUT_DATASET_ID, dataset_revision: "v1", source_digest: digest(bytes), rows: Object.freeze(ordered)});
}

function scoreRow(row, treatmentRef, compiled = null) {
  if (treatmentRef === false) return scoreLiveResponse(row.scenario, row.response, "control");
  const scenario = {...row.scenario, concept_markers: row.concept_markers ?? {}};
  if ([CONCEPT_TREATMENT_FAST_ID, CONCEPT_TREATMENT_FUSED_ID, CONCEPT_TREATMENT_INDEXED_ID, CONCEPT_TREATMENT_SHORT_CIRCUIT_ID, CONCEPT_TREATMENT_MARKER_INDEX_ID, CONCEPT_TREATMENT_SINGLE_SCAN_ID, CONCEPT_TREATMENT_SELECTIVE_SCAN_ID, CONCEPT_TREATMENT_LAZY_SCAN_ID, CONCEPT_TREATMENT_BOUNDED_FAST_ID, CONCEPT_TREATMENT_REGEX_ID, CONCEPT_TREATMENT_BUNDLED_REGEX_ID, CONCEPT_TREATMENT_AUTOMATON_ID, CONCEPT_TREATMENT_DECISION_PROJECTION_ID].includes(treatmentRef) && compiled) return compiled(row.response);
  if (treatmentRef === CONCEPT_TREATMENT_FAST_ID) return scoreConceptResponseFast(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_FUSED_ID) return scoreConceptResponseFused(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_INDEXED_ID) return scoreConceptResponseIndexed(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_SHORT_CIRCUIT_ID) return scoreConceptResponseShortCircuit(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_MARKER_INDEX_ID) return scoreConceptResponseMarkerIndexed(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_SINGLE_SCAN_ID) return scoreConceptResponseSingleScan(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_SELECTIVE_SCAN_ID) return scoreConceptResponseSelectiveScan(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_LAZY_SCAN_ID) return scoreConceptResponseLazyScan(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_BOUNDED_FAST_ID) return scoreConceptResponseBoundedFast(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_REGEX_ID) return scoreConceptResponseRegex(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_BUNDLED_REGEX_ID) return scoreConceptResponseBundledRegex(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_AUTOMATON_ID) return scoreConceptResponseAutomaton(scenario, row.response);
  if (treatmentRef === CONCEPT_TREATMENT_DECISION_PROJECTION_ID) return scoreConceptResponseDecisionProjection(scenario, row.response);
  return scoreConceptResponse(scenario, row.response);
}

const COMPILED_TREATMENTS = new Set([CONCEPT_TREATMENT_FAST_ID, CONCEPT_TREATMENT_FUSED_ID, CONCEPT_TREATMENT_INDEXED_ID, CONCEPT_TREATMENT_SHORT_CIRCUIT_ID, CONCEPT_TREATMENT_MARKER_INDEX_ID, CONCEPT_TREATMENT_SINGLE_SCAN_ID, CONCEPT_TREATMENT_SELECTIVE_SCAN_ID, CONCEPT_TREATMENT_LAZY_SCAN_ID, CONCEPT_TREATMENT_BOUNDED_FAST_ID, CONCEPT_TREATMENT_REGEX_ID, CONCEPT_TREATMENT_BUNDLED_REGEX_ID, CONCEPT_TREATMENT_AUTOMATON_ID, CONCEPT_TREATMENT_DECISION_PROJECTION_ID]);

function compiledFactoryFor(treatmentRef) {
  return treatmentRef === CONCEPT_TREATMENT_FUSED_ID ? compileConceptResponseFused : treatmentRef === CONCEPT_TREATMENT_INDEXED_ID ? compileConceptResponseIndexed : treatmentRef === CONCEPT_TREATMENT_SHORT_CIRCUIT_ID ? compileConceptResponseShortCircuit : treatmentRef === CONCEPT_TREATMENT_MARKER_INDEX_ID ? compileConceptResponseMarkerIndexed : treatmentRef === CONCEPT_TREATMENT_SINGLE_SCAN_ID ? compileConceptResponseSingleScan : treatmentRef === CONCEPT_TREATMENT_SELECTIVE_SCAN_ID ? compileConceptResponseSelectiveScan : treatmentRef === CONCEPT_TREATMENT_LAZY_SCAN_ID ? compileConceptResponseLazyScan : treatmentRef === CONCEPT_TREATMENT_BOUNDED_FAST_ID ? compileConceptResponseBoundedFast : treatmentRef === CONCEPT_TREATMENT_REGEX_ID ? compileConceptResponseRegex : treatmentRef === CONCEPT_TREATMENT_BUNDLED_REGEX_ID ? compileConceptResponseBundledRegex : treatmentRef === CONCEPT_TREATMENT_AUTOMATON_ID ? compileConceptResponseAutomaton : treatmentRef === CONCEPT_TREATMENT_DECISION_PROJECTION_ID ? compileConceptResponseDecisionProjection : compileConceptResponseFast;
}

function createScorer(rows, treatmentRef) {
  let compiled = null;
  let compileMs = 0;
  if (COMPILED_TREATMENTS.has(treatmentRef)) {
    const start = performance.now();
    const factory = compiledFactoryFor(treatmentRef);
    compiled = new Map(rows.map((row) => [row.case_id, factory({...row.scenario, concept_markers: row.concept_markers ?? {}})]));
    compileMs = performance.now() - start;
  }
  const score = (row) => scoreRow(row, treatmentRef, compiled?.get(row.case_id) ?? null);
  const decision = treatmentRef === CONCEPT_TREATMENT_DECISION_PROJECTION_ID
    ? (row) => compiled.get(row.case_id).decide(row.response)
    : (row) => score(row).passed === true;
  return {score, decision, compileMs};
}

function quality(rows, score) {
  const predictions = rows.map((row) => ({case_id: row.case_id, gold_label: row.gold_label, score: score(row)}));
  const falseNegatives = predictions.filter((row) => row.gold_label && !row.score.passed).length;
  const falsePositives = predictions.filter((row) => !row.gold_label && row.score.passed).length;
  const positives = predictions.filter((row) => row.gold_label).length;
  const negatives = predictions.length - positives;
  return {
    agreement: predictions.filter((row) => row.score.passed === row.gold_label).length / predictions.length,
    false_negative_rate: positives === 0 ? 0 : falseNegatives / positives,
    false_positive_rate: negatives === 0 ? 0 : falsePositives / negatives,
    false_negatives: falseNegatives,
    false_positives: falsePositives,
    positive_cases: positives,
    negative_cases: negatives,
    predictions,
  };
}

function bootstrapInterval(values, resamples = 2000, seed = 42) {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) return {lower: null, upper: null, resamples, seed};
  let state = seed >>> 0;
  const next = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0x100000000; };
  const means = [];
  for (let sample = 0; sample < resamples; sample += 1) {
    let total = 0;
    for (let index = 0; index < values.length; index += 1) total += values[Math.floor(next() * values.length)];
    means.push(total / values.length);
  }
  return {lower: percentile(means, 0.025), upper: percentile(means, 0.975), resamples, seed};
}

function pairedMetrics(rows, treatmentRef, repetitions, warmupSamples, timingOrder = "alternating") {
  if (timingOrder !== "alternating" && timingOrder !== "baseline-first" && timingOrder !== "treatment-first") throw new TypeError("timing_order must be alternating, baseline-first, or treatment-first.");
  const baselineScorer = createScorer(rows, false);
  const treatmentScorer = createScorer(rows, treatmentRef);
  const baselineQualityStart = performance.now();
  const baselineQuality = quality(rows, baselineScorer.score);
  const baselinePredictionMs = performance.now() - baselineQualityStart;
  const treatmentQualityStart = performance.now();
  const treatmentQuality = quality(rows, treatmentScorer.score);
  const treatmentPredictionMs = performance.now() - treatmentQualityStart;
  const samplesPerRepetition = 1000;
  const baselineTimings = [];
  const treatmentTimings = [];
  const fullEvidenceTimings = [];
  let baselineWarmupMs = 0;
  let treatmentWarmupMs = 0;
  let fullEvidenceWarmupMs = 0;
  let baselineTimingChecksum = 0;
  let treatmentTimingChecksum = 0;
  let fullEvidenceTimingChecksum = 0;
  const separateEvidenceProjection = treatmentRef === CONCEPT_TREATMENT_DECISION_PROJECTION_ID;
  const order = [];
  for (let sample = 0; sample < warmupSamples; sample += 1) {
    const baselineFirst = timingOrder === "baseline-first" || (timingOrder === "alternating" && sample % 2 === 0);
    const first = baselineFirst ? baselineScorer : treatmentScorer;
    const second = baselineFirst ? treatmentScorer : baselineScorer;
    let start = performance.now();
    let firstChecksum = 0;
    for (const row of rows) firstChecksum += first.decision(row) ? 1 : 0;
    const firstMs = performance.now() - start;
    start = performance.now();
    let secondChecksum = 0;
    for (const row of rows) secondChecksum += second.decision(row) ? 1 : 0;
    const secondMs = performance.now() - start;
    if (baselineFirst) {
      baselineWarmupMs += firstMs;
      treatmentWarmupMs += secondMs;
      baselineTimingChecksum += firstChecksum;
      treatmentTimingChecksum += secondChecksum;
    } else {
      treatmentWarmupMs += firstMs;
      baselineWarmupMs += secondMs;
      treatmentTimingChecksum += firstChecksum;
      baselineTimingChecksum += secondChecksum;
    }
    if (separateEvidenceProjection) {
      start = performance.now();
      for (const row of rows) fullEvidenceTimingChecksum += treatmentScorer.score(row).passed ? 1 : 0;
      fullEvidenceWarmupMs += performance.now() - start;
    }
  }
  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    const baselineFirst = timingOrder === "baseline-first" || (timingOrder === "alternating" && repetition % 2 === 0);
    const first = baselineFirst ? baselineScorer : treatmentScorer;
    const second = baselineFirst ? treatmentScorer : baselineScorer;
    const measure = (scorer, operation = "decision") => {
      const start = performance.now();
      let checksum = 0;
      for (let sample = 0; sample < samplesPerRepetition; sample += 1) {
        for (const row of rows) {
          const value = scorer[operation](row);
          checksum += (typeof value === "boolean" ? value : value?.passed === true) ? 1 : 0;
        }
      }
      return {latency: (performance.now() - start) / (samplesPerRepetition * rows.length), checksum};
    };
    const firstMeasurement = measure(first);
    const secondMeasurement = measure(second);
    if (baselineFirst) {
      baselineTimings.push(firstMeasurement.latency);
      treatmentTimings.push(secondMeasurement.latency);
      baselineTimingChecksum += firstMeasurement.checksum;
      treatmentTimingChecksum += secondMeasurement.checksum;
      order.push("baseline-first");
    } else {
      treatmentTimings.push(firstMeasurement.latency);
      baselineTimings.push(secondMeasurement.latency);
      treatmentTimingChecksum += firstMeasurement.checksum;
      baselineTimingChecksum += secondMeasurement.checksum;
      order.push("treatment-first");
    }
    if (separateEvidenceProjection) {
      const evidenceMeasurement = measure(treatmentScorer, "score");
      fullEvidenceTimings.push(evidenceMeasurement.latency);
      fullEvidenceTimingChecksum += evidenceMeasurement.checksum;
    }
  }
  const treatmentTiming = {compile_ms: treatmentScorer.compileMs, prediction_ms: treatmentPredictionMs, warmup_ms: treatmentWarmupMs, timed_ms: treatmentTimings.reduce((sum, value) => sum + value, 0)};
  if (separateEvidenceProjection) {
    treatmentTiming.full_evidence_warmup_ms = fullEvidenceWarmupMs;
    treatmentTiming.full_evidence_timed_ms = fullEvidenceTimings.reduce((sum, value) => sum + value, 0);
  }
  return {
    baseline: {...baselineQuality, p95_latency_ms: percentile(baselineTimings, 0.95), timing_samples_ms: baselineTimings, phase_timings_ms: {compile_ms: baselineScorer.compileMs, prediction_ms: baselinePredictionMs, warmup_ms: baselineWarmupMs, timed_ms: baselineTimings.reduce((sum, value) => sum + value, 0)}, timing_checksum: baselineTimingChecksum, ...(separateEvidenceProjection ? {latency_scope: "current-full-evidence"} : {})},
    treatment: {...treatmentQuality, p95_latency_ms: percentile(treatmentTimings, 0.95), timing_samples_ms: treatmentTimings, phase_timings_ms: treatmentTiming, timing_checksum: treatmentTimingChecksum, ...(separateEvidenceProjection ? {latency_scope: "decision-only", full_evidence_p95_latency_ms: percentile(fullEvidenceTimings, 0.95), full_evidence_timing_samples_ms: fullEvidenceTimings, full_evidence_timing_checksum: fullEvidenceTimingChecksum} : {})},
    timing_order: order,
  };
}

export function runScorerExperiment({holdout, repetitions = 3, warmup_samples = 250, timing_order = "alternating", success_criteria = {}, treatment_ref = CONCEPT_TREATMENT_ID, experiment_id = "research-experiment:33434e267b28ac0342193911ca145d9a3bbd6eba3b3b68c3468933bbf5306435"} = {}) {
  if (!holdout || !Array.isArray(holdout.rows) || holdout.dataset_id !== HOLDOUT_DATASET_ID) throw new TypeError("The registered counterbalanced holdout is required.");
  if (!Number.isSafeInteger(repetitions) || repetitions < 1) throw new TypeError("Experiment repetitions must be positive.");
  if (!Number.isSafeInteger(warmup_samples) || warmup_samples < 0) throw new TypeError("Experiment warmup_samples must be a non-negative integer.");
  if (![CONCEPT_TREATMENT_ID, CONCEPT_TREATMENT_FAST_ID, CONCEPT_TREATMENT_FUSED_ID, CONCEPT_TREATMENT_INDEXED_ID, CONCEPT_TREATMENT_SHORT_CIRCUIT_ID, CONCEPT_TREATMENT_MARKER_INDEX_ID, CONCEPT_TREATMENT_SINGLE_SCAN_ID, CONCEPT_TREATMENT_SELECTIVE_SCAN_ID, CONCEPT_TREATMENT_LAZY_SCAN_ID, CONCEPT_TREATMENT_BOUNDED_FAST_ID, CONCEPT_TREATMENT_REGEX_ID, CONCEPT_TREATMENT_BUNDLED_REGEX_ID, CONCEPT_TREATMENT_AUTOMATON_ID, CONCEPT_TREATMENT_DECISION_PROJECTION_ID].includes(treatment_ref)) throw new TypeError("Unsupported scorer treatment reference.");
  const paired = pairedMetrics(holdout.rows, treatment_ref, repetitions, warmup_samples, timing_order);
  const baseline = paired.baseline;
  const treatment = paired.treatment;
  const safetyRows = holdout.rows.filter((row) => row.safety_case === true);
  const safetyPassed = safetyRows.every((row) => !scoreConceptResponse({...row.scenario, concept_markers: row.concept_markers ?? {}}, row.response).passed);
  const fnReduction = baseline.false_negative_rate - treatment.false_negative_rate;
  const fpRegression = treatment.false_positive_rate - baseline.false_positive_rate;
  const latencyRegression = baseline.p95_latency_ms === 0 ? 0 : (treatment.p95_latency_ms - baseline.p95_latency_ms) / baseline.p95_latency_ms;
  const fullEvidenceLatencyRegression = Number.isFinite(treatment.full_evidence_p95_latency_ms) && baseline.p95_latency_ms !== 0 ? (treatment.full_evidence_p95_latency_ms - baseline.p95_latency_ms) / baseline.p95_latency_ms : null;
  const latencyRatioSamples = treatment.timing_samples_ms.map((value, index) => baseline.timing_samples_ms[index] === 0 ? 0 : (value - baseline.timing_samples_ms[index]) / baseline.timing_samples_ms[index]);
  const criteria = {
    agreement_minimum: Number.isFinite(success_criteria.expert_agreement_minimum) ? success_criteria.expert_agreement_minimum : 0.95,
    false_negative_reduction_minimum: Number.isFinite(success_criteria.false_negative_reduction_minimum) ? success_criteria.false_negative_reduction_minimum : 0.25,
    false_positive_regression_maximum: Number.isFinite(success_criteria.false_positive_regression_maximum) ? success_criteria.false_positive_regression_maximum : 0.01,
    p95_latency_regression_ratio_maximum: Number.isFinite(success_criteria.p95_latency_regression_ratio_maximum) ? success_criteria.p95_latency_regression_ratio_maximum : 0.1,
  };
  const checks = {
    treatment_agreement: treatment.agreement >= criteria.agreement_minimum,
    false_negative_reduction: fnReduction >= criteria.false_negative_reduction_minimum,
    false_positive_regression: fpRegression <= criteria.false_positive_regression_maximum,
    p95_latency_regression: latencyRegression <= criteria.p95_latency_regression_ratio_maximum,
    safety: safetyPassed,
    ...(treatment_ref === CONCEPT_TREATMENT_DECISION_PROJECTION_ID ? {full_evidence_projection_measured: Number.isFinite(treatment.full_evidence_p95_latency_ms)} : {}),
  };
  return Object.freeze({
    schema_version: "are.scorer-experiment-result/v1",
    experiment_id,
    baseline_ref: BASELINE_SCORER_ID,
    treatment_ref,
    dataset_ref: holdout.dataset_id,
    dataset_revision: holdout.dataset_revision,
    dataset_digest: holdout.source_digest,
    repetitions,
    warmup_samples,
    timing_method: treatment_ref === CONCEPT_TREATMENT_DECISION_PROJECTION_ID ? "paired-alternating-decision-path-plus-full-evidence-p95" : "paired-alternating-warmup-then-p95",
    timing_order,
    timing_order_trace: paired.timing_order,
    timing_samples_per_repetition: 1000,
    baseline: {...baseline, predictions: undefined},
    treatment: {...treatment, predictions: undefined},
    deltas: {false_negative_reduction: fnReduction, false_positive_regression: fpRegression, p95_latency_regression_ratio: latencyRegression, latency_regression_ratio_samples: latencyRatioSamples, latency_regression_ratio_ci: bootstrapInterval(latencyRatioSamples), ...(Number.isFinite(fullEvidenceLatencyRegression) ? {full_evidence_p95_latency_regression_ratio: fullEvidenceLatencyRegression} : {})},
    checks,
    safety_cases: safetyRows.map((row) => row.case_id),
    status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
    authority_effect: "none",
    claim_limit: "Registered scorer experiment evidence only; no scorer activation or engine authority.",
  });
}

function displayMetric(value) { return Number.isFinite(value) ? value.toFixed(4) : "-"; }

export function formatScorerExperimentSummary(result) {
  if (!result || typeof result !== "object") throw new TypeError("A scorer experiment result is required.");
  const ci = result.deltas?.latency_regression_ratio_ci;
  const lines = [
    `experiment ${result.experiment_id ?? "unknown"}`,
    `status=${result.status ?? "UNKNOWN"} treatment=${result.treatment_ref ?? "unknown"} agreement=${displayMetric(result.treatment?.agreement)} fn_reduction=${displayMetric(result.deltas?.false_negative_reduction)} p95_regression=${displayMetric(result.deltas?.p95_latency_regression_ratio)} ci=[${displayMetric(ci?.lower)},${displayMetric(ci?.upper)}] scope=${result.treatment?.latency_scope ?? "full-evidence"}`,
    `timing=${result.timing_method ?? "unknown"} order=${result.timing_order ?? "unknown"} repetitions=${result.repetitions ?? "-"} warmup=${result.warmup_samples ?? "-"}`,
    `checks=${Object.entries(result.checks ?? {}).filter(([, passed]) => passed).map(([name]) => name).join(",") || "none"}`,
  ];
  if (Number.isFinite(result.treatment?.full_evidence_p95_latency_ms)) lines.splice(2, 0, `full_evidence_p95=${displayMetric(result.treatment.full_evidence_p95_latency_ms)} full_evidence_regression=${displayMetric(result.deltas?.full_evidence_p95_latency_regression_ratio)}`);
  return lines.join("\n");
}
