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
  assert.match(result.stdout, /--durable-proposal-thread/u);
  assert.match(result.stdout, /\/reconcile/u);
});

test("durable proposal history is explicit and Codex-only", () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-durable-cli-test-"));
  try {
    const scope = resolve(root, "scope.json");
    writeFileSync(scope, JSON.stringify({schema_version: "are.coding-agent-run-config/v1"}));
    const result = spawnSync(process.execPath, [executable, "--implement", "--coding-config", scope,
      "--repository-root", root, "--durable-proposal-thread"], {encoding: "utf8"});
    assert.equal(result.status, 2);
    assert.match(result.stderr, /durable-proposal-thread-requires-codex/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
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

test("Codex scope selects the gateway without requiring a second local executable", () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-gateway-cli-test-"));
  try {
    const scope = resolve(root, "scope.json");
    writeFileSync(scope, JSON.stringify({schema_version: "are.codex-coding-agent-scope/v1", observation_allowlist: ["scope.json"],
      mutation_allowlist: ["scope.json"], verification_command: [process.execPath, "--test"]}));
    const result = spawnSync(process.execPath, [executable, "--doctor", "--implement", "--coding-config", scope,
      "--repository-root", root], {encoding: "utf8", env: {...process.env, PATH: ""}});
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.provider, "codex-app-server");
    assert.equal(report.checks.find((item) => item.check_id === "codex-command")?.status, "PASS");
    assert.deepEqual(report.reason_codes, ["sandbox.required"]);
    assert.doesNotMatch(result.stderr, /codex-command-required/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
