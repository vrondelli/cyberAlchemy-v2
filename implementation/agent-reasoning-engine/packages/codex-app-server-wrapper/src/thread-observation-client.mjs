import {randomBytes} from "node:crypto";
import {observationConnection} from "./observation-endpoint.mjs";

import {THREAD_OBSERVATION_REQUEST_SCHEMA, THREAD_OBSERVATION_RESPONSE_SCHEMA} from "./gateway.mjs";
import {GATEWAY_THREAD_OBSERVATION_SCHEMA, THREAD_OBSERVATION_PAGE_SIZE, validLearningFeedbackObservation} from "./thread-observation.mjs";

function validThread(thread) {
  const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
  const recoveryStatus = thread?.recovery_host_status ?? null;
  const recoveryDigest = thread?.recovery_host_observation_digest ?? null;
  return /^gateway-consumer:[0-9a-f]{64}$/.test(thread?.consumer_ref ?? "")
    && validLearningFeedbackObservation(thread?.learning_feedback)
    && /^backend-thread:[0-9a-f]{64}$/.test(thread?.thread_ref ?? "")
    && ["dispatch-pending", "turn-active", "turn-completed", "recovery-unverified", "recovery-terminal"].includes(thread.phase)
    && digest(thread.reasoning_epoch_digest) && digest(thread.checkpoint_digest)
    && (thread.latest_frontier_digest === null || digest(thread.latest_frontier_digest))
    && (thread.latest_frontier_event_sequence === null || Number.isSafeInteger(thread.latest_frontier_event_sequence))
    && (thread.last_completion_status === null || ["completed", "failed", "interrupted", "cancelled", "unknown"].includes(thread.last_completion_status))
    && (thread.recovered_dispatch_count === undefined || thread.recovered_dispatch_count === null
      || Number.isSafeInteger(thread.recovered_dispatch_count) && thread.recovered_dispatch_count >= 0
        && thread.recovered_dispatch_count <= 1_000_000)
    && (thread.unknown_hosted_effect_dispatch_count === undefined
      || thread.unknown_hosted_effect_dispatch_count === null
      || Number.isSafeInteger(thread.unknown_hosted_effect_dispatch_count)
        && thread.unknown_hosted_effect_dispatch_count >= 0
        && thread.unknown_hosted_effect_dispatch_count <= 1_000_000)
    && (recoveryStatus === null || ["inProgress", "completed", "failed", "interrupted"].includes(recoveryStatus))
    && (recoveryDigest === null || digest(recoveryDigest))
    && (recoveryStatus === null) === (recoveryDigest === null)
    && (["recovery-unverified", "recovery-terminal"].includes(thread.phase) || recoveryStatus === null)
    && (thread.phase !== "recovery-terminal" || ["completed", "interrupted", "failed"].includes(recoveryStatus));
}

export function readGatewayThreadObservation(options = {}) {
  const {socket_path: socketPath, token} = options;
  const timeoutMs = options.timeout_ms ?? 2500;
  const maxBytes = options.max_bytes ?? 64 * 1024;
  const pageOffset = options.page_offset ?? 0;
  const expectedDigest = options.expected_snapshot_digest ?? null;
  if (typeof socketPath !== "string" || !socketPath) throw new TypeError("Thread observation socket path is required.");
  if (typeof token !== "string" || Buffer.byteLength(token) < 32) throw new TypeError("Thread observation token is required.");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10_000) throw new TypeError("Invalid thread observation timeout.");
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1024 || maxBytes > 64 * 1024) throw new TypeError("Invalid thread observation byte limit.");
  if (!Number.isSafeInteger(pageOffset) || pageOffset < 0 || pageOffset % THREAD_OBSERVATION_PAGE_SIZE !== 0
    || (expectedDigest !== null && !/^[0-9a-f]{64}$/.test(expectedDigest))) throw new TypeError("thread.observation-invalid-page");
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
    socket.setTimeout(timeoutMs, () => finish(new Error("thread.observation-timeout")));
    socket.once("error", () => finish(new Error("thread.observation-unavailable")));
    socket.once("connect", () => socket.write(`${JSON.stringify({schema_version: THREAD_OBSERVATION_REQUEST_SCHEMA, nonce, token,
      page_offset: pageOffset, expected_snapshot_digest: expectedDigest})}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (Buffer.byteLength(buffer) > maxBytes) return finish(new Error("thread.observation-too-large"));
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      let response;
      try { response = JSON.parse(buffer.slice(0, newline)); }
      catch { return finish(new Error("thread.observation-invalid-json")); }
      if (response?.schema_version === THREAD_OBSERVATION_RESPONSE_SCHEMA && response.nonce === nonce
        && response.authority_effect === "none" && response.error === "thread.observation-source-changed") {
        return finish(new Error(response.error));
      }
      const observation = response?.observation;
      if (response?.schema_version !== THREAD_OBSERVATION_RESPONSE_SCHEMA || response.nonce !== nonce
        || observation?.schema_version !== GATEWAY_THREAD_OBSERVATION_SCHEMA || observation.authority_effect !== "none"
        || observation.source !== "gateway-in-process" || observation.scope !== "gateway-backend-threads-not-host-activation"
        || typeof observation.runtime_epoch_id !== "string" || observation.runtime_epoch_id.length < 1 || observation.runtime_epoch_id.length > 256
        || !Number.isSafeInteger(observation.observed_at_unix_ms)
        || !Number.isSafeInteger(observation.session_count) || observation.session_count < 0
        || !Number.isSafeInteger(observation.thread_count) || observation.thread_count < 0
        || observation.page_offset !== pageOffset
        || (observation.thread_count === 0 ? pageOffset !== 0 : pageOffset >= observation.thread_count)
        || !/^[0-9a-f]{64}$/.test(observation.snapshot_digest ?? "")
        || (expectedDigest !== null && observation.snapshot_digest !== expectedDigest)
        || observation.next_offset !== (pageOffset + THREAD_OBSERVATION_PAGE_SIZE < observation.thread_count
          ? pageOffset + THREAD_OBSERVATION_PAGE_SIZE : null)
        || !Number.isSafeInteger(observation.ongoing_thread_count) || observation.ongoing_thread_count < 0
        || observation.ongoing_thread_count > observation.thread_count
        || !Number.isSafeInteger(observation.omitted_ongoing_thread_count)
        || observation.omitted_ongoing_thread_count < 0
        || (observation.unknown_hosted_effect_dispatch_count !== undefined
          && observation.unknown_hosted_effect_dispatch_count !== null
          && (!Number.isSafeInteger(observation.unknown_hosted_effect_dispatch_count)
            || observation.unknown_hosted_effect_dispatch_count < 0
            || observation.unknown_hosted_effect_dispatch_count > 1_000_000
            || !Number.isSafeInteger(observation.unknown_dispatch_count)
            || observation.unknown_hosted_effect_dispatch_count > observation.unknown_dispatch_count))
        || (observation.recovered_dispatch_count !== undefined && observation.recovered_dispatch_count !== null
          && (!Number.isSafeInteger(observation.recovered_dispatch_count)
            || observation.recovered_dispatch_count < 0 || observation.recovered_dispatch_count > 1_000_000))
        || typeof observation.truncated !== "boolean" || !Array.isArray(observation.threads) || observation.threads.length > 32
        || observation.threads.length !== Math.min(THREAD_OBSERVATION_PAGE_SIZE, observation.thread_count - pageOffset)
        || observation.truncated !== (observation.thread_count > 32)
        || observation.omitted_ongoing_thread_count !== observation.ongoing_thread_count
          - observation.threads.filter((thread) => ["recovery-unverified", "turn-active", "dispatch-pending"].includes(thread?.phase)).length
        || (observation.unknown_hosted_effect_dispatch_count === undefined
          || observation.unknown_hosted_effect_dispatch_count === null
          ? observation.threads.some(thread => thread?.unknown_hosted_effect_dispatch_count !== undefined
            && thread.unknown_hosted_effect_dispatch_count !== null)
          : observation.threads.reduce((count, thread) => count
            + (thread?.unknown_hosted_effect_dispatch_count ?? 0), 0)
            > observation.unknown_hosted_effect_dispatch_count)
        || observation.threads.some((thread) => !validThread(thread))) {
        return finish(new Error("thread.observation-incompatible"));
      }
      const age = Date.now() - observation.observed_at_unix_ms;
      if (age > 5000 || age < -1000) return finish(new Error("thread.observation-stale"));
      finish(null, observation);
    });
    socket.once("close", () => { if (!settled) finish(new Error("thread.observation-closed")); });
  });
}
