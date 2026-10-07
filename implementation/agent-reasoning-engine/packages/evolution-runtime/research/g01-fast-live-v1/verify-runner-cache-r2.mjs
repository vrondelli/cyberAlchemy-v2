// Read-only pre-dispatch check for source-cache prerequisites used by the G01
// runner. In particular, source indexing alone does not verify Git origin.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {lstatSync, readFileSync} from "node:fs";
import {resolve, sep} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const safePath = path => {
  if (typeof path !== "string" || !path.startsWith("/") || resolve(path) !== path) return false;
  let cursor = sep;
  for (const piece of path.split(sep).filter(Boolean)) {
    cursor = cursor === sep ? `${sep}${piece}` : `${cursor}${sep}${piece}`;
    try { if (lstatSync(cursor).isSymbolicLink()) return false; }
    catch { return false; }
  }
  return true;
};
const git = (path, args) => {
  const result = spawnSync("git", ["-C", path, "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args],
    {encoding: "utf8", timeout: 10000, maxBuffer: 65536});
  return result.status === 0 ? result.stdout.trim() : null;
};

export function verifyRunnerCaches({candidate, index, runGit = git, checkPath = safePath}) {
  if (!Array.isArray(candidate?.ordered_tasks) || !Array.isArray(index?.results) ||
      candidate.ordered_tasks.length !== index.results.length ||
      new Set(candidate.ordered_tasks.map(task => task.instance_id)).size !== candidate.ordered_tasks.length)
    throw Error("g01-runner-cache.candidate-index-shape");
  const rows = candidate.ordered_tasks.map((task, position) => {
    const receipt = index.results[position], path = receipt.repository_path;
    if (receipt.instance_id !== task.instance_id || receipt.repo !== task.repo ||
        receipt.base_commit !== task.base_commit || receipt.status !== "passed" ||
        !/^https:\/\/github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.git$/.test(task.repo_url) ||
        !/^[a-f0-9]{40}$/.test(task.base_commit))
      throw Error(`g01-runner-cache.row-binding:${position}`);
    if (!checkPath(path)) return {instance_id: task.instance_id, status: "failed", reason: "unsafe-cache-path"};
    const origin = runGit(path, ["remote", "get-url", "origin"]);
    if (origin !== task.repo_url) return {instance_id: task.instance_id, status: "failed", reason: "origin-identity"};
    const commit = runGit(path, ["cat-file", "-t", `${task.base_commit}^{commit}`]);
    if (commit !== "commit") return {instance_id: task.instance_id, status: "failed", reason: "missing-commit"};
    const tree = runGit(path, ["rev-parse", `${task.base_commit}^{tree}`]);
    if (!/^[a-f0-9]{40}$/.test(tree ?? "")) return {instance_id: task.instance_id, status: "failed", reason: "missing-tree"};
    return {instance_id: task.instance_id, status: "passed", origin_sha256: sha(origin), tree};
  });
  return {schema_version: "are.g01-runner-cache-preflight/v2", status: rows.every(row => row.status === "passed") ? "passed" : "failed",
    checked: rows.length, passed: rows.filter(row => row.status === "passed").length, model_calls: 0,
    gold_loaded: false, rows, claim_ceiling: "Source-cache admission only; no model quality or benchmark superiority evidence."};
}

if (process.argv[1] === import.meta.filename) {
  try {
    const [candidatePath, candidateSha, indexPath, indexSha] = process.argv.slice(2);
    if (!candidatePath?.startsWith("/opt/") || !indexPath?.startsWith("/opt/") ||
        !/^[a-f0-9]{64}$/.test(candidateSha ?? "") || !/^[a-f0-9]{64}$/.test(indexSha ?? ""))
      throw Error("g01-runner-cache.arguments");
    const candidateBytes = readFileSync(candidatePath), indexBytes = readFileSync(indexPath);
    if (sha(candidateBytes) !== candidateSha || sha(indexBytes) !== indexSha) throw Error("g01-runner-cache.input-drift");
    const report = verifyRunnerCaches({candidate: JSON.parse(candidateBytes), index: JSON.parse(indexBytes)});
    process.stdout.write(`${JSON.stringify({...report, candidate_sha256: candidateSha, index_sha256: indexSha})}\n`);
    if (report.status !== "passed") process.exitCode = 2;
  } catch (error) { process.stderr.write(`${JSON.stringify({status: "preflight-error", error: String(error.message)})}\n`); process.exitCode = 2; }
}
