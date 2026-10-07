import {digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_OWNER_DECISION_DIGEST,
  CONTINUITY_PROJECTION_SCHEMA,
  renderDeterministicContinuity,
} from "./continuity-renderer.mjs";
import {CONTINUITY_NOTIFICATION, PROTOCOL_VERSION} from "./protocol.mjs";

export const CONTINUITY_HOST_RECEIPT_SCHEMA = "are.codex-continuity-host-receipt/v1";

const NOTIFICATION_KEYS = new Set(["jsonrpc", "method", "params"]);
const PROJECTION_KEYS = new Set([
  "schema_version", "candidate_ref", "learning_package_digest", "owner_decision_digest",
  "objective_resolution_digest", "objective_state_digest", "transition", "active_objective",
  "active_cycle", "relationship_code", "response_language", "next_action",
  "clarification_needed", "evidence_status", "response", "renderer", "authority_effect",
  "projection_digest",
]);
const DIGEST = /^[a-f0-9]{64}$/u;

function closed(value, keys) {
  return isRecord(value) && Object.keys(value).every((key) => keys.has(key));
}

export function validateContinuityNotification(message) {
  const reasons = [];
  if (!closed(message, NOTIFICATION_KEYS) || message.jsonrpc !== PROTOCOL_VERSION || message.method !== CONTINUITY_NOTIFICATION) {
    reasons.push("continuity-host.notification-invalid");
  }
  const projection = message?.params;
  if (!closed(projection, PROJECTION_KEYS) || Object.keys(projection ?? {}).length !== PROJECTION_KEYS.size) {
    reasons.push("continuity-host.projection-shape-invalid");
  } else {
    if (projection.schema_version !== CONTINUITY_PROJECTION_SCHEMA
      || projection.candidate_ref !== CONTINUITY_CANDIDATE_REF
      || projection.renderer !== CONTINUITY_CANDIDATE_REF
      || projection.learning_package_digest !== CONTINUITY_LEARNING_PACKAGE_DIGEST
      || projection.owner_decision_digest !== CONTINUITY_OWNER_DECISION_DIGEST
      || projection.authority_effect !== "none") reasons.push("continuity-host.projection-binding-invalid");
    if (![projection.objective_resolution_digest, projection.objective_state_digest, projection.projection_digest].every((value) => nonEmptyString(value) && DIGEST.test(value))) {
      reasons.push("continuity-host.projection-digest-invalid");
    }
    try {
      const rendered = renderDeterministicContinuity({
        transition: projection.transition,
        active_objective: projection.active_objective,
        active_cycle: projection.active_cycle,
        relationship_code: projection.relationship_code,
        response_language: projection.response_language,
        next_action: projection.next_action,
        clarification_needed: projection.clarification_needed,
        evidence_status: projection.evidence_status,
      });
      if (rendered.response !== projection.response) reasons.push("continuity-host.rendered-response-mismatch");
    } catch {
      reasons.push("continuity-host.rendered-fields-invalid");
    }
    const material = Object.fromEntries(Object.entries(projection).filter(([key]) => key !== "projection_digest"));
    if (digestValue(material) !== projection.projection_digest) reasons.push("continuity-host.projection-digest-mismatch");
  }
  if (reasons.length > 0) return fail("continuity-host", reasons);
  return freezeResult({
    ok: true,
    projection,
    notification_digest: digestValue(message),
    authority_effect: "none",
  });
}

export function createContinuityHostConsumer(options = {}) {
  if (typeof options.surface !== "function") throw new TypeError("A continuity surface callback is required.");
  const retained = options.retained_projection_digests ?? [];
  if (!Array.isArray(retained) || retained.some((value) => !nonEmptyString(value) || !DIGEST.test(value))) {
    throw new TypeError("retained_projection_digests must contain SHA-256 digests.");
  }
  const observed = new Set(retained);
  const receipts = [];
  let receivedCount = 0;
  let surfacedCount = 0;
  let duplicateCount = 0;
  let rejectedCount = 0;

  async function consume(message) {
    receivedCount += 1;
    const validated = validateContinuityNotification(message);
    if (!validated.ok) {
      rejectedCount += 1;
      return validated;
    }
    const duplicate = observed.has(validated.projection.projection_digest);
    const disposition = duplicate ? "duplicate-suppressed" : "surfaced";
    if (duplicate) duplicateCount += 1;
    else {
      try {
        await options.surface(validated.projection);
      } catch {
        rejectedCount += 1;
        return fail("continuity-host", ["continuity-host.surface-failed"]);
      }
      observed.add(validated.projection.projection_digest);
      surfacedCount += 1;
    }
    const material = {
      schema_version: CONTINUITY_HOST_RECEIPT_SCHEMA,
      sequence: receipts.length + 1,
      projection_digest: validated.projection.projection_digest,
      notification_digest: validated.notification_digest,
      disposition,
      authority_effect: "none",
    };
    const receipt = freezeResult({...material, receipt_digest: digestValue(material)});
    receipts.push(receipt);
    return freezeResult({ok: true, disposition, receipt, projection: validated.projection, authority_effect: "none"});
  }

  return Object.freeze({
    consume,
    inspect: () => freezeResult({
      schema_version: "are.codex-continuity-host-consumer-state/v1",
      received_count: receivedCount,
      surfaced_count: surfacedCount,
      duplicate_suppressed_count: duplicateCount,
      rejected_count: rejectedCount,
      retained_projection_digests: [...observed].sort(),
      receipts: [...receipts],
      authority_effect: "none",
    }),
  });
}
