#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot, sha256} from "../src/common.mjs";
import {createFixtureResearchProvider, runBenchmarkEvolutionCycle} from "../src/evolution-bridge.mjs";
import {projectFailureLearningCanary, runFailureLearningCanary} from "../src/evolution-canary.mjs";
import {inspectImprovementArtifact} from "../src/improvement-inspection.mjs";
import {diagnoseImprovement, loadImprovementReport, prepareIteration, runImprovementLoop, verifyCandidate} from "../src/improvement-loop.mjs";
import {writeImprovementReport} from "../src/improvement-report.mjs";

function parse(argv) {
  const commands = {inspect: "inspect", "run-canary": "failure-canary"};
  const leadingMode = commands[argv[0]] ?? null;
  const value = {mode: leadingMode ?? "diagnose", target: null, baseline: null, report: null, output: null, max_attempts: null, fast: false, write: true, research_fixture: null};
  for (let index = leadingMode ? 1 : 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") value.mode = argv[++index];
    else if (arg === "--target") value.target = argv[++index];
    else if (arg === "--baseline") value.baseline = argv[++index];
    else if (arg === "--report") value.report = argv[++index];
    else if (arg === "--output") value.output = argv[++index];
    else if (arg === "--max-attempts") value.max_attempts = Number(argv[++index]);
    else if (arg === "--fast") value.fast = true;
    else if (arg === "--stdout-only") value.write = false;
    else if (arg === "--research-fixture") value.research_fixture = argv[++index];
    else if (arg === "--help") value.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!["diagnose", "iterate", "verify-candidate", "loop", "evolution-cycle", "inspect", "failure-canary"].includes(value.mode)) throw new Error(`Unsupported mode: ${value.mode}`);
  if (value.max_attempts !== null && (!Number.isSafeInteger(value.max_attempts) || value.max_attempts < 1)) throw new Error("--max-attempts must be a positive integer");
  if (["verify-candidate", "loop"].includes(value.mode) && !value.baseline) throw new Error(`${value.mode} requires --baseline`);
  if (value.mode === "inspect" && !value.report) throw new Error("inspect requires --report");
  return value;
}

const options = parse(process.argv.slice(2));
if (options.help) {
  process.stdout.write("Usage: improve.mjs inspect --report FILE | run-canary [--output FILE] | --mode diagnose|iterate|verify-candidate|loop|evolution-cycle [--target ID] [--baseline REPORT] [--research-fixture FILE] [--max-attempts N] [--fast] [--output PATH] [--stdout-only]\n");
  process.exit(0);
}

const benchmark = loadBenchmark(packageRoot);
const baseline = options.baseline ? loadImprovementReport(options.baseline) : null;
const target = options.target ?? baseline?.target_id ?? null;
let result;
if (options.mode === "inspect") {
  const bytes = readFileSync(resolve(options.report));
  result = inspectImprovementArtifact(JSON.parse(bytes.toString("utf8")), {source_bytes_sha256: sha256(bytes)});
} else if (options.mode === "failure-canary") result = await runFailureLearningCanary();
else if (options.mode === "diagnose") result = await diagnoseImprovement(benchmark, options);
else if (options.mode === "iterate") result = await prepareIteration(benchmark, target, {...options, baseline});
else if (options.mode === "verify-candidate") result = await verifyCandidate(benchmark, baseline, target, options);
else if (options.mode === "loop") result = await runImprovementLoop(benchmark, baseline, target, options);
else {
  const evolutionProfile = JSON.parse(readFileSync(new URL("../../../packages/evolution-runtime/profiles/default-v1.json", import.meta.url), "utf8"));
  const researchProviders = options.research_fixture ? [createFixtureResearchProvider(resolve(options.research_fixture))] : [];
  if (researchProviders.length > 0) evolutionProfile.research.enabled = true;
  result = await runBenchmarkEvolutionCycle(benchmark, {evolution_profile: evolutionProfile, research_providers: researchProviders, fast: options.fast});
}

const reportPath = options.write && options.mode !== "inspect" ? writeImprovementReport(result, options.output) : null;
const projected = options.mode === "failure-canary" ? projectFailureLearningCanary(result) : result;
process.stdout.write(`${JSON.stringify({...projected, report_path: reportPath}, null, 2)}\n`);
process.exitCode = ["REJECT", "BLOCKED"].includes(result.status) ? 1 : 0;
