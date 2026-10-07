// No-model source-only r43 index preflight on the exposed r13 r1 candidate.
// This cannot freeze a campaign or admit evaluator gold.
import {createHash} from "node:crypto";
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const base = "/opt/are/evolution-runtime";
const source = `${base}/g01-source-r13-prospective-r43`;
const outputRoot = `${base}/g01-r13-r43-index-qualification-r1`;
const candidatePath = `${base}/g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json`;
const transferPath = `${base}/g01-r13-cache-transfer-r1/VERIFY.json`;
const candidateSha = "86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5";
const transferSha = "11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5";
const sourceSha = "b59c8474e5a04b5b2ff2033c83ca62df8c4fa5de0d4439c176e8b6ffe12de13d";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r43-index.${reason}`);};
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
const receipt = {schema_version: "are.g01-r13-r43-source-index-qualification/v1",
  status: result.status === "passed" ? "source-index-qualified-not-campaign-frozen" : "failed",
  source_root: source, source_tree_sha256: tree.tree_sha256, source_file_count: tree.file_count,
  candidate_sha256: candidateSha, transfer_sha256: transferSha,
  service_sha256: sha(readFileSync(servicePath)),
  preflight_sha256: sha(readFileSync(preflightPath)),
  result, model_calls: 0, gold_loaded: false,
  claim_ceiling: "Exposed r13 r1 source-only index preflight; not native-reference admission, campaign freeze, score, or superiority"};
mkdirSync(outputRoot, {recursive: false, mode: 0o700});
const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
const outputPath = join(outputRoot, "SOURCE-INDEX-QUALIFICATION.json");
writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status,
  passed: result.results.filter(row => row.status === "passed").length,
  count: result.results.length, output_path: outputPath, output_sha256: sha(bytes)}));
if (result.status !== "passed") process.exitCode = 2;
