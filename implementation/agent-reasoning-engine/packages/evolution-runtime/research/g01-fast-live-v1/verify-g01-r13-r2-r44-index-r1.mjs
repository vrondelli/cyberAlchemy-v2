// Source-only r44 index qualification on separately selected r13 r2. No gold or model calls.
import {createHash} from "node:crypto";
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-source-r13-prospective-r44`;
const outputRoot = `${base}/g01-r13-r2-r44-index-qualification-r1`;
const candidatePath = `${base}/g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`;
const transferPath = `${base}/g01-r13-cache-transfer-r2/VERIFY.json`;
const candidateSha = "e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d";
const transferSha = "e912532f9e9d23e9f7408a6bb94aaf23c366aed6252f7ef10ac32bd723ea7d07";
const sourceSha = "034458ba51cf7b8b00873fda75f9d1c126f623e5ca0154bbef72388d7770f484";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r13-r2-r44-index.${reason}`);};
const readPinned = (path, digest) => {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `input-drift:${path}`);
  return JSON.parse(bytes);
};

const candidate = readPinned(candidatePath, candidateSha);
const transfer = readPinned(transferPath, transferSha);
need(candidate.schema_version === "are.g01-r13-clean-source-only-candidate/v1" &&
  candidate.status === "preflight-only-not-frozen" && candidate.model_calls === 0 &&
  candidate.gold_values_or_paths_used === false && candidate.ordered_tasks?.length === 24 &&
  transfer.status === "passed" && transfer.candidate_sha256 === candidateSha &&
  transfer.verified_task_bindings?.length === 24, "input-shape");
const byId = new Map(transfer.verified_task_bindings.map(row => [row.instance_id, row]));
need(byId.size === 24 && candidate.ordered_tasks.every(task => {
  const row = byId.get(task.instance_id);
  return row && row.origin === task.repo_url && row.base_commit === task.base_commit;
}), "task-cache-bindings");
const preparePath = join(source,
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs");
const preflightPath = join(source,
  "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/preflight-cross-branch-cohort-r1.mjs");
const servicePath = join(source,
  "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs");
const {bindSourceTree} = await import(pathToFileURL(preparePath).href);
const tree = bindSourceTree(source);
need(tree.file_count === 412 && tree.tree_sha256 === sourceSha, "source-tree-drift");
const {preflightCandidate} = await import(pathToFileURL(preflightPath).href);
const {runSourceIndex} = await import(pathToFileURL(servicePath).href);
const projected = {...candidate, schema_version: "are.g01-source-only-cohort-candidate/v1",
  source_commit_join_verified: true,
  eligibility_receipt_sha256: sha(Buffer.from(JSON.stringify(candidate.prior_screen_receipt_sha256) + candidateSha))};
const result = await preflightCandidate({candidate: projected, runSourceIndex,
  paths: task => byId.get(task.instance_id).repository_path,
  expectedIdDigest: candidate.task_id_set_sha256});
const receipt = {schema_version: "are.g01-r13-r2-r44-source-index-qualification/v1",
  status: result.status === "passed" ? "source-index-qualified-not-campaign-frozen" : "failed",
  source_root: source, source_tree_sha256: tree.tree_sha256, source_file_count: tree.file_count,
  candidate_sha256: candidateSha, transfer_sha256: transferSha,
  service_sha256: sha(readFileSync(servicePath)),
  preflight_sha256: sha(readFileSync(preflightPath)),
  worker_deadline_seconds: 120, outer_deadline_ms: 125000,
  result, model_calls: 0, gold_loaded: false,
  claim_ceiling: "R13 r2 source-only index preflight; not native-reference admission, campaign freeze, score, or superiority"};
mkdirSync(outputRoot, {recursive: false, mode: 0o700});
const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
const outputPath = join(outputRoot, "SOURCE-INDEX-QUALIFICATION.json");
writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status,
  passed: result.results.filter(row => row.status === "passed").length,
  count: result.results.length, output_path: outputPath, output_sha256: sha(bytes)}));
if (result.status !== "passed") process.exitCode = 2;
