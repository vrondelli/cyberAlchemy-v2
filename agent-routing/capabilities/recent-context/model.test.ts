import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parseDomainSource, compileCarrier, evaluateRule, evaluateQuery } from "../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/index.ts";

const root = dirname(fileURLToPath(import.meta.url));
const plan = compileCarrier(parseDomainSource(readFileSync(resolve(root, "recent-context.alch"), "utf8")).carrier).plan;
const rule = (name: string, facts: Record<string, unknown>) => {
  const selected = plan.model.rules.find(item => item.id === name);
  assert.ok(selected);
  return evaluateRule(selected, facts);
};

test("freshness rejects each mismatched source coordinate", () => {
  const facts: Record<string, unknown> = { head: "abc", indexedHead: "abc", worktree: "w", indexedWorktree: "w",
    scope: "project", indexedScope: "project", branch: "main", indexedBranch: "main",
    historyBoundary: "full", indexedHistoryBoundary: "full", schemaVersion: "v1", indexedSchemaVersion: "v1",
    commitLimit: 20, indexedCommitLimit: 20, pathLimit: 100, indexedPathLimit: 100 };
  assert.equal(rule("snapshot-current", facts), true);
  for (const field of ["indexedHead", "indexedWorktree", "indexedScope", "indexedBranch", "indexedHistoryBoundary", "indexedSchemaVersion", "indexedCommitLimit", "indexedPathLimit"]) {
    assert.equal(rule("snapshot-current", { ...facts, [field]: typeof facts[field] === "number" ? 1 : "different" }), false, field);
  }
});

test("model has the same query bounds as the capability contract", () => {
  const capability = JSON.parse(readFileSync(resolve(root, "capability.json"), "utf8"));
  const maximum = capability.maximum_limits;
  assert.equal(rule("bounded-history", {commitLimit: maximum.commits, pathLimit: maximum.files}), true);
  for (const [commits, files] of [[0,100], [101,100], [20,0], [20,1001]]) {
    assert.equal(rule("bounded-history", {commitLimit: commits, pathLimit: files}), false);
  }
});

test("observation has no write permission", () => {
  assert.equal(rule("observation-only", {mutationRequested: false}), true);
  assert.equal(rule("observation-only", {mutationRequested: true}), false);
  assert.equal(plan.action_ports.length, 0);
  assert.equal(plan.effect_contracts.length, 0);
});

test("compiled query keeps relevant files and orders by commit position", () => {
  const rows = [
    {path:"older", previousPath:"", changeKind:"M", fileCommitId:"old", inScope:true, commitOrder:2},
    {path:"unrelated", previousPath:"", changeKind:"A", fileCommitId:"new", inScope:false, commitOrder:0},
    {path:"newer", previousPath:"before", changeKind:"R100", fileCommitId:"new", inScope:true, commitOrder:0},
  ];
  const result = evaluateQuery(plan.query_contracts[0], rows);
  assert.deepEqual(result.map(item => item.path), ["newer", "older"]);
  assert.equal(result[0].previousPath,"before");
});
