import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {test} from "node:test";
import {preflightR4} from "./preflight-campaign-r4.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const quotas = {"jqlang/jq": 3, "cli/cli": 7, "sveltejs/svelte": 7, "clap-rs/clap": 4, "sharkdp/fd": 3};
const rows = Object.entries(quotas).flatMap(([repo, count]) => Array.from({length: count}, (_, index) => ({
  instance_id: `${repo.replace("/", "-")}-${index}`, original_inst_id: `old-${index}`, repo,
  repo_url: `https://example.invalid/${repo}`, language: "fixture", base_commit: "a".repeat(40),
  problem_statement: "Find the relevant source", source: "fixture"})))
  .sort((a, b) => a.repo.localeCompare(b.repo) || sha(a.instance_id).localeCompare(sha(b.instance_id)));

test("r4 preflight binds five repository quotas and source-only index settlement", async () => {
  const seen = [];
  const result = await preflightR4({rows, runSourceIndex: async request => {
    seen.push(request);
    return {value: {index_digest: "index", manifest: {admitted_files: 1, entries: [1], partial: false}, model_calls: 0},
      settlement: {local_settled: true, process_group_absent: true, forced: false}};
  }});
  assert.equal(result.status, "passed");
  assert.equal(result.results.length, 24);
  assert.equal(result.model_calls, 0);
  assert.equal(result.gold_loaded, false);
  assert.equal(seen.filter(request => request.repository.includes("g01-product-replication-fd-cache-r4")).length, 3);
});

test("r4 preflight rejects an incorrect quota before any index work", async () => {
  let calls = 0;
  const changed = rows.map(row => ({...row}));
  changed.find(row => row.repo === "sharkdp/fd").repo = "clap-rs/clap";
  await assert.rejects(preflightR4({rows: changed, runSourceIndex: async () => { calls++; }}), /source-order|quota/);
  assert.equal(calls, 0);
});
