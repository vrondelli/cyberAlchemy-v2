#!/usr/bin/env node
import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {loadBenchmark} from "../src/corpus.mjs";
import {attachImprovementFeedback, packageRoot} from "../src/common.mjs";
import {runCoreBenchmark} from "../src/core.mjs";
import {runIntegrationBenchmark} from "../src/integration.mjs";
import {runContinuationRoutingBenchmark} from "../src/continuation-routing.mjs";
import {runLiveBenchmark, runLiveMultiTurnBenchmark} from "../src/live.mjs";
import {runExternalRetrievalBenchmark} from "../src/external-retrieval.mjs";
import {runIntentBenchmark} from "../src/intent.mjs";
import {runCompactionBenchmark} from "../src/compaction.mjs";
import {runCompactionLiveBenchmark} from "../src/compaction-live.mjs";
import {runCompactionAutoLiveBenchmark} from "../src/compaction-auto-live.mjs";
import {produceExternalRetrievalPredictions} from "../src/external-retrieval-producer.mjs";
import {combineResults, writeReport} from "../src/report.mjs";

function options(argv) {
  const value = {mode: "core", output: null, gateway_socket: null, repetitions: null, model: null, include_live: false, write: true, dataset: null, predictions: null, predictions_output: null, corpus_dir: null, dataset_id: null, dataset_revision: null, top_k: null, token_budget: null};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") value.mode = argv[++index];
    else if (arg === "--output") value.output = argv[++index];
    else if (arg === "--gateway-socket") value.gateway_socket = argv[++index];
    else if (arg === "--repetitions") value.repetitions = Number(argv[++index]);
    else if (arg === "--model") value.model = argv[++index];
    else if (arg === "--dataset") value.dataset = argv[++index];
    else if (arg === "--predictions") value.predictions = argv[++index];
    else if (arg === "--predictions-output") value.predictions_output = argv[++index];
    else if (arg === "--corpus-dir") value.corpus_dir = argv[++index];
    else if (arg === "--dataset-id") value.dataset_id = argv[++index];
    else if (arg === "--dataset-revision") value.dataset_revision = argv[++index];
    else if (arg === "--top-k") value.top_k = Number(argv[++index]);
    else if (arg === "--token-budget") value.token_budget = Number(argv[++index]);
    else if (arg === "--include-live") value.include_live = true;
    else if (arg === "--stdout-only") value.write = false;
    else if (arg === "--help") value.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!["core", "intent", "integration", "continuation-routing", "compaction-simulated", "compaction-live", "compaction-auto-live", "live", "live-multiturn", "external-retrieval", "external-retrieval-run", "all"].includes(value.mode)) throw new Error(`Unsupported mode: ${value.mode}`);
  if (value.repetitions !== null && (!Number.isSafeInteger(value.repetitions) || value.repetitions < 1)) throw new Error("--repetitions must be a positive integer");
  if (value.model !== null && (typeof value.model !== "string" || value.model.trim().length === 0)) throw new Error("--model must be a non-empty model identifier");
  if (value.model !== null && !["live", "live-multiturn", "compaction-live", "compaction-auto-live", "all"].includes(value.mode)) throw new Error("--model is supported only by live, live-multiturn, compaction-live, compaction-auto-live, or all --include-live");
  if (value.model !== null && value.mode === "all" && !value.include_live) throw new Error("--model with mode all requires --include-live");
  if (value.mode === "external-retrieval" && (![value.dataset, value.predictions, value.dataset_id, value.dataset_revision].every((entry) => typeof entry === "string" && entry.length > 0))) throw new Error("external-retrieval requires --dataset, --predictions, --dataset-id, and --dataset-revision");
  if (value.mode === "external-retrieval-run" && (![value.dataset, value.corpus_dir, value.dataset_id, value.dataset_revision].every((entry) => typeof entry === "string" && entry.length > 0))) throw new Error("external-retrieval-run requires --dataset, --corpus-dir, --dataset-id, and --dataset-revision");
  return value;
}

const selected = options(process.argv.slice(2));
if (selected.help) {
  process.stdout.write("Usage: benchmark.mjs --mode core|intent|integration|continuation-routing|compaction-simulated|compaction-live|compaction-auto-live|live|live-multiturn|external-retrieval|external-retrieval-run|all [options]\n\ncontinuation-routing scores production turn/completed continuation decisions, including premature stops and over-continuations. Use --model <model-id> to exact-bind live arms to the same Codex model. compaction-simulated replays telemetry fixtures. compaction-live invokes manual native compaction. compaction-auto-live uses bounded distractor turns and PASSes only after observed automatic compaction plus a registered recall gain. external-retrieval scores --predictions. external-retrieval-run produces them from --corpus-dir and optionally writes --predictions-output. Both require --dataset, --dataset-id, and --dataset-revision. 'all' remains deterministic modes unless --include-live is supplied.\n");
  process.exit(0);
}
const benchmark = loadBenchmark(packageRoot);
let result;
if (selected.mode === "core") result = await runCoreBenchmark(benchmark);
else if (selected.mode === "intent") result = await runIntentBenchmark(benchmark);
else if (selected.mode === "integration") result = await runIntegrationBenchmark(benchmark);
else if (selected.mode === "continuation-routing") result = await runContinuationRoutingBenchmark(benchmark);
else if (selected.mode === "compaction-simulated") result = await runCompactionBenchmark(benchmark);
else if (selected.mode === "compaction-live") result = await runCompactionLiveBenchmark(benchmark, selected);
else if (selected.mode === "compaction-auto-live") result = await runCompactionAutoLiveBenchmark(benchmark, selected);
else if (selected.mode === "live") result = await runLiveBenchmark(benchmark, selected);
else if (selected.mode === "live-multiturn") result = await runLiveMultiTurnBenchmark(benchmark, selected);
else if (selected.mode === "external-retrieval") result = runExternalRetrievalBenchmark(benchmark.profile, selected);
else if (selected.mode === "external-retrieval-run") {
  const production = produceExternalRetrievalPredictions(benchmark.profile, selected);
  if (selected.predictions_output) {
    const predictionPath = resolve(selected.predictions_output);
    mkdirSync(dirname(predictionPath), {recursive: true});
    writeFileSync(predictionPath, production.prediction_bytes);
  }
  const scored = runExternalRetrievalBenchmark(benchmark.profile, {...selected, prediction_bytes: production.prediction_bytes});
  const {improvement_feedback: _priorFeedback, ...scoredMaterial} = scored;
  result = attachImprovementFeedback({
    ...scoredMaterial,
    mode: "external-retrieval-run",
    producer_receipt: production.receipt,
    predictions_path: selected.predictions_output ? resolve(selected.predictions_output) : null,
  });
}
else {
  const results = [await runCoreBenchmark(benchmark), await runIntentBenchmark(benchmark), await runIntegrationBenchmark(benchmark), await runContinuationRoutingBenchmark(benchmark), await runCompactionBenchmark(benchmark)];
  if (selected.include_live) results.push(await runLiveBenchmark(benchmark, selected));
  result = combineResults(benchmark.profile, results);
}
const outputPath = selected.write ? writeReport(result, selected.output) : null;
process.stdout.write(`${JSON.stringify({...result, report_path: outputPath}, null, 2)}\n`);
process.exitCode = result.status === "FAIL" ? 1 : 0;
