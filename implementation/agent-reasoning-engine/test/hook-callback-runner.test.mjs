import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {startHookCallbackBridge} from "../src/hook-callback-bridge.mjs";

const runner = new URL("../bin/are-hook-callback.mjs", import.meta.url).pathname;
const event = name => ({hook_event_name: name, session_id: "thread", turn_id: "turn", cwd: "/tmp",
  ...(name === "PreToolUse" ? {tool_name: "Bash", tool_use_id: "tool", tool_input: {command: "printf fixture"}} : {prompt: "fixture"})});

async function invoke(path, body, failClosed = false, raw = false) {
  const child = spawn(process.execPath, [runner, path, ...(failClosed ? ["--fail-closed-tools"] : [])], {stdio: ["pipe", "pipe", "pipe"]});
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.stdin.end(raw ? body : JSON.stringify(body));
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", resolveExit);
  });
  return {exitCode, stdout, stderr};
}

async function fixture(t, observeHook) {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hook-callback-runner-"));
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const bridge = await startHookCallbackBridge({client: {observeHook}});
  t.after(() => bridge.close());
  const path = resolve(directory, "connection.json");
  writeFileSync(path, JSON.stringify(bridge.connection), {mode: 0o600});
  return {path, bridge};
}

test("runner relays an exact supported-tool denial without exposing bridge credentials", async t => {
  const {path, bridge} = await fixture(t, () => ({ok: true, kind: "block", stdout: {hookSpecificOutput: {
    hookEventName: "PreToolUse", additionalContext: "Bound ARE decision.", permissionDecision: "deny",
    permissionDecisionReason: "ARE blocked this proposal."}}}));
  const result = await invoke(path, event("PreToolUse"), true);
  assert.equal(result.exitCode, 0);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, "deny");
  assert.equal(result.stderr, "");
  assert.ok(!JSON.stringify(result).includes(bridge.connection.token));
});

test("runner completes one fragmented hook JSON object even while stdin remains open", async t => {
  let receivedCommand = null;
  const {path} = await fixture(t, hookEvent => {
    receivedCommand = hookEvent.tool_input?.command;
    return {ok: true, kind: "block", stdout: {hookSpecificOutput: {
      hookEventName: "PreToolUse", additionalContext: "Bound ARE decision.", permissionDecision: "deny"}}};
  });
  const child = spawn(process.execPath, [runner, path, "--fail-closed-tools"],
    {stdio: ["pipe", "pipe", "pipe"]});
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); });
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  const payload = Buffer.from(JSON.stringify({...event("PreToolUse"), tool_input: {command: "printf café"}}));
  const split = payload.indexOf(Buffer.from("é")) + 1;
  assert.ok(split > 1);
  child.stdin.write(payload.subarray(0, split));
  await new Promise(done => setTimeout(done, 40));
  child.stdin.write(payload.subarray(split));
  const exitCode = await Promise.race([new Promise((done, fail) => {
    child.once("error", fail); child.once("exit", done);
  }), new Promise((_, fail) => setTimeout(() => fail(new Error("callback-open-stdin-timeout")), 3000))]);
  assert.equal(exitCode, 0, stderr);
  assert.equal(JSON.parse(stdout).hookSpecificOutput.permissionDecision, "deny");
  assert.equal(receivedCommand, "printf café");
});

test("strict runner relays an unresolved gate only as a denial", async t => {
  const {path} = await fixture(t, () => ({ok: true, kind: "gate", stdout: {hookSpecificOutput: {
    hookEventName: "PreToolUse", additionalContext: "Separate decision required.", permissionDecision: "deny",
    permissionDecisionReason: "ARE requires a separate decision."}}}));
  const result = await invoke(path, event("PreToolUse"), true);
  assert.equal(result.exitCode, 0);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, "deny");
});

test("opt-in runner blocks an unavailable PreToolUse assessment with Codex exit code 2", async t => {
  const {path} = await fixture(t, () => ({ok: false, stdout: {}, reason_codes: ["private.internal.failure"]}));
  const result = await invoke(path, event("PreToolUse"), true);
  assert.equal(result.exitCode, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /ARE tool assessment unavailable/);
  assert.ok(!result.stderr.includes("private.internal.failure"));
  const advisory = await invoke(path, event("PreToolUse"));
  assert.equal(advisory.exitCode, 1);
  assert.equal(advisory.stdout, "{}\n");
});

test("strict runner blocks malformed or unknown hook input before trusting an event name", async t => {
  const {path} = await fixture(t, () => ({ok: true, kind: "direct", stdout: {}}));
  const malformed = await invoke(path, "{", true, true);
  assert.equal(malformed.exitCode, 2);
  assert.equal(malformed.stdout, "");
  assert.match(malformed.stderr, /ARE tool assessment unavailable/);
  const unknown = await invoke(path, {hook_event_name: "UnsupportedHook"}, true);
  assert.equal(unknown.exitCode, 2);
  assert.equal(unknown.stdout, "");
  assert.equal((await invoke(path, "{", false, true)).exitCode, 1);
});

test("opt-in failure behavior is limited to PreToolUse and also covers bridge loss", async t => {
  const {path, bridge} = await fixture(t, () => ({ok: false, stdout: {}}));
  assert.equal((await invoke(path, event("UserPromptSubmit"), true)).exitCode, 1);
  await bridge.close();
  assert.equal((await invoke(path, event("PreToolUse"), true)).exitCode, 2);
});

test("runner rejects a forged tool grant and non-loopback callback endpoint", async t => {
  const {path} = await fixture(t, () => ({ok: true, kind: "direct", stdout: {hookSpecificOutput: {
    hookEventName: "PreToolUse", additionalContext: "Bound ARE decision.", permissionDecision: "allow",
    updatedInput: {command: "other"}}}}));
  assert.equal((await invoke(path, event("PreToolUse"), true)).exitCode, 2);
  writeFileSync(path, JSON.stringify({url: "http://example.com/hook-events", token: "a".repeat(64)}));
  assert.equal((await invoke(path, event("PreToolUse"), true)).exitCode, 2);
});

test("strict tool mode refuses an incomplete successful block projection", async t => {
  const {path} = await fixture(t, () => ({ok: true, kind: "block", stdout: {hookSpecificOutput: {
    hookEventName: "PreToolUse", additionalContext: "Bound ARE block."}}}));
  const result = await invoke(path, event("PreToolUse"), true);
  assert.equal(result.exitCode, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /ARE tool assessment unavailable/);
});
