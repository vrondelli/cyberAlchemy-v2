import {performance} from "node:perf_hooks";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {CONTEXT_KEY, createCodexAppServerWrapper, loadRepositoryProfile} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
if (!loaded.ok) throw new Error(`PROFILE_LOAD_FAILED:${loaded.reason_codes?.join(",")}`);

const warmIterations = Number.parseInt(process.env.ARE_BENCHMARK_WARM ?? "20", 10);
const measuredIterations = Number.parseInt(process.env.ARE_BENCHMARK_ITERATIONS ?? "100", 10);
if (!Number.isSafeInteger(warmIterations) || warmIterations < 1 || !Number.isSafeInteger(measuredIterations) || measuredIterations < 1) {
  throw new Error("BENCHMARK_ITERATIONS_INVALID");
}

function wrapper() {
  return createCodexAppServerWrapper({
    loaded_profile: loaded.value,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot,
    context_source_provider: loaded.context_source_provider,
  });
}

function turnStart(id) {
  return {
    jsonrpc: "2.0",
    id,
    method: "turn/start",
    params: {
      threadId: "benchmark-thread",
      input: [{type: "text", text: "Research current context management approaches."}],
    },
  };
}

function percentile(sorted, quantile) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * quantile))];
}

const instance = wrapper();
for (let index = 0; index < warmIterations; index += 1) {
  const result = await instance.processClientMessage(turnStart(index));
  if (result.to_server.length !== 1) throw new Error("WARM_PREFLIGHT_DID_NOT_FORWARD");
}

const durations = [];
let inlineBytes = null;
for (let index = 0; index < measuredIterations; index += 1) {
  const started = performance.now();
  const result = await instance.processClientMessage(turnStart(warmIterations + index));
  durations.push(performance.now() - started);
  if (result.to_server.length !== 1) throw new Error("MEASURED_PREFLIGHT_DID_NOT_FORWARD");
  const fragment = JSON.parse(result.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  inlineBytes = fragment.inline_bytes;
}

durations.sort((a, b) => a - b);
const evidence = {
  schema_version: "are.codex-context-lifecycle-benchmark/v1",
  node_version: process.version,
  warm_iterations: warmIterations,
  measured_iterations: measuredIterations,
  mean_ms: durations.reduce((sum, value) => sum + value, 0) / durations.length,
  p50_ms: percentile(durations, 0.50),
  p95_ms: percentile(durations, 0.95),
  max_ms: durations.at(-1),
  inline_bytes: inlineBytes,
  target_p95_ms: 250,
  target_met: percentile(durations, 0.95) <= 250,
  authority_effect: "none",
  claim_limit: "Local warm timing for this host and current bytes only; no universal performance, admission, conformance, publication, or deployment claim.",
};

process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!evidence.target_met) process.exitCode = 1;
