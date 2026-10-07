// No-model probe of the full, versioned Node/Python source-index process path.
// Open questions: G01-POST-R8-CLEAN-COHORT-CANDIDATE.md.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-post-r8-production-index-probe-r2`;
const source = `${base}/g01-source-index-capacity-r2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench`;
const pins = Object.freeze({
  candidate: [`${base}/g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json`, "9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194"],
  caches: [`${base}/g01-post-r8-source-caches-r2/SOURCE-CACHES.json`, "5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9"],
  service: [`${source}/ranked-source-index-service-r1.mjs`, "f8272c5622b0ef189ef08899337ee4dc4f9e4c142240f83e4fcccb22f37696eb"],
  hints: [`${source}/ranked_source_hints_r3.py`, "7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a"],
  worker: [`${source}/ranked_source_worker_r2.py`, "5a34249bfb57412affb91827ddd135f6e097b181fd0a0622f9cbce1539c95ccb"],
  supervisor: [`${source}/ranked_source_supervisor_r1.py`, "a9ec94468736cb6d747e7b4692d55429b368b9472d4e4c825b09ebcc0c6b93f4"],
  nodeWorker: [`${source}/ranked-source-index-worker-r1.mjs`, "fddccd2dc265d3f5cdb6d6e2617c7939e15c37f1da60d303c6bba9dc8b76964c"],
  process: [`${source}/recovery-generation-process.mjs`, "8955e02fbcf81737d646a29046bcf5c68857089161a97b6e95f0e09a7d54dabe"]
});
const targets = new Set([
  "Multi-SWE-Bench__typescript__maintenance__bugfix__1ac0bb81",
  "SWE-PolyBench__typescript__maintenance__bugfix__7dfdbbd1",
  "SWE-PolyBench__typescript__maintenance__bugfix__2f2954b5",
  "SWE-PolyBench__typescript__maintenance__bugfix__574eba0a"
]);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => { if (!condition) throw Error(`g01-production-index-probe.${reason}`); };
const readPinned = ([path, digest]) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `source-drift:${path}`);
  return bytes;
};

async function main() {
  const id = process.argv[2];
  need(targets.has(id) && process.argv.length === 3, "exact-target-required");
  const candidate = JSON.parse(readPinned(pins.candidate));
  const caches = JSON.parse(readPinned(pins.caches));
  for (const name of ["service", "hints", "worker", "supervisor", "nodeWorker", "process"]) readPinned(pins[name]);
  need(candidate.gold_values_or_paths_used === false && caches.gold_loaded === false, "gold-boundary");
  const task = candidate.ordered_tasks.find(task => task.instance_id === id);
  const binding = caches.task_bindings.find(row => row.instance_id === id);
  need(task && binding && task.base_commit === binding.base_commit &&
    task.repo_url === binding.origin, "task-binding");
  const {runSourceIndex} = await import(pathToFileURL(pins.service[0]).href);
  const started = performance.now();
  const report = {schema_version: "are.g01-post-r8-production-index-probe/v2",
    task_id: id, source_bindings: Object.fromEntries(Object.entries(pins).map(([name, [path, digest]]) => [name, {path, sha256: digest}])),
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Full-process no-model index diagnostic only; not all-task preflight, evaluator-gold coverage, model quality or superiority"};
  try {
    const result = await runSourceIndex({repository: binding.repository_path, base_commit: task.base_commit,
      query: task.problem_statement, signal: new AbortController().signal});
    const manifest = result.value.manifest;
    report.status = "passed";
    report.index_digest = result.value.index_digest;
    report.entries = manifest.entries.length;
    report.manifest_bytes = Buffer.byteLength(JSON.stringify(manifest));
    report.admitted_files = manifest.admitted_files;
    report.admitted_bytes = manifest.admitted_bytes;
    report.postings = manifest.postings;
    report.partial = manifest.partial;
    report.max_rss_kib = result.value.max_rss_kib;
    report.query_result_sha256 = sha(Buffer.from(JSON.stringify(result.value.query_result)));
    report.settlement = result.settlement;
    report.python_settlement = result.python_settlement;
  } catch (error) {
    report.status = "failed";
    report.error = String(error.message);
    report.cause = String(error.cause?.message ?? "");
    report.settlement = error.result?.settlement ?? null;
    report.python_error = error.result?.report?.error ?? null;
    process.exitCode = 2;
  } finally {
    report.elapsed_ms = Math.round(performance.now() - started);
    report.script_sha256 = sha(readFileSync(import.meta.filename));
    const output = `${root}/${id.slice(-8)}-RESULT.json`;
    const bytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(output, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: report.status, task_id: id, elapsed_ms: report.elapsed_ms,
      output_sha256: sha(bytes), error: report.error ?? null, cause: report.cause ?? null}));
  }
}

main().catch(error => { console.error(JSON.stringify({status: "probe-error", error: String(error.message)})); process.exitCode = 2; });
