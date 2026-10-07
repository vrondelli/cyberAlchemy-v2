// Prospective G01 r4 source-only index preflight. Does not load gold or call a model.
import {createHash} from "node:crypto";
import {readdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, code) => { if (!value) throw new Error(`g01-r4-preflight.${code}`); };
const root = "/opt/are/evolution-runtime";
const quotas = {"jqlang/jq": 3, "cli/cli": 7, "sveltejs/svelte": 7, "clap-rs/clap": 4, "sharkdp/fd": 3};
const caches = {
  "jqlang/jq": join(root, "g01-product-replication-jq-cache-r2/repositories/contextbench-full"),
  "cli/cli": join(root, "g01-terminal-shortlist-fresh-r1/repositories/contextbench-full"),
  "sveltejs/svelte": join(root, "g01-shortlist-cap12-svelte-r1/repositories/contextbench-full"),
  "clap-rs/clap": join(root, "g01-shortlist-cap12-rust-r1/repositories/contextbench-full"),
  "sharkdp/fd": join(root, "g01-product-replication-fd-cache-r4/repositories/contextbench-full")
};
const sourceKeys = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];

export async function preflightR4({rows, runSourceIndex, concurrency = 2}) {
  need(Array.isArray(rows) && rows.length === 24 && concurrency === 2, "cohort-shape");
  need(new Set(rows.map(row => row.instance_id)).size === 24, "duplicate-id");
  need(rows.every((row, i) => i === 0 || rows[i - 1].repo.localeCompare(row.repo) < 0 ||
    (rows[i - 1].repo === row.repo && sha(rows[i - 1].instance_id).localeCompare(sha(row.instance_id)) < 0)), "source-order");
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
  return {schema_version: "are.g01-r4-source-index-preflight/v1",
    status: results.every(row => row.status === "passed") ? "passed" : "failed",
    population: "jq-3-cli-7-svelte-7-clap-4-fd-3",
    source_only_ids_sha256: sha(JSON.stringify(rows.map(row => row.instance_id))),
    source_only_rows_sha256: sha(JSON.stringify(rows)), concurrency, model_calls: 0, gold_loaded: false, results,
    claim_ceiling: "Source-only index and bounded-primer preflight; not transport, native scoring, cohort freeze, or model quality"};
}

if (process.argv[1] === import.meta.filename) {
  const [inputRoot, outputPath, servicePath] = process.argv.slice(2);
  need(inputRoot?.startsWith(root + "/") && outputPath?.startsWith(root + "/") &&
    servicePath?.startsWith(root + "/"), "absolute-bounded-paths");
  const rows = readdirSync(join(inputRoot, "tasks")).filter(name => name.endsWith(".json"))
    .map(name => JSON.parse(readFileSync(join(inputRoot, "tasks", name))))
    .sort((a, b) => a.repo.localeCompare(b.repo) || sha(a.instance_id).localeCompare(sha(b.instance_id)));
  const {runSourceIndex} = await import(pathToFileURL(servicePath).href);
  const receipt = await preflightR4({rows, runSourceIndex});
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: receipt.status, count: rows.length,
    passed: receipt.results.filter(row => row.status === "passed").length,
    output_path: outputPath, output_sha256: sha(bytes)}));
  if (receipt.status !== "passed") process.exitCode = 2;
}
