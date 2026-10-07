import {isRecord} from "./canonical.mjs";
import {codexServerRequestCriticalShapePosture, codexServerRequestTurnPosture,
  gatewayServerMethodPosture, sharedWrapperServerRequestPosture} from "./host-method-policy.mjs";
import {CONTINUITY_NOTIFICATION, DIRECTIVE_NOTIFICATION, SEMANTIC_NOTIFICATION,
  SUCCESSOR_NOTIFICATION} from "./protocol.mjs";

const SIDEBAND_NOTIFICATIONS = new Set([CONTINUITY_NOTIFICATION, DIRECTIVE_NOTIFICATION,
  SEMANTIC_NOTIFICATION, SUCCESSOR_NOTIFICATION]);
const REMOTE_STATUSES = new Set(["disabled", "connecting", "connected", "errored"]);

export function desktopHostGlobalNotificationPosture(message) {
  if (message?.method !== "remoteControl/status/changed") return {kind: "not-applicable"};
  const params = message.params;
  const bounded = value => typeof value === "string" && value.length > 0
    && value === value.trim() && Buffer.byteLength(value, "utf8") <= 256;
  if (Object.hasOwn(message, "id") || !isRecord(params)
    || Object.keys(params).some(key => !["status", "serverName", "installationId", "environmentId"].includes(key))
    || !REMOTE_STATUSES.has(params.status) || !bounded(params.serverName)
    || !bounded(params.installationId)
    || !(params.environmentId === undefined || params.environmentId === null
      || bounded(params.environmentId))) {
    return {kind: "rejected", reason: "desktop-gateway.global-notification-invalid"};
  }
  return {kind: "admitted"};
}

export function isDesktopSidebandNotification(message) {
  return isRecord(message) && !Object.hasOwn(message, "id")
    && SIDEBAND_NOTIFICATIONS.has(message.method);
}

// The desktop's App Server stream accepts only its pinned native methods.
// ARE notifications remain gateway/observation state, not invented host events.
export function desktopHostDeliveryPosture(message) {
  if (!isRecord(message) || message.jsonrpc !== undefined && message.jsonrpc !== "2.0") {
    return {kind: "rejected", reason: "desktop-gateway.delivery-invalid"};
  }
  if (typeof message.method === "string") {
    if (!message.method) return {kind: "rejected", reason: "desktop-gateway.delivery-invalid"};
    if (isDesktopSidebandNotification(message)) return {kind: "sideband"};
    const global = desktopHostGlobalNotificationPosture(message);
    if (global.kind === "admitted") return {kind: "native-notification"};
    if (global.kind === "rejected") return global;
    const policy = gatewayServerMethodPosture(message);
    if (Object.hasOwn(message, "id")) {
      const wrapper = sharedWrapperServerRequestPosture(message);
      const turn = codexServerRequestTurnPosture(message);
      const shape = codexServerRequestCriticalShapePosture(message);
      return ["assessed-effect", "client-interaction"].includes(wrapper.kind)
        && policy.kind === "scoped" && ["scoped", "not-applicable"].includes(turn.kind)
        && ["admitted", "not-applicable"].includes(shape.kind)
        ? {kind: "native-request"}
        : {kind: "rejected", reason: "desktop-gateway.server-request-unsupported"};
    }
    return ["scoped", "thread-started"].includes(policy.kind)
      ? {kind: "native-notification"}
      : {kind: "rejected", reason: "desktop-gateway.server-notification-unsupported"};
  }
  if (Object.hasOwn(message, "method")
    || (Object.hasOwn(message, "result") === Object.hasOwn(message, "error"))) {
    return {kind: "rejected", reason: "desktop-gateway.delivery-invalid"};
  }
  if (typeof message.id === "string" || Number.isSafeInteger(message.id)) return {kind: "native-response"};
  if (message.id === null && isRecord(message.error)) return {kind: "native-error"};
  return {kind: "rejected", reason: "desktop-gateway.delivery-invalid"};
}
