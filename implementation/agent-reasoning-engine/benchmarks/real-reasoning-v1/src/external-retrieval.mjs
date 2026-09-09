import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {ratio, resultEnvelope, sha256} from "./common.mjs";

const PREDICTION_SCHEMA = "are.external-retrieval-prediction/v1";
const ALLOWED_DECISIONS = new Set(["retrieve", "abstain"]);

function jsonlBytes(bytes, label) {
  return bytes.toString("utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); } catch (error) { throw new Error(`${label}:${index + 1}: ${error.message}`); }
  });
}

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }

function uniquePaths(values, label) {
  if (!Array.isArray(values)) throw new Error(`${label}: paths must be an array`);
  const paths = values.map((value) => {
    const raw = typeof value === "string" ? value : value?.path;
    if (!nonEmpty(raw)) throw new Error(`${label}: invalid path`);
    const normalized = raw.replaceAll("\\", "/").replace(/^\.\//, "");
    if (normalized.startsWith("/") || normalized.split("/").includes("..")) throw new Error(`${label}: path must be repository-relative`);
    return normalized;
  });
  if (new Set(paths).size !== paths.length) throw new Error(`${label}: duplicate path`);
  return paths;
}

function goldFiles(sample) {
  const gold = sample.gold ?? {};
  if (gold.no_gold === true) return [];
  if (Array.isArray(gold.files) && gold.files.length > 0) return uniquePaths(gold.files, `${sample.id}:gold.files`);
  if (sample.task_type === "code2test") return uniquePaths(gold.related_tests ?? [], `${sample.id}:gold.related_tests`);
  if (sample.task_type === "comment2context") {
    const context = gold.must_context_files ?? gold.context_files;
    if (Array.isArray(context) && context.length > 0) return uniquePaths(context, `${sample.id}:gold.context_files`);
  }
  const fallback = Array.isArray(gold.root_cause_files) && gold.root_cause_files.length > 0 ? gold.root_cause_files : gold.related_tests;
  return uniquePaths(fallback ?? [], `${sample.id}:gold`);
}

function normalizeSamples(rows, path) {
  const ids = new Set();
  return rows.map((sample, index) => {
    const id = sample.id ?? sample.sample_id;
    if (!nonEmpty(id) || !nonEmpty(sample.repo) || !nonEmpty(sample.base_commit) || !nonEmpty(sample.task_type) || typeof sample.gold !== "object" || sample.gold === null) {
      throw new Error(`${path}:${index + 1}: invalid Agent Retrieval Bench sample`);
    }
    if (ids.has(id)) throw new Error(`${path}:${index + 1}: duplicate sample ${id}`);
    ids.add(id);
    const gold = goldFiles({...sample, id});
    const noGold = sample.gold.no_gold === true;
    if (!noGold && gold.length === 0) throw new Error(`${path}:${index + 1}: positive sample has no gold files`);
    return {sample_id: id, repo: sample.repo, base_commit: sample.base_commit, task_type: sample.task_type, no_gold: noGold, gold_files: gold};
  });
}

function normalizePredictions(rows, path) {
  const predictions = new Map();
  for (const [index, prediction] of rows.entries()) {
    if (prediction.schema_version !== PREDICTION_SCHEMA || !nonEmpty(prediction.sample_id) || !nonEmpty(prediction.repo) || !nonEmpty(prediction.base_commit) || !ALLOWED_DECISIONS.has(prediction.decision)) {
      throw new Error(`${path}:${index + 1}: invalid external retrieval prediction`);
    }
    if (predictions.has(prediction.sample_id)) throw new Error(`${path}:${index + 1}: duplicate prediction ${prediction.sample_id}`);
    const ranked = prediction.ranked_files ?? [];
    if (!Array.isArray(ranked) || (prediction.decision === "abstain" && ranked.length > 0)) throw new Error(`${path}:${index + 1}: decision/ranking mismatch`);
    const paths = uniquePaths(ranked, `${prediction.sample_id}:ranked_files`);
    const rankedFiles = ranked.map((entry, rankedIndex) => {
      if (typeof entry !== "object" || entry === null || !Number.isSafeInteger(entry.header_tokens) || entry.header_tokens < 0 || !Number.isSafeInteger(entry.content_tokens) || entry.content_tokens < 0) {
        throw new Error(`${path}:${index + 1}: ranked file ${rankedIndex + 1} requires observed token counts`);
      }
      return {path: paths[rankedIndex], header_tokens: entry.header_tokens, content_tokens: entry.content_tokens};
    });
    predictions.set(prediction.sample_id, {...prediction, ranked_files: rankedFiles});
  }
  return predictions;
}

function fScore(precision, recall, beta = 0.5) {
  const betaSquared = beta ** 2;
  return precision + recall === 0 ? 0 : ((1 + betaSquared) * precision * recall) / ((betaSquared * precision) + recall);
}

function packedCoverage(rankedFiles, gold, tokenBudget) {
  let usedTokens = 0;
  let packedFiles = 0;
  let partialFiles = 0;
  const covered = new Set();
  for (const file of rankedFiles) {
    const separatorTokens = file.content_tokens > 0 ? 1 : 0;
    const totalTokens = file.header_tokens + file.content_tokens + separatorTokens;
    if (totalTokens <= 0) continue;
    const remaining = tokenBudget - usedTokens;
    if (remaining <= 0) break;
    packedFiles += 1;
    const includedContentTokens = totalTokens <= remaining
      ? file.content_tokens
      : Math.min(file.content_tokens, Math.max(0, remaining - file.header_tokens));
    if (totalTokens > remaining) partialFiles += 1;
    usedTokens += Math.min(totalTokens, remaining);
    if (gold.has(file.path) && includedContentTokens >= 1) covered.add(file.path);
    if (usedTokens >= tokenBudget) break;
  }
  return {bcy: ratio(covered.size, gold.size), used_tokens: usedTokens, packed_files: packedFiles, partial_files: partialFiles, covered_gold_files: [...covered].sort()};
}

function scoreCase(sample, prediction, {topK, tokenBudget}) {
  if (!prediction) return {sample_id: sample.sample_id, task_type: sample.task_type, passed: false, missing_prediction: true, no_gold: sample.no_gold};
  if (prediction.repo !== sample.repo || prediction.base_commit !== sample.base_commit) {
    throw new Error(`${sample.sample_id}: prediction repository binding mismatch`);
  }
  const rankedPaths = prediction.ranked_files.map((entry) => entry.path);
  const gold = new Set(sample.gold_files);
  const top = rankedPaths.slice(0, topK);
  const hits = top.filter((path) => gold.has(path));
  const firstRank = rankedPaths.findIndex((path) => gold.has(path));
  const abstained = prediction.decision === "abstain";
  const selectiveSuccess = sample.no_gold ? abstained : !abstained && hits.length > 0;
  if (sample.no_gold) {
    return {sample_id: sample.sample_id, task_type: sample.task_type, passed: selectiveSuccess, missing_prediction: false, no_gold: true, decision: prediction.decision, selective_success: selectiveSuccess, unnecessary_retrieval: !abstained, ranked_file_count: rankedPaths.length};
  }
  const recall = ratio(hits.length, gold.size);
  const precision = hits.length / topK;
  const packed = packedCoverage(prediction.ranked_files, gold, tokenBudget);
  return {
    sample_id: sample.sample_id,
    task_type: sample.task_type,
    passed: selectiveSuccess,
    missing_prediction: false,
    no_gold: false,
    decision: prediction.decision,
    selective_success: selectiveSuccess,
    false_abstention: abstained,
    reciprocal_rank: firstRank < 0 ? 0 : 1 / (firstRank + 1),
    recall_at_k: recall,
    precision_at_k: precision,
    f0_5_at_k: fScore(precision, recall),
    gold_files: [...gold].sort(),
    hits,
    ranked_file_count: rankedPaths.length,
    ...packed,
  };
}

function mean(rows, key) { return rows.length === 0 ? null : rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0) / rows.length; }

function summarize(cases) {
  const positive = cases.filter((entry) => !entry.no_gold && !entry.missing_prediction);
  const negative = cases.filter((entry) => entry.no_gold && !entry.missing_prediction);
  return {
    samples: cases.length,
    positive_samples: positive.length,
    no_gold_samples: negative.length,
    missing_predictions: cases.filter((entry) => entry.missing_prediction).length,
    mrr: mean(positive, "reciprocal_rank"),
    recall_at_k: mean(positive, "recall_at_k"),
    precision_at_k: mean(positive, "precision_at_k"),
    f0_5_at_k: mean(positive, "f0_5_at_k"),
    bcy_at_budget: mean(positive, "bcy"),
    selective_success: mean(cases.filter((entry) => !entry.missing_prediction), "selective_success"),
    correct_abstention_rate: negative.length === 0 ? null : ratio(negative.filter((entry) => entry.selective_success).length, negative.length),
    false_abstention_rate: positive.length === 0 ? null : ratio(positive.filter((entry) => entry.false_abstention).length, positive.length),
    mean_used_tokens: mean(positive, "used_tokens"),
  };
}

export function runExternalRetrievalBenchmark(profile, options) {
  if (!nonEmpty(options.dataset_id) || !nonEmpty(options.dataset_revision)) {
    throw new Error("External retrieval dataset identity and revision are required");
  }
  const datasetPath = resolve(options.dataset);
  const datasetBytes = readFileSync(datasetPath);
  const predictionsPath = options.prediction_bytes === undefined ? resolve(options.predictions) : null;
  const predictionsBytes = options.prediction_bytes === undefined ? readFileSync(predictionsPath) : Buffer.from(options.prediction_bytes);
  const predictionLabel = predictionsPath ?? "generated-predictions";
  const samples = normalizeSamples(jsonlBytes(datasetBytes, datasetPath), datasetPath);
  const predictions = normalizePredictions(jsonlBytes(predictionsBytes, predictionLabel), predictionLabel);
  const knownIds = new Set(samples.map((sample) => sample.sample_id));
  const unexpectedPredictions = [...predictions.keys()].filter((id) => !knownIds.has(id)).sort();
  if (unexpectedPredictions.length > 0) throw new Error(`Unexpected predictions: ${unexpectedPredictions.join(",")}`);
  const topK = options.top_k ?? profile.external_retrieval.top_k;
  const tokenBudget = options.token_budget ?? profile.external_retrieval.token_budget;
  if (!Number.isSafeInteger(topK) || topK < 1 || !Number.isSafeInteger(tokenBudget) || tokenBudget < 1) throw new Error("External retrieval budgets must be positive integers");
  const cases = samples.map((sample) => scoreCase(sample, predictions.get(sample.sample_id), {topK, tokenBudget}));
  const metrics = summarize(cases);
  const targets = profile.external_retrieval.quality_targets;
  const checks = {
    complete_predictions: metrics.missing_predictions === 0,
    mrr: metrics.mrr !== null && metrics.mrr >= targets.mrr,
    recall_at_k: metrics.recall_at_k !== null && metrics.recall_at_k >= targets.recall_at_20,
    bcy_at_budget: metrics.bcy_at_budget !== null && metrics.bcy_at_budget >= targets.bcy_at_8000,
    selective_success: metrics.selective_success !== null && metrics.selective_success >= targets.selective_success_at_20,
  };
  const byTask = Object.fromEntries([...new Set(cases.map((entry) => entry.task_type))].sort().map((task) => [task, summarize(cases.filter((entry) => entry.task_type === task))]));
  const result = resultEnvelope(profile, "external-retrieval", Object.values(checks).every(Boolean) ? "PASS" : "FAIL", {checks, metrics, by_task: byTask}, {external_retrieval: cases}, {});
  return {
    ...result,
    external_binding: {
      benchmark: "Agent Retrieval Bench",
      adapter_version: "agent-retrieval-bench-jsonl/v2",
      dataset_id: options.dataset_id,
      dataset_revision: options.dataset_revision,
      dataset_sha256: sha256(datasetBytes),
      predictions_sha256: sha256(predictionsBytes),
      top_k: topK,
      token_budget: tokenBudget,
      token_counts: "prediction-observed-not-inferred",
      upstream_source: profile.external_retrieval.upstream_source,
      authority_effect: "none",
    },
  };
}
