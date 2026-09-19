import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

const PLANES = ["mutation", "reroute", "corpus", "relationship_packet", "dossier"];

export function createOrchestrationIndexEntry(input, { expectedHead = null } = {}) {
  if (typeof input.branch_id !== "string" || input.branch_id.length === 0) throw new TypeError("branch_id is required");
  if (expectedHead !== null && input.predecessor_generation_id !== expectedHead && input.branch_id === "main") {
    throw new TypeError("predecessor fork requires an explicit non-main branch identity");
  }
  if (expectedHead === null && input.predecessor_generation_id !== null && input.branch_id === "main") {
    throw new TypeError("initial main generation cannot name an unknown predecessor");
  }
  const recordHandles = {};
  for (const plane of PLANES) {
    const record = input.records?.[plane];
    requireDigest(record?.record_id, "record:sha256", `${plane}.record_id`);
    requireDigest(record?.content_digest, "sha256", `${plane}.content_digest`);
    requireDigest(record?.generation_id, "generation:sha256", `${plane}.generation_id`);
    recordHandles[plane] = {
      record_id: record.record_id,
      content_digest: record.content_digest,
      generation_id: record.generation_id,
    };
  }
  if (!input.replay || !Array.isArray(input.replay.checks) || input.replay.checks.length !== PLANES.length) throw new TypeError("replay requires five checks");
  const allMatch = input.replay.checks.every((check) => check.match === true && check.expected_content_digest === check.observed_content_digest && check.expected_generation_id === check.observed_generation_id);
  if (!allMatch && input.invalidation == null) throw new TypeError("replay mismatch requires explained invalidation");
  if (allMatch && input.replay.status !== "identical") throw new TypeError("matching replay must be identical");
  if (!allMatch && input.replay.status !== "invalidated") throw new TypeError("mismatching replay must be invalidated");
  if (input.invalidation != null) {
    requireDigest(input.predecessor_generation_id, "generation:sha256", "predecessor_generation_id");
    if (input.invalidation.invalidated_generation_id !== input.predecessor_generation_id) throw new TypeError("invalidation must name the predecessor generation");
    if (typeof input.invalidation.reason !== "string" || input.invalidation.reason.length === 0) throw new TypeError("invalidation reason is required");
  }
  if (!Array.isArray(input.owner_inputs) || input.owner_inputs.length === 0) throw new TypeError("owner_inputs are required");
  for (const handle of input.owner_inputs) requireDigest(handle, "generation:sha256", "owner_inputs");

  const semantic = {
    schema_version: "ui-repair.orchestration-index-entry.v1",
    branch_id: input.branch_id,
    predecessor_generation_id: input.predecessor_generation_id,
    invalidation: input.invalidation,
    record_handles: recordHandles,
    replay: input.replay,
    owner_inputs: [...input.owner_inputs].sort(),
    authority_boundary: "mechanical-index-is-not-authority-or-owner-adjudication",
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.orchestration-index-entry",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: "complete",
    predecessorGenerationId: input.predecessor_generation_id,
    inputHandles: [...Object.values(recordHandles).map((entry) => entry.generation_id), ...input.owner_inputs].filter((value, index, array) => array.indexOf(value) === index).sort(),
    createdAt: input.created_at,
  });
  return { ...envelope, semantic };
}

function requireDigest(value, prefix, label) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (typeof value !== "string" || !new RegExp(`^${escaped}:[a-f0-9]{64}$`).test(value)) throw new TypeError(`${label} is invalid`);
}
