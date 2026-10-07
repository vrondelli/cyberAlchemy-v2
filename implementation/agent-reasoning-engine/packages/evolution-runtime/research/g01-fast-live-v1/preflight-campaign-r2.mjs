// G01 r2 source-only index preflight. Gold and model transport are separate.
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {pathToFileURL} from "node:url";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, code) => { if (!value) throw new Error(`g01-r2-preflight.${code}`); };
const quotas = {"jqlang/jq": 3, "cli/cli": 7, "sveltejs/svelte": 7, "clap-rs/clap": 7};
const caches = {
  "jqlang/jq": "/opt/are/evolution-runtime/g01-product-replication-jq-cache-r2/repositories/contextbench-full",
  "cli/cli": "/opt/are/evolution-runtime/g01-terminal-shortlist-fresh-r1/repositories/contextbench-full",
  "sveltejs/svelte": "/opt/are/evolution-runtime/g01-shortlist-cap12-svelte-r1/repositories/contextbench-full",
  "clap-rs/clap": "/opt/are/evolution-runtime/g01-shortlist-cap12-rust-r1/repositories/contextbench-full"
};
const sourceKeys = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];

export async function preflight({rows, runSourceIndex, concurrency = 2}) {
  need(Array.isArray(rows) && rows.length === 24 && concurrency === 2, "cohort-shape");
  need(new Set(rows.map(row => row.instance_id)).size === rows.length, "duplicate-id");
  for (const [repo, count] of Object.entries(quotas))
    need(rows.filter(row => row.repo === repo).length === count, `quota:${repo}`);
  for (const row of rows)
    need(Object.keys(row).sort().join() === [...sourceKeys].sort().join() &&
      sourceKeys.every(key => typeof row[key] === "string" && row[key].length > 0) &&
      /^[a-f0-9]{40}$/.test(row.base_commit), "source-only-row");

  const results = Array(rows.length);
  let next = 0;
  async function worker() {
    while (next < rows.length) {
      const index = next++, row = rows[index], started = Date.now();
      const primer = Buffer.from(row.problem_statement).subarray(0, 1024).toString("utf8").replace(/\uFFFD$/, "").trim();
      try {
        const result = await runSourceIndex({repository: caches[row.repo], base_commit: row.base_commit,
          query: primer, signal: new AbortController().signal});
        results[index] = {instance_id: row.instance_id, repo: row.repo, base_commit: row.base_commit,
          status: "passed", index_digest: result.value.index_digest,
          admitted_files: result.value.manifest.admitted_files,
          excluded_files: result.value.manifest.entries.length - result.value.manifest.admitted_files,
          partial_index: result.value.manifest.partial, model_calls: result.value.model_calls,
          local_settled: result.settlement.local_settled, process_group_absent: result.settlement.process_group_absent,
          forced: result.settlement.forced, elapsed_ms: Date.now() - started};
      } catch (error) {
        results[index] = {instance_id: row.instance_id, repo: row.repo, base_commit: row.base_commit,
          status: "failed", error: String(error.message), detail: error.result?.error ?? null,
          settlement: error.result?.settlement ?? null, elapsed_ms: Date.now() - started};
      }
    }
  }
  await Promise.all(Array.from({length: concurrency}, worker));
  return {schema_version: "are.g01-r2-source-index-preflight/v1", status: results.every(row => row.status === "passed") ? "passed" : "failed",
    population: "jq-3-cli-7-svelte-7-clap-7", source_only_ids_sha256: sha(JSON.stringify(rows.map(row => row.instance_id))),
    source_only_rows_sha256: sha(JSON.stringify(rows)), concurrency, model_calls: 0, gold_loaded: false, results,
    claim_ceiling: "Source-only index and bounded-primer preflight; not transport, native scoring, cohort freeze, or model quality",
    open_questions_ref: "G01-R2-RECOVERY-PLAN-CANDIDATE.md"};
}

if (process.argv[1] === import.meta.filename) {
  const [servicePath, outputPath] = process.argv.slice(2);
  try {
    need(servicePath?.startsWith("/") && outputPath?.startsWith("/"), "arguments");
    const rows = JSON.parse(readFileSync(0, "utf8"));
    const {runSourceIndex} = await import(pathToFileURL(servicePath).href);
    const result = await preflight({rows, runSourceIndex});
    mkdirSync(dirname(outputPath), {recursive: true, mode: 0o700});
    writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n", {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: result.status, passed: result.results.filter(row => row.status === "passed").length,
      failed: result.results.filter(row => row.status !== "passed").length, output_path: outputPath,
      output_sha256: sha(readFileSync(outputPath))}));
    if (result.status !== "passed") process.exitCode = 2;
  } catch (error) {
    console.error(JSON.stringify({status: "preflight_error", error: String(error.message)}));
    process.exitCode = 2;
  }
}
