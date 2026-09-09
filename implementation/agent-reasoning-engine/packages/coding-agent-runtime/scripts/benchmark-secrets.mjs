#!/usr/bin/env node

import {spawnSync} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {
  createEnvironmentSecretProvider,
  createInjectedSecretProvider,
  createSecretProviderRegistry,
  createSecretReference
} from "../secret-provider.mjs";
import {createSopsAgeProcessSecretProvider} from "../sops-age-secret-provider.mjs";

const SCHEMA_VERSION = "are.secret-retrieval-benchmark/v1";
const REQUEST_DIGEST = "a".repeat(64);
const CONSUMER_ID = "benchmark.consumer";
const MATERIAL = "synthetic-benchmark-material-never-log";
const ENV_LOCATOR = "ARE_SYNTHETIC_BENCHMARK_SECRET";
const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repositoryRoot = resolve(packageRoot, "../../../../..");
const secretProjectRoot = resolve(repositoryRoot, "projects/secret-management");

function positiveInteger(value, option) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${option} requires a positive integer`);
  return parsed;
}

function positiveNumber(value, option) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${option} requires a positive number`);
  return parsed;
}

function parseArguments(argv) {
  const options = {
    iterations: 30000,
    warmup: 2000,
    localIterations: 50,
    localWarmup: 5,
    adapterBudgetP95Us: 100,
    localBudgetP95Ms: 500,
    enforce: false,
    skipLocal: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === "--enforce") options.enforce = true;
    else if (option === "--skip-local") options.skipLocal = true;
    else if (option === "--iterations") options.iterations = positiveInteger(argv[++index], option);
    else if (option === "--warmup") options.warmup = positiveInteger(argv[++index], option);
    else if (option === "--local-iterations") options.localIterations = positiveInteger(argv[++index], option);
    else if (option === "--local-warmup") options.localWarmup = positiveInteger(argv[++index], option);
    else if (option === "--adapter-budget-p95-us") options.adapterBudgetP95Us = positiveNumber(argv[++index], option);
    else if (option === "--local-budget-p95-ms") options.localBudgetP95Ms = positiveNumber(argv[++index], option);
    else throw new Error(`unknown option: ${option}`);
  }
  return Object.freeze(options);
}

function percentile(ordered, fraction) {
  return ordered[Math.max(0, Math.ceil(fraction * ordered.length) - 1)];
}

async function benchmarkAdapter({path, provider, reference, options}) {
  const registry = createSecretProviderRegistry({providers: [provider]});
  const consume = () => registry.consume({
    secret_ref: reference,
    consumer_id: CONSUMER_ID,
    request_digest: REQUEST_DIGEST,
    consumer(material) {
      if (material.byteLength !== Buffer.byteLength(MATERIAL)) throw new Error("synthetic material length mismatch");
    }
  });
  for (let index = 0; index < options.warmup; index += 1) await consume();
  const durationsUs = new Float64Array(options.iterations);
  const totalStarted = process.hrtime.bigint();
  for (let index = 0; index < options.iterations; index += 1) {
    const started = process.hrtime.bigint();
    await consume();
    durationsUs[index] = Number(process.hrtime.bigint() - started) / 1000;
  }
  const totalUs = Number(process.hrtime.bigint() - totalStarted) / 1000;
  const ordered = Array.from(durationsUs).sort((left, right) => left - right);
  const p95Us = percentile(ordered, 0.95);
  return Object.freeze({
    path,
    material_bytes: Buffer.byteLength(MATERIAL),
    warmup_iterations: options.warmup,
    iterations: options.iterations,
    mean_us: totalUs / options.iterations,
    p50_us: percentile(ordered, 0.50),
    p95_us: p95Us,
    p99_us: percentile(ordered, 0.99),
    ops_per_second: options.iterations / (totalUs / 1_000_000),
    budget: Object.freeze({
      metric: "p95_us",
      maximum: options.adapterBudgetP95Us,
      enforced: options.enforce,
      status: p95Us <= options.adapterBudgetP95Us ? "PASS" : "FAIL"
    })
  });
}

async function benchmarkLocalStore(options) {
  if (options.skipLocal) return Object.freeze({status: "SKIPPED", reason_code: "user-requested"});
  const python = process.env.PYTHON_BIN || "/usr/bin/python3.12";
  const root = mkdtempSync(join(tmpdir(), "are-integrated-secret-benchmark-"));
  try {
    const keyFile = join(root, "config", "keys.txt");
    const vaultFile = join(root, "data", "secrets.yaml");
    const setupCode = "import sys;from secret_management.store import SopsAgeStore;s=SopsAgeStore(key_file=sys.argv[1],vault_file=sys.argv[2]);s.initialize();s.put('synthetic/integrated-key',sys.stdin.buffer.read(),purpose='benchmark')";
    const initialized = spawnSync(python, ["-c", setupCode, keyFile, vaultFile], {
      cwd: secretProjectRoot,
      input: MATERIAL,
      encoding: "utf8",
      env: {LANG: "C", LC_ALL: "C", PYTHONDONTWRITEBYTECODE: "1", PYTHONPATH: secretProjectRoot}
    });
    if (initialized.status !== 0) return Object.freeze({status: "NOT_EVALUABLE", reason_code: "local-store-setup-failed"});
    const provider = createSopsAgeProcessSecretProvider({provider_id: "local-benchmark", python_command: python, project_root: secretProjectRoot, key_file: keyFile, vault_file: vaultFile});
    const registry = createSecretProviderRegistry({providers: [provider]});
    const reference = createSecretReference({provider_id: "local-benchmark", locator: "synthetic/integrated-key"});
    const consume = () => registry.consume({
      secret_ref: reference,
      consumer_id: CONSUMER_ID,
      request_digest: REQUEST_DIGEST,
      consumer(material) { if (material.byteLength !== Buffer.byteLength(MATERIAL)) throw new Error("synthetic material length mismatch"); }
    });
    for (let index = 0; index < options.localWarmup; index += 1) await consume();
    const durationsMs = [];
    const totalStarted = process.hrtime.bigint();
    for (let index = 0; index < options.localIterations; index += 1) {
      const started = process.hrtime.bigint();
      await consume();
      durationsMs.push(Number(process.hrtime.bigint() - started) / 1_000_000);
    }
    const totalMs = Number(process.hrtime.bigint() - totalStarted) / 1_000_000;
    durationsMs.sort((left, right) => left - right);
    const p95Ms = percentile(durationsMs, 0.95);
    const budgetStatus = p95Ms <= options.localBudgetP95Ms ? "PASS" : "FAIL";
    return Object.freeze({
      schema_version: "are.integrated-secret-retrieval-benchmark/v1",
      status: options.enforce && budgetStatus === "FAIL" ? "BLOCK" : "PASS",
      path: "node-python-sops-age-registry-consume",
      material_bytes: Buffer.byteLength(MATERIAL),
      warmup_iterations: options.localWarmup,
      iterations: options.localIterations,
      mean_ms: totalMs / options.localIterations,
      p50_ms: percentile(durationsMs, 0.50),
      p95_ms: p95Ms,
      p99_ms: percentile(durationsMs, 0.99),
      ops_per_second: options.localIterations / (totalMs / 1000),
      budget: {metric: "p95_ms", maximum: options.localBudgetP95Ms, enforced: options.enforce, status: budgetStatus},
      includes: "Node registry, Python process startup, one SOPS vault decrypt, pipe transfer, callback, clearing, receipt",
      store_setup_measured: false,
      live_vault_accessed: false,
      authority_effect: "none"
    });
  } catch {
    return Object.freeze({status: "NOT_EVALUABLE", reason_code: "integrated-local-benchmark-failed"});
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const environmentReference = createSecretReference({provider_id: "environment", locator: ENV_LOCATOR});
  const environmentProvider = createEnvironmentSecretProvider({env: {[ENV_LOCATOR]: MATERIAL}});
  const injectedReference = createSecretReference({provider_id: "injected", locator: "opaque-synthetic-locator"});
  const injectedProvider = createInjectedSecretProvider({provider_id: "injected", resolve: async () => Buffer.from(MATERIAL)});
  const adapters = [
    await benchmarkAdapter({path: "environment-registry-consume", provider: environmentProvider, reference: environmentReference, options}),
    await benchmarkAdapter({path: "injected-local-mock-registry-consume", provider: injectedProvider, reference: injectedReference, options})
  ];
  const localStore = await benchmarkLocalStore(options);
  const adapterBudgetsPass = adapters.every((entry) => entry.budget.status === "PASS");
  const localBudgetPass = options.skipLocal || localStore.status === "PASS";
  const status = options.enforce && (!adapterBudgetsPass || !localBudgetPass) ? "BLOCK" : "PASS";
  const result = {
    schema_version: SCHEMA_VERSION,
    status,
    runtime: process.version,
    adapters,
    local_store: localStore,
    cloud_network: {status: "NOT_EVALUATED", reason_code: "no-live-provider-or-credential"},
    includes: "provider resolution, owned copy and clearing, consumer callback, redacted receipt hashing",
    live_vault_accessed: false,
    authority_effect: "none"
  };
  console.log(JSON.stringify(result, null, 2));
  if (status === "BLOCK") process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({schema_version: SCHEMA_VERSION, status: "BLOCK", reason_code: "benchmark-invalid", error: String(error.message), authority_effect: "none"}));
  process.exitCode = 2;
});
