import {fork} from "node:child_process";
import {MessageChannel, Worker, isMainThread, parentPort, receiveMessageOnPort,
  workerData} from "node:worker_threads";
import {fileURLToPath} from "node:url";
import {validModelContextSizeDiagnostic} from './web-model-context-batch.mjs';

const SCHEMA = "are.dsh-web-gateway-journal-worker/v2";
const PROCESS_SCHEMA = "are.dsh-web-gateway-process/v1";
const STORE_METHODS = new Set(["append", "compact", "getSession", "inspect", 'readPlan',
  "hasFaultedSession", "hasIncompleteHistoryAudit"]);
const MAX_PREPARATION_INPUT_BYTES = 512 * 1024;
const MAX_PENDING_PREPARATIONS = 16;
const RESPONSE_WAIT_FLAG = new Int32Array(new SharedArrayBuffer(4));

function boundedPreparationInput(input) {
  try {
    return input !== null && typeof input === "object" && !Array.isArray(input)
      && Buffer.byteLength(JSON.stringify(input)) <= MAX_PREPARATION_INPUT_BYTES;
  } catch { return false; }
}

/** The worker may notify before the Host reaches Atomics.wait. */
export function waitForGatewayWorkerResponse(port, flag, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const status = Atomics.wait(flag, 0, 0, timeoutMs);
  const signalled = status === "ok" || status === "not-equal" && Atomics.load(flag, 0) === 1;
  let response = signalled ? receiveMessageOnPort(port)?.message : null;
  // The flag can become visible before the MessagePort payload is readable.
  while (signalled && response === undefined && Date.now() < deadline) {
    Atomics.wait(RESPONSE_WAIT_FLAG, 0, 0, 1);
    response = receiveMessageOnPort(port)?.message;
  }
  return {status, signalled, response};
}

if (!isMainThread && workerData?.schema_version === SCHEMA) {
  const child = fork(fileURLToPath(new URL("./web-are-gateway-process.mjs", import.meta.url)),
    ["--are-dsh-web-gateway-process", workerData.path, workerData.store_id,
      JSON.stringify(workerData.requirement_seed ?? null),
      JSON.stringify(workerData.plan_selection ?? null)], {
      execArgv: [], stdio: ["ignore", "ignore", "ignore", "ipc"],
      env: Object.fromEntries(["PATH", "Path", "SystemRoot", "WINDIR", "LANG", "LC_ALL"]
        .filter((key) => typeof process.env[key] === "string")
        .map((key) => [key, process.env[key]])),
    });
  let ready = false;
  let closing = false;
  let closeResponse = false;
  let failed = false;
  let sequence = 0;
  const pending = new Map();
  function settle(entry, response) {
    if (entry.kind === "call") {
      try { entry.port.postMessage(response); }
      catch { entry.port.postMessage({ok: false, reason: "dsh-web.gateway-response-uncloneable"}); }
      finally {
        const flag = new Int32Array(entry.signal);
        Atomics.store(flag, 0, 1);
        Atomics.notify(flag, 0);
      }
    } else if (entry.kind === "prepare") {
      parentPort.postMessage({schema_version: SCHEMA, kind: "prepared",
        id: entry.parent_id, ...response});
    } else if (entry.kind === "close") closeResponse = response.ok === true;
  }
  function fail(reason) {
    if (failed || closing && closeResponse) return;
    failed = true;
    for (const entry of pending.values()) settle(entry, {ok: false, reason});
    pending.clear();
    parentPort.postMessage({schema_version: SCHEMA,
      kind: ready ? "fatal" : "startup-failed", reason});
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
  child.on("message", (message) => {
    if (failed || message?.schema_version !== PROCESS_SCHEMA) {
      if (!failed) fail("dsh-web.gateway-process-protocol-invalid");
      return;
    }
    if (!ready) {
      if (message.kind === "ready" && Number.isSafeInteger(message.process_id)
        && message.process_id > 0 && message.process_id === child.pid) {
        ready = true;
        parentPort.postMessage({schema_version: SCHEMA, kind: "ready",
          gateway_process_id: child.pid});
      } else fail(message.kind === "startup-failed"
        ? `dsh-web.gateway-process-start-failed:${message.reason}`
        : "dsh-web.gateway-process-protocol-invalid");
      return;
    }
    const entry = pending.get(message.id);
    if (message.kind !== "response" || !entry || typeof message.ok !== "boolean"
      || message.ok !== true && typeof message.reason !== "string") {
      fail("dsh-web.gateway-process-response-invalid");
      return;
    }
    pending.delete(message.id);
    settle(entry, {ok: message.ok, ...(message.ok ? {value: message.value}
      : {reason: message.reason, ...(validModelContextSizeDiagnostic(message.size_diagnostic)
        ? {size_diagnostic: message.size_diagnostic} : {})})});
  });
  child.on("error", () => fail("dsh-web.gateway-process-error"));
  child.on("exit", (code) => {
    if (closing && closeResponse && pending.size === 0 && code === 0) {
      parentPort.postMessage({schema_version: SCHEMA, kind: "closed"});
    } else fail(`dsh-web.gateway-process-exited:${code}`);
  });
  parentPort.on("message", (message) => {
    if (message?.schema_version !== SCHEMA || failed || !ready) {
      if (!failed) fail("dsh-web.gateway-worker-request-invalid");
      return;
    }
    if (message.kind === "abort") {
      fail("dsh-web.gateway-worker-aborted");
      return;
    }
    const method = message.kind === "prepare" ? "prepare"
      : message.kind === "close" ? "close" : message.method;
    if (closing || !["prepare", "close"].includes(method) && !STORE_METHODS.has(method)
      || !Array.isArray(message.args)
      || message.kind === "call" && (!(message.port && message.signal instanceof SharedArrayBuffer)
        || method === "prepare" || method === "close")
      || message.kind === "prepare" && (!Number.isSafeInteger(message.id)
        || message.id < 1 || message.args.length !== 1)
      || !["call", "prepare", "close"].includes(message.kind)) {
      fail("dsh-web.gateway-worker-request-invalid");
      return;
    }
    if (message.kind === "close") closing = true;
    const id = ++sequence;
    pending.set(id, message.kind === "call" ? {kind: "call", port: message.port,
      signal: message.signal} : message.kind === "prepare"
      ? {kind: "prepare", parent_id: message.id} : {kind: "close"});
    child.send({schema_version: PROCESS_SCHEMA, id, method, args: message.args}, (error) => {
      if (error) fail("dsh-web.gateway-process-send-failed");
    });
  });
}

/** A separate ARE process owns route/context decisions and durable journal writes. */
export async function createDshWebGatewayJournalWorker({path, store_id,
  timeout_ms = 30_000, on_fatal = () => {}, requirement_seed = null, plan_selection = null} = {}) {
  if (typeof path !== "string" || !path || typeof store_id !== "string" || !store_id
    || !Number.isSafeInteger(timeout_ms) || timeout_ms < 1 || timeout_ms > 120_000
    || typeof on_fatal !== "function") {
    throw new TypeError("dsh-web.gateway-journal-worker-input-invalid");
  }
  const worker = new Worker(new URL(import.meta.url), {workerData: {schema_version: SCHEMA,
    path, store_id, requirement_seed, plan_selection}});
  let failed = null;
  let closed = false;
  let closing = false;
  let gatewayProcessId;
  let nextPrepareId = 0;
  let closeResolve;
  let closeReject;
  const preparations = new Map();
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  const startupTimer = setTimeout(() => readyReject(new Error(
    "dsh-web.gateway-process-start-timeout")), timeout_ms);
  function fail(reason) {
    if (failed || closed) return;
    failed = reason;
    clearTimeout(startupTimer);
    readyReject(new Error(reason));
    closeReject?.(new Error(reason));
    for (const entry of preparations.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    }
    preparations.clear();
    on_fatal(reason);
  }
  worker.on("message", (message) => {
    if (message?.schema_version !== SCHEMA) {
      fail("dsh-web.gateway-worker-protocol-invalid");
    } else if (message.kind === "ready" && Number.isSafeInteger(message.gateway_process_id)
      && message.gateway_process_id > 0) {
      clearTimeout(startupTimer);
      gatewayProcessId = message.gateway_process_id;
      readyResolve();
    } else if (message.kind === "startup-failed" || message.kind === "fatal") {
      fail(message.reason ?? "dsh-web.gateway-process-failed");
    } else if (message.kind === "prepared" && Number.isSafeInteger(message.id)) {
      const entry = preparations.get(message.id);
      if (!entry || typeof message.ok !== "boolean") {
        fail("dsh-web.gateway-preparation-response-invalid");
        return;
      }
      preparations.delete(message.id);
      clearTimeout(entry.timer);
      if (message.ok) entry.resolve(message.value);
      else entry.reject(Object.assign(new Error(message.reason), validModelContextSizeDiagnostic(message.size_diagnostic)
        ? {size_diagnostic: message.size_diagnostic} : {}));
    } else if (message.kind === "closed" && closing) closeResolve?.();
    else fail("dsh-web.gateway-worker-protocol-invalid");
  });
  worker.on("error", () => fail("dsh-web.gateway-worker-error"));
  worker.on("exit", (code) => {
    if (!closed) fail(`dsh-web.gateway-worker-exited:${code}`);
  });
  try { await ready; }
  catch (error) { await worker.terminate(); throw error; }

  function call(method, args = []) {
    if (failed || closed || closing) throw new Error(failed ?? "dsh-web.gateway-worker-closed");
    const signal = new SharedArrayBuffer(4);
    const flag = new Int32Array(signal);
    const {port1, port2} = new MessageChannel();
    worker.postMessage({schema_version: SCHEMA, kind: "call", method, args,
      port: port2, signal}, [port2]);
    const {status, signalled, response} = waitForGatewayWorkerResponse(port1, flag, timeout_ms);
    port1.close();
    if (!response || typeof response.ok !== "boolean") {
      fail(status === "timed-out" ? "dsh-web.gateway-process-response-timeout"
        : signalled ? "dsh-web.gateway-process-response-missing-after-notify"
          : "dsh-web.gateway-process-response-missing");
      worker.postMessage({schema_version: SCHEMA, kind: "abort"});
      throw new Error(failed);
    }
    if (!response.ok) throw new Error(response.reason);
    return response.value;
  }
  return Object.freeze({
    gateway_process_id: gatewayProcessId,
    append: (value) => call("append", [value]),
    compact: () => call("compact"),
    getSession: (consumerId) => call("getSession", [consumerId]),
    inspect: () => call("inspect"),
    readPlan: input => call('readPlan', [input]),
    hasFaultedSession: () => call("hasFaultedSession"),
    hasIncompleteHistoryAudit: () => call("hasIncompleteHistoryAudit"),
    prepare(input) {
      if (failed || closed || closing) return Promise.reject(new Error(
        failed ?? "dsh-web.gateway-worker-closed"));
      if (!boundedPreparationInput(input)) return Promise.reject(new Error(
        "dsh-web.gateway-preparation-input-too-large-or-invalid"));
      if (preparations.size >= MAX_PENDING_PREPARATIONS) return Promise.reject(new Error(
        "dsh-web.gateway-preparation-capacity-exceeded"));
      const id = ++nextPrepareId;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          preparations.delete(id);
          fail("dsh-web.gateway-preparation-response-timeout");
          worker.postMessage({schema_version: SCHEMA, kind: "abort"});
          reject(new Error("dsh-web.gateway-preparation-response-timeout"));
        }, timeout_ms);
        preparations.set(id, {resolve, reject, timer});
        worker.postMessage({schema_version: SCHEMA, kind: "prepare", id, args: [input]});
      });
    },
    async close() {
      if (closed) return;
      closing = true;
      try {
        if (!failed) {
          await new Promise((resolve, reject) => {
            closeResolve = resolve;
            closeReject = reject;
            worker.postMessage({schema_version: SCHEMA, kind: "close", args: []});
            setTimeout(() => reject(new Error("dsh-web.gateway-process-close-timeout")),
              timeout_ms).unref?.();
          });
        } else worker.postMessage({schema_version: SCHEMA, kind: "abort"});
      } finally {
        closed = true;
        await worker.terminate();
      }
    },
  });
}
