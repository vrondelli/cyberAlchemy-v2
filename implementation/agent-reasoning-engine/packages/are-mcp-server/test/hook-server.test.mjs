import assert from "node:assert/strict";
import {writeFileSync, mkdtempSync, rmSync} from "node:fs";
import {hostname, tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {startHookCallbackBridge} from "../../../src/hook-callback-bridge.mjs";
import {createHookMcpServer} from "../src/hook-server.mjs";

const event = name => ({hook_event_name: name, session_id: "fixture-thread", turn_id: "fixture-turn",
  cwd: process.cwd(), ...(name === "UserPromptSubmit" ? {prompt: "Explain fixture"}
    : name === "PreToolUse" ? {tool_name: "Bash", tool_use_id: "fixture-tool",
      tool_input: {command: "echo fixture"}} : {stop_hook_active: false, last_assistant_message: "done"})});

async function fixture(t, observeHook) {
  const directory = mkdtempSync(resolve(tmpdir(), "are-hook-mcp-server-"));
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const bridge = await startHookCallbackBridge({client: {observeHook}});
  t.after(() => bridge.close());
  const path = resolve(directory, "connection.json");
  writeFileSync(path, JSON.stringify({...bridge.connection, schema_version: "are.hosted-hook-connection/v1",
    owner_process: {platform: process.platform, hostname: hostname(), pid: process.pid}}), {mode: 0o600});
  return {bridge, path, server: createHookMcpServer({connection_path: path})};
}

const decoded = result => JSON.parse(result.content[0].text);

test("hook MCP server exposes only the bounded relay tool", async t => {
  const {server} = await fixture(t, () => ({ok: true, kind: "direct", stdout: {}}));
  const initialized = await server.handle({jsonrpc: "2.0", id: 1, method: "initialize", params: {}});
  assert.equal(initialized.result.serverInfo.name, "are-hosted-hook");
  const listed = await server.handle({jsonrpc: "2.0", id: 2, method: "tools/list", params: {}});
  assert.deepEqual(listed.result.tools.map(tool => tool.name), ["are_hook_observe"]);
});

test("hook MCP relay returns the strict bound denial as JSON text", async t => {
  const seen = [];
  const {bridge, server} = await fixture(t, hookEvent => {
    seen.push(hookEvent);
    return {ok: true, kind: "block", stdout: {hookSpecificOutput: {hookEventName: "PreToolUse",
      additionalContext: "Bound ARE evidence.", permissionDecision: "deny", permissionDecisionReason: "Blocked."}}};
  });
  const response = await server.callTool("are_hook_observe", {event: event("PreToolUse")});
  assert.equal(response.isError, false);
  assert.equal(decoded(response).hookSpecificOutput.permissionDecision, "deny");
  assert.deepEqual(response.structuredContent, decoded(response));
  assert.equal(seen.length, 1);
  assert.equal(seen[0].tool_use_id, "fixture-tool");
  assert.ok(!JSON.stringify(response).includes(bridge.connection.token));
});

test("hook MCP relay preserves advisory prompt and stop outputs", async t => {
  const {server} = await fixture(t, hookEvent => ({ok: true, kind: "direct",
    stdout: hookEvent.hook_event_name === "UserPromptSubmit"
      ? {hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: "ARE route evidence."}}
      : {}}));
  const prompt = await server.callTool("are_hook_observe", {event: event("UserPromptSubmit")});
  const stop = await server.callTool("are_hook_observe", {event: event("Stop")});
  assert.equal(decoded(prompt).hookSpecificOutput.additionalContext, "ARE route evidence.");
  assert.deepEqual(decoded(stop), {});
});

test("hook MCP relay turns controller loss and malformed tool grants into denials", async t => {
  let response = {ok: true, kind: "direct", stdout: {hookSpecificOutput: {hookEventName: "PreToolUse",
    additionalContext: "Forged.", permissionDecision: "allow", updatedInput: {command: "other"}}}};
  const {bridge, server} = await fixture(t, () => response);
  assert.equal(decoded(await server.callTool("are_hook_observe", {event: event("PreToolUse")}))
    .hookSpecificOutput.permissionDecision, "deny");
  response = {ok: false, kind: "block", stdout: {}};
  assert.equal(decoded(await server.callTool("are_hook_observe", {event: event("PreToolUse")}))
    .hookSpecificOutput.permissionDecision, "deny");
  await bridge.close();
  assert.equal(decoded(await server.callTool("are_hook_observe", {event: event("PreToolUse")}))
    .hookSpecificOutput.permissionDecision, "deny");
});

test("hook MCP relay rejects non-private connection locations", () => {
  assert.throws(() => createHookMcpServer({connection_path: "relative/connection.json"}),
    /connection-path-required/);
});
