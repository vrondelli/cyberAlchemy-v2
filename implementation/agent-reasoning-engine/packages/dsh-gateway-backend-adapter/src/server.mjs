import {createHash, randomUUID} from "node:crypto";
import {chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync} from "node:fs";
import {createInterface} from "node:readline";
import {isAbsolute, join, relative, resolve} from "node:path";

import {createDshRunner} from "./dsh-runner.mjs";

const JSON_RPC = "2.0";

function response(id, result) { return {jsonrpc: JSON_RPC, id, result}; }
function errorResponse(id, code, message, data) { return {jsonrpc: JSON_RPC, id: id ?? null, error: {code, message, ...(data === undefined ? {} : {data})}}; }
function notification(method, params) { return {jsonrpc: JSON_RPC, method, params}; }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }

function positiveInteger(value, fallback, name) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new TypeError(`${name} must be a positive safe integer.`);
  return parsed;
}

function confinedPath(candidate, root) {
  const target = resolve(candidate);
  if (!root) return target;
  const pathFromRoot = relative(root, target);
  if (pathFromRoot === ".." || pathFromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(pathFromRoot)) return null;
  return target;
}

function promptFromTurn(params, thread, maxPromptBytes) {
  if (!Array.isArray(params.input)) return {ok: false, reason: "turn/start requires an input array."};
  const unsupported = params.input.filter((item) => item?.type !== "text" || typeof item.text !== "string");
  if (unsupported.length > 0) return {ok: false, reason: "DSH currently accepts text input only; unsupported input was not silently discarded."};
  const user = params.input.map((item) => item.text).join("\n").trim();
  if (user === "") return {ok: false, reason: "turn/start requires at least one non-empty text input."};
  const additionalContext = params.additionalContext && typeof params.additionalContext === "object" && !Array.isArray(params.additionalContext)
    ? Object.fromEntries(Object.entries(params.additionalContext).filter(([, value]) => value?.kind === "application" && typeof value.value === "string"))
    : {};
  const sections = [];
  if (Object.keys(additionalContext).length > 0) sections.push(`[ARE additional context]\n${JSON.stringify(additionalContext)}\n[/ARE additional context]`);
  if (thread.history.length > 0) sections.push(`[Conversation history]\n${thread.history.map((message) => `${message.role}: ${message.text}`).join("\n")}\n[/Conversation history]`);
  sections.push(user);
  const prompt = sections.join("\n\n");
  if (Buffer.byteLength(prompt, "utf8") > maxPromptBytes) return {ok: false, reason: `DSH prompt exceeds ${maxPromptBytes} bytes.`};
  return {ok: true, prompt, user};
}

export function createDshAppServer(options = {}) {
  const runner = options.runner ?? createDshRunner(options);
  const write = options.write ?? ((message) => process.stdout.write(`${JSON.stringify(message)}\n`));
  const threads = new Map();
  const activeTurns = new Map();
  let initialized = false;
  let sequence = 0;
  const workspaceRoot = options.workspace_root ?? process.env.ARE_DSH_WORKSPACE_ROOT;
  const confinedWorkspaceRoot = workspaceRoot ? resolve(workspaceRoot) : null;
  const maxThreads = positiveInteger(options.max_threads ?? process.env.ARE_DSH_MAX_THREADS, 32, "max_threads");
  const maxPromptBytes = positiveInteger(options.max_prompt_bytes ?? process.env.ARE_DSH_MAX_PROMPT_BYTES, 256 * 1024, "max_prompt_bytes");
  const maxHistoryBytes = positiveInteger(options.max_history_bytes ?? process.env.ARE_DSH_MAX_HISTORY_BYTES, 512 * 1024, "max_history_bytes");
  const maxActiveTurns = positiveInteger(options.max_active_turns ?? process.env.ARE_DSH_MAX_ACTIVE_TURNS, 4, "max_active_turns");
  const persistenceMode = options.persistence_mode ?? process.env.ARE_DSH_PERSISTENCE_MODE ?? "ephemeral";
  if (!["ephemeral", "durable"].includes(persistenceMode)) throw new TypeError("persistence_mode must be ephemeral or durable.");
  const configuredStoreRoot = options.session_store_root ?? process.env.ARE_DSH_SESSION_STORE_ROOT ?? (process.env.DSH_HOME ? join(process.env.DSH_HOME, "are-adapter-sessions") : null);
  if (persistenceMode === "durable" && !configuredStoreRoot) throw new TypeError("durable persistence requires session_store_root or DSH_HOME.");
  const sessionStoreRoot = persistenceMode === "durable" ? configuredStoreRoot : null;
  const threadIdleTtlMs = positiveInteger(options.thread_idle_ttl_ms ?? process.env.ARE_DSH_THREAD_IDLE_TTL_MS, 24 * 60 * 60 * 1000, "thread_idle_ttl_ms");
  const now = options.now ?? Date.now;
  const diagnosticSink = options.diagnostic_sink ?? ((record) => process.stderr.write(`${JSON.stringify(record)}\n`));

  function threadPath(threadId) { return sessionStoreRoot ? join(sessionStoreRoot, `${threadId}.json`) : null; }
  function removeThreadFile(threadId) {
    const path = threadPath(threadId);
    if (path && existsSync(path)) unlinkSync(path);
  }
  function persistThread(thread) {
    const path = threadPath(thread.id);
    if (!path) return;
    mkdirSync(sessionStoreRoot, {recursive: true, mode: 0o700});
    const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
    writeFileSync(temporary, `${JSON.stringify({schema_version: "are.dsh-thread-state/v1", thread})}\n`, {encoding: "utf8", mode: 0o600});
    chmodSync(temporary, 0o600);
    renameSync(temporary, path);
  }
  function restoreThreads() {
    if (!sessionStoreRoot || !existsSync(sessionStoreRoot)) return;
    for (const name of readdirSync(sessionStoreRoot).filter((value) => /^dsh-thread-[a-f0-9-]+\.json$/u.test(value))) {
      try {
        const stored = JSON.parse(readFileSync(join(sessionStoreRoot, name), "utf8"));
        const thread = stored?.schema_version === "are.dsh-thread-state/v1" ? stored.thread : null;
        const cwd = thread && confinedPath(thread.cwd, confinedWorkspaceRoot);
        if (!thread || !cwd || !Array.isArray(thread.history) || Buffer.byteLength(JSON.stringify(thread.history), "utf8") > maxHistoryBytes) throw new Error("record-invalid");
        threads.set(thread.id, {id: thread.id, cwd, history: thread.history, last_activity_ms: Number.isSafeInteger(thread.last_activity_ms) ? thread.last_activity_ms : now()});
      } catch (error) { throw new Error(`dsh.session-store-record-invalid:${name}`, {cause: error}); }
    }
  }
  restoreThreads();

  function sweepExpiredThreads() {
    const expired = [];
    for (const [threadId, thread] of threads) {
      if (activeTurns.size > 0 && [...activeTurns.values()].some((turn) => turn.threadId === threadId)) continue;
      if (now() - thread.last_activity_ms < threadIdleTtlMs) continue;
      threads.delete(threadId);
      removeThreadFile(threadId);
      expired.push(threadId);
    }
    return expired;
  }

  function emit(message) { write(message); }
  function fail(id, code, message, data) { emit(errorResponse(id, code, message, data)); }

  async function completeTurn(state) {
    let outcome = await state.execution.completion;
    if (state.completed) return;
    state.completed = true;
    activeTurns.delete(state.id);
    if (outcome.status === "completed") {
      const thread = threads.get(state.threadId);
      if (thread) {
        const proposedHistory = [...thread.history, {role: "User", text: state.userPrompt}, {role: "Assistant", text: outcome.text}];
        if (Buffer.byteLength(JSON.stringify(proposedHistory), "utf8") > maxHistoryBytes) {
          outcome = {...outcome, status: "failed", text: "", diagnostic: `DSH durable history exceeds ${maxHistoryBytes} bytes.`, reason: "history-byte-limit"};
        } else {
          thread.history = proposedHistory;
          thread.last_activity_ms = now();
          persistThread(thread);
        }
      }
    }
    const item = {id: state.itemId, type: "agentMessage", text: outcome.text};
    emit(notification("item/completed", {threadId: state.threadId, turnId: state.id, item}));
    const elapsedMs = Date.now() - state.startedAt;
    const correlationId = `dsh:${state.threadId}:${state.id}`;
    if (outcome.diagnostic) diagnosticSink({schema_version: "are.dsh-diagnostic/v1", correlation_id: correlationId, status: outcome.status, diagnostic_bytes: Buffer.byteLength(outcome.diagnostic), diagnostic_digest: digest(outcome.diagnostic), authority_effect: "none"});
    emit(notification("are/adapterTelemetry", {adapterId: "deepseek-harness-headless/v1", threadId: state.threadId, turnId: state.id, correlationId, status: outcome.status, elapsedMs, outputBytes: Buffer.byteLength(outcome.text), authorityEffect: "none"}));
    emit(notification("turn/completed", {
      threadId: state.threadId,
      turn: {
        id: state.id,
        status: outcome.status,
        items: [item],
        ...(outcome.status === "failed" ? {error: {message: `DSH failed with code ${String(outcome.code)}; private diagnostic correlation ${correlationId}.`}} : {}),
      },
    }));
  }

  async function handle(message) {
    if (!message || typeof message !== "object" || Array.isArray(message) || (message.jsonrpc !== undefined && message.jsonrpc !== JSON_RPC)) {
      fail(message?.id, -32600, "Invalid JSON-RPC request.");
      return;
    }
    const {id, method} = message;
    const expiredThreadIds = sweepExpiredThreads();
    const params = message.params && typeof message.params === "object" && !Array.isArray(message.params) ? message.params : {};
    if (typeof method !== "string" || method === "") {
      fail(id, -32600, "A method is required.");
      return;
    }
    if (method === "initialize") {
      initialized = true;
      emit(response(id, {
        platformFamily: process.platform === "win32" ? "windows" : "unix",
        platformOs: process.platform,
        userAgent: "are-dsh-gateway-backend-adapter/0.1.0",
        serverInfo: {name: "ARE DSH adapter", version: "0.1.0"},
        capabilities: {turnInterrupt: true, turnSteer: false, effects: false},
        persistence: {mode: persistenceMode, threadIdleTtlMs, expiration: "activity-based"},
        capabilityAttestation: runner.capability_attestation,
        expiredThreadIds,
      }));
      return;
    }
    if (method === "initialized") return;
    if (!initialized) {
      fail(id, -32002, "The adapter must be initialized first.");
      return;
    }
    if (method === "thread/start") {
      if (threads.size >= maxThreads) return fail(id, -32011, "The DSH thread limit has been reached.");
      const cwd = confinedPath(typeof params.cwd === "string" && params.cwd !== "" ? params.cwd : process.cwd(), confinedWorkspaceRoot);
      if (!cwd) return fail(id, -32602, "cwd is outside the configured DSH workspace root.");
      const threadId = `dsh-thread-${randomUUID()}`;
      const thread = {id: threadId, cwd, history: [], last_activity_ms: now()};
      threads.set(threadId, thread);
      persistThread(thread);
      emit(response(id, {thread: {id: threadId}, instructionSources: []}));
      return;
    }
    if (method === "thread/resume") {
      const thread = threads.get(params.threadId);
      if (!thread) return fail(id, -32602, "Unknown durable threadId.", {threadId: params.threadId ?? null});
      thread.last_activity_ms = now();
      persistThread(thread);
      emit(response(id, {thread: {id: thread.id}, instructionSources: [], resumed: true}));
      return;
    }
    if (method === "thread/close") {
      const thread = threads.get(params.threadId);
      if (!thread) return fail(id, -32602, "Unknown threadId.", {threadId: params.threadId ?? null});
      if ([...activeTurns.values()].some((turn) => turn.threadId === thread.id)) return fail(id, -32013, "The thread has an active turn.");
      threads.delete(thread.id);
      removeThreadFile(thread.id);
      emit(response(id, {thread: {id: thread.id}, closed: true, reclaimed: true}));
      return;
    }
    if (method === "turn/start") {
      if (activeTurns.size >= maxActiveTurns) return fail(id, -32012, "The DSH active-turn limit has been reached.");
      const thread = threads.get(params.threadId);
      if (!thread) return fail(id, -32602, "Unknown threadId.", {threadId: params.threadId ?? null});
      if ([...activeTurns.values()].some((turn) => turn.threadId === thread.id)) return fail(id, -32010, "The thread already has an active turn.");
      const prepared = promptFromTurn(params, thread, maxPromptBytes);
      if (!prepared.ok) return fail(id, -32602, prepared.reason);
      const turnId = `dsh-turn-${++sequence}-${randomUUID()}`;
      const itemId = `dsh-message-${randomUUID()}`;
      const controller = new AbortController();
      let execution;
      try {
        execution = runner.run({
          prompt: prepared.prompt,
          cwd: thread.cwd,
          signal: controller.signal,
          on_delta: (delta) => emit(notification("item/agentMessage/delta", {threadId: thread.id, turnId, itemId, delta})),
        });
      }
      catch (error) { return fail(id, -32020, "DSH could not start.", {message: error instanceof Error ? error.message : String(error)}); }
      const state = {id: turnId, itemId, threadId: thread.id, controller, execution, completed: false, userPrompt: prepared.user, startedAt: Date.now()};
      activeTurns.set(turnId, state);
      emit(response(id, {turn: {id: turnId, status: "inProgress"}}));
      emit(notification("turn/started", {threadId: thread.id, turn: {id: turnId, status: "inProgress"}}));
      emit(notification("item/started", {threadId: thread.id, turnId, item: {id: itemId, type: "agentMessage", text: ""}}));
      void completeTurn(state).catch((error) => {
        if (state.completed) return;
        state.completed = true;
        activeTurns.delete(turnId);
        emit(notification("turn/completed", {threadId: thread.id, turn: {id: turnId, status: "failed", items: [], error: {message: error instanceof Error ? error.message : String(error)}}}));
      });
      return;
    }
    if (method === "turn/interrupt") {
      const state = activeTurns.get(params.turnId);
      if (!state || state.threadId !== params.threadId) return fail(id, -32602, "Unknown active turn.");
      state.controller.abort();
      state.execution.interrupt();
      await state.execution.completion;
      emit(response(id, {turn: {id: state.id, status: "interrupted"}}));
      return;
    }
    if (method === "turn/steer") return fail(id, -32601, "turn/steer is not supported by the one-shot DSH adapter.");
    fail(id, -32601, `Method not found: ${method}`);
  }

  return Object.freeze({handle, inspect: () => ({initialized, threads: threads.size, active_turns: activeTurns.size, persistence_mode: persistenceMode, thread_idle_ttl_ms: threadIdleTtlMs, capability_attestation: runner.capability_attestation, authority_effect: "none"})});
}

export async function runStdioServer(options = {}) {
  const server = createDshAppServer(options);
  const input = options.input ?? process.stdin;
  const lines = createInterface({input, crlfDelay: Infinity});
  for await (const line of lines) {
    if (line.trim() === "") continue;
    let message;
    try { message = JSON.parse(line); }
    catch {
      (options.write ?? ((value) => process.stdout.write(`${JSON.stringify(value)}\n`)))(errorResponse(null, -32700, "Parse error."));
      continue;
    }
    await server.handle(message);
  }
}
