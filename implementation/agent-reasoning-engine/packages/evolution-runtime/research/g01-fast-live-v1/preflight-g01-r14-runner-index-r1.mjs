// Source-only exact-cache, isolated-checkout, and bounded-index admission for G01 r14.
// This uses the already-qualified prospective r45 source; it does not load gold or call GLM.
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-source-r13-prospective-r45`;
const attempt = process.argv[2] ?? "r1";
const outputRoot = `${base}/g01-r14-runner-index-preflight-${attempt}`;
const paths = Object.freeze({
  candidate: `${base}/g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json`,
  transfer: `${base}/g01-r14-cache-transfer-r1/VERIFY.json`,
  sourceQualification: `${base}/g01-r13-r45-source-qualification-r1/SOURCE-QUALIFICATION.json`,
  prepare: join(source, "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs"),
  cacheCheck: join(source, "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/verify-runner-cache-r2.mjs"),
  preflight: join(source, "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/preflight-cross-branch-cohort-r1.mjs"),
  service: join(source, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs"),
  orchestrator: join(source, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs")
});
const pins = Object.freeze({
  candidate: "014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845",
  transfer: "be17912245ed314d2f405a11af7fdef6c200ba2d55d68d3996e0c300f8bd1703",
  sourceQualification: "c510b10f05df09cec57bcace74a6c10d551f925aa22f2826580f96dca6442af6",
  sourceTree: "f4a9a90677ccc71cc2353e056b2af56ee470013579015d34eb3578bdfd374173",
  taskIds: "8fc07d7b92fb3eda43a359dd753ca5e1fbb801e53999e41a7aeaa478cb9f2488"
});
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r14-preflight.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};
const readPinnedJson = (path, digest) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `input-drift:${path}`);
  return JSON.parse(bytes);
};

async function main() {
  need(["r1", "r2"].includes(attempt), "attempt");
  need(free("/tmp") > 2_500_000_000 && free(base) > 1_476_000_000, "disk-headroom");
  const candidate = readPinnedJson(paths.candidate, pins.candidate);
  const transfer = readPinnedJson(paths.transfer, pins.transfer);
  const sourceQualification = readPinnedJson(paths.sourceQualification, pins.sourceQualification);
  need(candidate.schema_version === "are.g01-r14-development-cap-three-candidate/v1" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
    candidate.task_id_set_sha256 === pins.taskIds &&
    candidate.r45_source_qualification_sha256 === pins.sourceQualification &&
    transfer.schema_version === "are.g01-r14-vps-cache-transfer-verify/v1" &&
    transfer.status === "passed" && transfer.candidate_sha256 === pins.candidate &&
    transfer.verified_task_bindings?.length === 24 && transfer.model_calls === 0 &&
    transfer.gold_loaded === false && sourceQualification.status === "source-qualified-not-campaign-frozen" &&
    sourceQualification.source_tree_sha256 === pins.sourceTree &&
    sourceQualification.model_calls === 0 && sourceQualification.gold_loaded === false, "input-shape");

  const {bindSourceTree} = await import(pathToFileURL(paths.prepare).href);
  const tree = bindSourceTree(source);
  need(tree.file_count === 412 && tree.tree_sha256 === pins.sourceTree, "source-tree-drift");
  const byId = new Map(transfer.verified_task_bindings.map(row => [row.instance_id, row]));
  need(byId.size === 24, "duplicate-cache-binding");
  const virtualIndex = {results: candidate.ordered_tasks.map(task => {
    const row = byId.get(task.instance_id);
    need(row && row.origin === task.repo_url && row.base_commit === task.base_commit &&
      /^[a-f0-9]{40}$/.test(row.tree), `cache-binding:${task.instance_id}`);
    return {instance_id: task.instance_id, repo: task.repo, base_commit: task.base_commit,
      repository_path: row.repository_path, status: "passed"};
  })};
  const {verifyRunnerCaches} = await import(pathToFileURL(paths.cacheCheck).href);
  const {preflightCandidate} = await import(pathToFileURL(paths.preflight).href);
  const {runSourceIndex} = await import(pathToFileURL(paths.service).href);
  const {prepareIsolatedShallowSourceCheckout} = await import(pathToFileURL(paths.orchestrator).href);
  const cacheCheck = verifyRunnerCaches({candidate, index: virtualIndex});
  const checkouts = [];
  if (cacheCheck.status === "passed") for (const [position, task] of candidate.ordered_tasks.entries()) {
    const directory = mkdtempSync("/tmp/are-g01-r14-runner-probe-");
    try {
      const result = prepareIsolatedShallowSourceCheckout({cache: virtualIndex.results[position].repository_path,
        destination: join(directory, "source"), base_commit: task.base_commit});
      need(result.head === task.base_commit && result.tree === byId.get(task.instance_id).tree, "checkout-tree");
      checkouts.push({instance_id: task.instance_id, status: "passed", tree: result.tree});
    } catch (error) {
      checkouts.push({instance_id: task.instance_id, status: "failed", error: String(error.message)});
    } finally {
      rmSync(directory, {recursive: true, force: false});
    }
  }
  const admitted = cacheCheck.status === "passed" && checkouts.length === 24 &&
    checkouts.every(row => row.status === "passed");
  const projected = {...candidate, schema_version: "are.g01-source-only-cohort-candidate/v1",
    source_commit_join_verified: true,
    eligibility_receipt_sha256: sha(Buffer.from(JSON.stringify([
      candidate.dev_cap_receipt_sha256, candidate.fresh_screen_receipt_sha256, pins.candidate])))};
  const sourceIndex = admitted ? await preflightCandidate({candidate: projected, runSourceIndex,
    paths: task => byId.get(task.instance_id).repository_path,
    expectedIdDigest: pins.taskIds}) : null;
  const status = admitted && sourceIndex?.status === "passed" ? "passed" : "failed";
  const receipt = {schema_version: "are.g01-r14-runner-index-preflight/v1", attempt, status,
    candidate_sha256: pins.candidate, transfer_sha256: pins.transfer,
    source_qualification_sha256: pins.sourceQualification, source_tree_sha256: tree.tree_sha256,
    source_bindings: Object.fromEntries(Object.entries(paths).map(([name, path]) =>
      [name, {path, sha256: sha(readFileSync(path))}])),
    cache_check: cacheCheck, checkout_probes: checkouts, source_index: sourceIndex,
    model_calls: 0, gold_loaded: false, script_sha256: sha(readFileSync(import.meta.filename)),
    claim_ceiling: "R14 source-only cache, checkout and index preflight; no native-reference admission, freeze, score or superiority proof",
    open_questions: ["Are all native reference files admitted by these bounded indexes?",
      "Can a separately frozen matched campaign pass all quality, cost, speed and reliability gates?"]};
  mkdirSync(outputRoot, {recursive: false, mode: 0o700});
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(join(outputRoot, "RUNNER-INDEX-PREFLIGHT.json"), bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status, cache_passed: cacheCheck.passed,
    checkout_passed: checkouts.filter(row => row.status === "passed").length,
    index_passed: sourceIndex?.results.filter(row => row.status === "passed").length ?? 0,
    receipt_sha256: sha(bytes)}));
  if (status !== "passed") process.exitCode = 2;
}

main().catch(error => {console.error(JSON.stringify({status: "preflight-error", error: String(error.message)})); process.exitCode = 2;});
