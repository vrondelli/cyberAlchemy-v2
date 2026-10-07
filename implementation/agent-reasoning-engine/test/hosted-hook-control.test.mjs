import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {EventEmitter} from "node:events";
import {chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {hostname, tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {reclaimTerminatedHostedHookConnection, startHostedHookControl} from "../src/hosted-hook-control.mjs";

const runner = resolve(import.meta.dirname, "../bin/are-hook-callback.mjs");
const checkout = resolve(import.meta.dirname, "../../..");
const event = (name, thread = "hosted-thread", turn = "hosted-turn") => ({hook_event_name: name,
  session_id: thread, turn_id: turn, cwd: checkout,
  ...(name === "PreToolUse" ? {tool_name: "exec_command", tool_use_id: "tool-1",
    tool_input: {cmd: "printf fixture"}} : {prompt: "Explain the repository routing architecture"})});

function rpcFixture() {
  const events = new EventEmitter();
  let failed = false;
  return {events, inspect: () => ({closed: false, failure: failed ? "connection lost" : null,
    transport: {connected: !failed, failed}}), fail: () => { failed = true; events.emit("failure", new Error("connection lost")); }};
}

async function invoke(path, body) {
  const child = spawn(process.execPath, [runner, path, "--fail-closed-tools"], {stdio: ["pipe", "pipe", "pipe"]});
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.stdin.end(JSON.stringify(body));
  const exitCode = await new Promise((done, reject) => { child.once("error", reject); child.once("exit", done); });
  return {exitCode, stdout, stderr};
}

test("hosted client publishes one private callback binding and removes only its own file", async t => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hosted-hooks-"));
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const path = resolve(directory, "callback.json");
  const rpc = rpcFixture();
  const control = await startHostedHookControl({rpc_client: rpc, connection_path: path,
    owns_session: sessionId => sessionId === "hosted-thread"});
  t.after(() => control.close());
  assert.equal(existsSync(path), true);
  const connection = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(connection.schema_version, "are.hosted-hook-connection/v1");
  assert.equal(connection.owner_process.pid, process.pid);
  assert.match(connection.token, /^[0-9a-f]{64}$/);
  assert.match(connection.url, /^http:\/\/127\.0\.0\.1:\d+\/hook-events$/);
  const prompt = await invoke(path, event("UserPromptSubmit"));
  assert.equal(prompt.exitCode, 0, prompt.stderr);
  assert.match(JSON.parse(prompt.stdout).hookSpecificOutput.additionalContext, /ARE/);
  assert.equal(control.inspect().retained_turns, 1);
  const foreign = await invoke(path, event("PreToolUse", "other-thread"));
  assert.equal(foreign.exitCode, 2);
  assert.equal(foreign.stdout, "");
  const tool = await invoke(path, event("PreToolUse"));
  assert.equal(tool.exitCode, 0, tool.stderr);
  assert.equal(JSON.parse(tool.stdout).hookSpecificOutput.permissionDecision, "deny");
  rpc.events.emit("notification", {method: "turn/completed", params: {threadId: "hosted-thread",
    turn: {id: "hosted-turn", status: "completed"}}});
  assert.equal(control.inspect().retained_turns, 1);
  await control.close();
  assert.equal(existsSync(path), false);
  assert.equal(rpc.events.listenerCount("notification"), 0);
  assert.equal(rpc.events.listenerCount("failure"), 0);
});

test("a terminated hosted client leaves a reclaimable exact callback binding", async t => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hosted-hooks-crash-"));
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const path = resolve(directory, "callback.json");
  const source = pathToFileURL(resolve(import.meta.dirname, "../src/hosted-hook-control.mjs")).href;
  const child = spawn(process.execPath, ["--input-type=module", "-e", `
    import {EventEmitter} from "node:events";
    import {startHostedHookControl} from ${JSON.stringify(source)};
    const events = new EventEmitter();
    await startHostedHookControl({rpc_client: {events, inspect: () => ({closed: false,
      transport: {connected: true}})}, connection_path: process.argv[1], owns_session: () => true});
    process.stdout.write("ready\\n");
    setInterval(() => {}, 1000);
  `, path], {stdio: ["ignore", "pipe", "pipe"]});
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); });
  await new Promise((resolveReady, rejectReady) => {
    const timer = setTimeout(() => rejectReady(new Error("hosted-hooks.child-start-timeout")), 5000);
    child.stdout.once("data", chunk => {
      clearTimeout(timer);
      if (String(chunk).includes("ready")) resolveReady();
      else rejectReady(new Error("hosted-hooks.child-start-invalid"));
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      rejectReady(new Error(`hosted-hooks.child-exited:${signal ?? code}`));
    });
  });
  const before = readFileSync(path, "utf8");
  await assert.rejects(startHostedHookControl({rpc_client: rpcFixture(), connection_path: path,
    owns_session: () => true}), /EEXIST/, "A live callback owner must not be replaced.");
  assert.equal(readFileSync(path, "utf8"), before);
  const exited = new Promise(resolveExit => child.once("exit", resolveExit));
  child.kill("SIGKILL");
  await exited;
  const control = await startHostedHookControl({rpc_client: rpcFixture(), connection_path: path,
    owns_session: () => true});
  t.after(() => control.close());
  assert.notEqual(readFileSync(path, "utf8"), before);
  assert.equal(JSON.parse(readFileSync(path, "utf8")).owner_process.pid, process.pid);
  await control.close();
  assert.equal(existsSync(path), false);
});

test("manager cleanup reclaims only an unchanged dead-owner hook binding", t => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hosted-hooks-managed-cleanup-"));
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const path = resolve(directory, "callback.json");
  const connection = ownerPid => `${JSON.stringify({schema_version: "are.hosted-hook-connection/v1",
    url: "http://127.0.0.1:39999/hook-events", token: "a".repeat(64),
    owner_process: {platform: process.platform, hostname: hostname(), pid: ownerPid}})}\n`;
  writeFileSync(path, connection(process.pid));
  assert.equal(reclaimTerminatedHostedHookConnection(path), false, "a live owner must be preserved");
  assert.equal(readFileSync(path, "utf8"), connection(process.pid));
  writeFileSync(path, connection(2147483647));
  assert.equal(reclaimTerminatedHostedHookConnection(path), true, "a dead exact owner may be reclaimed");
  assert.equal(existsSync(path), false);
  writeFileSync(path, "unrelated-file\n");
  assert.equal(reclaimTerminatedHostedHookConnection(path), false, "an unrelated file must be preserved");
  assert.equal(readFileSync(path, "utf8"), "unrelated-file\n");
});

test("gateway loss fails a supported tool callback closed without a second RPC writer", async t => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hosted-hooks-loss-"));
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const path = resolve(directory, "callback.json");
  const rpc = rpcFixture();
  const control = await startHostedHookControl({rpc_client: rpc, connection_path: path,
    owns_session: sessionId => sessionId === "hosted-thread"});
  t.after(() => control.close());
  assert.equal((await invoke(path, event("UserPromptSubmit"))).exitCode, 0);
  rpc.fail();
  assert.equal(control.inspect().live, false);
  const result = await invoke(path, event("PreToolUse"));
  assert.equal(result.exitCode, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /ARE tool assessment unavailable/);
  assert.doesNotMatch(result.stderr, /connection lost/);
});

test("existing callback files are never replaced and unsafe parent directories are rejected", async t => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hosted-hooks-exclusive-"));
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const path = resolve(directory, "callback.json");
  writeFileSync(path, "user-owned\n");
  const rpc = rpcFixture();
  await assert.rejects(startHostedHookControl({rpc_client: rpc, connection_path: path,
    owns_session: () => true}), /EEXIST/);
  assert.equal(readFileSync(path, "utf8"), "user-owned\n");
  assert.equal(rpc.events.listenerCount("notification"), 0);
  const legacyPath = resolve(directory, "legacy-callback.json");
  const legacyBytes = `${JSON.stringify({url: "http://127.0.0.1:39999/hook-events", token: "a".repeat(64)})}\n`;
  writeFileSync(legacyPath, legacyBytes);
  await assert.rejects(startHostedHookControl({rpc_client: rpc, connection_path: legacyPath,
    owns_session: () => true}), /EEXIST/, "An untagged legacy endpoint cannot be reclaimed automatically.");
  assert.equal(readFileSync(legacyPath, "utf8"), legacyBytes);
  const foreignHostPath = resolve(directory, "foreign-host-callback.json");
  const foreignHostBytes = `${JSON.stringify({schema_version: "are.hosted-hook-connection/v1",
    url: "http://127.0.0.1:39999/hook-events", token: "b".repeat(64),
    owner_process: {platform: process.platform, hostname: "definitely-not-this-host", pid: 999999999}})}\n`;
  writeFileSync(foreignHostPath, foreignHostBytes);
  await assert.rejects(startHostedHookControl({rpc_client: rpc, connection_path: foreignHostPath,
    owns_session: () => true}), /EEXIST/, "Another host's file cannot be reclaimed.");
  assert.equal(readFileSync(foreignHostPath, "utf8"), foreignHostBytes);
  if (process.platform !== "win32") {
    const unsafeParent = resolve(directory, "public-parent");
    mkdirSync(unsafeParent);
    chmodSync(unsafeParent, 0o755);
    await assert.rejects(startHostedHookControl({rpc_client: rpc, connection_path: resolve(unsafeParent, "callback.json"),
      owns_session: () => true}),
      /hosted-hooks.connection-parent-unsafe/);
  }
});
