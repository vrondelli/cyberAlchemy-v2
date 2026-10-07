import assert from "node:assert/strict";
import {chmodSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {createLocalStateBackup, inspectLocalRuntime, parseLocalRuntimeConfig, projectChildEnvironment, restoreLocalStateBackup} from "../src/local-operations.mjs";

const config = (root) => ({schema_version: "are.local-runtime-config/v1", state_root: root, secret_references: {MODEL_TOKEN: "env:MODEL_TOKEN"}, child_environment_allowlist: ["PATH", "MODEL_TOKEN"], quotas: {maximum_state_bytes: 1048576, maximum_replay_events: 1000, maximum_queue_depth: 64, maximum_child_processes: 4}});

test("local configuration accepts references and projects only allowlisted environment names", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-local-config-"));
  try {
    assert.equal(parseLocalRuntimeConfig(config(root)).ok, true);
    const projected = projectChildEnvironment(config(root), {PATH: "/bin", MODEL_TOKEN: "fixture-secret", UNDECLARED: "no"});
    assert.deepEqual(projected.projected_names, ["MODEL_TOKEN", "PATH"]);
    assert.equal(projected.secret_values_emitted, false);
    assert.equal(Object.hasOwn(projected.value, "UNDECLARED"), false);
    assert.equal(inspectLocalRuntime({config: config(root)}).readiness, "ready");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("diagnostics distinguish loaded configuration from process liveness and require a private state root", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-local-root-check-"));
  const linked = `${root}-link`;
  try {
    const ready = inspectLocalRuntime({config: config(root)});
    assert.equal(ready.liveness, "configuration-loaded");
    assert.equal(ready.readiness, "ready");
    chmodSync(root, 0o755);
    assert.match(inspectLocalRuntime({config: config(root)}).reason_codes.join(), /state-root-mode-too-open/u);
    symlinkSync(root, linked, "dir");
    assert.match(inspectLocalRuntime({config: config(linked)}).reason_codes.join(), /state-root-not-private-directory/u);
    assert.match(inspectLocalRuntime({config: config(`${root}-missing`)}).reason_codes.join(), /state-root-unavailable/u);
  } finally {
    rmSync(linked, {force: true});
    rmSync(root, {recursive: true, force: true});
  }
});

test("backup and restore bind exact bytes and refuse a non-empty destination", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-local-backup-source-"));
  const backup = `${root}-backup`; const restored = `${root}-restored`;
  try {
    const state = resolve(root, "reasoning.jsonl"); writeFileSync(state, "{\"state\":1}\n", {mode: 0o600});
    const created = createLocalStateBackup({state_root: root, files: [state], destination: backup});
    assert.equal(created.ok, true);
    const result = restoreLocalStateBackup({backup, destination: restored});
    assert.equal(result.disposition, "restored-to-empty-root");
    assert.equal(readFileSync(resolve(restored, "reasoning.jsonl"), "utf8"), "{\"state\":1}\n");
    assert.throws(() => restoreLocalStateBackup({backup, destination: restored}), /not-empty/);
  } finally {
    for (const path of [root, backup, restored]) rmSync(path, {recursive: true, force: true});
  }
});
