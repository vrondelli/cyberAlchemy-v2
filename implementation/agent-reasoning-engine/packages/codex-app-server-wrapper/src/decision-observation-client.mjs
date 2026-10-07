import {randomBytes} from "node:crypto";
import {observationConnection} from "./observation-endpoint.mjs";

import {DECISION_OBSERVATION_REQUEST_SCHEMA, DECISION_OBSERVATION_RESPONSE_SCHEMA} from "./gateway.mjs";
import {GATEWAY_DECISION_OBSERVATION_SCHEMA} from "./decision-observation.mjs";

const DIGEST = /^[0-9a-f]{64}$/;
const REASON = /^[a-z0-9][a-z0-9._-]{0,127}$/;
function validDecision(decision) {
  return ["turn-preflight", "effect-evaluation", "turn-continuation"].includes(decision?.decision_type)
    && ["direct", "gate", "block", "stop", "unknown"].includes(decision.outcome)
    && /^gateway-consumer:[0-9a-f]{64}$/.test(decision.consumer_ref ?? "")
    && /^backend-thread:[0-9a-f]{64}$/.test(decision.thread_ref ?? "")
    && DIGEST.test(decision.decision_digest ?? "") && DIGEST.test(decision.evidence_event_digest ?? "")
    && Number.isSafeInteger(decision.event_sequence) && decision.event_sequence > 0
    && Number.isSafeInteger(decision.observed_at_unix_ms) && decision.observed_at_unix_ms > 0
    && Array.isArray(decision.reason_codes) && decision.reason_codes.length <= 8
    && decision.reason_codes.every((reason) => typeof reason === "string" && REASON.test(reason));
}

export function readGatewayDecisionObservation(options = {}) {
  const {socket_path: socketPath, token} = options;
  const timeoutMs = options.timeout_ms ?? 2500;
  const maxBytes = options.max_bytes ?? 64 * 1024;
  if (typeof socketPath !== "string" || !socketPath) throw new TypeError("Decision observation socket path is required.");
  if (typeof token !== "string" || Buffer.byteLength(token) < 32) throw new TypeError("Decision observation token is required.");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10_000) throw new TypeError("Invalid decision observation timeout.");
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1024 || maxBytes > 128 * 1024) throw new TypeError("Invalid decision observation byte limit.");
  const nonce = randomBytes(24).toString("base64url");
  return new Promise((resolveRead, rejectRead) => {
    const socket = observationConnection(socketPath);
    let settled = false;
    let buffer = "";
    const finish = (error, observation = null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) rejectRead(error);
      else resolveRead(observation);
    };
    socket.setTimeout(timeoutMs, () => finish(new Error("decision.observation-timeout")));
    socket.once("error", () => finish(new Error("decision.observation-unavailable")));
    socket.once("connect", () => socket.write(`${JSON.stringify({schema_version: DECISION_OBSERVATION_REQUEST_SCHEMA, nonce, token})}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (Buffer.byteLength(buffer) > maxBytes) return finish(new Error("decision.observation-too-large"));
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      let response;
      try { response = JSON.parse(buffer.slice(0, newline)); }
      catch { return finish(new Error("decision.observation-invalid-json")); }
      const observation = response?.observation;
      if (response?.schema_version !== DECISION_OBSERVATION_RESPONSE_SCHEMA || response.nonce !== nonce
        || observation?.schema_version !== GATEWAY_DECISION_OBSERVATION_SCHEMA || observation.authority_effect !== "none"
        || observation.source !== "gateway-in-process" || observation.scope !== "gateway-backend-decisions-not-durable-host-history"
        || typeof observation.runtime_epoch_id !== "string" || observation.runtime_epoch_id.length < 1 || observation.runtime_epoch_id.length > 256
        || !Number.isSafeInteger(observation.observed_at_unix_ms)
        || !Number.isSafeInteger(observation.session_count) || observation.session_count < 0
        || !Number.isSafeInteger(observation.decision_count) || observation.decision_count < 0
        || typeof observation.truncated !== "boolean" || !Array.isArray(observation.decisions) || observation.decisions.length > 32
        || observation.decisions.length !== Math.min(32, observation.decision_count)
        || observation.truncated !== (observation.decision_count > 32)
        || observation.decisions.some((decision) => !validDecision(decision))) {
        return finish(new Error("decision.observation-incompatible"));
      }
      const age = Date.now() - observation.observed_at_unix_ms;
      if (age > 5000 || age < -1000) return finish(new Error("decision.observation-stale"));
      finish(null, observation);
    });
    socket.once("close", () => { if (!settled) finish(new Error("decision.observation-closed")); });
  });
}
