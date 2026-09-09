#!/usr/bin/env node
import {createInterface} from "node:readline";
import {resolve} from "node:path";

import {CodexProxySession} from "./session.mjs";

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolveValue, rejectValue) => {
    resolvePromise = resolveValue;
    rejectPromise = rejectValue;
  });
  return {promise, resolve: resolvePromise, reject: rejectPromise};
}

function emit(type, fields = {}) {
  process.stdout.write(`${JSON.stringify({type, emittedAtMs: Date.now(), ...fields})}\n`);
}

function failure(error) {
  return {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
    code: error?.code ?? null,
    data: error?.data ?? null,
  };
}

const upstream = argument("--upstream", process.env.CODEX_BINARY ?? null);
const cwd = resolve(argument("--cwd", process.env.ARE_CODEX_CWD ?? process.cwd()));
const model = argument("--model", process.env.ARE_CODEX_MODEL ?? null);
const receiptPath = argument("--receipt", process.env.ARE_CODEX_RECEIPT_PATH ?? null);
const allowProtocolDrift = process.argv.includes("--allow-protocol-drift");

if (!upstream) throw new Error("CODEX_BINARY_REQUIRED");

const pendingApprovals = new Map();
const pendingUserInputs = new Map();
let promptSequence = 0;
let closing = false;

function prompt(map, prefix, value, eventType) {
  const promptId = `${prefix}-${++promptSequence}`;
  const wait = deferred();
  map.set(promptId, wait);
  emit(eventType, {promptId, ...value});
  return wait.promise.finally(() => map.delete(promptId));
}

const session = new CodexProxySession({
  upstream,
  ...(receiptPath ? {receiptPath: resolve(receiptPath)} : {}),
  allowProtocolDrift,
  handlers: {
    onTextDelta(text, params) { emit("assistant.delta", {text, params}); },
    onPreflight(decision) { emit("preflight.completed", {decision}); },
    onEffectDecision(decision) { emit("effect.decision", {decision}); },
    onApproval(value) {
      return prompt(pendingApprovals, "approval", value, "approval.requested");
    },
    onApprovalBound(binding) { emit("approval.bound", {binding}); },
    onPermissionDenied(value) { emit("permission.denied", value); },
    onUnboundApproval(request) { emit("approval.blocked", {request}); },
    onUserInput(params) {
      return prompt(pendingUserInputs, "question", {params}, "user-input.requested");
    },
    onContinuation(decision) { emit("continuation.completed", {decision}); },
    onContinuationTurnResponse(value) { emit("continuation.turn-response", {value}); },
    onStderr(text) { emit("bridge.stderr", {text}); },
  },
});

function requireRequestId(command) {
  if (typeof command.requestId !== "string" || !command.requestId.trim()) {
    throw new Error("CHAT_REQUEST_ID_REQUIRED");
  }
  return command.requestId;
}

function runDetached(requestId, operation) {
  void operation().catch((error) => emit("request.failed", {requestId, error: failure(error)}));
}

async function handle(command) {
  if (!command || typeof command !== "object") throw new Error("CHAT_COMMAND_OBJECT_REQUIRED");
  const requestId = requireRequestId(command);
  if (command.type === "turn.start") {
    if (typeof command.text !== "string" || !command.text.trim()) throw new Error("CHAT_TEXT_REQUIRED");
    emit("turn.dispatched", {requestId});
    runDetached(requestId, async () => {
      const result = await session.turn({
        text: command.text,
        requestContext: command.requestContext ?? {},
        continuation: command.continuation ?? {},
      });
      emit("turn.completed", {requestId, result});
    });
    return;
  }
  if (command.type === "approval.resolve") {
    const pending = pendingApprovals.get(command.promptId);
    if (!pending) throw new Error("CHAT_APPROVAL_NOT_PENDING");
    const decision = ["accept", "acceptForSession"].includes(command.decision) ? command.decision : "decline";
    pending.resolve(decision);
    emit("approval.resolved", {requestId, promptId: command.promptId, decision});
    return;
  }
  if (command.type === "user-input.resolve") {
    const pending = pendingUserInputs.get(command.promptId);
    if (!pending) throw new Error("CHAT_USER_INPUT_NOT_PENDING");
    pending.resolve({answers: command.answers && typeof command.answers === "object" ? command.answers : {}});
    emit("user-input.resolved", {requestId, promptId: command.promptId});
    return;
  }
  if (command.type === "continuation.resolve") {
    emit("continuation.dispatched", {requestId});
    runDetached(requestId, async () => {
      const result = await session.resolveContinuation({
        decisionDigest: command.decisionDigest,
        optionId: command.optionId,
        proposalDigest: command.proposalDigest,
        decision: command.decision === "accept" ? "accept" : "decline",
      });
      emit("continuation.resolved", {requestId, result});
    });
    return;
  }
  if (command.type === "session.close") {
    closing = true;
    await session.close();
    emit("session.closed", {requestId});
    process.exitCode = 0;
    return;
  }
  throw new Error(`CHAT_COMMAND_UNSUPPORTED:${command.type ?? "missing"}`);
}

const started = await session.start({cwd, model, ephemeral: true});
emit("session.ready", {
  threadId: started.thread.id,
  receiptPath: started.receiptPath,
  protocol: "are-codex-desktop-bridge/v1",
});

const input = createInterface({input: process.stdin, crlfDelay: Infinity});
input.on("line", (line) => {
  let command;
  try {
    command = JSON.parse(line);
  } catch (error) {
    emit("request.failed", {requestId: null, error: failure(error)});
    return;
  }
  void handle(command).catch((error) => emit("request.failed", {requestId: command?.requestId ?? null, error: failure(error)}));
});
input.on("close", () => {
  if (!closing) void session.close();
});
