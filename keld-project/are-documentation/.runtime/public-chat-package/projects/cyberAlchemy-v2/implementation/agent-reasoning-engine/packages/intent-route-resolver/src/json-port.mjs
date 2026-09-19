import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
} from "./canonical-json.mjs";
import {
  REQUEST_SCHEMA_VERSION,
  admitRouteRequest,
} from "./request.mjs";
import {resolveIntentRoute} from "./resolve.mjs";

export const RUNTIME_PORT_PROTOCOL_VERSION = "intent-route.runtime-port@1";

function requestIdOf(value) {
  return typeof value?.request_id === "string" ? value.request_id : null;
}

function diagnosticResponse(requestId, subject, reasonCode, details = []) {
  return deepFreeze(canonicalizeJson({
    protocol_version: RUNTIME_PORT_PROTOCOL_VERSION,
    request_id: requestId,
    disposition: null,
    transport_diagnostic: {
      subject,
      reason_codes: [reasonCode],
      details: [...new Set(details)].sort(),
    },
  }));
}

export function resolveJsonValue(value) {
  if (value?.schema_version !== REQUEST_SCHEMA_VERSION) {
    return diagnosticResponse(
      requestIdOf(value),
      "request",
      "port.unsupported-request-version",
    );
  }

  const admission = admitRouteRequest(value);
  if (!admission.ok) {
    return diagnosticResponse(
      requestIdOf(value),
      "request",
      "port.invalid-request",
      admission.diagnostic.reason_codes,
    );
  }

  return deepFreeze(canonicalizeJson({
    protocol_version: RUNTIME_PORT_PROTOCOL_VERSION,
    request_id: admission.value.request_id,
    disposition: resolveIntentRoute(admission.value),
    transport_diagnostic: null,
  }));
}

export function resolveJson(requestText) {
  if (typeof requestText !== "string") {
    return canonicalJson(diagnosticResponse(
      null,
      "transport",
      "port.invalid-json",
      ["transport.expected-string"],
    ));
  }

  let value;
  try {
    value = JSON.parse(requestText);
  } catch {
    return canonicalJson(diagnosticResponse(
      null,
      "transport",
      "port.invalid-json",
    ));
  }

  try {
    return canonicalJson(resolveJsonValue(value));
  } catch {
    return canonicalJson(diagnosticResponse(
      requestIdOf(value),
      "request",
      "port.invalid-request",
      ["request.unprocessable"],
    ));
  }
}
