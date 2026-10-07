#!/usr/bin/env node
// Native Windows negative canary. Missing WSL dependencies must fail before launch.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {existsSync} from "node:fs";
import {connect} from "node:net";

assert.equal(process.platform, "win32", "native Windows is required");
const [node, launcher, ...baseArgs] = process.argv.slice(2);
assert.ok(node && launcher && existsSync(node) && existsSync(launcher),
  "usage: test-cross-os-preflight-windows.mjs <node.exe> <run.mjs> <launcher arguments>");

function replaceOption(name, value) {
  const index = baseArgs.indexOf(name);
  assert.ok(index >= 0 && index + 1 < baseArgs.length, `Missing ${name}`);
  const args = [...baseArgs];
  args[index + 1] = value;
  return args;
}

function runMissing(name, reason) {
  const absent = `/tmp/are-cross-os-preflight-missing-${randomUUID()}`;
  const result = spawnSync(node, [launcher, ...replaceOption(name, absent)], {
    encoding: "utf8", timeout: 50_000, maxBuffer: 4096, windowsHide: true,
  });
  assert.equal(result.status, 1, `${name}: expected a bounded preflight refusal`);
  assert.equal(result.stdout, "", `${name}: no ready record may be emitted`);
  const line = result.stderr.trim();
  const record = JSON.parse(line);
  assert.deepEqual(record, {schema_version: "are.cross-os-windows-failure/v1", ok: false,
    reason, authority_effect: "none"});
}

function closedPort() {
  const index = baseArgs.indexOf("--observer-port");
  assert.ok(index >= 0 && index + 1 < baseArgs.length, "Missing --observer-port");
  return new Promise(resolveResult => {
    const socket = connect(Number(baseArgs[index + 1]), "127.0.0.1");
    socket.once("connect", () => { socket.destroy(); resolveResult(false); });
    socket.once("error", error => resolveResult(error.code === "ECONNREFUSED"));
    socket.setTimeout(1500, () => { socket.destroy(); resolveResult(false); });
  });
}

assert.equal(await closedPort(), true, "The selected port must be unused before testing");
runMissing("--wsl-supervisor", "cross-os-windows.wsl-supervisor-missing");
runMissing("--wsl-state-dir", "cross-os-windows.wsl-state-dir-missing");
assert.equal(await closedPort(), true, "A refused preflight must not leave an observer");
process.stdout.write(`${JSON.stringify({schema_version: "are.cross-os-preflight-windows-canary/v1",
  ok: true, missing_supervisor_refused: true, missing_state_refused: true,
  observer_not_started: true, authority_effect: "none"})}\n`);
