import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, rmSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {materializeHostedCommandExec} from "../src/hosted-effect-command.mjs";

test("hosted command uses only the selected host sandbox and bounded buffered output", () => {
  const root = mkdtempSync(join(tmpdir(), "are-effect-command-"));
  try {
    const child = join(root, "child");
    mkdirSync(child);
    const result = materializeHostedCommandExec({repository_root: root,
      request: {kind: "command", proposal: {command: ["git", "status", "--short"], cwd: child}}});
    assert.equal(result.ok, true);
    assert.equal(result.host_method, "command/exec");
    assert.deepEqual(result.params.command, ["git", "status", "--short"]);
    assert.equal(result.params.cwd, child);
    assert.deepEqual(result.params.sandboxPolicy, {type: "workspaceWrite",
      writableRoots: [root], excludeSlashTmp: true, excludeTmpdirEnvVar: true,
      networkAccess: false});
    assert.equal(result.params.timeoutMs, 30000);
    if (process.platform === "win32") assert.equal(Object.hasOwn(result.params, "outputBytesCap"), false);
    else assert.equal(result.params.outputBytesCap, 32768);
    assert.equal(result.params.tty, false);
    assert.equal(result.params.streamStdin, false);
    assert.equal(result.params.streamStdoutStderr, false);
    assert.equal(result.authority_effect, "none");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("hosted command refuses proposal-supplied policy, shell shape and cwd escape", () => {
  const root = mkdtempSync(join(tmpdir(), "are-effect-command-"));
  const outside = mkdtempSync(join(tmpdir(), "are-effect-outside-"));
  try {
    symlinkSync(outside, join(root, "escape"), "dir");
    const request = proposal => ({repository_root: root, request: {kind: "command", proposal}});
    for (const proposal of [
      {command: "git status"},
      {command: []},
      {command: ["git", "status"], sandboxPolicy: {type: "dangerFullAccess"}},
      {command: ["git"], env: {SECRET: "injected"}},
      {command: ["git"], cwd: outside},
      {command: ["git"], cwd: join(root, "escape")},
    ]) assert.equal(materializeHostedCommandExec(request(proposal)).ok, false);
    assert.deepEqual(materializeHostedCommandExec(request({command: ["git"], cwd: "relative"})).reason_codes,
      ["hosted-effect.command-cwd-invalid"]);
  } finally {
    rmSync(root, {recursive: true, force: true});
    rmSync(outside, {recursive: true, force: true});
  }
});
