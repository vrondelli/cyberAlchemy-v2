import {performance} from "node:perf_hooks";
import {compileRequestIntent, verifyIntentContract} from "../index.mjs";

const input = {request_ref: "benchmark:intent", request: "Start with a definition, then an example, then a deeper look for the homepage copywriting."};
for (let index = 0; index < 1000; index += 1) await compileRequestIntent(input);
const samples = [];
for (let index = 0; index < 10000; index += 1) {
  const start = performance.now();
  const result = await compileRequestIntent(input);
  if (!result.ok || !verifyIntentContract(result.value.contract).ok) throw new Error("Intent benchmark failed verification.");
  samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
const evidence = {schema_version: "are.intent-runtime-benchmark/v1", iterations: samples.length, p50_ms: samples[Math.floor(samples.length * 0.5)], p95_ms: samples[Math.floor(samples.length * 0.95)], p99_ms: samples[Math.floor(samples.length * 0.99)], target_p95_ms: 5, passed: samples[Math.floor(samples.length * 0.95)] <= 5, authority_effect: "none"};
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!evidence.passed) process.exitCode = 1;
