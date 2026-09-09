import {spawn} from "node:child_process";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";

import {evaluatePermissionPolicy} from "./permission-policy.mjs";
import {digest} from "../runtime/engine.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultProxyPath = resolve(packageRoot, "runtime/proxy.mjs");

export class CodexRpcError extends Error {
  constructor(method, error) {
    super(`${method}: ${error?.message ?? "JSON-RPC error"}`);
    this.name = "CodexRpcError";
    this.code = error?.code;
    this.data = error?.data;
  }
}

function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return {promise, resolve: resolvePromise, reject: rejectPromise};
}

function approvalResponse(request, choice) {
  const accepted = choice === true || choice === "accept" || choice === "acceptForSession";
  if (request.method === "item/permissions/requestApproval") {
    if (!accepted) return {error: {code: -32073, message: "ARE_PERMISSION_DECLINED"}};
    return {result: {permissions: request.params?.permissions ?? {}, scope: choice === "acceptForSession" ? "session" : "turn"}};
  }
  return {result: {decision: accepted ? (choice === "acceptForSession" ? "acceptForSession" : "accept") : "decline"}};
}

function effectMatches(request, decision) {
  const identity = decision?.effect_identity;
  return Boolean(identity)
    && identity.method === request.method
    && identity.thread_id === (request.params?.threadId ?? null)
    && identity.turn_id === (request.params?.turnId ?? null)
    && identity.item_id === (request.params?.itemId ?? null)
    && decision.kind === "gate";
}

export class CodexProxySession {
  constructor({
    upstream,
    proxyPath = defaultProxyPath,
    receiptPath = resolve(mkdtempSync(resolve(tmpdir(), "are-codex-interactive-")), "events.jsonl"),
    allowProtocolDrift = false,
    handlers = {},
  } = {}) {
    if (!upstream) throw new Error("upstream is required");
    this.upstream = upstream;
    this.proxyPath = proxyPath;
    this.receiptPath = receiptPath;
    this.allowProtocolDrift = allowProtocolDrift;
    this.handlers = handlers;
    this.pending = new Map();
    this.sequence = 0;
    this.threadId = null;
    this.latestEffectDecision = null;
    this.turnPolicy = null;
    this.activeTerminal = null;
    this.stderr = "";
  }

  async start({cwd = process.cwd(), model, ephemeral = true} = {}) {
    const args = [this.proxyPath, "--upstream", this.upstream, "--receipt", this.receiptPath];
    if (this.allowProtocolDrift) args.push("--allow-protocol-drift");
    this.child = spawn(process.execPath, args, {stdio: ["pipe", "pipe", "pipe"]});
    this.child.stderr.on("data", (chunk) => {
      this.stderr += chunk;
      this.handlers.onStderr?.(String(chunk));
    });
    this.child.on("error", (error) => this.#failAll(error));
    this.child.on("exit", (code, signal) => {
      if (this.closing) return;
      this.#failAll(new Error(`ARE proxy exited: code=${code} signal=${signal}`));
    });
    const lines = createInterface({input: this.child.stdout, crlfDelay: Infinity});
    let ordered = Promise.resolve();
    lines.on("line", (line) => {
      ordered = ordered.then(() => this.#handleLine(line)).catch((error) => this.#failAll(error));
    });

    const initialized = await this.request("initialize", {clientInfo: {name: "are-interactive-client", version: "0.1.0"}});
    const started = await this.request("thread/start", {
      cwd,
      ephemeral,
      ...(model ? {model} : {}),
      approvalPolicy: "untrusted",
      sandbox: "read-only",
    });
    this.threadId = started.thread.id;
    return {initialized, thread: started.thread, receiptPath: this.receiptPath};
  }

  request(method, params) {
    if (!this.child?.stdin?.writable) return Promise.reject(new Error("ARE proxy is not running"));
    const id = `interactive-${++this.sequence}`;
    const wait = deferred();
    this.pending.set(String(id), {method, ...wait});
    this.#send({id, method, params});
    return wait.promise;
  }

  async turn({text, input, requestContext = {}, continuation = {}}) {
    if (this.activeTerminal) throw new Error("a turn is already active");
    const terminal = deferred();
    this.activeTerminal = terminal;
    this.turnPolicy = {approvalPolicy: "untrusted", sandboxPolicy: {type: "readOnly", networkAccess: false}};
    const declaredContinuation = structuredClone(continuation);
    if (Array.isArray(declaredContinuation.plan_bound) && declaredContinuation.plan_bound.length > 0) {
      declaredContinuation.plan_manifest = {
        schema_version: "are.codex-host-plan-manifest/v1",
        source_kind: "host-declared-plan",
        source_ref: "are-interactive-client:turn-argument",
        plan_digest: digest(declaredContinuation.plan_bound),
      };
    }
    try {
      const result = await this.request("turn/start", {
        threadId: this.threadId,
        input: input ?? [{type: "text", text}],
        approvalPolicy: this.turnPolicy.approvalPolicy,
        sandboxPolicy: this.turnPolicy.sandboxPolicy,
        _are: {requestContext, continuation: declaredContinuation},
      });
      const outcome = await terminal.promise;
      return {turn: result.turn, outcome};
    } catch (error) {
      if (this.activeTerminal === terminal) this.activeTerminal = null;
      if (error instanceof CodexRpcError && error.code === -32071) return {turn: null, outcome: error.data};
      throw error;
    }
  }

  async resolveContinuation({decisionDigest, optionId, proposalDigest, decision}) {
    if (this.activeTerminal) throw new Error("a turn is already active");
    if (decision !== "accept") {
      return this.request("are/continuation/resolve", {threadId: this.threadId, decisionDigest, optionId, proposalDigest, decision: "decline"});
    }
    const terminal = deferred();
    this.activeTerminal = terminal;
    try {
      const binding = await this.request("are/continuation/resolve", {threadId: this.threadId, decisionDigest, optionId, proposalDigest, decision: "accept"});
      return {binding, outcome: await terminal.promise};
    } catch (error) {
      if (this.activeTerminal === terminal) this.activeTerminal = null;
      throw error;
    }
  }

  async close() {
    if (!this.child || this.closing) return;
    this.closing = true;
    this.child.stdin.end();
    if (this.child.exitCode !== null) return;
    await Promise.race([
      new Promise((resolvePromise) => this.child.once("exit", resolvePromise)),
      new Promise((resolvePromise) => setTimeout(resolvePromise, 1000)),
    ]);
    if (this.child.exitCode === null) this.child.kill("SIGTERM");
  }

  #send(message) {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  #failAll(error) {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
    if (this.activeTerminal) this.activeTerminal.reject(error);
    this.activeTerminal = null;
  }

  async #handleLine(line) {
    let message;
    try { message = JSON.parse(line); } catch {
      this.handlers.onProtocolText?.(line);
      return;
    }

    if (Object.hasOwn(message, "id") && !message.method) {
      const pending = this.pending.get(String(message.id));
      if (!pending) return;
      this.pending.delete(String(message.id));
      if (message.error) pending.reject(new CodexRpcError(pending.method, message.error));
      else pending.resolve(message.result);
      return;
    }

    if (message.method === "are/effect/decision") {
      this.latestEffectDecision = message.params;
      this.handlers.onEffectDecision?.(message.params);
      return;
    }
    if (message.method?.endsWith("/requestApproval") && Object.hasOwn(message, "id")) {
      const exactDecision = effectMatches(message, this.latestEffectDecision) ? this.latestEffectDecision : null;
      const permissionDecision = exactDecision
        ? evaluatePermissionPolicy(message, exactDecision, this.turnPolicy ?? {})
        : null;
      if (!exactDecision) this.handlers.onUnboundApproval?.(message);
      if (permissionDecision?.kind === "deny") this.handlers.onPermissionDenied?.({request: message, decision: permissionDecision});
      const choice = exactDecision && permissionDecision?.kind === "permit"
        ? await (this.handlers.onApproval?.({request: message, decision: exactDecision, permissionDecision}) ?? "decline")
        : "decline";
      this.#send({id: message.id, ...approvalResponse(message, choice), _are: {permissionDecision}});
      this.latestEffectDecision = null;
      return;
    }
    if (message.method === "item/tool/requestUserInput" && Object.hasOwn(message, "id")) {
      const result = await (this.handlers.onUserInput?.(message.params) ?? {answers: {}});
      this.#send({id: message.id, result});
      return;
    }
    if (message.method === "item/agentMessage/delta") {
      this.handlers.onTextDelta?.(message.params?.delta ?? "", message.params);
      return;
    }
    if (message.method === "are/preflight/completed") this.handlers.onPreflight?.(message.params);
    if (message.method === "are/effect/approvalBound") this.handlers.onApprovalBound?.(message.params);
    if (message.method === "are/continuation/turnResponse") this.handlers.onContinuationTurnResponse?.(message.params);
    if (message.method === "are/continuation/completed") {
      this.handlers.onContinuation?.(message.params);
      if (message.params?.kind !== "direct" && this.activeTerminal) {
        const terminal = this.activeTerminal;
        this.activeTerminal = null;
        terminal.resolve(message.params);
      }
    }
    this.handlers.onNotification?.(message);
  }
}
