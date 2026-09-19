import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

const SOURCE_OUTCOMES = new Set(["rejected", "accepted", "invalid"]);
const DESTINATION_OUTCOMES = new Set(["shape-accepted", "rejected", "pending-owner", "not-testable"]);
const PROHIBITED = [
  "source-rejection-is-not-destination-acceptance",
  "shape-acceptance-is-not-destination-identity",
  "owner-acknowledgement-is-not-owner-decision",
];

export function createRerouteReceipt(input) {
  if (Object.hasOwn(input, "destination_identity")) {
    throw new TypeError("destination identity is prohibited in a reroute receipt");
  }
  requireEnum(input.source_outcome, SOURCE_OUTCOMES, "source_outcome");
  requireEnum(input.destination_outcome, DESTINATION_OUTCOMES, "destination_outcome");
  requireString(input.specimen_digest, "specimen_digest");
  requireString(input.source_contract, "source_contract");
  requireString(input.destination_contract, "destination_contract");
  if (input.destination_outcome === "shape-accepted" && !input.destination_handle) {
    throw new TypeError("shape-accepted requires destination_handle");
  }
  if (input.destination_outcome === "pending-owner" && !input.owner_handle) {
    throw new TypeError("pending-owner requires owner_handle");
  }

  const recordState = input.source_outcome === "invalid" ? "invalid" : "complete";
  const semantic = {
    schema_version: "ui-repair.reroute-receipt.v1",
    specimen_digest: input.specimen_digest,
    source_contract: input.source_contract,
    source_outcome: input.source_outcome,
    destination_contract: input.destination_contract,
    destination_outcome: input.destination_outcome,
    destination_handle: input.destination_handle ?? null,
    owner_handle: input.owner_handle ?? null,
    disposition: disposition(input.source_outcome, input.destination_outcome),
    record_state: recordState,
    prohibited_inferences: PROHIBITED,
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.reroute-receipt",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: recordState === "invalid" ? "invalid" : input.destination_outcome === "pending-owner" ? "pending-owner" : "complete",
    inputHandles: [input.specimen_digest],
    createdAt: input.observed_at,
  });
  return { ...envelope, semantic };
}

function disposition(source, destination) {
  if (source === "invalid") return "invalid";
  if (source !== "rejected") return "not-rerouted";
  if (destination === "shape-accepted") return "rerouted";
  if (destination === "pending-owner") return "pending-owner";
  if (destination === "not-testable") return "not-testable";
  return "not-rerouted";
}

function requireEnum(value, values, label) {
  if (!values.has(value)) throw new TypeError(`${label} is invalid`);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} is required`);
}
