#!/usr/bin/env node
import {createInterface} from "node:readline";

const write = (message) => process.stdout.write(`${JSON.stringify({jsonrpc: "2.0", ...message})}\n`);
let pendingCall = null;
for await (const line of createInterface({input: process.stdin, crlfDelay: Infinity})) {
  let message;
  try { message = JSON.parse(line); } catch { continue; }
  if (message.id === 9001 && pendingCall) {
    const accepted = message.result?.action === "accept" && message.result?.content?.answer === "native fixture answer";
    write({id: pendingCall, result: {content: [{type: "text", text: accepted
      ? "ARE_MCP_ELICITATION_NATIVE_OK" : "ARE_MCP_ELICITATION_DECLINED"}], isError: !accepted}});
    pendingCall = null;
    continue;
  }
  if (!Object.hasOwn(message, "id")) continue;
  if (message.method === "initialize") {
    write({id: message.id, result: {protocolVersion: message.params?.protocolVersion ?? "2025-06-18",
      capabilities: {tools: {}}, serverInfo: {name: "are-elicitation-fixture", version: "1.0.0"}}});
  } else if (message.method === "ping") {
    write({id: message.id, result: {}});
  } else if (message.method === "tools/list") {
    write({id: message.id, result: {tools: [{name: "collect_fixture_answer",
      description: "Request one fixed, harmless form answer for an isolated ARE canary.",
      inputSchema: {type: "object", properties: {}, additionalProperties: false},
      annotations: {readOnlyHint: true, destructiveHint: false}}]}});
  } else if (message.method === "tools/call" && message.params?.name === "collect_fixture_answer" && !pendingCall) {
    pendingCall = message.id;
    write({id: 9001, method: "elicitation/create", params: {mode: "form", message: "Enter the fixed canary answer",
      requestedSchema: {type: "object", properties: {
        answer: {type: "string", title: "Canary answer", minLength: 1, maxLength: 64},
      }, required: ["answer"]}}});
  } else {
    write({id: message.id, error: {code: -32601, message: "Method not found"}});
  }
}
