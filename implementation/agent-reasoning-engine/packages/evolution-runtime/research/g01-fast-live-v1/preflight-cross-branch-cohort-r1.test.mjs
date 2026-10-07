import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash} from "node:crypto";
import {preflightCandidate} from "./preflight-cross-branch-cohort-r1.mjs";

const ids = Array.from({length: 24}, (_, index) => `source-${index}`);
const sha = value => createHash("sha256").update(value).digest("hex");
const candidate = {schema_version: "are.g01-source-only-cohort-candidate/v1", status: "preflight-only-not-frozen",
  source_commit_join_verified: true, source_parquet_sha256: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8",
  eligibility_receipt_sha256: "a".repeat(64),
  task_id_set_sha256: sha([...ids].sort().join("\n") + "\n"),
  ordered_tasks: ids.map(instance_id => ({instance_id, original_inst_id: instance_id, repo: "r/r",
    repo_url: "https://github.com/r/r.git", language: "go", base_commit: "a".repeat(40),
    problem_statement: "Find relevant source", source: "Multi"}))};

test("rejects task-set drift before starting an index", async () => {
  let calls = 0;
  const changed = {...candidate, ordered_tasks: candidate.ordered_tasks.map(row => ({...row}))};
  changed.ordered_tasks[0].instance_id = "changed";
  await assert.rejects(preflightCandidate({candidate: changed, expectedIdDigest: candidate.task_id_set_sha256,
    paths: () => "/repo", runSourceIndex: async () => { calls++; }}),
    /source-only-rows/);
  assert.equal(calls, 0);
});

test("records every settled source index without model calls", async () => {
  const result = await preflightCandidate({candidate, expectedIdDigest: candidate.task_id_set_sha256,
    paths: () => "/repo", runSourceIndex: async () => ({
      value: {index_digest: "a".repeat(64), manifest: {admitted_files: 1, entries: [{status: "admitted"}], partial: false}, model_calls: 0},
      settlement: {local_settled: true, process_group_absent: true, forced: false}
    })});
  assert.equal(result.status, "passed");
  assert.equal(result.results.length, 24);
  assert.equal(result.model_calls, 0);
});
