#!/usr/bin/env node
import {readFileSync, statSync} from "node:fs";
import {isAbsolute} from "node:path";

import {MAX_INPUT_BYTES} from "../src/decision-cli.mjs";

const MAX_CONNECTION_BYTES = 4096;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const BLOCK_REASON = "ARE tool assessment unavailable; this supported tool call is blocked.";
const validRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const [connectionPath, mode, ...extra] = process.argv.slice(2);
const failClosedTools = mode === "--fail-closed-tools";
let eventName = null;

function fail() {
  // A strict invocation may be the only guard for a supported tool call.
  // If its input is malformed, the event name cannot be trusted to distinguish
  // a tool from an advisory prompt/Stop event. Deny that unknown case too.
  if (failClosedTools && !["UserPromptSubmit", "Stop"].includes(eventName)) {
    process.stderr.write(`${BLOCK_REASON}\n`);
    process.exitCode = 2;
  } else {
    process.stdout.write("{}\n");
    process.stderr.write("ARE hook callback unavailable.\n");
    process.exitCode = 1;
  }
}

try {
  const chunks = [];
  let raw = "";
  let event = null;
  let bytes = 0;
  const inputTimeout = setTimeout(() => process.stdin.destroy(new Error("callback.input-timeout")), 10000);
  try {
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > MAX_INPUT_BYTES) throw new Error("callback.input-too-large");
      chunks.push(chunk);
      raw = Buffer.concat(chunks).toString("utf8");
      try { event = JSON.parse(raw); break; }
      catch (error) { if (!(error instanceof SyntaxError)) throw error; }
    }
  } finally {
    clearTimeout(inputTimeout);
  }
  if (event === null) throw new Error("callback.input-incomplete");
  if (!validRecord(event) || typeof event.hook_event_name !== "string") throw new Error("callback.event-invalid");
  eventName = event.hook_event_name;
  if (typeof connectionPath !== "string" || !isAbsolute(connectionPath)
    || extra.length !== 0 || (mode !== undefined && !failClosedTools)) throw new Error("callback.invalid-arguments");
  const file = statSync(connectionPath);
  if (!file.isFile() || file.size > MAX_CONNECTION_BYTES) throw new Error("callback.connection-invalid");
  const connection = JSON.parse(readFileSync(connectionPath, "utf8"));
  if (!validRecord(connection) || typeof connection.url !== "string"
    || typeof connection.token !== "string" || !/^[0-9a-f]{64}$/.test(connection.token)) throw new Error("callback.connection-invalid");
  const url = new URL(connection.url);
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port
    || url.pathname !== "/hook-events" || url.search || url.hash || url.username || url.password) throw new Error("callback.connection-invalid");
  const response = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json",
    Authorization: `Bearer ${connection.token}`}, body: raw, signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw new Error("callback.bridge-unavailable");
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) throw new Error("callback.response-too-large");
  const responseChunks = [];
  let responseBytes = 0;
  for await (const chunk of response.body) {
    responseBytes += chunk.length;
    if (responseBytes > MAX_RESPONSE_BYTES) throw new Error("callback.response-too-large");
    responseChunks.push(chunk);
  }
  const result = JSON.parse(Buffer.concat(responseChunks).toString("utf8"));
  if (!validRecord(result) || result.ok !== true || !validRecord(result.stdout)) throw new Error("callback.decision-unavailable");
  const output = result.stdout;
  if (failClosedTools && eventName === "PreToolUse") {
    const specific = output.hookSpecificOutput;
    if (!["direct", "gate", "block"].includes(result.kind) || !validRecord(specific)
      || specific.hookEventName !== "PreToolUse" || typeof specific.additionalContext !== "string"
      || specific.additionalContext.length === 0
      || (["block", "gate"].includes(result.kind) && specific.permissionDecision !== "deny")
      || (result.kind === "direct" && specific.permissionDecision !== undefined)) {
      throw new Error("callback.tool-projection-invalid");
    }
  }
  if (eventName === "PreToolUse" && (output.hookSpecificOutput?.permissionDecision === "allow"
    || output.hookSpecificOutput?.updatedInput !== undefined)) throw new Error("callback.tool-grant-forbidden");
  process.stdout.write(`${JSON.stringify(output)}\n`);
} catch {
  fail();
}
