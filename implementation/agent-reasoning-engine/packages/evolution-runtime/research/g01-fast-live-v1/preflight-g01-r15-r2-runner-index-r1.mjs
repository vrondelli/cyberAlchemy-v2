// Complete r15 r2 source-only cache, checkout and bounded-index preflight.
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-r14-r46-source-qualification-r1`;
const outputRoot = `${base}/g01-r15-r2-runner-index-preflight-r1`;
const paths = Object.freeze({
  candidate: `${base}/g01-r15-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`,
  transfer: `${base}/g01-r15-r2-cache-transfer-r1/VERIFY.json`,
  sourceQualification: `${base}/g01-r14-r46-source-evidence-r1/SOURCE-QUALIFICATION.json`,
  prepare: join(source, "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs"),
  cacheCheck: join(source, "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/verify-runner-cache-r2.mjs"),
  preflight: join(source, "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/preflight-cross-branch-cohort-r1.mjs"),
  service: join(source, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs"),
  orchestrator: join(source, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-intent-anchor-r3.mjs")
});
const pins = Object.freeze({
  candidate: "0d713aefd06e38043c48073af7226e6aab55ed0cff16efd7d77f55bb1c7da496",
  transfer: "1588b6230631a24462315a33f7df06efeaa7ec1ad6ad734c9dfc45e50a0e6e38",
  sourceQualification: "df9f803944461aec3f27e5babdec762fd5675da212766e566fd689a189955b66",
  sourceTree: "b97b3718c55c9ffb19cd6c8d140d8147580f8c6db1d6d2c98476a99e38aa54df",
  taskIds: "9a520365e35cc5f22688d4a409cd63dfa8d4e8a0fd1ae88169024a6da4a2e06c"
});
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r15-r2-preflight.${reason}`);};
const free = path => {const stat = statfsSync(path); return Number(stat.bavail) * Number(stat.bsize);};
const readPinnedJson = (path, digest) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `input-drift:${path}`);
  return JSON.parse(bytes);
};

async function main() {
  need(process.argv.length === 2, "arguments");
  need(free("/tmp") > 2_500_000_000 && free(base) > 1_476_000_000, "disk-headroom");
  const candidate = readPinnedJson(paths.candidate, pins.candidate);
  const transfer = readPinnedJson(paths.transfer, pins.transfer);
  const sourceQualification = readPinnedJson(paths.sourceQualification, pins.sourceQualification);
  need(candidate.schema_version === "are.g01-r15-development-cap-eight-candidate-r2/v1" &&
    candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
    candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
    candidate.task_id_set_sha256 === pins.taskIds &&
    candidate.r46_source_qualification_sha256 === pins.sourceQualification &&
    transfer.schema_version === "are.g01-r15-r2-vps-cache-transfer-verify/v1" &&
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
    const directory = mkdtempSync("/tmp/are-g01-r15-r2-runner-probe-");
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
      candidate.r1_native_reference_audit_sha256, candidate.replacement_ids, pins.candidate])))};
  const sourceIndex = admitted ? await preflightCandidate({candidate: projected, runSourceIndex,
    paths: task => byId.get(task.instance_id).repository_path,
    expectedIdDigest: pins.taskIds}) : null;
  const status = admitted && sourceIndex?.status === "passed" ? "passed" : "failed";
  const receipt = {schema_version: "are.g01-r15-r2-runner-index-preflight/v1", status,
    candidate_sha256: pins.candidate, transfer_sha256: pins.transfer,
    source_qualification_sha256: pins.sourceQualification, source_tree_sha256: tree.tree_sha256,
    source_bindings: Object.fromEntries(Object.entries(paths).map(([name, path]) =>
      [name, {path, sha256: sha(readFileSync(path))}])),
    cache_check: cacheCheck, checkout_probes: checkouts, source_index: sourceIndex,
    model_calls: 0, gold_loaded: false, script_sha256: sha(readFileSync(import.meta.filename)),
    claim_ceiling: "R15 r2 source-only cache, checkout and index preflight; no native-reference admission, freeze, score or superiority proof",
    open_questions: ["Are all r2 native reference files admitted by these bounded indexes?",
      "Can a new freeze and matched campaign pass strict quality, cost, speed and reliability gates?"]};
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
