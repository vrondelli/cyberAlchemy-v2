import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {mkdtempSync, rmSync} from "node:fs";
import {createServer} from "node:net";
import {resolve} from "node:path";
import test from "node:test";

import {GATEWAY_CONNECTED_SCHEMA} from "../index.mjs";
import {digestValue} from "../src/canonical.mjs";
import {createWindowsClientRecoveryState} from "../src/windows-client-recovery-state.mjs";

test("steer RPC response fault seam rejects an unbound or malformed test environment", () => {
  const executable = resolve(import.meta.dirname, "../bin/are-codex-windows-client.mjs");
  const args = [executable, "--socket", "unused-gateway-socket", "--repository-root", process.cwd(),
    "--state-file", resolve(process.cwd(), "unused-client-state.json")];
  for (const marker of ["1", "0"]) {
    const child = spawnSync(process.execPath, args, {encoding: "utf8",
      env: {...process.env, ARE_INTEGRATION_TEST_MODE: "1",
        ARE_INTEGRATION_TEST_DROP_STEER_RPC_RESPONSE: marker}});
    assert.equal(child.status, 2);
    assert.match(child.stderr, /Usage: are-codex-windows-client/);
  }
});

test("Windows client executable opens a read-only stop page for a gateway startup fault", {
  skip: process.platform === "win32",
}, async (context) => {
  const directory = mkdtempSync("/tmp/are-client-fault-cli-");
  const socketPath = resolve(directory, "gateway.sock");
  const statePath = resolve(directory, "client-state.json");
  const resumeToken = "fixture-resume-token";
  const recovery = createWindowsClientRecoveryState({path: statePath, consumer_id: "codex:human-chat"});
  recovery.bind_gateway({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
    consumer_id: "codex:human-chat", resumed: false,
    continuity: {resume_token: resumeToken, resume_token_digest: digestValue(resumeToken)}});
  recovery.close();
  const faultDigest = "b".repeat(64);
  const gateway = createServer((socket) => {
    socket.once("data", (chunk) => {
      const handshake = JSON.parse(chunk.toString("utf8").trim());
      assert.equal(handshake.consumer_id, "codex:human-chat");
      assert.equal(handshake.continuity.resume_token, resumeToken);
      socket.end(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
        reason: "gateway.session-faulted", fault_digest: faultDigest,
        fault_reason_code: "gateway.compaction-history-conflict", authority_effect: "none"})}\n`);
    });
  });
  await new Promise((resolveListen) => gateway.listen(socketPath, resolveListen));
  const executable = resolve(import.meta.dirname, "../bin/are-codex-windows-client.mjs");
  const child = spawn(process.execPath, [executable, "--socket", socketPath,
    "--repository-root", directory, "--state-file", statePath,
    "--port", "0", "--token", "cli-fixture-token"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  context.after(async () => {
    if (child.exitCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
    await new Promise((resolveClose) => gateway.close(resolveClose));
    rmSync(directory, {recursive: true, force: true});
  });
  const stopped = await new Promise((resolveStopped, rejectStopped) => {
    let buffer = "";
    const timer = setTimeout(() => rejectStopped(new Error("Timed out waiting for hosted fault view")), 5000);
    child.once("exit", (code) => { clearTimeout(timer); rejectStopped(new Error(`Client exited before fault view: ${code}; ${buffer}`)); });
    child.stderr.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      clearTimeout(timer);
      try { resolveStopped(JSON.parse(buffer.slice(0, newline))); }
      catch (error) { rejectStopped(error); }
    });
  });
  assert.equal(stopped.schema_version, "are.codex-windows-client-stopped/v1");
  assert.equal(stopped.transport_failure.fault_digest, faultDigest);
  assert.match(stopped.launch_url, /#token=cli-fixture-token$/);
  const response = await fetch(`${stopped.url}api/state`, {headers: {authorization: "Bearer cli-fixture-token"}});
  assert.equal(response.status, 200);
  const state = (await response.json()).value;
  assert.equal(state.ready, false);
  assert.equal(state.recovery_mode, "private-file-stopped");
  assert.equal(state.transport_failure.fault_reason_code, "gateway.compaction-history-conflict");
  assert.equal((await fetch(`${stopped.url}api/state`)).status, 401);
  assert.equal((await fetch(`${stopped.url}api/turns`, {method: "POST",
    headers: {authorization: "Bearer cli-fixture-token", "content-type": "application/json"}, body: "{}"})).status, 503);
});

test("a reconnect denial without fault authentication cannot open the fault view", {
  skip: process.platform === "win32",
}, async (context) => {
  const directory = mkdtempSync("/tmp/are-client-unauthorized-cli-");
  const socketPath = resolve(directory, "gateway.sock");
  const gateway = createServer((socket) => socket.once("data", () => socket.end(`${JSON.stringify({
    schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
    reason: "gateway.resume-authentication-required", authority_effect: "none",
  })}\n`)));
  await new Promise((resolveListen) => gateway.listen(socketPath, resolveListen));
  context.after(async () => {
    await new Promise((resolveClose) => gateway.close(resolveClose));
    rmSync(directory, {recursive: true, force: true});
  });
  const child = spawn(process.execPath, [resolve(import.meta.dirname, "../bin/are-codex-windows-client.mjs"),
    "--socket", socketPath, "--repository-root", directory, "--port", "0"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
  const [code] = await once(child, "exit");
  assert.equal(code, 1);
  const result = JSON.parse(stderr.trim());
  assert.equal(result.schema_version, "are.codex-windows-client-start-failure/v1");
  assert.equal(result.reason, "gateway.resume-authentication-required");
  assert.equal(Object.hasOwn(result, "fault_digest"), false);
  assert.equal(Object.hasOwn(result, "launch_url"), false);
});

test("a fault-shaped receipt without a client resume secret cannot open the fault view", {
  skip: process.platform === "win32",
}, async (context) => {
  const directory = mkdtempSync("/tmp/are-client-unbound-fault-cli-");
  const socketPath = resolve(directory, "gateway.sock");
  const gateway = createServer((socket) => socket.once("data", () => socket.end(`${JSON.stringify({
    schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.session-faulted",
    fault_digest: "c".repeat(64), fault_reason_code: "gateway.turn-history-status-conflict",
    authority_effect: "none",
  })}\n`)));
  await new Promise((resolveListen) => gateway.listen(socketPath, resolveListen));
  context.after(async () => {
    await new Promise((resolveClose) => gateway.close(resolveClose));
    rmSync(directory, {recursive: true, force: true});
  });
  const child = spawn(process.execPath, [resolve(import.meta.dirname, "../bin/are-codex-windows-client.mjs"),
    "--socket", socketPath, "--repository-root", directory, "--port", "0"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
  const [code] = await once(child, "exit");
  assert.equal(code, 1);
  const result = JSON.parse(stderr.trim());
  assert.equal(result.reason, "gateway.invalid-connect-receipt");
  assert.equal(Object.hasOwn(result, "fault_digest"), false);
  assert.equal(Object.hasOwn(result, "launch_url"), false);
});

test("an audit-quarantine receipt without a client resume secret cannot open a stop page", {
  skip: process.platform === "win32",
}, async (context) => {
  const directory = mkdtempSync("/tmp/are-client-unbound-audit-cli-");
  const socketPath = resolve(directory, "gateway.sock");
  const gateway = createServer((socket) => socket.once("data", () => socket.end(`${JSON.stringify({
    schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
    reason: "gateway.history-audit-incomplete", authority_effect: "none",
  })}\n`)));
  await new Promise((resolveListen) => gateway.listen(socketPath, resolveListen));
  context.after(async () => {
    await new Promise((resolveClose) => gateway.close(resolveClose));
    rmSync(directory, {recursive: true, force: true});
  });
  const child = spawn(process.execPath, [resolve(import.meta.dirname, "../bin/are-codex-windows-client.mjs"),
    "--socket", socketPath, "--repository-root", directory, "--port", "0"], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
  const [code] = await once(child, "exit");
  assert.equal(code, 1);
  const result = JSON.parse(stderr.trim());
  assert.equal(result.reason, "gateway.invalid-connect-receipt");
  assert.equal(Object.hasOwn(result, "launch_url"), false);
});
