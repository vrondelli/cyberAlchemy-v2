#!/usr/bin/env node
// Disposable MCP endpoint for the native PreToolUse transport canary.
import {appendFileSync} from "node:fs";
import {createInterface} from "node:readline";

const [mode, log] = process.argv.slice(2);
if (!["deny", "deny-text-only", "deny-structured-only", "missing-tool", "allow-stdin", "restricted-catalog", "restricted-reject-shell", "restricted-reject-effects", "restricted-view-image-deny", "restricted-view-image-deny-all", "restricted-view-image-missing-tool"].includes(mode) || !log) process.exit(2);
const send = (message) => process.stdout.write(`${JSON.stringify({jsonrpc: "2.0", ...message})}\n`);
const deny = {hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny",
  permissionDecisionReason: "Disposable ARE MCP hook transport canary."}};

for await (const line of createInterface({input: process.stdin, crlfDelay: Infinity})) {
  let message;
  try { message = JSON.parse(line); } catch { continue; }
  if (!Object.hasOwn(message, "id")) continue;
  if (message.method === "initialize") {
    send({id: message.id, result: {protocolVersion: message.params?.protocolVersion ?? "2025-06-18",
      capabilities: {tools: {}}, serverInfo: {name: "are-mcp-hook-transport-fixture", version: "1.0.0"}}});
  } else if (message.method === "ping") {
    send({id: message.id, result: {}});
  } else if (message.method === "tools/list") {
    send({id: message.id, result: {tools: mode === "missing-tool" || mode === "restricted-view-image-missing-tool" ? [] : [{name: "intercept_fixture_tool",
      description: "Deny one harmless tool call in an isolated native-host canary.",
      inputSchema: {type: "object", properties: {event: {type: "object"}}, required: ["event"], additionalProperties: false},
      annotations: {readOnlyHint: true, destructiveHint: false}}]}});
  } else if (message.method === "tools/call" && message.params?.name === "intercept_fixture_tool"
    && (mode.startsWith("deny") || mode === "allow-stdin"
      || (mode.startsWith("restricted-") && mode !== "restricted-view-image-missing-tool"))) {
    const event = message.params.arguments?.event;
    appendFileSync(log, `${JSON.stringify(message.params.arguments)}\n`);
    const output = event?.hook_event_name === "PreToolUse" ? mode === "allow-stdin" ? {} : deny
      : event?.hook_event_name === "UserPromptSubmit"
        ? {hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: "ARE_MCP_PROMPT_OBSERVED"}}
        : {};
    const structuredOnly = event?.hook_event_name === "PreToolUse" && mode === "deny-structured-only";
    send({id: message.id, result: {
      content: structuredOnly ? [] : [{type: "text", text: JSON.stringify(output)}],
      ...(event?.hook_event_name === "PreToolUse" && mode === "deny-text-only" ? {} : {structuredContent: output}),
      isError: false}});
  } else {
    send({id: message.id, error: {code: -32601, message: "Method not found"}});
  }
}
