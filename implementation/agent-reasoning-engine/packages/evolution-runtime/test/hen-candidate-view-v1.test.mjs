import assert from "node:assert/strict";
import {mkdtempSync, rmSync} from "node:fs";
import {readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

import {materializeHenCandidateView, verifyHenCandidateView} from "../index.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");
const replay = JSON.parse(readFileSync(resolve(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/EVIDENCE-NEIGHBORHOOD-FRONTIER-REPLAY-R7.json"), "utf8"));

test("each R7 task materializes as a distinct, exact-accounted candidate view", () => {
  const views = replay.rows.map((row) => materializeHenCandidateView({task_ref: `task:${row.task_id}`, query_results: row.query_results}));
  assert.equal(views.every((view) => view.ok), true);
  assert.equal(new Set(views.map((view) => view.value.view_digest)).size, 4);
  for (const [index, view] of views.entries()) {
    assert.equal(view.value.accounting.query_count, replay.rows[index].query_results.length);
    assert.equal(view.value.accounting.returned_hint_count, replay.rows[index].returned_hints);
    assert.equal(view.value.accounting.compressed_hint_count, 16);
    assert.ok(view.value.accounting.compressed_payload_bytes <= 4096);
    assert.equal(view.value.accounting.provider_calls, 0);
    assert.equal(view.value.accounting.model_calls, 0);
    assert.equal(verifyHenCandidateView(view.value).ok, true);
  }
});

test("candidate view construction rejects label injection, mixed commits, and duplicate facets", () => {
  const original = {task_ref: "task:contextbench-1", query_results: structuredClone(replay.rows[0].query_results)};
  const injected = structuredClone(original);
  injected.query_results[0].gold_paths = ["appveyor.yml"];
  assert.equal(materializeHenCandidateView(injected).ok, false);
  const mixedCommit = structuredClone(original);
  mixedCommit.query_results[0].hints[0].base_commit = "0".repeat(40);
  assert.equal(materializeHenCandidateView(mixedCommit).ok, false);
  const duplicateFacet = structuredClone(original);
  duplicateFacet.query_results[1].facet = duplicateFacet.query_results[0].facet;
  assert.equal(materializeHenCandidateView(duplicateFacet).ok, false);
});

test("view verification detects payload and accounting mutation", () => {
  const view = materializeHenCandidateView({task_ref: "task:contextbench-2", query_results: replay.rows[1].query_results}).value;
  const mutatedPayload = structuredClone(view);
  mutatedPayload.hint_payload.records.pop();
  assert.equal(verifyHenCandidateView(mutatedPayload).ok, false);
  const mutatedAccounting = structuredClone(view);
  mutatedAccounting.accounting.provider_calls = 1;
  assert.equal(verifyHenCandidateView(mutatedAccounting).ok, false);
});

test("the closed JSON CLI exposes candidate-view construction without provider effects", (context) => {
  const root = mkdtempSync(join(tmpdir(), "are-hen-view-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const cli = resolve(import.meta.dirname, "../bin/prototype.mjs");
  const request = {schema_version: "are.evolution-prototype-cli-request/v1", operation: "build-hen-candidate-view", input: {task_ref: "task:contextbench-1", query_results: replay.rows[0].query_results}};
  const run = spawnSync(process.execPath, [cli, "--root", root, "--repository-root", repositoryRoot, "--construction-disabled-definitions"], {input: JSON.stringify(request), encoding: "utf8"});
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const result = JSON.parse(run.stdout);
  assert.equal(result.ok, true);
  assert.equal(result.value.accounting.provider_calls, 0);
  assert.equal(result.value.accounting.model_calls, 0);
  const injected = structuredClone(request);
  injected.input.gold_paths = ["appveyor.yml"];
  const rejected = spawnSync(process.execPath, [cli, "--root", root, "--repository-root", repositoryRoot, "--construction-disabled-definitions"], {input: JSON.stringify(injected), encoding: "utf8"});
  assert.equal(rejected.status, 2);
  assert.deepEqual(JSON.parse(rejected.stdout).reason_codes, ["prototype.request-invalid"]);
});
