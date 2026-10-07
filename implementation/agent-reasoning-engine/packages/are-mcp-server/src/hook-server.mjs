import {readFileSync, lstatSync} from "node:fs";
import {hostname} from "node:os";
import {createInterface} from "node:readline";

import {MAX_INPUT_BYTES} from "../../../src/decision-cli.mjs";
import {validateHostedHookConnectionPath} from "../../../src/hosted-hook-control.mjs";

const maxConnectionBytes = 4096;
const maxResponseBytes = 2 * 1024 * 1024;
const protocolVersion = "2025-06-18";
const connectionSchema = "are.hosted-hook-connection/v1";
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const deny = () => ({hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny",
  permissionDecisionReason: "ARE tool assessment unavailable on this hook transport."}});

function outputForFailure(event) {
  return event?.hook_event_name === "PreToolUse" ? deny()
    : {systemMessage: "ARE hook assessment unavailable on this hook transport."};
}

function result(output) {
  return {content: [{type: "text", text: JSON.stringify(output)}], structuredContent: output, isError: false};
}

function validatedOutput(event, decision) {
  if (decision?.ok !== true || !record(decision.stdout)) return outputForFailure(event);
  const output = decision.stdout;
  if (event.hook_event_name === "PreToolUse") {
    const specific = output.hookSpecificOutput;
    if (!["direct", "gate", "block"].includes(decision.kind) || !record(specific)
      || specific.hookEventName !== "PreToolUse"
      || typeof specific.additionalContext !== "string" || specific.additionalContext.length === 0
      || specific.updatedInput !== undefined || specific.permissionDecision === "allow"
      || (["gate", "block"].includes(decision.kind) && specific.permissionDecision !== "deny")
      || (decision.kind === "direct" && specific.permissionDecision !== undefined)) return deny();
  } else if (event.hook_event_name === "UserPromptSubmit") {
    const specific = output.hookSpecificOutput;
    if (!record(specific) || specific.hookEventName !== "UserPromptSubmit"
      || typeof specific.additionalContext !== "string" || specific.additionalContext.length === 0) {
      return outputForFailure(event);
    }
  } else if (event.hook_event_name === "Stop") {
    if (output.hookSpecificOutput !== undefined) return outputForFailure(event);
  }
  return output;
}

function connectionAt(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 2 || stat.size > maxConnectionBytes)
    throw new Error("mcp-hook.connection-invalid");
  if (process.platform !== "win32" && (stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0))
    throw new Error("mcp-hook.connection-owner-invalid");
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (value?.schema_version !== connectionSchema || typeof value.url !== "string"
    || !/^http:\/\/127\.0\.0\.1:\d+\/hook-events$/.test(value.url)
    || !/^[0-9a-f]{64}$/.test(value.token ?? "")
    || value.owner_process?.platform !== process.platform || value.owner_process?.hostname !== hostname()
    || !Number.isSafeInteger(value.owner_process?.pid) || value.owner_process.pid <= 0)
    throw new Error("mcp-hook.connection-invalid");
  process.kill(value.owner_process.pid, 0);
  return value;
}

async function observe(connectionPath, event, fetchImpl) {
  try {
    if (!record(event) || !["UserPromptSubmit", "PreToolUse", "Stop"].includes(event.hook_event_name)
      || Buffer.byteLength(JSON.stringify(event)) > MAX_INPUT_BYTES) return outputForFailure(event);
    const connection = connectionAt(connectionPath);
    const response = await fetchImpl(connection.url, {method: "POST", headers: {
      "Content-Type": "application/json", Authorization: `Bearer ${connection.token}`},
    body: JSON.stringify(event), signal: AbortSignal.timeout(8000)});
    if (!response.ok) return outputForFailure(event);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) return outputForFailure(event);
    const chunks = []; let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > maxResponseBytes) return outputForFailure(event);
      chunks.push(chunk);
    }
    const decision = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return validatedOutput(event, decision);
  } catch { return outputForFailure(event); }
}

export function createHookMcpServer({connection_path: connectionPath, fetch_impl: fetchImpl = fetch} = {}) {
  const path = validateHostedHookConnectionPath(connectionPath);
  if (typeof fetchImpl !== "function") throw new TypeError("mcp-hook.fetch-required");
  const tools = [{name: "are_hook_observe", title: "ARE hosted hook observation",
    description: "Relay one Codex lifecycle event to the owning ARE hosted controller. Does not grant tool permission.",
    inputSchema: {type: "object", properties: {event: {type: "object"}}, required: ["event"], additionalProperties: false},
    annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false}}];
  const callTool = async (name, args = {}) => {
    if (name !== "are_hook_observe") return {content: [{type: "text", text: "Unknown tool"}], isError: true};
    if (!record(args) || Object.keys(args).some(key => key !== "event")) return result(outputForFailure(args?.event));
    return result(await observe(path, args.event, fetchImpl));
  };
  const handle = async message => {
    if (!record(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string")
      return {jsonrpc: "2.0", id: message?.id ?? null, error: {code: -32600, message: "Invalid Request"}};
    if (message.id === undefined) return null;
    if (message.method === "initialize") return {jsonrpc: "2.0", id: message.id, result: {
      protocolVersion, capabilities: {tools: {listChanged: false}},
      serverInfo: {name: "are-hosted-hook", version: "0.1.0-candidate"}}};
    if (message.method === "ping") return {jsonrpc: "2.0", id: message.id, result: {}};
    if (message.method === "tools/list") return {jsonrpc: "2.0", id: message.id, result: {tools}};
    if (message.method === "tools/call") return {jsonrpc: "2.0", id: message.id,
      result: await callTool(message.params?.name, message.params?.arguments ?? {})};
    return {jsonrpc: "2.0", id: message.id, error: {code: -32601, message: "Method not found"}};
  };
  return Object.freeze({handle, callTool, tools});
}

export async function runHookMcpStdio({connection_path: connectionPath, input = process.stdin,
  output = process.stdout} = {}) {
  const server = createHookMcpServer({connection_path: connectionPath});
  for await (const line of createInterface({input, crlfDelay: Infinity})) {
    if (Buffer.byteLength(line) > MAX_INPUT_BYTES) {
      output.write(`${JSON.stringify({jsonrpc: "2.0", id: null, error: {code: -32700, message: "Message too large"}})}\n`);
      continue;
    }
    let message;
    try { message = JSON.parse(line); }
    catch {
      output.write(`${JSON.stringify({jsonrpc: "2.0", id: null, error: {code: -32700, message: "Parse error"}})}\n`);
      continue;
    }
    const reply = await server.handle(message);
    if (reply) output.write(`${JSON.stringify(reply)}\n`);
  }
}
