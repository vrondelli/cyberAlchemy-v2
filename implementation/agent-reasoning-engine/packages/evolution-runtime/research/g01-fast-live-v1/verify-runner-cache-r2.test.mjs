import assert from "node:assert/strict";
import {test} from "node:test";
import {verifyRunnerCaches} from "./verify-runner-cache-r2.mjs";

const commit = "a".repeat(40), tree = "b".repeat(40);
const candidate = {ordered_tasks: [{instance_id: "task-1", repo: "org/repo", repo_url: "https://github.com/org/repo.git", base_commit: commit}]};
const index = {results: [{instance_id: "task-1", repo: "org/repo", base_commit: commit,
  repository_path: "/opt/cache/repo", status: "passed"}]};
const runGit = (_path, args) => args[0] === "remote" ? "https://github.com/org/repo.git" : args[0] === "cat-file" ? "commit" : tree;

test("runner cache preflight admits exact origin, commit, and tree", () => {
  const result = verifyRunnerCaches({candidate, index, runGit, checkPath: () => true});
  assert.equal(result.status, "passed");
  assert.equal(result.passed, 1);
  assert.equal(result.model_calls, 0);
});

test("missing Git origin fails before model dispatch", () => {
  const result = verifyRunnerCaches({candidate, index,
    runGit: (path, args) => args[0] === "remote" ? null : runGit(path, args), checkPath: () => true});
  assert.equal(result.status, "failed");
  assert.equal(result.rows[0].reason, "origin-identity");
});

test("commit and cache-path defects fail closed", () => {
  assert.equal(verifyRunnerCaches({candidate, index, runGit, checkPath: () => false}).rows[0].reason, "unsafe-cache-path");
  assert.equal(verifyRunnerCaches({candidate, index,
    runGit: (path, args) => args[0] === "cat-file" ? null : runGit(path, args), checkPath: () => true}).rows[0].reason, "missing-commit");
});

test("index-task identity drift fails before any Git reads", () => {
  assert.throws(() => verifyRunnerCaches({candidate, index: {results: [{...index.results[0], instance_id: "other"}]},
    runGit: () => { throw Error("unexpected Git read"); }, checkPath: () => true}), /row-binding/);
});
