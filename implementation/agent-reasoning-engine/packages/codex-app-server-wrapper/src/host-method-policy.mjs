import {EFFECT_METHODS, TURN_START} from "./protocol.mjs";
import {digestValue, freezeResult} from "./canonical.mjs";
import catalog from "./host-client-method-catalog.v1.json" with {type: "json"};

const KNOWN_REQUESTS = new Set(catalog.client_request_methods);
const KNOWN_NOTIFICATIONS = new Set(catalog.client_notification_methods);
const ADMITTED_GATEWAY_REQUESTS = new Set(catalog.admitted_gateway_requests);
const ADMITTED_GATEWAY_NOTIFICATIONS = new Set(catalog.admitted_gateway_notifications);
const ADMITTED_WRAPPER_LOCAL_REQUESTS = new Set(catalog.admitted_wrapper_local_requests);
const SERVER_NOTIFICATIONS = new Set(catalog.server_notification_methods);
const SERVER_REQUESTS = new Set(catalog.server_request_methods);
const SERVER_SCOPED_NOTIFICATIONS = new Set(catalog.server_notification_required_thread_id_methods);
const SERVER_TURN_SCOPED_NOTIFICATIONS = new Set(catalog.server_notification_required_turn_id_methods);
const SERVER_OPTIONAL_TURN_NOTIFICATIONS = new Set(catalog.server_notification_optional_turn_id_methods);
const SERVER_OPTIONAL_NOTIFICATIONS = new Set(catalog.server_notification_optional_thread_id_methods);
const SERVER_SCOPED_REQUESTS = new Set(catalog.server_request_required_thread_id_methods);
const SERVER_TURN_SCOPED_REQUESTS = new Set(catalog.server_request_required_turn_id_methods);
const SERVER_OPTIONAL_TURN_REQUESTS = new Set(catalog.server_request_optional_turn_id_methods);
const UNASSESSED_SERVER_EFFECT_REQUESTS = new Set(["item/tool/call"]);
export const HOSTED_EFFECT_TOOL_NAME = "are_effect_request";
export const HOSTED_EFFECT_DYNAMIC_TOOL = freezeResult({type: "function", name: HOSTED_EFFECT_TOOL_NAME,
  description: "Propose one command for ARE assessment and explicit user approval. A proposal does not execute by itself.",
  inputSchema: {type: "object", properties: {
    kind: {type: "string", enum: ["command"]},
    proposal: {type: "object", minProperties: 1},
  }, required: ["kind", "proposal"], additionalProperties: false}});
const ASSESSED_SERVER_EFFECT_REQUESTS = new Set(EFFECT_METHODS);
const EXPLICIT_CLIENT_SERVER_REQUESTS = new Set([
  "item/tool/requestUserInput", "mcpServer/elicitation/request", "currentTime/read",
]);

if (catalog.schema_version !== "are.codex-host-client-method-catalog/v1"
  || KNOWN_REQUESTS.size !== catalog.client_request_methods.length
  || KNOWN_NOTIFICATIONS.size !== catalog.client_notification_methods.length
  || [...ADMITTED_GATEWAY_REQUESTS].some((method) => !KNOWN_REQUESTS.has(method))
  || [...ADMITTED_GATEWAY_NOTIFICATIONS].some((method) => !KNOWN_NOTIFICATIONS.has(method))
  || SERVER_NOTIFICATIONS.size !== catalog.server_notification_methods.length
  || SERVER_TURN_SCOPED_NOTIFICATIONS.size !== catalog.server_notification_required_turn_id_methods.length
  || SERVER_OPTIONAL_TURN_NOTIFICATIONS.size !== catalog.server_notification_optional_turn_id_methods.length
  || SERVER_REQUESTS.size !== catalog.server_request_methods.length
  || SERVER_TURN_SCOPED_REQUESTS.size !== catalog.server_request_required_turn_id_methods.length
  || SERVER_OPTIONAL_TURN_REQUESTS.size !== catalog.server_request_optional_turn_id_methods.length
  || [...SERVER_SCOPED_NOTIFICATIONS, ...SERVER_OPTIONAL_NOTIFICATIONS].some((method) => !SERVER_NOTIFICATIONS.has(method))
  || [...SERVER_TURN_SCOPED_NOTIFICATIONS].some((method) => !SERVER_SCOPED_NOTIFICATIONS.has(method))
  || [...SERVER_OPTIONAL_TURN_NOTIFICATIONS].some((method) => !SERVER_SCOPED_NOTIFICATIONS.has(method)
    || SERVER_TURN_SCOPED_NOTIFICATIONS.has(method))
  || [...SERVER_SCOPED_REQUESTS].some((method) => !SERVER_REQUESTS.has(method))
  || [...SERVER_TURN_SCOPED_REQUESTS].some((method) => !SERVER_SCOPED_REQUESTS.has(method))
  || [...SERVER_OPTIONAL_TURN_REQUESTS].some((method) => !SERVER_SCOPED_REQUESTS.has(method)
    || SERVER_TURN_SCOPED_REQUESTS.has(method))
  || [...ASSESSED_SERVER_EFFECT_REQUESTS, ...EXPLICIT_CLIENT_SERVER_REQUESTS,
    ...UNASSESSED_SERVER_EFFECT_REQUESTS].some((method) => !SERVER_REQUESTS.has(method))
  || [...SERVER_SCOPED_NOTIFICATIONS].some((method) => SERVER_OPTIONAL_NOTIFICATIONS.has(method))
  || !SERVER_NOTIFICATIONS.has("thread/started")) {
  throw new Error("host.method-catalog-invalid");
}

export function hostMethodCatalogBindingCheck(observedVersion) {
  return observedVersion === catalog.observed_codex_version;
}

export function codexServerNotificationRequiresAcceptedTurn(method, params) {
  return method === "turn/started" || method === "turn/completed"
    || SERVER_TURN_SCOPED_NOTIFICATIONS.has(method)
    || (SERVER_OPTIONAL_TURN_NOTIFICATIONS.has(method)
      && params?.turnId !== undefined && params?.turnId !== null);
}

// A standalone MCP elicitation may have no host-correlated turn. The managed
// gateway has no safe attribution for that case, so it cannot present the
// request as an ARE-owned turn interaction.
export function codexServerRequestTurnPosture(message) {
  if (typeof message?.method !== "string" || !Object.hasOwn(message, "id")) return {kind: "not-applicable"};
  const required = SERVER_TURN_SCOPED_REQUESTS.has(message.method);
  const optional = SERVER_OPTIONAL_TURN_REQUESTS.has(message.method);
  if (!required && !optional) return {kind: "not-applicable"};
  const turnId = message.params?.turnId;
  if (optional && (turnId === undefined || turnId === null)) return {kind: "unsupported-unattributed"};
  if (typeof turnId !== "string" || !turnId || turnId !== turnId.trim()
    || Buffer.byteLength(turnId, "utf8") > 256) return {kind: "invalid"};
  return {kind: "scoped", turn_id: turnId};
}

// The installed schema pins these required fields, while native MCP form
// requests also carry useful fields that schema does not enumerate. Validate
// the fields needed to identify or present an admitted request without
// treating the generated property list as an exhaustive payload allowlist.
export function codexServerRequestCriticalShapePosture(message) {
  if (typeof message?.method !== "string" || !Object.hasOwn(message, "id")) return {kind: "not-applicable"};
  const method = message.method;
  if (![...ASSESSED_SERVER_EFFECT_REQUESTS, "item/tool/requestUserInput", "mcpServer/elicitation/request"].includes(method)) {
    return {kind: "not-applicable"};
  }
  const params = message.params;
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return {kind: "rejected", reason_code: "host.server-request-required-field-invalid"};
  }
  const boundedText = (value, limit) => typeof value === "string" && value.length > 0
    && value === value.trim() && Buffer.byteLength(value, "utf8") <= limit;
  if (method === "mcpServer/elicitation/request") {
    return boundedText(params.serverName, 256) ? {kind: "admitted"}
      : {kind: "rejected", reason_code: "host.server-request-required-field-invalid"};
  }
  if (!boundedText(params.itemId, 256)) {
    return {kind: "rejected", reason_code: "host.server-request-required-field-invalid"};
  }
  if (method === "item/tool/requestUserInput") {
    return typeof params.isBlocking === "boolean" && Array.isArray(params.questions)
      && params.questions.length > 0 && params.questions.length <= 16
      ? {kind: "admitted"} : {kind: "rejected", reason_code: "host.server-request-required-field-invalid"};
  }
  if (!Number.isSafeInteger(params.startedAtMs) || params.startedAtMs < 0) {
    return {kind: "rejected", reason_code: "host.server-request-required-field-invalid"};
  }
  if (method === "item/permissions/requestApproval"
    && (!boundedText(params.cwd, 4096) || !params.permissions
      || typeof params.permissions !== "object" || Array.isArray(params.permissions))) {
    return {kind: "rejected", reason_code: "host.server-request-required-field-invalid"};
  }
  return {kind: "admitted"};
}

// Host attribution is necessary but not sufficient for execution. Only an
// explicitly configured hosted effect broker may consume this exact call;
// all other dynamic tools retain the unsupported-request posture.
export function hostedEffectToolCallPosture(message) {
  if (message?.method !== "item/tool/call" || !Object.hasOwn(message, "id")) {
    return {kind: "not-applicable"};
  }
  const params = message.params;
  const bounded = value => typeof value === "string" && value.length > 0
    && value === value.trim() && Buffer.byteLength(value, "utf8") <= 256;
  let proposalBytes;
  try { proposalBytes = Buffer.byteLength(JSON.stringify(params?.arguments?.proposal), "utf8"); }
  catch { proposalBytes = Infinity; }
  if (!params || typeof params !== "object" || Array.isArray(params)
    || Object.keys(params).some(key => !["threadId", "turnId", "callId", "namespace", "tool", "arguments"].includes(key))
    || !bounded(params.threadId) || !bounded(params.turnId) || !bounded(params.callId)
    || params.namespace !== null || params.tool !== HOSTED_EFFECT_TOOL_NAME
    || !params.arguments || typeof params.arguments !== "object" || Array.isArray(params.arguments)
    || Object.keys(params.arguments).sort().join(",") !== "kind,proposal"
    || params.arguments.kind !== "command"
    || !params.arguments.proposal || typeof params.arguments.proposal !== "object"
    || Array.isArray(params.arguments.proposal) || proposalBytes <= 2 || proposalBytes > 65536) {
    return {kind: "rejected", reason_code: "host.hosted-effect-call-invalid"};
  }
  return {kind: "admitted"};
}

export function gatewayClientMethodPosture(message) {
  if (typeof message?.method !== "string") return {kind: "response"};
  const request = Object.hasOwn(message, "id");
  if (request && ADMITTED_WRAPPER_LOCAL_REQUESTS.has(message.method)) return {kind: "admitted-local"};
  if (request && ADMITTED_GATEWAY_REQUESTS.has(message.method)) return {kind: "admitted-host"};
  if (!request && ADMITTED_GATEWAY_NOTIFICATIONS.has(message.method)) return {kind: "admitted-host"};
  const known = request ? KNOWN_REQUESTS.has(message.method) : KNOWN_NOTIFICATIONS.has(message.method);
  return {kind: "rejected", reason_code: known ? "host.method-ungoverned" : "host.method-unknown"};
}

// This projection is bound to the installed host's generated server schemas.
// Notifications without an owned thread are suppressed, not interpreted as
// globally safe. Unscoped requests are denied before the browser sees them.
export function gatewayServerMethodPosture(message, {allow_hosted_effect_tool = false} = {}) {
  if (typeof message?.method !== "string") return {kind: "response"};
  const request = Object.hasOwn(message, "id");
  const method = message.method;
  if (request ? !SERVER_REQUESTS.has(method) : !SERVER_NOTIFICATIONS.has(method)) {
    return {kind: "rejected", reason_code: "host.server-method-unknown"};
  }
  if (request && unassessedHostServerEffectRequest(method)) {
    if (!allow_hosted_effect_tool) return {kind: "deny-unassessed-request"};
    const shape = hostedEffectToolCallPosture(message);
    if (shape.kind !== "admitted") return shape;
  }
  if (!request && method === "thread/started") return {kind: "thread-started"};
  const required = request ? SERVER_SCOPED_REQUESTS.has(method) : SERVER_SCOPED_NOTIFICATIONS.has(method);
  const optional = !request && SERVER_OPTIONAL_NOTIFICATIONS.has(method);
  if (!required && !optional) return {kind: request ? "deny-unscoped-request" : "suppress-unscoped-notification"};
  const threadId = message.params?.threadId;
  if (optional && threadId === undefined) return {kind: "suppress-unscoped-notification"};
  if (typeof threadId !== "string" || !threadId || threadId !== threadId.trim()
    || Buffer.byteLength(threadId, "utf8") > 256) {
    return {kind: "rejected", reason_code: "host.server-thread-id-required"};
  }
  if (!request && (method === "turn/started" || method === "turn/completed")) {
    const turn = message.params?.turn;
    const turnId = turn?.id;
    const validStatus = method === "turn/started" ? turn?.status === "inProgress"
      : ["completed", "interrupted", "failed"].includes(turn?.status);
    if (!turn || typeof turn !== "object" || Array.isArray(turn)
      || typeof turnId !== "string" || !turnId || turnId !== turnId.trim()
      || Buffer.byteLength(turnId, "utf8") > 256 || !validStatus) {
      return {kind: "rejected", reason_code: "host.server-turn-lifecycle-invalid"};
    }
  }
  return {kind: "scoped", thread_id: threadId};
}

export function unassessedHostServerEffectRequest(method) {
  return UNASSESSED_SERVER_EFFECT_REQUESTS.has(method);
}

// The direct stdio wrapper has no gateway client-policy gate. Only its three
// assessed approval methods and explicit client-owned interaction/read methods
// may reach a client; every other server request receives an upstream error.
export function sharedWrapperServerRequestPosture(message, {allow_hosted_effect_tool = false} = {}) {
  if (typeof message?.method !== "string" || !Object.hasOwn(message, "id")) return {kind: "not-applicable"};
  if (message.method === "item/tool/call" && allow_hosted_effect_tool
    && hostedEffectToolCallPosture(message).kind === "admitted") return {kind: "client-interaction"};
  if (ASSESSED_SERVER_EFFECT_REQUESTS.has(message.method)) return {kind: "assessed-effect"};
  if (EXPLICIT_CLIENT_SERVER_REQUESTS.has(message.method)) return {kind: "client-interaction"};
  return {kind: "unsupported", reason_code: SERVER_REQUESTS.has(message.method)
    ? "host.server-request-unsupported" : "host.server-request-unknown"};
}

// This is the bounded read-only Codex gateway profile, not a claim that all
// App Server effects are intercepted. Unknown fields fail closed because the
// host may add sticky execution overrides without changing a method name.
const CODEX_LIFECYCLE_FIELDS = new Map([
  ["model/list", new Set(["cursor", "limit", "includeHidden"])],
  ["thread/start", new Set(["cwd", "model", "serviceName", "personality", "ephemeral", "approvalPolicy", "sandbox"])],
  ["thread/resume", new Set(["threadId", "approvalPolicy", "sandbox"])],
  ["thread/compact/start", new Set(["threadId"])],
  ["thread/fork", new Set(["threadId", "lastTurnId", "beforeTurnId", "ephemeral", "excludeTurns", "deferGoalContinuation", "approvalPolicy", "sandbox"])],
  ["turn/start", new Set(["threadId", "input", "model", "effort", "summary", "personality", "clientUserMessageId", "turnTrigger", "additionalContext", "collaborationMode", "approvalPolicy", "sandboxPolicy", "outputSchema"])],
  ["turn/steer", new Set(["threadId", "input", "expectedTurnId"])],
  ["turn/interrupt", new Set(["threadId", "turnId"])],
  ["mcpServerStatus/list", new Set(["threadId", "detail", "limit"])],
]);

export function codexGatewayLifecycleParameterPosture(message, {allow_hosted_effect_tool = false} = {}) {
  if (message?.method === "cyberalchemy/continuation/registerPlan") {
    return codexGatewayLifecycleParameterPosture({method: "turn/start", params: message.params?.proposal?.next_turn?.params});
  }
  if (message?.method === "initialize") {
    const params = message.params;
    if (!params || typeof params !== "object" || Array.isArray(params)) return {kind: "rejected", reason_code: "host.params-invalid"};
    const capabilities = params.capabilities;
    if (capabilities !== undefined) {
      if (typeof capabilities !== "object" || Array.isArray(capabilities)) return {kind: "rejected", reason_code: "host.params-invalid"};
      if (capabilities === null || Object.keys(capabilities).some((key) =>
        !["experimentalApi", "mcpServerOpenaiFormElicitation", "optOutNotificationMethods",
          "requestAttestation"].includes(key))
        || ["experimentalApi", "mcpServerOpenaiFormElicitation", "requestAttestation"].some((key) =>
          capabilities[key] !== undefined && typeof capabilities[key] !== "boolean")) {
        return {kind: "rejected", reason_code: "host.params-invalid"};
      }
      // This gateway cannot produce an authenticated desktop attestation token.
      if (capabilities.requestAttestation === true) {
        return {kind: "rejected", reason_code: "host.attestation-unsupported"};
      }
      const suppressed = capabilities.optOutNotificationMethods;
      if (suppressed !== undefined) {
        if (!Array.isArray(suppressed)) return {kind: "rejected", reason_code: "host.params-invalid"};
        if (suppressed.length > 0) return {kind: "rejected", reason_code: "host.required-notification-opt-out"};
      }
    }
    return {kind: "admitted"};
  }
  const fields = CODEX_LIFECYCLE_FIELDS.get(message?.method);
  if (!fields) return {kind: "not-applicable"};
  const params = message?.params;
  if (!params || typeof params !== "object" || Array.isArray(params)) return {kind: "rejected", reason_code: "host.params-invalid"};
  if (Object.keys(params).some((field) => !fields.has(field)
    && !(message.method === "thread/start" && field === "dynamicTools" && allow_hosted_effect_tool))) {
    return {kind: "rejected", reason_code: "host.params-unknown-field"};
  }
  if (message.method === "model/list") {
    const cursor = params.cursor;
    return Number.isSafeInteger(params.limit) && params.limit >= 1 && params.limit <= 100
      && params.includeHidden === false
      && (cursor === undefined || cursor === null
        || (typeof cursor === "string" && cursor.length > 0
          && cursor === cursor.trim() && Buffer.byteLength(cursor, "utf8") <= 1024))
      ? {kind: "admitted"} : {kind: "rejected", reason_code: "host.params-invalid"};
  }
  if (message.method === "thread/compact/start") {
    return typeof params.threadId === "string" && params.threadId.length > 0
      && params.threadId === params.threadId.trim()
      && Buffer.byteLength(params.threadId, "utf8") <= 256
      && Object.keys(params).length === 1
      ? {kind: "admitted"} : {kind: "rejected", reason_code: "host.params-invalid"};
  }
  if (message.method === "thread/start" && Object.hasOwn(params, "dynamicTools")) {
    let matches = false;
    try { matches = allow_hosted_effect_tool && Array.isArray(params.dynamicTools)
      && params.dynamicTools.length === 1
      && digestValue(params.dynamicTools) === digestValue([HOSTED_EFFECT_DYNAMIC_TOOL]); }
    catch { matches = false; }
    if (!matches) return {kind: "rejected", reason_code: "host.dynamic-tools-unsafe"};
  }
  if (message.method === "mcpServerStatus/list") {
    if (typeof params.threadId !== "string" || !params.threadId.trim()
      || Buffer.byteLength(params.threadId, "utf8") > 256
      || params.detail !== "toolsAndAuthOnly" || params.limit !== 100) {
      return {kind: "rejected", reason_code: "host.params-invalid"};
    }
    return {kind: "admitted"};
  }
  if (message.method === "turn/steer" || message.method === "turn/interrupt") {
    if (typeof params.threadId !== "string" || !params.threadId.trim()) return {kind: "rejected", reason_code: "host.params-invalid"};
    if (message.method === "turn/steer") {
      if (typeof params.expectedTurnId !== "string" || !params.expectedTurnId.trim()
        || !Array.isArray(params.input) || params.input.length === 0) {
        return {kind: "rejected", reason_code: "host.params-invalid"};
      }
    } else if (typeof params.turnId !== "string" || !params.turnId.trim()) {
      return {kind: "rejected", reason_code: "host.params-invalid"};
    }
    return {kind: "admitted"};
  }
  if (params.approvalPolicy !== "on-request") return {kind: "rejected", reason_code: "host.approval-policy-unsafe"};
  if (message.method === "turn/start") {
    if (params.outputSchema !== undefined) {
      const schema = params.outputSchema;
      let serialized;
      try { serialized = JSON.stringify(schema); } catch { serialized = null; }
      if (!schema || typeof schema !== "object" || Array.isArray(schema)
        || schema.type !== "object" || schema.additionalProperties !== false
        || !serialized || Buffer.byteLength(serialized, "utf8") > 16384) {
        return {kind: "rejected", reason_code: "host.output-schema-unsafe"};
      }
    }
    if (params.collaborationMode !== undefined) {
      const mode = params.collaborationMode;
      const settings = mode?.settings;
      if (!mode || typeof mode !== "object" || Array.isArray(mode) || mode.mode !== "plan"
        || Object.keys(mode).some((field) => !["mode", "settings"].includes(field))
        || !settings || typeof settings !== "object" || Array.isArray(settings)
        || Object.keys(settings).some((field) => !["model", "reasoning_effort", "developer_instructions"].includes(field))
        || settings.developer_instructions !== null
        || (settings.model !== undefined && typeof settings.model !== "string")
        || (settings.reasoning_effort !== undefined && settings.reasoning_effort !== null)) {
        return {kind: "rejected", reason_code: "host.collaboration-mode-unsafe"};
      }
    }
    if (params.additionalContext !== undefined) {
      const context = params.additionalContext;
      const hint = context?.["cyberalchemy.request-context"];
      if (!context || typeof context !== "object" || Array.isArray(context)
        || Object.keys(context).some((key) => key !== "cyberalchemy.request-context")
        || !hint || typeof hint !== "object" || Array.isArray(hint) || hint.kind !== "application"
        || typeof hint.value !== "string" || hint.value.length > 65536) {
        return {kind: "rejected", reason_code: "host.client-context-unsafe"};
      }
    }
    const policy = params.sandboxPolicy;
    if (!policy || typeof policy !== "object" || Array.isArray(policy) || policy.type !== "readOnly"
      || Object.keys(policy).some((field) => !["type", "networkAccess"].includes(field))
      || (policy.networkAccess !== undefined && typeof policy.networkAccess !== "boolean")) {
      return {kind: "rejected", reason_code: "host.sandbox-policy-unsafe"};
    }
    if (typeof params.threadId !== "string" || !Array.isArray(params.input)) return {kind: "rejected", reason_code: "host.params-invalid"};
  } else {
    if (params.sandbox !== "read-only") return {kind: "rejected", reason_code: "host.sandbox-policy-unsafe"};
    if (message.method !== "thread/start" && typeof params.threadId !== "string") return {kind: "rejected", reason_code: "host.params-invalid"};
    if (message.method === "thread/fork" && params.deferGoalContinuation !== true) return {kind: "rejected", reason_code: "host.fork-continuation-unsafe"};
  }
  return {kind: "admitted"};
}

const TRUSTED_GENERATED_CONTEXT_KEYS = new Set([
  "cyberalchemy.are.context-basis", "cyberalchemy.are.cache-affinity", "cyberalchemy.are.request-intent",
  "cyberalchemy.are.objective-frontier", "cyberalchemy.request-context",
]);

export function codexGatewayGeneratedParameterPosture(message, {allow_objective_context = false} = {}) {
  if (message?.method !== "turn/start") return codexGatewayLifecycleParameterPosture(message);
  const context = message.params?.additionalContext;
  if (context === undefined) return codexGatewayLifecycleParameterPosture(message);
  if (!context || typeof context !== "object" || Array.isArray(context)
    || Object.keys(context).some((key) => !TRUSTED_GENERATED_CONTEXT_KEYS.has(key)
      && !(allow_objective_context && key === "cyberalchemy.are.objective"))) {
    return {kind: "rejected", reason_code: "host.generated-context-unsafe"};
  }
  const params = {...message.params};
  delete params.additionalContext;
  return codexGatewayLifecycleParameterPosture({...message, params});
}

const GOVERNED_TURN_METHODS = new Set([TURN_START, "turn/steer", "turn/interrupt"]);
const UNGOVERNED_EXECUTION_METHODS = new Set([
  "thread/shellCommand",
  "thread/rollback",
  "thread/compact",
  "thread/queue",
  "thread/realtime",
  "review/start",
  "command/exec",
  "process/spawn",
]);

export function ungovernedHostMethod(method) {
  if (typeof method !== "string") return false;
  return UNGOVERNED_EXECUTION_METHODS.has(method)
    || (method.startsWith("turn/") && !GOVERNED_TURN_METHODS.has(method))
    || method.startsWith("thread/compact/")
    || method.startsWith("thread/queue/")
    || method.startsWith("thread/realtime/");
}
