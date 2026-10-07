import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {once} from "node:events";
import {existsSync, mkdtempSync, readFileSync, rmSync} from "node:fs";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {GATEWAY_CONNECTED_SCHEMA, GATEWAY_DELIVERY_SCHEMA} from "../packages/codex-app-server-wrapper/src/gateway.mjs";

const client = resolve(import.meta.dirname, "../packages/codex-app-server-wrapper/bin/are-codex-windows-client.mjs");
const runner = resolve(import.meta.dirname, "../bin/are-hook-callback.mjs");
const checkout = resolve(import.meta.dirname, "../../..");

async function invokeHook(connectionPath, event) {
  const hook = spawn(process.execPath, [runner, connectionPath, "--fail-closed-tools"], {stdio: ["pipe", "pipe", "pipe"]});
  let output = "", error = "";
  hook.stdout.on("data", chunk => { output += chunk; });
  hook.stderr.on("data", chunk => { error += chunk; });
  hook.stdin.end(JSON.stringify(event));
  const [status] = await once(hook, "exit");
  return {status, output, error};
}

test("hosted client opt-in recovers its private callback after hard termination", async t => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hosted-hooks-cli-"));
  const socketPath = process.platform === "win32"
    ? `\\\\.\\pipe\\are-hosted-hooks-cli-${process.pid}-${randomUUID()}` : resolve(directory, "gateway.sock");
  const connectionPath = resolve(directory, "callback.json");
  const received = [];
  let connectedSocket = null, sequence = 0;
  const server = createServer(socket => {
    connectedSocket = socket;
    let buffer = "", handshaken = false;
    socket.on("data", chunk => {
      buffer += chunk.toString("utf8");
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
        if (!line) continue;
        const message = JSON.parse(line);
        if (!handshaken) {
          handshaken = true;
          sequence = 0;
          assert.equal(message.consumer_id, "codex:human-chat");
          socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
            consumer_id: "codex:human-chat", lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
            resumed: false, continuity: {resume_token: "fixture-resume-token", acknowledged_through: 0},
            authority_effect: "none"})}\n`);
          continue;
        }
        if (message.schema_version) continue;
        received.push(message.method);
        if (["initialize", "cyberalchemy/learning/status", "thread/start"].includes(message.method)) {
          socket.write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA, sequence: ++sequence,
            message: {jsonrpc: "2.0", id: message.id,
              result: message.method === "initialize" ? {platformFamily: process.platform === "win32" ? "windows" : "unix", userAgent: "fixture"}
                : message.method === "thread/start" ? {thread: {id: "hosted-thread-1"}, instructionSources: []}
                  : {available: false}}})}\n`);
        }
      }
    });
  });
  await new Promise(done => server.listen(socketPath, done));
  const startClient = () => spawn(process.execPath, [client, "--socket", socketPath, "--repository-root", checkout,
    "--hook-connection-file", connectionPath, "--port", "0", "--token", "fixture-token"],
  {stdio: ["ignore", "ignore", "pipe"]});
  let processHandle = startClient();
  t.after(async () => {
    if (processHandle.exitCode === null && processHandle.signalCode === null) {
      processHandle.kill("SIGTERM");
      await once(processHandle, "exit");
    }
    connectedSocket?.destroy();
    await new Promise(done => server.close(done));
    rmSync(directory, {recursive: true, force: true});
  });
  const readReady = processHandle => new Promise((done, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error(`Hosted client startup timed out: ${buffer}`)), 5000);
    processHandle.once("exit", code => { clearTimeout(timer); reject(new Error(`Hosted client exited early: ${code}; ${buffer}`)); });
    processHandle.stderr.on("data", chunk => {
      buffer += chunk.toString("utf8");
      const end = buffer.indexOf("\n");
      if (end < 0) return;
      clearTimeout(timer);
      try { done(JSON.parse(buffer.slice(0, end))); } catch (error) { reject(error); }
    });
  });
  const ready = await readReady(processHandle);
  assert.equal(ready.schema_version, "are.codex-windows-client-ready/v1");
  assert.equal(existsSync(connectionPath), true);
  const unowned = await invokeHook(connectionPath, {hook_event_name: "PreToolUse", session_id: "unknown-thread", turn_id: "unknown-turn",
    cwd: checkout, tool_name: "exec_command", tool_use_id: "tool-1", tool_input: {cmd: "printf fixture"}});
  assert.equal(unowned.status, 2);
  assert.equal(unowned.output, "");
  assert.match(unowned.error, /ARE tool assessment unavailable/);
  const created = await fetch(`${ready.url}api/threads`, {method: "POST", headers: {authorization: "Bearer fixture-token", "content-type": "application/json"},
    body: JSON.stringify({cwd: checkout, requestKey: "thread:hosted-hook-cli"})});
  assert.equal(created.status, 201);
  assert.equal((await created.json()).value.thread.id, "hosted-thread-1");
  const prompt = await invokeHook(connectionPath, {hook_event_name: "UserPromptSubmit", session_id: "hosted-thread-1",
    turn_id: "hosted-turn-1", cwd: checkout, prompt: "Explain the repository routing architecture"});
  assert.equal(prompt.status, 0, prompt.error);
  assert.equal(typeof JSON.parse(prompt.output).hookSpecificOutput.additionalContext, "string");
  const tool = await invokeHook(connectionPath, {hook_event_name: "PreToolUse", session_id: "hosted-thread-1",
    turn_id: "hosted-turn-1", cwd: checkout, tool_name: "exec_command", tool_use_id: "tool-2",
    tool_input: {cmd: "printf '%s' ARE_NATIVE_TOOL_ OK"}});
  assert.equal(tool.status, 0, tool.error);
  assert.equal(JSON.parse(tool.output).hookSpecificOutput.permissionDecision, "deny");
  assert.deepEqual(received.filter(method => method === "initialize"), ["initialize"]);
  assert.deepEqual(received.filter(method => method === "thread/start"), ["thread/start"]);
  assert.equal(received.filter(method => method === "turn/start").length, 0);
  const originalBinding = readFileSync(connectionPath, "utf8");
  const crashed = new Promise(resolveExit => processHandle.once("exit", resolveExit));
  processHandle.kill("SIGKILL");
  await crashed;
  assert.equal(existsSync(connectionPath), true, "A hard crash leaves the exact private file for guarded recovery.");
  processHandle = startClient();
  const restarted = await readReady(processHandle);
  assert.equal(restarted.schema_version, "are.codex-windows-client-ready/v1");
  assert.notEqual(readFileSync(connectionPath, "utf8"), originalBinding);
  assert.equal(JSON.parse(readFileSync(connectionPath, "utf8")).owner_process.pid, processHandle.pid);
  const afterRestart = await invokeHook(connectionPath, {hook_event_name: "PreToolUse",
    session_id: "unknown-thread", turn_id: "unknown-turn", cwd: checkout,
    tool_name: "exec_command", tool_use_id: "tool-restart", tool_input: {cmd: "printf fixture"}});
  assert.equal(afterRestart.status, 2);
  const restartedThread = await fetch(`${restarted.url}api/threads`, {method: "POST",
    headers: {authorization: "Bearer fixture-token", "content-type": "application/json"},
    body: JSON.stringify({cwd: checkout, requestKey: "thread:hosted-hook-cli-restart"})});
  assert.equal(restartedThread.status, 201);
  assert.equal((await restartedThread.json()).value.thread.id, "hosted-thread-1");
  const restartedPrompt = await invokeHook(connectionPath, {hook_event_name: "UserPromptSubmit",
    session_id: "hosted-thread-1", turn_id: "hosted-turn-2", cwd: checkout,
    prompt: "Explain the repository routing architecture"});
  assert.equal(restartedPrompt.status, 0, restartedPrompt.error);
  const restartedTool = await invokeHook(connectionPath, {hook_event_name: "PreToolUse",
    session_id: "hosted-thread-1", turn_id: "hosted-turn-2", cwd: checkout,
    tool_name: "exec_command", tool_use_id: "tool-restart-owned", tool_input: {cmd: "printf fixture"}});
  assert.equal(restartedTool.status, 0, restartedTool.error);
  assert.equal(JSON.parse(restartedTool.output).hookSpecificOutput.permissionDecision, "deny");
  assert.deepEqual(received.filter(method => method === "initialize"), ["initialize", "initialize"]);
  assert.deepEqual(received.filter(method => method === "thread/start"), ["thread/start", "thread/start"]);
  processHandle.kill("SIGTERM");
  const [exitCode, signalCode] = await once(processHandle, "exit");
  if (process.platform === "win32") {
    assert.equal(signalCode, "SIGTERM", "Windows child termination does not run the Node cleanup handler.");
    assert.equal(existsSync(connectionPath), true, "The next start must reclaim this terminated client's binding.");
  } else {
    assert.equal(exitCode, 0);
    assert.equal(existsSync(connectionPath), false);
  }
});
