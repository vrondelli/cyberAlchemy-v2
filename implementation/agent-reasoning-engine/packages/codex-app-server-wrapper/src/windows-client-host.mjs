import {createHash, randomBytes, timingSafeEqual} from "node:crypto";
import {readFileSync, realpathSync} from "node:fs";
import {createServer as createHttpServer} from "node:http";
import {createServer as createHttpsServer} from "node:https";
import {extname, isAbsolute, relative, resolve, sep} from "node:path";

import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {isGatewaySessionFaultReason} from "./gateway-fault-contract.mjs";
import {GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM, GATEWAY_THREAD_CREATION_RECOVERY_GET,
  GATEWAY_OWNED_RUNTIME_GET, GATEWAY_OWNED_RUNTIME_SCHEMA,
  GATEWAY_TURN_RECOVERY_CONFIRM, GATEWAY_TURN_RECOVERY_GET,
  GATEWAY_STEER_OUTCOME_GET, GATEWAY_STEER_OUTCOME_SCHEMA} from "./gateway.mjs";
import {hostedMcpRelayCatalogPosture, hostedRestrictedMcpCatalogPosture} from "./hosted-mcp-catalog.mjs";
import {hostedMcpHookTrustPosture} from "./hosted-hook-profile.mjs";
import {HOSTED_EFFECT_DYNAMIC_TOOL} from "./host-method-policy.mjs";
import {resolveHostedEffectRoot} from "./hosted-effect-root.mjs";
export {hostedMcpRelayCatalogPosture} from "./hosted-mcp-catalog.mjs";
import {declineElicitationResult, defaultApprovalResult, isApprovalRequest} from "./server-request-contract.mjs";
import {MAX_ACCEPTED_TURN_RECEIPTS} from "./windows-client-recovery-state.mjs";
import {REQUEST_CONTEXT_KEY} from "./request-context.mjs";

export const WINDOWS_CLIENT_STATE_SCHEMA = "are.codex-windows-client-state/v1";
export const WINDOWS_CLIENT_EVENT_SCHEMA = "are.codex-windows-client-event/v1";

const JSON_LIMIT = 128 * 1024;
const EVENT_LIMIT = 256 * 1024;
const HISTORY_TURN_LIMIT = 20;
const HISTORY_MESSAGE_LIMIT = 80;
const HISTORY_TEXT_LIMIT = 8192;
const HISTORY_TOTAL_LIMIT = 65536;
const TERMINAL_TURN_STATUSES = new Set(["completed", "failed", "interrupted"]);
// A session-wide grant can suppress later host approval requests, leaving ARE
// unable to assess those later effects. This client only offers one-use consent.
const DECISIONS = new Set(["accept", "decline", "cancel"]);
const CLIENT_POLICY_KEYS = ["approvalPolicy", "sandbox", "sandboxPolicy", "permissions", "collaborationMode"];
const ASSET_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

function secureEqual(left, right) {
  if (!nonEmptyString(left) || !nonEmptyString(right)) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function json(response, status, body) {
  const value = `${JSON.stringify(body)}\n`;
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(value),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(value);
}

function normalizedApprovalResult(method, input) {
  if (method === "item/permissions/requestApproval") {
    if (input?.decision !== "decline") throw new TypeError("The prototype only permits declining explicit permission expansion requests.");
    return defaultApprovalResult(method);
  }
  if (!DECISIONS.has(input?.decision)) throw new TypeError("Unknown approval decision.");
  return {decision: input.decision};
}

export function createApprovalBroker(options = {}) {
  const timeoutMs = options.timeout_ms ?? 120000;
  const pending = new Map();
  let onChange = options.on_change ?? (() => {});

  function release(entry) {
    clearTimeout(entry.timer);
    entry.signal?.removeEventListener("abort", entry.abort_listener);
    pending.delete(entry.request_id);
  }

  function snapshot() {
    return [...pending.values()].map((entry) => freezeResult({
      request_id: entry.request_id,
      method: entry.method,
      params: entry.params,
      received_at: entry.received_at,
      expires_at: entry.expires_at,
    }));
  }

  function request(message, {signal} = {}) {
    if (!isApprovalRequest(message?.method) || !Object.hasOwn(message ?? {}, "id")) {
      return Promise.resolve(defaultApprovalResult(message?.method));
    }
    if (signal?.aborted) return Promise.resolve(defaultApprovalResult(message.method));
    const requestId = String(message.id);
    if (pending.has(requestId)) return Promise.resolve(defaultApprovalResult(message.method));
    return new Promise((resolveRequest) => {
      const receivedAt = new Date().toISOString();
      const entry = {
        request_id: requestId,
        method: message.method,
        params: structuredClone(message.params ?? {}),
        received_at: receivedAt,
        expires_at: new Date(Date.now() + timeoutMs).toISOString(),
        resolve: resolveRequest,
        timer: null,
        signal,
        abort_listener: null,
      };
      entry.timer = setTimeout(() => {
        const publicEntry = snapshot().find((value) => value.request_id === requestId);
        release(entry);
        resolveRequest(defaultApprovalResult(entry.method));
        onChange({kind: "approval-expired", approval: publicEntry});
      }, timeoutMs);
      entry.timer.unref?.();
      pending.set(requestId, entry);
      entry.abort_listener = () => {
        if (pending.get(requestId) !== entry) return;
        release(entry);
        resolveRequest(defaultApprovalResult(entry.method));
        onChange({kind: "approval-aborted", request_id: requestId});
      };
      signal?.addEventListener("abort", entry.abort_listener, {once: true});
      if (signal?.aborted) {
        entry.abort_listener();
        return;
      }
      onChange({kind: "approval-requested", approval: snapshot().find((value) => value.request_id === requestId)});
    });
  }

  function decide(requestId, input) {
    const entry = pending.get(String(requestId));
    if (!entry) return {ok: false, reason: "windows-client.approval-not-found"};
    let result;
    try { result = normalizedApprovalResult(entry.method, input); }
    catch (error) { return {ok: false, reason: "windows-client.approval-decision-invalid", detail: error.message}; }
    release(entry);
    entry.resolve(result);
    onChange({kind: "approval-resolved", request_id: String(requestId), decision: input.decision});
    return {ok: true, request_id: String(requestId), decision: input.decision, authority_effect: "none"};
  }

  function close() {
    for (const entry of pending.values()) {
      release(entry);
      entry.resolve(defaultApprovalResult(entry.method));
      onChange({kind: "approval-aborted", request_id: entry.request_id});
    }
  }

  return Object.freeze({request, decide, snapshot, close, set_on_change: (handler) => { onChange = handler; }});
}

export function createUserInputBroker(options = {}) {
  const timeoutMs = options.timeout_ms ?? 120000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600000) throw new TypeError("Invalid user input timeout.");
  const pending = new Map();
  let onChange = options.on_change ?? (() => {});

  function release(entry) {
    clearTimeout(entry.timer);
    entry.signal?.removeEventListener("abort", entry.abort_listener);
    pending.delete(entry.request_id);
  }

  function snapshot() {
    return [...pending.values()].map((entry) => freezeResult({
      request_id: entry.request_id,
      thread_id: entry.thread_id,
      turn_id: entry.turn_id,
      item_id: entry.item_id,
      questions: entry.questions,
      received_at: entry.received_at,
      expires_at: entry.expires_at,
    }));
  }

  function request(message, {signal} = {}) {
    if (message?.method !== "item/tool/requestUserInput" || !Object.hasOwn(message ?? {}, "id")) throw new TypeError("Invalid user input request.");
    const params = message.params;
    if (!isRecord(params) || !nonEmptyString(params.threadId) || !nonEmptyString(params.turnId) || !nonEmptyString(params.itemId) ||
      !Array.isArray(params.questions) || params.questions.length < 1 || params.questions.length > 16) throw new TypeError("Invalid user input request params.");
    if (params.autoResolutionMs !== undefined && params.autoResolutionMs !== null &&
      (!Number.isSafeInteger(params.autoResolutionMs) || params.autoResolutionMs < 0)) throw new TypeError("Invalid user input auto-resolution delay.");
    if (Buffer.byteLength(JSON.stringify(params.questions)) > 65536 || String(message.id).length > 256) throw new TypeError("User input request exceeds bounds.");
    const ids = new Set();
    const questions = params.questions.map((question) => {
      if (!isRecord(question) || !nonEmptyString(question.id) || ids.has(question.id) || !nonEmptyString(question.header) ||
        !nonEmptyString(question.question) || typeof question.isOther !== "boolean" || typeof question.isSecret !== "boolean" ||
        !(question.options === null || Array.isArray(question.options))) throw new TypeError("Invalid user input question.");
      if (question.header.length > 256 || question.question.length > 4096 || question.id.length > 256 || question.options?.length > 32) throw new TypeError("User input question exceeds bounds.");
      const labels = new Set();
      for (const option of question.options ?? []) {
        if (!isRecord(option) || !nonEmptyString(option.label) || option.label.length > 256 ||
          typeof option.description !== "string" || option.description.length > 4096 || labels.has(option.label)) throw new TypeError("Invalid user input option.");
        labels.add(option.label);
      }
      ids.add(question.id);
      return structuredClone(question);
    });
    const requestId = String(message.id);
    if (pending.has(requestId)) throw new TypeError("Duplicate user input request id.");
    if (signal?.aborted) throw new Error("User input request was aborted.");
    const autoResolutionMs = params.autoResolutionMs ?? null;
    const autoResolve = autoResolutionMs !== null && autoResolutionMs <= timeoutMs;
    const effectiveTimeoutMs = autoResolve ? autoResolutionMs : timeoutMs;
    return new Promise((resolveRequest, rejectRequest) => {
      const entry = {
        request_id: requestId, thread_id: params.threadId, turn_id: params.turnId, item_id: params.itemId, questions,
        received_at: new Date().toISOString(), expires_at: new Date(Date.now() + effectiveTimeoutMs).toISOString(),
        resolve: resolveRequest, reject: rejectRequest, signal, timer: null, abort_listener: null,
      };
      entry.timer = setTimeout(() => {
        release(entry);
        if (autoResolve) resolveRequest({answers: {}});
        else rejectRequest(new Error("User input request expired."));
        onChange({kind: "user-input-expired", request_id: requestId, resolution: autoResolve ? "automatic" : "timeout"});
      }, effectiveTimeoutMs);
      entry.timer.unref?.();
      pending.set(requestId, entry);
      entry.abort_listener = () => {
        if (pending.get(requestId) !== entry) return;
        release(entry);
        rejectRequest(new Error("User input request was aborted."));
        onChange({kind: "user-input-aborted", request_id: requestId});
      };
      signal?.addEventListener("abort", entry.abort_listener, {once: true});
      if (signal?.aborted) return entry.abort_listener();
      onChange({kind: "user-input-requested", user_input: snapshot().find((value) => value.request_id === requestId)});
    });
  }

  function answer(requestId, input) {
    const entry = pending.get(String(requestId));
    if (!entry) return {ok: false, reason: "windows-client.user-input-not-found"};
    const supplied = input?.answers;
    if (!isRecord(supplied) || Object.keys(supplied).length !== entry.questions.length) return {ok: false, reason: "windows-client.user-input-invalid"};
    const answers = Object.create(null);
    for (const question of entry.questions) {
      const value = supplied[question.id];
      if (!Array.isArray(value?.answers) || value.answers.length !== 1 || !nonEmptyString(value.answers[0]) || value.answers[0].length > 4096) {
        return {ok: false, reason: "windows-client.user-input-invalid"};
      }
      const selected = value.answers[0];
      if (question.options?.length && !question.options.some((option) => option.label === selected) && !question.isOther) {
        return {ok: false, reason: "windows-client.user-input-invalid"};
      }
      answers[question.id] = {answers: [selected]};
    }
    release(entry);
    entry.resolve({answers});
    onChange({kind: "user-input-answered", request_id: entry.request_id});
    return {ok: true, request_id: entry.request_id, authority_effect: "none"};
  }

  function resolved(threadId, requestId) {
    const entry = pending.get(String(requestId));
    if (!entry || entry.thread_id !== threadId) return false;
    release(entry);
    entry.reject(new Error("App-server cleared the user input request."));
    onChange({kind: "user-input-aborted", request_id: entry.request_id});
    return true;
  }

  function close() {
    for (const entry of pending.values()) {
      release(entry);
      entry.reject(new Error("User input broker closed."));
      onChange({kind: "user-input-aborted", request_id: entry.request_id});
    }
  }

  return Object.freeze({request, answer, resolved, snapshot, close, set_on_change: (handler) => { onChange = handler; }});
}

function elicitationOptions(schema) {
  let values;
  if (Array.isArray(schema.enum)) {
    if (schema.enumNames !== undefined && (!Array.isArray(schema.enumNames) || schema.enumNames.length !== schema.enum.length)) return null;
    values = schema.enum.map((value, index) => ({value, label: schema.enumNames?.[index] ?? value}));
  } else if (Array.isArray(schema.oneOf)) {
    if (schema.oneOf.some((entry) => !isRecord(entry) || Object.keys(entry).some((key) => !["const", "title"].includes(key)))) return null;
    values = schema.oneOf.map((entry) => ({value: entry.const, label: entry.title}));
  } else if (schema.type === "array" && isRecord(schema.items) && Array.isArray(schema.items.enum)) {
    if (Object.keys(schema.items).some((key) => !["type", "enum"].includes(key)) || (schema.items.type !== undefined && schema.items.type !== "string")) return null;
    values = schema.items.enum.map((value) => ({value, label: value}));
  } else if (schema.type === "array" && isRecord(schema.items) && Array.isArray(schema.items.anyOf)) {
    if (Object.keys(schema.items).some((key) => !["type", "anyOf"].includes(key)) || (schema.items.type !== undefined && schema.items.type !== "string")
      || schema.items.anyOf.some((entry) => !isRecord(entry) || Object.keys(entry).some((key) => !["const", "title"].includes(key)))) return null;
    values = schema.items.anyOf.map((entry) => ({value: entry.const, label: entry.title}));
  }
  if (!values || values.length < 1 || values.length > 32 || new Set(values.map((entry) => entry.value)).size !== values.length
    || values.some((entry) => !nonEmptyString(entry.value) || !nonEmptyString(entry.label)
      || entry.value.length > 256 || entry.label.length > 256)) return null;
  return values;
}

function parsedElicitationForm(message) {
  const params = message?.params;
  if (message?.method !== "mcpServer/elicitation/request" || !Object.hasOwn(message ?? {}, "id")
    || !isRecord(params) || params.mode !== "form" || !nonEmptyString(params.threadId)
    || !nonEmptyString(params.serverName) || typeof params.message !== "string"
    || params.threadId !== params.threadId.trim() || params.serverName !== params.serverName.trim()
    || params.threadId.length > 256 || params.serverName.length > 256 || params.message.length > 4096
    || String(message.id).length > 256 || (params.turnId !== undefined && params.turnId !== null
      && (!nonEmptyString(params.turnId) || params.turnId.length > 256))) return null;
  const schema = params.requestedSchema;
  if (!isRecord(schema) || schema.type !== "object" || !isRecord(schema.properties)
    || Object.keys(schema).some((key) => !["$schema", "type", "properties", "required"].includes(key))) return null;
  let bytes;
  try { bytes = Buffer.byteLength(JSON.stringify(schema)); } catch { return null; }
  if (bytes > 65536) return null;
  const names = Object.keys(schema.properties);
  if (names.length > 16 || (schema.required !== undefined && schema.required !== null && !Array.isArray(schema.required))) return null;
  const required = new Set(schema.required ?? []);
  if (required.size !== (schema.required ?? []).length || [...required].some((name) => !names.includes(name))) return null;
  const fields = [];
  for (const name of names) {
    const spec = schema.properties[name];
    if (!nonEmptyString(name) || name.length > 128 || !isRecord(spec)
      || (spec.title !== undefined && spec.title !== null && (typeof spec.title !== "string" || spec.title.length > 256))
      || (spec.description !== undefined && spec.description !== null && (typeof spec.description !== "string" || spec.description.length > 1024))) return null;
    const commonKeys = ["type", "title", "description", "default"];
    const field = {name, label: spec.title || name, description: spec.description ?? "", required: required.has(name)};
    if (spec.type === "string" && (spec.enum !== undefined || spec.oneOf !== undefined)) {
      if (Object.keys(spec).some((key) => ![...commonKeys, "enum", "enumNames", "oneOf"].includes(key))) return null;
      field.kind = "choice";
      field.options = elicitationOptions(spec);
      if (!field.options) return null;
    } else if (spec.type === "array") {
      if (Object.keys(spec).some((key) => ![...commonKeys, "items", "minItems", "maxItems"].includes(key))) return null;
      field.kind = "multi-choice";
      field.options = elicitationOptions(spec);
      if (!field.options || (spec.minItems !== undefined && spec.minItems !== null && (!Number.isSafeInteger(spec.minItems) || spec.minItems < 0 || spec.minItems > 32))
        || (spec.maxItems !== undefined && spec.maxItems !== null && (!Number.isSafeInteger(spec.maxItems) || spec.maxItems < 0 || spec.maxItems > 32))) return null;
      field.min = spec.minItems ?? 0;
      field.max = spec.maxItems ?? field.options.length;
      if (field.min > field.max) return null;
    } else if (spec.type === "string") {
      if (Object.keys(spec).some((key) => ![...commonKeys, "format", "minLength", "maxLength"].includes(key))) return null;
      if (spec.format !== undefined && spec.format !== null && !["email", "uri", "date", "date-time"].includes(spec.format)) return null;
      field.kind = "string";
      field.format = spec.format ?? null;
      field.min = spec.minLength ?? 0;
      field.max = spec.maxLength ?? 4096;
      if (!Number.isSafeInteger(field.min) || !Number.isSafeInteger(field.max) || field.min < 0 || field.max > 4096 || field.min > field.max) return null;
    } else if (spec.type === "integer" || spec.type === "number") {
      if (Object.keys(spec).some((key) => ![...commonKeys, "minimum", "maximum"].includes(key))) return null;
      field.kind = spec.type;
      field.min = spec.minimum ?? null;
      field.max = spec.maximum ?? null;
      if ((field.min !== null && (!Number.isFinite(field.min))) || (field.max !== null && !Number.isFinite(field.max))
        || (field.min !== null && field.max !== null && field.min > field.max)) return null;
    } else if (spec.type === "boolean") {
      if (Object.keys(spec).some((key) => !commonKeys.includes(key))) return null;
      field.kind = "boolean";
    }
    else return null;
    fields.push(field);
  }
  return {request_id: String(message.id), thread_id: params.threadId, turn_id: params.turnId ?? null,
    server_name: params.serverName, message: params.message, fields};
}

function validElicitationValue(field, value) {
  if (field.kind === "choice") return typeof value === "string" && field.options.some((entry) => entry.value === value);
  if (field.kind === "multi-choice") return Array.isArray(value) && value.length >= field.min && value.length <= field.max
    && new Set(value).size === value.length && value.every((item) => typeof item === "string" && field.options.some((entry) => entry.value === item));
  if (field.kind === "boolean") return typeof value === "boolean";
  if (field.kind === "integer" || field.kind === "number") return typeof value === "number" && Number.isFinite(value)
    && (field.kind !== "integer" || Number.isSafeInteger(value)) && (field.min === null || value >= field.min)
    && (field.max === null || value <= field.max);
  if (field.kind !== "string" || typeof value !== "string" || value.length < field.min || value.length > field.max) return false;
  if (field.format === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (field.format === "uri") { try { return Boolean(new URL(value).protocol); } catch { return false; } }
  if (field.format === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    try { return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; } catch { return false; }
  }
  if (field.format === "date-time") return /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && !Number.isNaN(Date.parse(value));
  return true;
}

export function createElicitationBroker(options = {}) {
  const timeoutMs = options.timeout_ms ?? 90000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw new TypeError("Invalid elicitation timeout.");
  const pending = new Map();
  let onChange = options.on_change ?? (() => {});
  const snapshot = () => [...pending.values()].map((entry) => freezeResult({
    request_id: entry.request_id, thread_id: entry.thread_id, turn_id: entry.turn_id,
    server_name: entry.server_name, message: entry.message, fields: entry.fields,
    received_at: entry.received_at, expires_at: entry.expires_at,
  }));
  function release(entry) {
    clearTimeout(entry.timer);
    entry.signal?.removeEventListener("abort", entry.abort_listener);
    pending.delete(entry.request_id);
  }
  function request(message, {signal} = {}) {
    const form = parsedElicitationForm(message);
    if (!form || pending.has(form.request_id) || signal?.aborted) return Promise.resolve(declineElicitationResult());
    return new Promise((resolveRequest) => {
      const entry = {...form, received_at: new Date().toISOString(), expires_at: new Date(Date.now() + timeoutMs).toISOString(),
        signal, resolve: resolveRequest, timer: null, abort_listener: null};
      entry.timer = setTimeout(() => {
        release(entry);
        resolveRequest(declineElicitationResult());
        onChange({kind: "elicitation-expired", request_id: entry.request_id});
      }, timeoutMs);
      entry.timer.unref?.();
      pending.set(entry.request_id, entry);
      entry.abort_listener = () => {
        if (pending.get(entry.request_id) !== entry) return;
        release(entry);
        resolveRequest(declineElicitationResult());
        onChange({kind: "elicitation-aborted", request_id: entry.request_id});
      };
      signal?.addEventListener("abort", entry.abort_listener, {once: true});
      if (signal?.aborted) return entry.abort_listener();
      onChange({kind: "elicitation-requested", request_id: entry.request_id});
    });
  }
  function answer(requestId, input) {
    const entry = pending.get(String(requestId));
    if (!entry) return {ok: false, reason: "windows-client.elicitation-not-found"};
    if (!["accept", "decline", "cancel"].includes(input?.action)) return {ok: false, reason: "windows-client.elicitation-action-invalid"};
    let result = {action: input.action, content: null, _meta: null};
    if (input.action === "accept") {
      const supplied = input.content;
      if (!isRecord(supplied) || Object.keys(supplied).some((name) => !entry.fields.some((field) => field.name === name))) {
        return {ok: false, reason: "windows-client.elicitation-content-invalid"};
      }
      const content = Object.create(null);
      for (const field of entry.fields) {
        if (!Object.hasOwn(supplied, field.name)) {
          if (field.required) return {ok: false, reason: "windows-client.elicitation-content-invalid"};
          continue;
        }
        if (!validElicitationValue(field, supplied[field.name])) return {ok: false, reason: "windows-client.elicitation-content-invalid"};
        content[field.name] = supplied[field.name];
      }
      if (Buffer.byteLength(JSON.stringify(content)) > 65536) return {ok: false, reason: "windows-client.elicitation-content-invalid"};
      result = {action: "accept", content, _meta: null};
    } else if (input.content !== undefined && input.content !== null) return {ok: false, reason: "windows-client.elicitation-content-invalid"};
    release(entry);
    entry.resolve(result);
    onChange({kind: "elicitation-answered", request_id: entry.request_id, action: result.action});
    return {ok: true, request_id: entry.request_id, action: result.action, authority_effect: "none"};
  }
  function resolved(threadId, requestId) {
    const entry = pending.get(String(requestId));
    if (!entry || entry.thread_id !== threadId) return false;
    release(entry);
    entry.resolve(declineElicitationResult());
    onChange({kind: "elicitation-aborted", request_id: entry.request_id});
    return true;
  }
  function close() {
    for (const entry of pending.values()) {
      release(entry);
      entry.resolve(declineElicitationResult());
      onChange({kind: "elicitation-aborted", request_id: entry.request_id});
    }
  }
  return Object.freeze({request, answer, resolved, snapshot, close, set_on_change: (handler) => { onChange = handler; }});
}

async function readJsonBody(request) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > JSON_LIMIT) throw new RangeError("request body exceeds the 128 KiB limit");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!isRecord(parsed)) throw new TypeError("request body must be a JSON object");
  return parsed;
}

function confinedPath(root, candidate) {
  const realRoot = realpathSync(root);
  const realCandidate = realpathSync(candidate);
  const path = relative(realRoot, realCandidate);
  if (path === "" || (!isAbsolute(path) && !path.startsWith(`..${sep}`)
    && path !== ".." && !path.includes(`${sep}..${sep}`))) return realCandidate;
  throw new RangeError("cwd must remain inside the configured repository root");
}

function publicInitialization(value) {
  if (!isRecord(value)) return null;
  return freezeResult({
    platform_family: value.platformFamily ?? null,
    platform_os: value.platformOs ?? null,
    user_agent: value.userAgent ?? null,
  });
}

function historyText(value) {
  if (typeof value !== "string") return null;
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length <= HISTORY_TEXT_LIMIT) return {text: value, truncated: false};
  return {text: bytes.subarray(0, HISTORY_TEXT_LIMIT).toString("utf8").replace(/\uFFFD$/u, ""), truncated: true};
}

function projectHistoryPage(threadId, page) {
  if (!isRecord(page) || !Array.isArray(page.data) || page.data.length > HISTORY_TURN_LIMIT) throw new Error("windows-client.history-response-invalid");
  const messages = [];
  let totalBytes = 0;
  let truncated = Boolean(page.nextCursor);
  let stopped = false;
  for (const turn of [...page.data].reverse()) {
    if (!nonEmptyString(turn?.id) || !Array.isArray(turn.items)) throw new Error("windows-client.history-turn-invalid");
    for (const item of turn.items) {
      if (messages.length >= HISTORY_MESSAGE_LIMIT) { truncated = true; stopped = true; break; }
      let role;
      let rawText;
      if (item?.type === "userMessage") {
        role = "user";
        rawText = Array.isArray(item.content) ? item.content.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("\n") : null;
      } else if (item?.type === "agentMessage") {
        role = "agent";
        rawText = item.text;
      } else continue;
      const bounded = historyText(rawText);
      if (!bounded || !bounded.text || !nonEmptyString(item.id)) continue;
      const bytes = Buffer.byteLength(bounded.text);
      if (totalBytes + bytes > HISTORY_TOTAL_LIMIT) { truncated = true; stopped = true; break; }
      totalBytes += bytes;
      messages.push({id: item.id, turn_id: turn.id, role, text: bounded.text, truncated: bounded.truncated});
      if (bounded.truncated) truncated = true;
    }
    if (stopped || messages.length >= HISTORY_MESSAGE_LIMIT || totalBytes >= HISTORY_TOTAL_LIMIT) break;
  }
  return freezeResult({schema_version: "are.codex-windows-client-history/v1", thread_id: threadId,
    messages, has_older: Boolean(page.nextCursor), truncated, authority_effect: "none"});
}

function projectThreadRuntime(threadId, read, page) {
  const hostStatus = read?.thread?.status?.type;
  const latest = page?.data?.[0];
  if (read?.thread?.id !== threadId || !Array.isArray(page?.data) || page.data.length > 1) {
    throw new Error("windows-client.runtime-response-invalid");
  }
  const turnStatus = latest?.status ?? null;
  const turnId = nonEmptyString(latest?.id) ? latest.id : null;
  let disposition = "uncertain";
  if (hostStatus === "active" || turnStatus === "inProgress" || turnStatus === "in_progress") disposition = "active";
  else if (hostStatus === "idle" && (!latest || (turnId && TERMINAL_TURN_STATUSES.has(turnStatus)))) disposition = "idle";
  return freezeResult({schema_version: "are.codex-windows-client-runtime/v1", thread_id: threadId,
    disposition, host_status: hostStatus ?? "unknown", turn_id: disposition === "active" ? turnId : null,
    turn_status: turnStatus, authority_effect: "none"});
}

function preFirstTurnHistoryUnavailable(error) {
  return error?.code === "rpc.response-error"
    && /is not materialized yet; thread\/turns\/list is unavailable before first user message/.test(error.message);
}

function turnsListUnsupported(error) {
  return error?.code === "rpc.response-error" && /thread\/turns\/list: list_turns is not supported yet/.test(error.message);
}

function turnsInThreadReadUnsupported(error) {
  return error?.code === "rpc.response-error" && /thread\/read: list_turns is not supported yet/.test(error.message);
}

function auditedHistoryUnavailable(error) {
  // The installed host can expose this transient read failure while its first
  // turn is materializing, or the gateway can withhold a stored snapshot until
  // it agrees with a durable native completion. Neither proves an idle turn.
  return error?.code === "rpc.response-error"
    && (preFirstTurnHistoryUnavailable(error)
      || /thread\/read: list_turns is not supported yet/.test(error.message)
      || error.details?.data?.reason_codes?.some((reason) => ["gateway.turn-history-unsettled",
        "gateway.turn-history-stale"].includes(reason)));
}

function validFreshFirstTurnProof(proof, threadId) {
  return isRecord(proof)
    && Object.keys(proof).sort().join(",") === "authority_effect,creation_acceptance_digest,disposition,schema_version,thread_id"
    && proof.schema_version === GATEWAY_OWNED_RUNTIME_SCHEMA && proof.thread_id === threadId
    && proof.disposition === "first-turn-ready" && proof.authority_effect === "none"
    && /^[0-9a-f]{64}$/.test(proof.creation_acceptance_digest ?? "");
}

function pageFromThreadRead(threadId, read, limit) {
  if (read?.thread?.id !== threadId || !Array.isArray(read.thread.turns)) throw new Error("windows-client.history-response-invalid");
  const turns = read.thread.turns;
  return {data: turns.slice(-limit).reverse(), nextCursor: turns.length > limit ? "unavailable-unpaged" : null};
}

export function createWindowsClientHost(options = {}) {
  if (options.allow_hosted_effect_tool !== undefined
    && typeof options.allow_hosted_effect_tool !== "boolean") {
    throw new TypeError("allow_hosted_effect_tool must be a boolean.");
  }
  const allowHostedEffectTool = options.allow_hosted_effect_tool === true;
  const rpc = options.rpc_client;
  const startupFailure = options.startup_failure ?? null;
  if (startupFailure && !((startupFailure.code === "gateway.session-faulted"
    && /^[0-9a-f]{64}$/.test(startupFailure.fault_digest ?? "")
    && isGatewaySessionFaultReason(startupFailure.fault_reason_code))
    || (startupFailure.code === "gateway.history-audit-incomplete"
      && !Object.hasOwn(startupFailure, "fault_digest")
      && !Object.hasOwn(startupFailure, "fault_reason_code")))) {
    throw new TypeError("A valid gateway stop diagnostic is required.");
  }
  const approvals = options.approval_broker;
  const userInputs = options.user_input_broker ?? createUserInputBroker();
  const elicitations = options.elicitation_broker ?? createElicitationBroker();
  let turnsListSupported = true;
  const recoveryState = options.recovery_state ?? null;
  if (!startupFailure && (!rpc?.initialize || !rpc?.notify || !rpc?.request || !rpc?.events)) throw new TypeError("An app-server RPC client is required.");
  if (!approvals?.request || !approvals?.decide || !approvals?.snapshot) throw new TypeError("An approval broker is required.");
  if (!userInputs?.request || !userInputs?.answer || !userInputs?.snapshot) throw new TypeError("A user input broker is required.");
  if (!elicitations?.request || !elicitations?.answer || !elicitations?.snapshot) throw new TypeError("An elicitation broker is required.");
  if (recoveryState && (!recoveryState.thread_ids || !recoveryState.record_thread || !recoveryState.pending_turn_intent
    || !recoveryState.record_turn_intent || !recoveryState.last_turn_result || !recoveryState.settle_turn_intent
    || !recoveryState.settle_recovered_turn_intent || !recoveryState.reject_turn_intent
    || !recoveryState.pending_steer_intent || !recoveryState.record_steer_intent
    || !recoveryState.clear_steer_intent)) {
    throw new TypeError("A valid hosted-client recovery state is required.");
  }
  const host = options.host ?? "127.0.0.1";
  const loopback = ["127.0.0.1", "::1", "localhost"].includes(host);
  const tls = isRecord(options.tls) && nonEmptyString(options.tls.key) && nonEmptyString(options.tls.cert)
    ? {key: options.tls.key, cert: options.tls.cert}
    : null;
  const allowedOrigins = new Set(Array.isArray(options.allowed_origins) ? options.allowed_origins.filter(nonEmptyString) : []);
  const frameAncestors = Array.isArray(options.frame_ancestors) ? options.frame_ancestors.filter(nonEmptyString) : [];
  if (!loopback && !tls) throw new TypeError("A non-loopback client host requires TLS.");
  if (!loopback && allowedOrigins.size === 0) throw new TypeError("A non-loopback client host requires an explicit origin allowlist.");
  const repositoryRoot = realpathSync(resolve(options.repository_root));
  const defaultCwd = confinedPath(repositoryRoot, resolve(options.default_cwd ?? repositoryRoot));
  const hostedEffectRootBinding = allowHostedEffectTool
    ? resolveHostedEffectRoot({repository_root: repositoryRoot,
      effect_root: options.hosted_effect_root}) : null;
  const hostedEffectRoot = hostedEffectRootBinding?.root ?? null;
  const hostedEffectToolDigest = allowHostedEffectTool
    ? digestValue([HOSTED_EFFECT_DYNAMIC_TOOL]) : null;
  if (hostedEffectRoot) confinedPath(hostedEffectRoot, defaultCwd);
  const assetsRoot = realpathSync(resolve(options.assets_directory));
  const threadApprovalPolicy = options.thread_approval_policy ?? "on-request";
  const threadSandbox = options.thread_sandbox ?? "read-only";
  if (threadApprovalPolicy !== "on-request" && !(threadApprovalPolicy === "never" && threadSandbox === "read-only")) {
    throw new TypeError("The hosted client requires on-request approval, except for a trusted read-only fixture.");
  }
  if (threadSandbox !== "read-only") {
    throw new TypeError("The hosted client requires a read-only sandbox until a writable host policy is admitted.");
  }
  const turnSandboxPolicy = {type: "readOnly"};
  const turnExecutionBlockedReason = options.turn_execution_blocked_reason ?? null;
  const requirementTrackingPosture = options.requirement_tracking_posture ?? "unverified";
  if (!["enabled", "disabled", "unverified"].includes(requirementTrackingPosture)) {
    throw new TypeError("Invalid hosted requirement-tracking posture.");
  }
  const requireMcpHookRelay = options.require_mcp_hook_relay === true;
  const hookProfileSourcePath = options.hook_profile_source_path ?? null;
  if (requireMcpHookRelay && (!nonEmptyString(hookProfileSourcePath)
    || !isAbsolute(hookProfileSourcePath))) {
    throw new TypeError("The MCP hook relay requires an exact native hook source path.");
  }
  const requireRestrictedMcpCatalog = options.require_restricted_mcp_catalog === true;
  const guardedUserInputPlan = options.guarded_user_input_plan === true;
  if (guardedUserInputPlan && (!requireRestrictedMcpCatalog || allowHostedEffectTool)) {
    throw new TypeError("Guarded user input Plan mode requires a restricted non-effect host.");
  }
  const guardedPlanModel = options.guarded_plan_model ?? null;
  if (guardedUserInputPlan
    ? (typeof guardedPlanModel !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(guardedPlanModel))
    : guardedPlanModel !== null) {
    throw new TypeError("Guarded user input Plan mode requires an exact model.");
  }
  if (turnExecutionBlockedReason !== null
    && turnExecutionBlockedReason !== "windows-client.hook-boundary-unverified") {
    throw new TypeError("Invalid hosted turn-execution boundary reason.");
  }
  const token = options.token ?? randomBytes(32).toString("base64url");
  const observationToken = options.observation_token ?? null;
  if (observationToken !== null && (!loopback || typeof observationToken !== "string"
    || Buffer.byteLength(observationToken) < 32 || secureEqual(observationToken, token))) {
    throw new TypeError("A distinct loopback-only observation token is required.");
  }
  const hostedInputAttestationAvailable = options.hosted_input_attestation_available === true;
  const maxEvents = options.max_events ?? 512;
  const sseClients = new Set();
  const events = [];
  const recoveredThreadIds = new Set(recoveryState?.thread_ids() ?? []);
  const threads = new Set(recoveredThreadIds);
  const reboundThreadIds = new Set();
  const resumedThreadIds = new Set();
  let pendingTurn = recoveryState?.pending_turn_intent() ?? null;
  let pendingSteer = recoveryState?.pending_steer_intent() ?? null;
  let lastTurnResult = recoveryState?.last_turn_result() ?? null;
  let acceptedTurns = recoveryState?.accepted_turn_results?.() ?? (lastTurnResult ? [lastTurnResult] : []);
  let recoveryConfirmationRequired = lastTurnResult?.schema_version === "are.codex-client-recovered-turn/v1";
  if (pendingTurn && !threads.has(pendingTurn.thread_id)) throw new Error("windows-client.pending-turn-not-owned");
  if (pendingSteer && !threads.has(pendingSteer.thread_id)) throw new Error("windows-client.pending-steer-not-owned");
  if (lastTurnResult && !threads.has(lastTurnResult.thread_id)) throw new Error("windows-client.last-turn-not-owned");
  if (acceptedTurns.length > MAX_ACCEPTED_TURN_RECEIPTS
    || acceptedTurns.some((entry) => !threads.has(entry.thread_id))
    || (acceptedTurns.at(-1)?.request_key ?? null) !== (lastTurnResult?.request_key ?? null)) {
    throw new Error("windows-client.accepted-turn-receipts-invalid");
  }
  const recoveredAcceptedThreadIds = new Set(acceptedTurns.map((entry) => entry.thread_id));
  const startingTurns = new Set();
  let lastMcpRelayCheck = null;
  const auditedReadTails = new Map();
  let eventSequence = 0;
  let initialization = null;
  let initialized = false;
  let feedbackAvailable = false;
  let closing = false;
  let transportFailure = startupFailure ? freezeResult({code: startupFailure.code,
    ...(startupFailure.code === "gateway.session-faulted" ? {fault_digest: startupFailure.fault_digest,
      fault_reason_code: startupFailure.fault_reason_code} : {}),
    authority_effect: "none"}) : null;

  function auditedThreadRead(threadId) {
    // The gateway audits includeTurns reads against durable turn status. Two
    // concurrent snapshots can otherwise return in reverse order and make an
    // older inProgress status look like a regression from completed.
    const prior = auditedReadTails.get(threadId) ?? Promise.resolve();
    const read = prior.then(async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try { return await rpc.request("thread/read", {threadId, includeTurns: true}); }
        catch (error) {
          const stale = error?.code === "rpc.response-error"
            && error.details?.data?.reason_codes?.includes("gateway.turn-history-stale");
          if (!stale || attempt === 2) throw error;
          await new Promise(resolveWait => setTimeout(resolveWait, 20));
        }
      }
      throw new Error("windows-client.history-read-unreachable");
    });
    const tail = read.catch(() => {});
    auditedReadTails.set(threadId, tail);
    tail.then(() => { if (auditedReadTails.get(threadId) === tail) auditedReadTails.delete(threadId); });
    return read;
  }

  function publish(kind, payload) {
    let safePayload = payload;
    try {
      const encoded = JSON.stringify(payload);
      if (Buffer.byteLength(encoded) > EVENT_LIMIT) safePayload = {truncated: true, original_bytes: Buffer.byteLength(encoded)};
    } catch {
      safePayload = {unserializable: true};
    }
    const event = freezeResult({
      schema_version: WINDOWS_CLIENT_EVENT_SCHEMA,
      sequence: ++eventSequence,
      kind,
      payload: safePayload,
      observed_at: new Date().toISOString(),
      authority_effect: "none",
    });
    events.push(event);
    if (events.length > maxEvents) events.splice(0, events.length - maxEvents);
    const frame = `id: ${event.sequence}\nevent: message\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) client.write(frame);
    return event;
  }

  approvals.set_on_change((event) => publish(event.kind, event));
  userInputs.set_on_change((event) => publish(event.kind, event));
  elicitations.set_on_change((event) => publish(event.kind, event));
  rpc?.events?.on("notification", (message) => {
    if (message.method === "serverRequest/resolved") {
      userInputs.resolved(message.params?.threadId, message.params?.requestId);
      elicitations.resolved(message.params?.threadId, message.params?.requestId);
    }
    publish("app-server-notification", message);
  });
  rpc?.events?.on("continuity", (message) => publish("continuity", message));
  rpc?.events?.on("failure", (error) => {
    if (transportFailure) return;
    const code = typeof error?.code === "string" && /^gateway\.[a-z0-9.-]{1,96}$/.test(error.code)
      ? error.code : "gateway.connection-lost";
    transportFailure = freezeResult({code, authority_effect: "none"});
    approvals.close();
    userInputs.close();
    elicitations.close();
    publish("transport-failure", transportFailure);
  });

  async function initialize() {
    if (startupFailure) throw new Error("windows-client.gateway-startup-stopped");
    if (initialized) return initialization;
    const value = await rpc.initialize({
      clientInfo: {name: "cyberalchemy_are_windows", title: "CyberAlchemy ARE Windows Client", version: "0.1.0"},
      capabilities: {experimentalApi: true},
    });
    await rpc.notify("initialized", {});
    initialization = publicInitialization(value);
    try { feedbackAvailable = (await rpc.request("cyberalchemy/learning/status", {}))?.available === true; }
    catch { feedbackAvailable = false; }
    initialized = true;
    publish("client-initialized", initialization);
    return initialization;
  }

  function hostedThreadBinding(threadId, cwd, params) {
    if (!hostedEffectRoot) return null;
    if (!nonEmptyString(initialization?.user_agent)) {
      throw new Error("windows-client.hosted-effect-host-identity-unavailable");
    }
    return {schema_version: "are.codex-hosted-effect-thread-binding/v1",
      thread_id: threadId, cwd, host_user_agent: initialization.user_agent,
      request_binding_digest: digestValue({method: "thread/start", params}),
      root_digest: hostedEffectRootBinding.sha256, tool_digest: hostedEffectToolDigest};
  }

  function hostedRebindCandidate(threadId) {
    const binding = recoveryState?.thread_binding?.(threadId);
    let journal;
    try { journal = options.hosted_effect_journal?.inspect?.(); }
    catch { return null; }
    if (!isRecord(binding) || binding.schema_version !== "are.codex-hosted-effect-thread-binding/v1"
      || binding.thread_id !== threadId || binding.root_digest !== hostedEffectRootBinding.sha256
      || binding.tool_digest !== hostedEffectToolDigest
      || binding.host_user_agent !== initialization?.user_agent
      || !nonEmptyString(binding.cwd)
      || journal?.schema_version !== "are.hosted-effect-journal-state/v1"
      || journal.faulted !== false || journal.closed !== false || journal.unsettled !== 0) return null;
    try { if (confinedPath(hostedEffectRoot, binding.cwd) !== binding.cwd) return null; }
    catch { return null; }
    return binding;
  }

  async function rejoinPreflight(threadId) {
    if (pendingTurn || recoveryConfirmationRequired) {
      return {reason: "windows-client.pending-turn-recovery-required"};
    }
    // A stored ID does not demonstrate a handover from another desktop client.
    if (!threads.has(threadId)) return {reason: "windows-client.external-thread-handover-unverified"};
    let hostedBinding = null;
    if (hostedEffectRoot && recoveredThreadIds.has(threadId)) {
      hostedBinding = hostedRebindCandidate(threadId);
      if (!hostedBinding) return {reason: "windows-client.hosted-effect-resume-rebind-unverified"};
      let observed;
      try { observed = await auditedThreadRead(threadId); }
      catch { return {reason: "windows-client.hosted-effect-resume-rebind-unverified"}; }
      if (observed?.thread?.id !== threadId || observed.thread.cwd !== hostedBinding.cwd) {
        return {reason: "windows-client.hosted-effect-resume-rebind-unverified"};
      }
    }
    if (recoveredThreadIds.has(threadId)) {
      // An accepted start receipt is not a completed turn. The owned gateway
      // must verify the exact terminal frontier or fresh creation before rejoin.
      const latestAccepted = acceptedTurns.filter(entry => entry.thread_id === threadId).at(-1) ?? null;
      const unverifiedReason = latestAccepted === null
        ? "windows-client.zero-turn-rejoin-unverified"
        : "windows-client.reasoning-recovery-unverified";
      let proof;
      try { proof = await rpc.request(GATEWAY_OWNED_RUNTIME_GET, {threadId}); }
      catch { return {reason: unverifiedReason}; }
      const verified = latestAccepted === null
        ? validFreshFirstTurnProof(proof, threadId)
        : isRecord(proof)
          && Object.keys(proof).sort().join(",") === "authority_effect,checkpoint_digest,disposition,frontier_digest,host_observation_digest,schema_version,thread_id,turn_ref,turn_status"
          && proof.schema_version === GATEWAY_OWNED_RUNTIME_SCHEMA
          && proof.thread_id === threadId && proof.disposition === "terminal-verified"
          && TERMINAL_TURN_STATUSES.has(proof.turn_status)
          && proof.turn_ref === digestValue(latestAccepted.turn_id)
          && ["checkpoint_digest", "frontier_digest", "host_observation_digest"].every(key =>
            /^[0-9a-f]{64}$/.test(proof[key] ?? ""))
          && proof.authority_effect === "none";
      if (!verified) return {reason: unverifiedReason};
    }
    return {hostedBinding};
  }

  async function unresumedRecoveredThreadReason(threadId, {allowLegacyPendingReplay = false} = {}) {
    if (!recoveredThreadIds.has(threadId) || resumedThreadIds.has(threadId)) return null;
    // A v1 pending intent has no gateway-bound recovery receipt. Its exact
    // same-key retry is the only permitted dispatch before native Rejoin;
    // the caller has already checked thread, key and text digest.
    if (allowLegacyPendingReplay && !recoveredAcceptedThreadIds.has(threadId)
      && pendingTurn?.schema_version === "are.codex-client-pending-turn/v1"
      && pendingTurn.thread_id === threadId) return null;
    const preflight = await rejoinPreflight(threadId);
    return preflight.reason ?? "windows-client.rejoin-required";
  }

  async function recoverPendingTurn() {
    if (!recoveryState) return {disposition: "unavailable"};
    if (pendingTurn?.schema_version === "are.codex-client-pending-turn/v2") {
      // The gateway, not the client, verifies the durable marker against host history.
      await auditedThreadRead(pendingTurn.thread_id);
      const response = await rpc.request(GATEWAY_TURN_RECOVERY_GET, {
        threadId: pendingTurn.thread_id, requestKey: pendingTurn.request_key,
        requestBindingDigest: pendingTurn.request_binding_digest,
      });
      const recovered = recoveryState.settle_recovered_turn_intent(pendingTurn, response?.recovery);
      pendingTurn = null;
      acceptedTurns = recoveryState.accepted_turn_results?.() ?? [...acceptedTurns, recovered];
      lastTurnResult = recovered;
      recoveryConfirmationRequired = true;
      publish("turn-recovered", {thread_id: recovered.thread_id, turn_id: recovered.turn_id,
        receipt_digest: recovered.gateway_recovery.receipt_digest});
    }
    if (!recoveryConfirmationRequired) return {disposition: pendingTurn ? "pending-unverified" : "clear"};
    const receipt = lastTurnResult.gateway_recovery;
    await auditedThreadRead(lastTurnResult.thread_id);
    const result = await rpc.request(GATEWAY_TURN_RECOVERY_CONFIRM, {receipt});
    if (result?.confirmed !== true || result.recovery_digest !== receipt.receipt_digest) {
      throw new Error("windows-client.recovery-confirmation-invalid");
    }
    recoveryConfirmationRequired = false;
    publish("turn-recovery-confirmed", {thread_id: lastTurnResult.thread_id,
      receipt_digest: receipt.receipt_digest});
    return {disposition: "recovered"};
  }

  async function tryRecoverPendingTurn() {
    try { return await recoverPendingTurn(); }
    catch (error) {
      publish("turn-recovery-unverified", {reason: error.code ?? "windows-client.recovery-evidence-unavailable"});
      return {disposition: "unverified"};
    }
  }

  function state() {
    return freezeResult({
      schema_version: WINDOWS_CLIENT_STATE_SCHEMA,
      ready: initialized && !closing && !transportFailure,
      transport_failure: transportFailure,
      bind_host: host,
      repository_root: repositoryRoot,
      default_cwd: defaultCwd,
      initialization,
      feedback_available: feedbackAvailable,
      collaboration_mode: guardedUserInputPlan ? "plan-with-guarded-user-input" : "default",
      thread_ids: [...threads],
      pending_turn: pendingTurn,
      pending_steer: pendingSteer,
      last_turn_result: lastTurnResult,
      accepted_turn_results: acceptedTurns,
      recovery_confirmation_required: recoveryConfirmationRequired,
      recovery_mode: startupFailure && options.recovery_state_retained === true ? "private-file-stopped"
        : recoveryState ? "private-file" : "process-memory",
      pending_approvals: approvals.snapshot(),
      pending_user_inputs: userInputs.snapshot(),
      pending_elicitations: elicitations.snapshot(),
      turn_execution: {enabled: turnExecutionBlockedReason === null,
        reason_code: turnExecutionBlockedReason},
      requirement_tracking: {status: requirementTrackingPosture,
        source: requirementTrackingPosture === "unverified" ? "unverified" : "managed-gateway-startup"},
      hook_relay: {required: requireMcpHookRelay, last_check: lastMcpRelayCheck},
      last_event_sequence: eventSequence,
      authority_effect: "none",
    });
  }

  function locallyKnownTurn(threadId) {
    return pendingTurn?.thread_id === threadId
      || acceptedTurns.some((entry) => entry.thread_id === threadId);
  }

  async function gatewayFreshFirstTurnReady(threadId) {
    if (locallyKnownTurn(threadId)) return false;
    try { return validFreshFirstTurnProof(await rpc.request(GATEWAY_OWNED_RUNTIME_GET, {threadId}), threadId); }
    catch { return false; }
  }

  async function threadRuntime(threadId) {
    const read = await rpc.request("thread/read", {threadId, includeTurns: false});
    let page;
    try {
      if (!turnsListSupported) page = pageFromThreadRead(threadId, await auditedThreadRead(threadId), 1);
      else {
        try { page = await rpc.request("thread/turns/list", {threadId, limit: 1, itemsView: "notLoaded", sortDirection: "desc"}); }
        catch (error) {
          if (turnsListUnsupported(error)) {
            turnsListSupported = false;
            page = pageFromThreadRead(threadId, await auditedThreadRead(threadId), 1);
          } else {
            if (read?.thread?.id !== threadId || read.thread.status?.type !== "idle" || !preFirstTurnHistoryUnavailable(error)) throw error;
            if (!await gatewayFreshFirstTurnReady(threadId)) throw error;
            return freezeResult({schema_version: "are.codex-windows-client-runtime/v1", thread_id: threadId,
              disposition: "idle", host_status: "idle", turn_id: null, turn_status: null,
              verification_source: "gateway-fresh-creation", authority_effect: "none"});
          }
        }
      }
    } catch (error) {
      // This does not reconstruct host history. It only permits the next turn
      // when the owned gateway has durably bound the latest host completion to
      // an exact ARE Reasoning State frontier and the host is currently idle.
      if (!turnsInThreadReadUnsupported(error) || read?.thread?.id !== threadId
        || read.thread.status?.type !== "idle") throw error;
      let proof;
      try { proof = await rpc.request(GATEWAY_OWNED_RUNTIME_GET, {threadId}); }
      catch { throw error; }
      if (!locallyKnownTurn(threadId) && validFreshFirstTurnProof(proof, threadId)) {
        return freezeResult({schema_version: "are.codex-windows-client-runtime/v1", thread_id: threadId,
          disposition: "idle", host_status: "idle", turn_id: null, turn_status: null,
          verification_source: "gateway-fresh-creation", authority_effect: "none"});
      }
      if (!isRecord(proof) || Object.keys(proof).sort().join(",") !== "authority_effect,checkpoint_digest,disposition,frontier_digest,host_observation_digest,schema_version,thread_id,turn_ref,turn_status"
        || proof.schema_version !== GATEWAY_OWNED_RUNTIME_SCHEMA || proof.thread_id !== threadId
        || proof.disposition !== "terminal-verified" || !TERMINAL_TURN_STATUSES.has(proof.turn_status)
        || proof.authority_effect !== "none" || !["checkpoint_digest", "frontier_digest", "host_observation_digest", "turn_ref"]
          .every((key) => /^[0-9a-f]{64}$/.test(proof[key] ?? ""))) throw error;
      return freezeResult({schema_version: "are.codex-windows-client-runtime/v1", thread_id: threadId,
        disposition: "idle", host_status: "idle", turn_id: null, turn_status: proof.turn_status,
        turn_ref: proof.turn_ref, verification_source: "gateway-owned-frontier", authority_effect: "none"});
    }
    return projectThreadRuntime(threadId, read, page);
  }

  async function verifyActiveTurn(threadId, turnId) {
    if (!nonEmptyString(threadId) || !nonEmptyString(turnId) || !threads.has(threadId)
      || closing || transportFailure || startupFailure) return false;
    const runtime = await threadRuntime(threadId);
    return runtime.disposition === "active" && runtime.thread_id === threadId
      && runtime.turn_id === turnId;
  }

  async function modelEntryCatalogBlock(threadId) {
    if (requireMcpHookRelay || requireRestrictedMcpCatalog) {
      let catalog;
      try {
        catalog = await rpc.request("mcpServerStatus/list", {threadId,
          detail: "toolsAndAuthOnly", limit: 100});
      } catch {
        if (requireMcpHookRelay) lastMcpRelayCheck = {thread_id: threadId, status: "unavailable",
          checked_at_unix_ms: Date.now()};
        return requireRestrictedMcpCatalog
          ? "windows-client.restricted-mcp-catalog-unavailable" : "windows-client.mcp-hook-relay-unavailable";
      }
      const ready = requireRestrictedMcpCatalog
        ? hostedRestrictedMcpCatalogPosture(catalog, {requireRelay: requireMcpHookRelay}).ok
        : hostedMcpRelayCatalogPosture(catalog).ok;
      if (requireMcpHookRelay) lastMcpRelayCheck = {thread_id: threadId,
        status: ready ? "listed" : "not-ready", checked_at_unix_ms: Date.now()};
      if (!ready) return requireRestrictedMcpCatalog
        ? "windows-client.restricted-mcp-catalog-unavailable" : "windows-client.mcp-hook-relay-unavailable";
    }
    if (requireMcpHookRelay) {
      let listed;
      try { listed = await rpc.request("hooks/list", {cwds: [defaultCwd]}); }
      catch {
        lastMcpRelayCheck = {thread_id: threadId, status: "hook-trust-unavailable",
          checked_at_unix_ms: Date.now()};
        return "windows-client.mcp-hook-trust-unavailable";
      }
      if (!hostedMcpHookTrustPosture(listed, hookProfileSourcePath).ok) {
        lastMcpRelayCheck = {thread_id: threadId, status: "hook-not-ready",
          checked_at_unix_ms: Date.now()};
        return "windows-client.mcp-hook-trust-unavailable";
      }
      lastMcpRelayCheck = {thread_id: threadId, status: "trusted",
        checked_at_unix_ms: Date.now()};
    }
    return null;
  }

  function authorized(request) {
    const header = request.headers.authorization;
    return typeof header === "string" && header.startsWith("Bearer ") && secureEqual(header.slice(7), token);
  }

  async function observeRejoin(request, response, url) {
    // This credential cannot enter the general /api/ control surface. Browser
    // origins are excluded; the managed Companion reads through its Node sidecar.
    const header = request.headers.authorization;
    if (observationToken === null || request.headers.origin !== undefined
      || typeof header !== "string" || !header.startsWith("Bearer ")
      || !secureEqual(header.slice(7), observationToken)) {
      return json(response, 401, {ok: false, reason: "windows-client.observation-unauthorized"});
    }
    const raw = url.searchParams.get("refs");
    const refs = raw === "" ? [] : raw?.split(",") ?? [];
    if (request.method !== "GET" || [...url.searchParams.keys()].join(",") !== "refs"
      || refs.length > 32 || refs.some(ref => !/^backend-thread:[0-9a-f]{64}$/.test(ref))
      || new Set(refs).size !== refs.length) {
      return json(response, 400, {ok: false, reason: "windows-client.observation-params-invalid"});
    }
    const requested = new Set(refs);
    const matched = [...threads].filter(threadId => requested.has(`backend-thread:${digestValue(threadId)}`));
    const rows = await Promise.all(matched.map(async threadId => {
      let status = "hosted-owned";
      let reasonCode = null;
      if (closing || transportFailure || startupFailure || !initialized) {
        status = "unverified";
        reasonCode = "windows-client.gateway-unavailable";
      } else if (recoveredThreadIds.has(threadId)) {
        if (resumedThreadIds.has(threadId)) status = "rejoined";
        else {
          const preflight = await rejoinPreflight(threadId);
          status = preflight.reason ? "blocked" : "rejoin-ready";
          reasonCode = preflight.reason ?? null;
        }
      }
      return {thread_ref: `backend-thread:${digestValue(threadId)}`, status,
        reason_code: reasonCode, pending_steer_checkpoint: pendingSteer?.thread_id === threadId};
    }));
    return json(response, 200, {ok: true, value: {schema_version: "are.hosted-rejoin-observation/v1",
      scope: "managed-hosted-client-only", rows, observed_at_unix_ms: Date.now(),
      authority_effect: "none"}});
  }

  function originAllowed(request) {
    if (allowedOrigins.size === 0) return true;
    const origin = request.headers.origin;
    return typeof origin === "string" && allowedOrigins.has(origin);
  }

  function serveAsset(pathname, response) {
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    if (!["index.html", "app.js", "pending-turn.js", "pending-steer.js", "pending-thread.js", "pending-feedback.js",
      "runtime-verification.js", "requirements-entry.js", "requirement-posture.js", "styles.css", "favicon.svg"].includes(relativePath)) return false;
    const assetPath = resolve(assetsRoot, relativePath);
    const body = readFileSync(assetPath);
    response.writeHead(200, {
      "content-type": ASSET_TYPES.get(extname(assetPath)) ?? "application/octet-stream",
      "content-length": body.length,
      "cache-control": "no-store",
      "content-security-policy": `default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors ${frameAncestors.length > 0 ? frameAncestors.join(" ") : "'none'"}; form-action 'none'`,
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      ...(frameAncestors.length === 0 ? {"x-frame-options": "DENY"} : {}),
    });
    response.end(body);
    return true;
  }

  async function api(request, response, url) {
    if (!originAllowed(request)) return json(response, 403, {ok: false, reason: "windows-client.origin-not-allowed"});
    if (!authorized(request)) return json(response, 401, {ok: false, reason: "windows-client.unauthorized"});
    if (request.method === "GET" && url.pathname === "/api/state") return json(response, 200, {ok: true, value: state()});
    if (transportFailure && !(request.method === "GET" && url.pathname === "/api/events")) {
      return json(response, 503, {ok: false, reason: "windows-client.gateway-unavailable",
        value: {transport_failure: transportFailure}});
    }
    if (request.method === "GET" && url.pathname === "/api/feedback/pending") {
      if (Array.from(url.searchParams.keys()).length !== 1 || !url.searchParams.has("threadId")) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-review-params-invalid"});
      const threadId = url.searchParams.get("threadId");
      if (!nonEmptyString(threadId) || !threads.has(threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      try {
        const listed = await rpc.request("cyberalchemy/learning/pendingFeedback/list", {threadId});
        if (listed?.ok !== true || listed.schema_version !== "are.pending-feedback-list/v1"
          || listed.thread_id !== threadId || !Array.isArray(listed.items) || listed.items.length > 256
          || listed.count !== listed.items.length || Object.keys(listed).some((key) => ![
            "ok", "schema_version", "thread_id", "count", "items", "authority_effect"].includes(key))
          || listed.items.some((item) => !item || !["candidate_episode_ref,feedback_id,text_digest", "feedback_id,text_digest"].includes(Object.keys(item).sort().join(","))
            || typeof item.feedback_id !== "string" || !item.feedback_id || Buffer.byteLength(item.feedback_id) > 256
            || !/^[0-9a-f]{64}$/.test(item.text_digest)
            || (Object.hasOwn(item, "candidate_episode_ref") && item.candidate_episode_ref !== null
              && (typeof item.candidate_episode_ref !== "string" || !item.candidate_episode_ref
                || Buffer.byteLength(item.candidate_episode_ref) > 1024))) || listed.authority_effect !== "none") {
          return json(response, 409, {ok: false, reason: "windows-client.feedback-review-response-invalid"});
        }
        return json(response, 200, {ok: true, value: listed});
      } catch (error) {
        if (error?.code !== "rpc.response-error") throw error;
        return json(response, 409, {ok: false, reason: "windows-client.feedback-review-blocked",
          value: {reason_codes: error.details?.data?.reason_codes ?? ["learning.feedback-unavailable"]}});
      }
    }
    if (request.method === "GET" && url.pathname === "/api/feedback/lessons") {
      if (Array.from(url.searchParams.keys()).length !== 1 || !url.searchParams.has("threadId")) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-review-params-invalid"});
      const threadId = url.searchParams.get("threadId");
      if (!nonEmptyString(threadId) || !threads.has(threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      try {
        const listed = await rpc.request("cyberalchemy/learning/lessons/list", {threadId});
        if (listed?.ok !== true || listed.schema_version !== "are.current-lessons-list/v1"
          || listed.thread_id !== threadId || !Array.isArray(listed.items) || listed.items.length > 50
          || listed.count !== listed.items.length || listed.authority_effect !== "none"
          || Object.keys(listed).sort().join(",") !== "authority_effect,count,items,ok,schema_version,thread_id"
          || listed.items.some((item) => !item || Object.keys(item).sort().join(",") !== "instruction,lesson_digest,lesson_id,revision"
            || !/^lesson:[0-9a-f]{64}$/.test(item.lesson_id ?? "")
            || !/^[0-9a-f]{64}$/.test(item.lesson_digest ?? "")
            || !Number.isSafeInteger(item.revision) || item.revision < 1
            || !nonEmptyString(item.instruction) || Buffer.byteLength(item.instruction) > 512)) {
          return json(response, 409, {ok: false, reason: "windows-client.feedback-review-response-invalid"});
        }
        return json(response, 200, {ok: true, value: listed});
      } catch (error) {
        if (error?.code !== "rpc.response-error") throw error;
        return json(response, 409, {ok: false, reason: "windows-client.feedback-review-blocked",
          value: {reason_codes: error.details?.data?.reason_codes ?? ["learning.feedback-unavailable"]}});
      }
    }
    if (request.method === "POST" && url.pathname === "/api/turns/recover") {
      const result = await tryRecoverPendingTurn();
      return json(response, result.disposition === "unverified" || result.disposition === "pending-unverified" ? 409 : 200,
        {ok: result.disposition !== "unverified" && result.disposition !== "pending-unverified",
          ...(result.disposition === "unverified" || result.disposition === "pending-unverified"
            ? {reason: "windows-client.recovery-evidence-unavailable"} : {}), value: result});
    }
    const rejoinCheckMatch = request.method === "GET"
      ? url.pathname.match(/^\/api\/threads\/([^/]+)\/rejoin-check$/) : null;
    if (rejoinCheckMatch) {
      const threadId = decodeURIComponent(rejoinCheckMatch[1]);
      const preflight = await rejoinPreflight(threadId);
      if (preflight.reason) return json(response, 409, {ok: false, reason: preflight.reason});
      return json(response, 200, {ok: true, value: {thread_id: threadId,
        check: "rejoin-preflight", requires_resume: recoveredThreadIds.has(threadId)
          && !resumedThreadIds.has(threadId), authority_effect: "none"}});
    }
    const runtimeMatch = request.method === "GET" ? url.pathname.match(/^\/api\/threads\/([^/]+)\/runtime$/) : null;
    if (runtimeMatch) {
      const threadId = decodeURIComponent(runtimeMatch[1]);
      if (!threads.has(threadId)) return json(response, 409, {ok: false, reason: "windows-client.thread-not-loaded"});
      return json(response, 200, {ok: true, value: await threadRuntime(threadId)});
    }
    const historyMatch = request.method === "GET" ? url.pathname.match(/^\/api\/threads\/([^/]+)\/history$/) : null;
    if (historyMatch) {
      const threadId = decodeURIComponent(historyMatch[1]);
      if (!threads.has(threadId)) return json(response, 409, {ok: false, reason: "windows-client.thread-not-loaded"});
      let page;
      if (!turnsListSupported) page = pageFromThreadRead(threadId, await auditedThreadRead(threadId), HISTORY_TURN_LIMIT);
      else {
        try { page = await rpc.request("thread/turns/list", {threadId, limit: HISTORY_TURN_LIMIT, itemsView: "summary", sortDirection: "desc"}); }
        catch (error) {
          if (turnsListUnsupported(error)) {
            turnsListSupported = false;
            page = pageFromThreadRead(threadId, await auditedThreadRead(threadId), HISTORY_TURN_LIMIT);
          } else {
            if (!preFirstTurnHistoryUnavailable(error)) throw error;
            const read = await rpc.request("thread/read", {threadId, includeTurns: false});
            if (read?.thread?.id !== threadId || read.thread.status?.type !== "idle") throw error;
            if (!await gatewayFreshFirstTurnReady(threadId)) throw error;
            page = {data: [], nextCursor: null};
          }
        }
      }
      return json(response, 200, {ok: true, value: projectHistoryPage(threadId, page)});
    }
    if (request.method === "GET" && url.pathname === "/api/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      });
      response.write(": connected\n\n");
      const lastId = Number(request.headers["last-event-id"] ?? url.searchParams.get("after") ?? 0);
      for (const event of events) if (event.sequence > lastId) response.write(`id: ${event.sequence}\nevent: message\ndata: ${JSON.stringify(event)}\n\n`);
      sseClients.add(response);
      request.on("close", () => sseClients.delete(response));
      return;
    }
    const body = await readJsonBody(request);
    if (request.method === "POST" && url.pathname === "/api/threads") {
      if (pendingSteer) return json(response, 409,
        {ok: false, reason: "windows-client.pending-steer-recovery-required"});
      if (pendingTurn || recoveryConfirmationRequired) return json(response, 409, {ok: false, reason: "windows-client.pending-turn-recovery-required"});
      if (CLIENT_POLICY_KEYS.some((key) => Object.hasOwn(body, key))) {
        return json(response, 400, {ok: false, reason: "windows-client.thread-policy-client-override-forbidden"});
      }
      if (!nonEmptyString(body.requestKey) || body.requestKey !== body.requestKey.trim()
        || Buffer.byteLength(body.requestKey) > 256) {
        return json(response, 400, {ok: false, reason: "windows-client.thread-request-key-invalid"});
      }
      const cwd = confinedPath(repositoryRoot, resolve(body.cwd ?? defaultCwd));
      if (hostedEffectRoot) {
        try { confinedPath(hostedEffectRoot, cwd); }
        catch { return json(response, 409, {ok: false,
          reason: "windows-client.hosted-effect-workspace-outside-root"}); }
      }
      const params = {
        cwd,
        approvalPolicy: threadApprovalPolicy,
        sandbox: threadSandbox,
        serviceName: "cyberalchemy_are_windows",
        ...(allowHostedEffectTool ? {dynamicTools: [HOSTED_EFFECT_DYNAMIC_TOOL]} : {}),
        ...(nonEmptyString(body.model) ? {model: body.model} : {}),
        ...(nonEmptyString(body.personality) ? {personality: body.personality} : {}),
      };
      let result;
      try {
        result = await rpc.startThread(params, {idempotency_key: body.requestKey});
      } catch (error) {
        if (error?.code === "rpc.response-error" && error.details?.code === -32093
          && ["gateway.dispatch-outcome-unknown", "gateway.dispatch-recovered-no-host-response"]
            .some((reason) => error.details?.data?.reason_codes?.includes(reason))) {
          if (recoveryState) {
            try {
              const requestBindingDigest = digestValue({method: "thread/start", params});
              const getParams = {requestKey: body.requestKey, requestBindingDigest};
              const candidate = await rpc.request(GATEWAY_THREAD_CREATION_RECOVERY_GET, getParams);
              if (nonEmptyString(candidate?.thread_id)) {
                const history = await rpc.request("thread/read", {threadId: candidate.thread_id, includeTurns: true});
                if (history?.thread?.id === candidate.thread_id && Array.isArray(history.thread.turns)
                  && history.thread.turns.length === 0) {
                  const verified = await rpc.request(GATEWAY_THREAD_CREATION_RECOVERY_GET, getParams);
                  if (verified?.history_verified === true && verified?.thread_id === candidate.thread_id
                    && isRecord(verified.receipt)) {
                    recoveryState.record_thread(candidate.thread_id,
                      hostedThreadBinding(candidate.thread_id, cwd, params));
                    threads.add(candidate.thread_id);
                    const confirmed = await rpc.request(GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM,
                      {receipt: verified.receipt});
                    if (confirmed?.confirmed === true
                      && confirmed.recovery_digest === verified.receipt.receipt_digest) {
                      publish("thread-recovered", {thread_id: candidate.thread_id,
                        receipt_digest: verified.receipt.receipt_digest});
                      return json(response, 201, {ok: true, value: {thread: {id: candidate.thread_id},
                        recovered_from_receipt: true}});
                    }
                  }
                }
              }
            } catch { /* Keep the exact unknown creation quarantined for a later same-key retry. */ }
          }
          return json(response, 409, {ok: false, reason: "windows-client.thread-creation-outcome-unknown"});
        }
        throw error;
      }
      if (!nonEmptyString(result?.thread?.id)) throw new Error("thread/start did not return a thread identity");
      // A failed ownership checkpoint withholds the result from the browser.
      recoveryState?.record_thread(result.thread.id,
        hostedThreadBinding(result.thread.id, cwd, params));
      threads.add(result.thread.id);
      publish("thread-started", {thread: result.thread, instructionSources: result.instructionSources ?? []});
      return json(response, 201, {ok: true, value: result});
    }
    if (request.method === "POST" && url.pathname === "/api/threads/resume") {
      if (!nonEmptyString(body.threadId)) return json(response, 400, {ok: false, reason: "windows-client.thread-id-required"});
      if (CLIENT_POLICY_KEYS.some((key) => Object.hasOwn(body, key))) {
        return json(response, 400, {ok: false, reason: "windows-client.thread-policy-client-override-forbidden"});
      }
      const preflight = await rejoinPreflight(body.threadId);
      if (preflight.reason) return json(response, 409, {ok: false, reason: preflight.reason});
      const result = await rpc.request("thread/resume", {threadId: body.threadId,
        approvalPolicy: threadApprovalPolicy, sandbox: threadSandbox}, {idempotency_key: body.requestKey});
      if (result?.thread?.id !== body.threadId) return json(response, 409,
        {ok: false, reason: "windows-client.thread-resume-identity-unverified"});
      if (preflight.hostedBinding) {
        if (result.thread.cwd !== preflight.hostedBinding.cwd) {
          return json(response, 409, {ok: false,
            reason: "windows-client.hosted-effect-resume-rebind-unverified"});
        }
        reboundThreadIds.add(body.threadId);
      }
      if (recoveredThreadIds.has(body.threadId)) resumedThreadIds.add(body.threadId);
      publish("thread-resumed", {thread: result.thread});
      return json(response, 200, {ok: true, value: result});
    }
    if (request.method === "POST" && url.pathname === "/api/feedback") {
      if (pendingSteer) return json(response, 409,
        {ok: false, reason: "windows-client.pending-steer-recovery-required"});
      if (!feedbackAvailable) return json(response, 409, {ok: false, reason: "windows-client.feedback-unavailable"});
      if (recoveryConfirmationRequired || pendingTurn) return json(response, 409,
        {ok: false, reason: "windows-client.pending-turn-recovery-required"});
      if (!nonEmptyString(body.threadId) || !threads.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      const rejoinReason = await unresumedRecoveredThreadReason(body.threadId);
      if (rejoinReason) return json(response, 409, {ok: false, reason: rejoinReason});
      if (CLIENT_POLICY_KEYS.some((key) => Object.hasOwn(body, key))) return json(response, 400,
        {ok: false, reason: "windows-client.thread-policy-client-override-forbidden"});
      if (!nonEmptyString(body.text) || Buffer.byteLength(body.text) > 4096) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-text-invalid"});
      if (!nonEmptyString(body.requestKey) || body.requestKey !== body.requestKey.trim()
        || Buffer.byteLength(body.requestKey) > 256) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-request-key-invalid"});
      if (startingTurns.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.turn-start-pending"});
      startingTurns.add(body.threadId);
      try {
        const runtime = await threadRuntime(body.threadId);
        if (runtime.disposition !== "idle") return json(response, 409,
          {ok: false, reason: "windows-client.turn-not-reconciled", value: runtime});
        let result;
        try {
          // This is a wrapper-local operation. Its feedbackId is checkpointed
          // by the learning ledger; it never dispatches a Codex model turn.
          result = await rpc.request("cyberalchemy/learning/submitFeedback",
            {threadId: body.threadId, feedbackId: body.requestKey, text: body.text},
            {hosted_input: hostedInputAttestationAvailable});
        } catch (error) {
          if (error?.code !== "rpc.response-error") throw error;
          if ((error.details?.data?.reason_codes ?? []).some((reason) => ["learning.feedback-policy-off",
            "learning.feedback-provider-unavailable"].includes(reason))) feedbackAvailable = false;
          return json(response, 409, {ok: false, reason: "windows-client.feedback-blocked",
            value: {reason_codes: error.details?.data?.reason_codes ?? ["learning.feedback-unavailable"]}});
        }
        publish("feedback-submitted", {thread_id: body.threadId, feedback_ref: result.feedback_ref ?? null,
          disposition: result.disposition, lesson_digest: result.lesson_digest ?? null});
        return json(response, result.disposition === "pending" ? 202 : 200, {ok: true, value: result});
      } finally {startingTurns.delete(body.threadId);}
    }
    if (request.method === "POST" && url.pathname === "/api/feedback/dismiss") {
      if (pendingSteer) return json(response, 409,
        {ok: false, reason: "windows-client.pending-steer-recovery-required"});
      if (Object.keys(body).some((key) => !["threadId", "requestKey", "text"].includes(key))) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-review-params-invalid"});
      if (recoveryConfirmationRequired || pendingTurn) return json(response, 409,
        {ok: false, reason: "windows-client.pending-turn-recovery-required"});
      if (!nonEmptyString(body.threadId) || !threads.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      const rejoinReason = await unresumedRecoveredThreadReason(body.threadId);
      if (rejoinReason) return json(response, 409, {ok: false, reason: rejoinReason});
      if (!nonEmptyString(body.text) || Buffer.byteLength(body.text) > 4096
        || !nonEmptyString(body.requestKey) || body.requestKey !== body.requestKey.trim()
        || Buffer.byteLength(body.requestKey) > 256) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-review-input-invalid"});
      if (startingTurns.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.turn-start-pending"});
      startingTurns.add(body.threadId);
      try {
        const runtime = await threadRuntime(body.threadId);
        if (runtime.disposition !== "idle") return json(response, 409,
          {ok: false, reason: "windows-client.turn-not-reconciled", value: runtime});
        let result;
        try {
          result = await rpc.request("cyberalchemy/learning/dismissPendingFeedback",
            {threadId: body.threadId, feedbackId: body.requestKey, text: body.text},
            {hosted_input: hostedInputAttestationAvailable});
        } catch (error) {
          if (error?.code !== "rpc.response-error") throw error;
          return json(response, 409, {ok: false, reason: "windows-client.feedback-review-blocked",
            value: {reason_codes: error.details?.data?.reason_codes ?? ["learning.feedback-pending-not-found"]}});
        }
        publish("feedback-reviewed", {thread_id: body.threadId, feedback_ref: result.feedback_ref ?? null,
          disposition: result.disposition});
        return json(response, 200, {ok: true, value: result});
      } finally {startingTurns.delete(body.threadId);}
    }
    if (request.method === "POST" && url.pathname === "/api/feedback/apply") {
      if (pendingSteer) return json(response, 409,
        {ok: false, reason: "windows-client.pending-steer-recovery-required"});
      if (Object.keys(body).some((key) => !["threadId", "requestKey", "text", "episodeRef", "quote", "instruction",
        "revisesLessonId", "expectedLessonDigest"].includes(key))) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-review-params-invalid"});
      if (!feedbackAvailable) return json(response, 409, {ok: false, reason: "windows-client.feedback-unavailable"});
      if (recoveryConfirmationRequired || pendingTurn) return json(response, 409,
        {ok: false, reason: "windows-client.pending-turn-recovery-required"});
      if (!nonEmptyString(body.threadId) || !threads.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      const rejoinReason = await unresumedRecoveredThreadReason(body.threadId);
      if (rejoinReason) return json(response, 409, {ok: false, reason: rejoinReason});
      if (!nonEmptyString(body.requestKey) || body.requestKey !== body.requestKey.trim()
        || Buffer.byteLength(body.requestKey) > 256 || !nonEmptyString(body.text)
        || Buffer.byteLength(body.text) > 4096 || !nonEmptyString(body.episodeRef)
        || Buffer.byteLength(body.episodeRef) > 1024 || !nonEmptyString(body.quote)
        || Buffer.byteLength(body.quote) > 256 || !body.text.includes(body.quote)
        || !nonEmptyString(body.instruction) || Buffer.byteLength(body.instruction) > 512) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-review-input-invalid"});
      const revision = Object.hasOwn(body, "revisesLessonId") || Object.hasOwn(body, "expectedLessonDigest");
      if (revision && (!/^lesson:[0-9a-f]{64}$/.test(body.revisesLessonId ?? "")
        || !/^[0-9a-f]{64}$/.test(body.expectedLessonDigest ?? ""))) return json(response, 400,
        {ok: false, reason: "windows-client.feedback-review-predecessor-invalid"});
      if (startingTurns.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.turn-start-pending"});
      startingTurns.add(body.threadId);
      try {
        const runtime = await threadRuntime(body.threadId);
        if (runtime.disposition !== "idle") return json(response, 409,
          {ok: false, reason: "windows-client.turn-not-reconciled", value: runtime});
        let result;
        try {
          result = await rpc.request("cyberalchemy/learning/applyPendingFeedback",
            {threadId: body.threadId, feedbackId: body.requestKey, text: body.text,
              episodeRef: body.episodeRef, quote: body.quote, instruction: body.instruction,
              ...(revision ? {revisesLessonId: body.revisesLessonId,
                expectedLessonDigest: body.expectedLessonDigest} : {})},
            {hosted_input: hostedInputAttestationAvailable});
        } catch (error) {
          if (error?.code !== "rpc.response-error") throw error;
          return json(response, 409, {ok: false, reason: "windows-client.feedback-review-blocked",
            value: {reason_codes: error.details?.data?.reason_codes ?? ["learning.feedback-pending-not-found"]}});
        }
        publish("feedback-reviewed", {thread_id: body.threadId, feedback_ref: result.feedback_ref ?? null,
          disposition: result.disposition, lesson_digest: result.lesson_digest ?? null});
        return json(response, 200, {ok: true, value: result});
      } finally {startingTurns.delete(body.threadId);}
    }
    if (request.method === "POST" && url.pathname === "/api/threads/compact") {
      if (pendingSteer) return json(response, 409,
        {ok: false, reason: "windows-client.pending-steer-recovery-required"});
      if (turnExecutionBlockedReason) return json(response, 409,
        {ok: false, reason: turnExecutionBlockedReason});
      if (recoveryConfirmationRequired || pendingTurn) return json(response, 409,
        {ok: false, reason: "windows-client.pending-turn-recovery-required"});
      if (Object.keys(body).some((key) => !["threadId", "requestKey"].includes(key))) return json(response, 400,
        {ok: false, reason: "windows-client.compaction-params-invalid"});
      if (!nonEmptyString(body.threadId) || !threads.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      if (hostedEffectRoot && recoveredThreadIds.has(body.threadId)
        && !reboundThreadIds.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.hosted-effect-resume-rebind-unverified"});
      const rejoinReason = await unresumedRecoveredThreadReason(body.threadId);
      if (rejoinReason) return json(response, 409, {ok: false, reason: rejoinReason});
      if (!nonEmptyString(body.requestKey) || body.requestKey !== body.requestKey.trim()
        || Buffer.byteLength(body.requestKey) > 256) return json(response, 400,
        {ok: false, reason: "windows-client.compaction-request-key-invalid"});
      if (startingTurns.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.turn-start-pending"});
      startingTurns.add(body.threadId);
      try {
        const runtime = await threadRuntime(body.threadId);
        if (runtime.disposition !== "idle") return json(response, 409,
          {ok: false, reason: "windows-client.turn-not-reconciled", value: runtime});
        let result;
        try {
          result = await rpc.request("thread/compact/start", {threadId: body.threadId},
            {idempotency_key: body.requestKey});
        } catch (error) {
          if (error?.code === "rpc.response-error" && error.details?.code === -32093
            && error.details?.data?.reason_codes?.includes("gateway.compaction-unsettled")) {
            return json(response, 409, {ok: false, reason: "windows-client.compaction-unsettled"});
          }
          throw error;
        }
        publish("compaction-requested", {thread_id: body.threadId});
        return json(response, 202, {ok: true, value: result});
      } finally {startingTurns.delete(body.threadId);}
    }
    if (request.method === "POST" && url.pathname === "/api/turns") {
      if (pendingSteer) return json(response, 409, {ok: false, reason: "windows-client.pending-steer-recovery-required"});
      if (turnExecutionBlockedReason) return json(response, 409,
        {ok: false, reason: turnExecutionBlockedReason});
      if (recoveryConfirmationRequired) return json(response, 409, {ok: false, reason: "windows-client.recovery-confirmation-required"});
      if (pendingTurn?.schema_version === "are.codex-client-pending-turn/v2") {
        return json(response, 409, {ok: false, reason: "windows-client.pending-turn-recovery-required"});
      }
      if (!nonEmptyString(body.threadId) || !threads.has(body.threadId)) return json(response, 409, {ok: false, reason: "windows-client.thread-not-loaded"});
      if (hostedEffectRoot && recoveredThreadIds.has(body.threadId)
        && !reboundThreadIds.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.hosted-effect-resume-rebind-unverified"});
      if (CLIENT_POLICY_KEYS.some((key) => Object.hasOwn(body, key))) {
        return json(response, 400, {ok: false, reason: "windows-client.thread-policy-client-override-forbidden"});
      }
      if (!nonEmptyString(body.text) || body.text.length > 65536) return json(response, 400, {ok: false, reason: "windows-client.turn-text-invalid"});
      if (body.requirements !== undefined && (!Array.isArray(body.requirements)
        || body.requirements.length > 64 || body.requirements.some(item => !nonEmptyString(item)
          || item !== item.trim() || Buffer.byteLength(item, "utf8") > 2048)
        || new Set(body.requirements).size !== body.requirements.length
        || Buffer.byteLength(JSON.stringify(body.requirements), "utf8") > 16384)) {
        return json(response, 400, {ok: false, reason: "windows-client.requirements-invalid"});
      }
      if (!nonEmptyString(body.requestKey) || body.requestKey !== body.requestKey.trim() || Buffer.byteLength(body.requestKey) > 256) {
        return json(response, 400, {ok: false, reason: "windows-client.turn-request-key-invalid"});
      }
      const turnParams = {threadId: body.threadId, input: [{type: "text", text: body.text}],
        approvalPolicy: threadApprovalPolicy, sandboxPolicy: turnSandboxPolicy,
        ...(body.requirements !== undefined ? {additionalContext: {[REQUEST_CONTEXT_KEY]: {kind: "application",
          value: JSON.stringify({schema_version: "are.request-context-hint/v1",
            raw_request: body.text, requirement_seed: body.requirements})}}} : {}),
        ...(guardedUserInputPlan ? {collaborationMode: {mode: "plan",
          settings: {model: guardedPlanModel, reasoning_effort: null,
            developer_instructions: null}}} : {})};
      const requestBindingDigest = digestValue({method: "turn/start", params: turnParams});
      const textDigest = createHash("sha256").update(body.text, "utf8").digest("hex");
      if (pendingTurn && (pendingTurn.thread_id !== body.threadId || pendingTurn.request_key !== body.requestKey
        || pendingTurn.text_digest !== textDigest)) {
        return json(response, 409, {ok: false, reason: "windows-client.pending-turn-conflict"});
      }
      const earlierAccepted = acceptedTurns.find((entry) => entry.request_key === body.requestKey);
      if (!pendingTurn && earlierAccepted) {
        if (earlierAccepted.thread_id !== body.threadId || earlierAccepted.text_digest !== textDigest) {
          return json(response, 409, {ok: false, reason: "windows-client.accepted-key-conflict"});
        }
        const acceptedBindingDigest = earlierAccepted.request_binding_digest
          ?? earlierAccepted.gateway_recovery?.request_digest ?? null;
        if (acceptedBindingDigest !== null && acceptedBindingDigest !== requestBindingDigest) {
          return json(response, 409, {ok: false, reason: "windows-client.accepted-binding-conflict"});
        }
        if (acceptedBindingDigest === null && body.requirements !== undefined) {
          return json(response, 409, {ok: false, reason: "windows-client.accepted-binding-unverified"});
        }
        return json(response, 202, {ok: true, value: {turn: {id: earlierAccepted.turn_id},
          recovered_from_receipt: true}});
      }
      const repeated = lastTurnResult?.thread_id === body.threadId && lastTurnResult?.text_digest === textDigest;
      if (repeated && body.confirmRepeatOfTurnId !== lastTurnResult.turn_id) {
        return json(response, 409, {ok: false, reason: "windows-client.recent-turn-already-accepted",
          value: {turn_id: lastTurnResult.turn_id, accepted_at: lastTurnResult.accepted_at}});
      }
      if (body.confirmRepeatOfTurnId !== undefined && (!repeated || body.confirmRepeatOfTurnId !== lastTurnResult.turn_id)) {
        return json(response, 409, {ok: false, reason: "windows-client.repeat-confirmation-stale"});
      }
      if (acceptedTurns.length >= MAX_ACCEPTED_TURN_RECEIPTS) return json(response, 409,
        {ok: false, reason: "windows-client.accepted-receipt-limit"});
      const rejoinReason = await unresumedRecoveredThreadReason(body.threadId,
        {allowLegacyPendingReplay: true});
      if (rejoinReason) return json(response, 409, {ok: false, reason: rejoinReason});
      if (startingTurns.has(body.threadId)) return json(response, 409, {ok: false, reason: "windows-client.turn-start-pending"});
      startingTurns.add(body.threadId);
      try {
        const runtime = await threadRuntime(body.threadId);
        if (runtime.disposition !== "idle") return json(response, 409, {ok: false, reason: "windows-client.turn-not-reconciled", value: runtime});
        const catalogBlock = await modelEntryCatalogBlock(body.threadId);
        if (catalogBlock) return json(response, 409, {ok: false, reason: catalogBlock});
        if (!pendingTurn) {
          const intent = Object.freeze({schema_version: "are.codex-client-pending-turn/v2", thread_id: body.threadId,
            request_key: body.requestKey, text_digest: textDigest,
            request_binding_digest: requestBindingDigest,
            created_at: new Date().toISOString()});
          recoveryState?.record_turn_intent(intent);
          pendingTurn = intent;
        } else if (pendingTurn.schema_version === "are.codex-client-pending-turn/v2"
          && pendingTurn.request_binding_digest !== requestBindingDigest) {
          return json(response, 409, {ok: false, reason: "windows-client.pending-turn-binding-conflict"});
        }
        let result;
        try {
          result = await rpc.request("turn/start", turnParams,
            {idempotency_key: body.requestKey, hosted_input: hostedInputAttestationAvailable});
        } catch (error) {
          if (error?.code === "rpc.response-error"
            && ((error.details?.code === -32070 && error.details.message === "ARE preflight failed")
              || (error.details?.code === -32072 && error.details.message === "ARE preflight block"))
            && (error.details.code === -32072 || error.details.data?.ok === false)
            && error.details.data.authority_effect === "none") {
            const reasonCodes = error.details?.data?.reason_codes;
            recoveryState?.reject_turn_intent(pendingTurn, "reasoning.preflight-failed");
            pendingTurn = null;
            return json(response, 409, {ok: false, reason: error.details.code === -32072
              ? "windows-client.are-preflight-blocked" : "windows-client.are-preflight-unavailable",
              value: {reason_codes: Array.isArray(reasonCodes) && reasonCodes.length <= 8
                && reasonCodes.every(code => typeof code === "string" && /^[a-z0-9.-]{1,96}$/.test(code))
                ? reasonCodes : ["preflight.unavailable"]}});
          }
          if (error?.code === "rpc.response-error" && error.details?.code === -32087
            && error.details?.data?.reason_codes?.includes("gateway.restricted-host-config-drift")) {
            recoveryState?.reject_turn_intent(pendingTurn, "gateway.restricted-host-config-drift");
            pendingTurn = null;
            return json(response, 409, {ok: false, reason: "windows-client.restricted-host-config-drift"});
          }
          if (error?.code === "rpc.response-error" && error.details?.code === -32093
            && error.details?.data?.reason_codes?.includes("gateway.compaction-unsettled")) {
            recoveryState?.reject_turn_intent(pendingTurn, "gateway.compaction-unsettled");
            pendingTurn = null;
            return json(response, 409, {ok: false, reason: "windows-client.compaction-unsettled"});
          }
          if (error?.code !== "rpc.response-error" || error.details?.code !== -32082
            || !error.details?.data?.reason_codes?.includes("reasoning.prior-turn-unsettled")) throw error;
          recoveryState?.reject_turn_intent(pendingTurn, "reasoning.prior-turn-unsettled");
          pendingTurn = null;
          return json(response, 409, {ok: false, reason: "windows-client.reasoning-recovery-unverified"});
        }
        if (!nonEmptyString(result?.turn?.id) || result.turn.id !== result.turn.id.trim()
          || Buffer.byteLength(result.turn.id) > 256) throw new Error("turn/start did not return a valid turn identity");
        const seededBindingDigest = body.requirements !== undefined ? requestBindingDigest : null;
        const accepted = recoveryState?.settle_turn_intent(pendingTurn, result.turn.id, seededBindingDigest)
          ?? {schema_version: seededBindingDigest === null ? "are.codex-client-accepted-turn/v1"
            : "are.codex-client-accepted-turn/v2", thread_id: pendingTurn.thread_id,
            request_key: pendingTurn.request_key, text_digest: pendingTurn.text_digest,
            ...(seededBindingDigest === null ? {} : {request_binding_digest: seededBindingDigest}),
            turn_id: result.turn.id, accepted_at: new Date().toISOString()};
        lastTurnResult = accepted;
        acceptedTurns = recoveryState?.accepted_turn_results?.() ?? [...acceptedTurns, accepted];
        pendingTurn = null;
        publish("turn-requested", {thread_id: body.threadId, turn_id: result?.turn?.id ?? null});
        return json(response, 202, {ok: true, value: result});
      } finally { startingTurns.delete(body.threadId); }
    }
    if (request.method === "POST" && url.pathname === "/api/turns/steer") {
      if (pendingSteer) return json(response, 409,
        {ok: false, reason: "windows-client.pending-steer-recovery-required"});
      if (turnExecutionBlockedReason) return json(response, 409,
        {ok: false, reason: turnExecutionBlockedReason});
      if (recoveryConfirmationRequired) return json(response, 409,
        {ok: false, reason: "windows-client.recovery-confirmation-required"});
      if (pendingTurn) return json(response, 409,
        {ok: false, reason: "windows-client.pending-turn-recovery-required"});
      if (!nonEmptyString(body.threadId) || !threads.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      if (hostedEffectRoot && recoveredThreadIds.has(body.threadId)
        && !reboundThreadIds.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.hosted-effect-resume-rebind-unverified"});
      if (Object.keys(body).some(key => !["threadId", "expectedTurnId", "text", "requestKey"].includes(key))) {
        return json(response, 400, {ok: false, reason: "windows-client.steer-fields-invalid"});
      }
      if (!nonEmptyString(body.expectedTurnId) || body.expectedTurnId !== body.expectedTurnId.trim()
        || Buffer.byteLength(body.expectedTurnId) > 256) return json(response, 400,
        {ok: false, reason: "windows-client.turn-identity-required"});
      if (!nonEmptyString(body.text) || body.text.length > 65536) return json(response, 400,
        {ok: false, reason: "windows-client.turn-text-invalid"});
      if (!nonEmptyString(body.requestKey) || body.requestKey !== body.requestKey.trim()
        || Buffer.byteLength(body.requestKey) > 256) return json(response, 400,
        {ok: false, reason: "windows-client.turn-request-key-invalid"});
      if (!acceptedTurns.some(entry => entry.thread_id === body.threadId
        && entry.turn_id === body.expectedTurnId)) return json(response, 409,
        {ok: false, reason: "windows-client.steer-turn-not-accepted"});
      const rejoinReason = await unresumedRecoveredThreadReason(body.threadId);
      if (rejoinReason) return json(response, 409, {ok: false, reason: rejoinReason});
      if (startingTurns.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.turn-start-pending"});
      startingTurns.add(body.threadId);
      try {
        const runtime = await threadRuntime(body.threadId);
        if (runtime.disposition !== "active" || runtime.turn_id !== body.expectedTurnId) return json(response, 409,
          {ok: false, reason: "windows-client.turn-not-current", value: runtime});
        const catalogBlock = await modelEntryCatalogBlock(body.threadId);
        if (catalogBlock) return json(response, 409, {ok: false, reason: catalogBlock});
        const steerIntent = Object.freeze({schema_version: "are.codex-client-pending-steer/v1",
          thread_id: body.threadId, turn_id: body.expectedTurnId, request_key: body.requestKey,
          text_digest: createHash("sha256").update(body.text, "utf8").digest("hex"),
          created_at: new Date().toISOString()});
        recoveryState?.record_steer_intent(steerIntent);
        pendingSteer = steerIntent;
        const result = await rpc.request("turn/steer", {threadId: body.threadId,
          expectedTurnId: body.expectedTurnId, input: [{type: "text", text: body.text}]},
        {idempotency_key: body.requestKey, hosted_input: hostedInputAttestationAvailable});
        if (result?.turnId !== body.expectedTurnId) throw new Error("turn/steer did not return the expected turn identity");
        // The HTTP response can be lost after the gateway accepts this steer.
        // Keep the content-free key until a terminal exact-key status is read
        // and acknowledged, even when this request returned successfully.
        publish("turn-steer-requested", {thread_id: body.threadId, turn_id: body.expectedTurnId});
        return json(response, 202, {ok: true, value: result});
      } finally {startingTurns.delete(body.threadId);}
    }
    if (request.method === "POST" && url.pathname === "/api/turns/steer/status") {
      if (Object.keys(body).sort().join(",") !== "expectedTurnId,requestKey,threadId") return json(response, 400,
        {ok: false, reason: "windows-client.steer-status-fields-invalid"});
      const bounded = value => nonEmptyString(value) && value === value.trim()
        && Buffer.byteLength(value, "utf8") <= 256;
      if (!bounded(body.threadId) || !bounded(body.expectedTurnId) || !bounded(body.requestKey)) return json(response, 400,
        {ok: false, reason: "windows-client.steer-status-params-invalid"});
      if (!threads.has(body.threadId)) return json(response, 409,
        {ok: false, reason: "windows-client.thread-not-loaded"});
      const result = await rpc.request(GATEWAY_STEER_OUTCOME_GET, body);
      if (!isRecord(result) || Object.keys(result).sort().join(",") !== "authority_effect,disposition,schema_version"
        || result.schema_version !== GATEWAY_STEER_OUTCOME_SCHEMA || result.authority_effect !== "none"
        || !["unrecorded", "pending", "settled-accepted", "rejected", "host-accepted-unreconciled",
          "outcome-unknown", "unverified"].includes(result.disposition)) return json(response, 503,
        {ok: false, reason: "windows-client.steer-status-unverified"});
      return json(response, 200, {ok: true, value: result});
    }
    if (request.method === "POST" && url.pathname === "/api/turns/steer/ack") {
      if (Object.keys(body).sort().join(",") !== "expectedTurnId,requestKey,threadId") return json(response, 400,
        {ok: false, reason: "windows-client.steer-ack-fields-invalid"});
      const bounded = value => nonEmptyString(value) && value === value.trim()
        && Buffer.byteLength(value, "utf8") <= 256;
      if (!bounded(body.threadId) || !bounded(body.expectedTurnId) || !bounded(body.requestKey)) return json(response, 400,
        {ok: false, reason: "windows-client.steer-ack-params-invalid"});
      if (!threads.has(body.threadId) || (pendingSteer && (body.threadId !== pendingSteer.thread_id
        || body.expectedTurnId !== pendingSteer.turn_id || body.requestKey !== pendingSteer.request_key))) {
        return json(response, 409, {ok: false, reason: "windows-client.steer-ack-intent-mismatch"});
      }
      const result = await rpc.request(GATEWAY_STEER_OUTCOME_GET, body);
      if (!isRecord(result) || result.schema_version !== GATEWAY_STEER_OUTCOME_SCHEMA
        || result.authority_effect !== "none" || !["settled-accepted", "rejected"].includes(result.disposition)) {
        return json(response, 409, {ok: false, reason: "windows-client.steer-ack-not-terminal"});
      }
      if (pendingSteer) {
        recoveryState?.clear_steer_intent(pendingSteer);
        pendingSteer = null;
      }
      return json(response, 200, {ok: true, value: result});
    }
    if (request.method === "POST" && url.pathname === "/api/turns/interrupt") {
      if (!nonEmptyString(body.threadId) || !nonEmptyString(body.turnId)) return json(response, 400, {ok: false, reason: "windows-client.turn-identity-required"});
      if (!threads.has(body.threadId)) return json(response, 409, {ok: false, reason: "windows-client.thread-not-loaded"});
      const runtime = await threadRuntime(body.threadId);
      if (runtime.disposition !== "active" || runtime.turn_id !== body.turnId) {
        return json(response, 409, {ok: false, reason: "windows-client.turn-not-current", value: runtime});
      }
      const result = await rpc.request("turn/interrupt", {threadId: body.threadId, turnId: body.turnId});
      publish("turn-interrupt-requested", {thread_id: body.threadId, turn_id: body.turnId});
      return json(response, 202, {ok: true, value: result});
    }
    const approvalMatch = request.method === "POST" ? url.pathname.match(/^\/api\/approvals\/([^/]+)$/) : null;
    if (approvalMatch) {
      const result = approvals.decide(decodeURIComponent(approvalMatch[1]), body);
      return json(response, result.ok ? 200 : 409, result);
    }
    const userInputMatch = request.method === "POST" ? url.pathname.match(/^\/api\/user-input\/([^/]+)$/) : null;
    if (userInputMatch) {
      const result = userInputs.answer(decodeURIComponent(userInputMatch[1]), body);
      return json(response, result.ok ? 200 : 409, result);
    }
    const elicitationMatch = request.method === "POST" ? url.pathname.match(/^\/api\/elicitations\/([^/]+)$/) : null;
    if (elicitationMatch) {
      const result = elicitations.answer(decodeURIComponent(elicitationMatch[1]), body);
      return json(response, result.ok ? 200 : 409, result);
    }
    return json(response, 404, {ok: false, reason: "windows-client.api-not-found"});
  }

  const requestHandler = (request, response) => {
    const url = new URL(request.url ?? "/", `${tls ? "https" : "http"}://${host}`);
    if (request.method === "GET" && url.pathname === "/healthz") return json(response, 200, {ok: true, ready: initialized && !closing && !transportFailure});
    if (url.pathname === "/api/observation/rejoin") {
      observeRejoin(request, response, url).catch(() => json(response, 503,
        {ok: false, reason: "windows-client.observation-unavailable"}));
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      api(request, response, url).catch((error) => {
        const historyUnavailable = auditedHistoryUnavailable(error);
        return json(response, historyUnavailable ? 409
          : error instanceof SyntaxError || error instanceof TypeError || error instanceof RangeError ? 400 : 500, {
          ok: false,
          reason: historyUnavailable ? "windows-client.history-unavailable" : "windows-client.request-failed",
          ...(!historyUnavailable ? {detail: error.message} : {}),
        });
      });
      return;
    }
    try {
      if (request.method === "GET" && serveAsset(url.pathname, response)) return;
    } catch (error) {
      return json(response, 500, {ok: false, reason: "windows-client.asset-failed", detail: error.message});
    }
    json(response, 404, {ok: false, reason: "windows-client.not-found"});
  };
  const server = tls ? createHttpsServer(tls, requestHandler) : createHttpServer(requestHandler);

  async function start() {
    if (!startupFailure) {
      await initialize();
      await tryRecoverPendingTurn();
    }
    await new Promise((resolveStart, reject) => {
      server.once("error", reject);
      server.listen(options.port ?? 4317, host, () => {
        server.off("error", reject);
        resolveStart();
      });
    });
    const address = server.address();
    return freezeResult({
      schema_version: startupFailure ? "are.codex-windows-client-stopped/v1" : "are.codex-windows-client-ready/v1",
      host,
      port: address.port,
      url: `${tls ? "https" : "http"}://${host}:${address.port}/`,
      transport_security: tls ? "tls" : "loopback-http",
      embeddable: frameAncestors.length > 0,
      initialization,
      ...(startupFailure ? {transport_failure: transportFailure} : {}),
      authority_effect: "none",
    });
  }

  async function close() {
    if (closing) return;
    closing = true;
    approvals.close();
    userInputs.close();
    elicitations.close();
    for (const response of sseClients) response.end();
    sseClients.clear();
    if (server.listening) await new Promise((resolveClose) => server.close(resolveClose));
    await rpc?.close?.();
  }

  return Object.freeze({start, close, initialize, state, publish,
    verify_active_turn: verifyActiveTurn, token, server});
}
