import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

const executable = resolve(import.meta.dirname, "../bin/cyberalchemy.mjs");

test("CLI help advertises the review-and-apply Implement workspace", () => {
  const result = spawnSync(process.execPath, [executable, "--help"], {encoding: "utf8"});
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--implement/u);
  assert.match(result.stdout, /--proposal-output/u);
  assert.match(result.stdout, /review-and-apply coding agent/u);
  assert.match(result.stdout, /--codex-command/u);
  assert.match(result.stdout, /--doctor/u);
  assert.match(result.stdout, /--self-test/u);
  assert.match(result.stdout, /--chat/u);
  assert.match(result.stdout, /--control-center-demo/u);
});

test("control-center demo needs no model or repository configuration", () => {
  const result = spawnSync(process.execPath, [executable, "--control-center-demo"], {encoding: "utf8"});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /terminal-required/u);
  assert.doesNotMatch(result.stderr, /coding-options-required/u);
});

test("CLI accepts chat-first repository shorthand and discovers its local scope", () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-chat-cli-test-"));
  try {
    mkdirSync(resolve(root, ".cyberalchemy"));
    writeFileSync(resolve(root, ".cyberalchemy", "coding-agent.json"), JSON.stringify({schema_version: "are.coding-agent-run-config/v1"}));
    const result = spawnSync(process.execPath, [executable, "--repository-root", root], {encoding: "utf8", env: {...process.env, PATH: ""}});
    assert.equal(result.status, 1);
    assert.match(result.stdout, /"status": "BLOCK"/u);
    assert.doesNotMatch(result.stderr, /coding-options-required/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("CLI fails closed before rendering when coding options are incomplete", () => {
  const result = spawnSync(process.execPath, [executable, "--implement"], {encoding: "utf8"});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /coding-options-required/u);
  assert.doesNotMatch(result.stdout, /\u001b\[\?1049h/u);
});
