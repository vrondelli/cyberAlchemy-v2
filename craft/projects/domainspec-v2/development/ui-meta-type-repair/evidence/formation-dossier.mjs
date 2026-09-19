import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

export const CONJUNCT_ORDER = [
  "independent-positive",
  "stable-contrast",
  "label-erasure",
  "criterion-erasure",
  "changed-consequence",
  "typed-negatives",
  "corpus-bound-portability",
  "owner-firewall",
];
const STATES = new Set(["pass", "fail", "missing", "disputed", "pending-owner"]);
const PROHIBITED = [
  "dossier-outcome-is-not-semantic-identity",
  "evidence-complete-is-not-replication-or-promotion",
  "shared-hygiene-is-not-an-independent-positive",
  "weighted-score-cannot-replace-a-hard-conjunct",
];

export function createFormationDossier(input) {
  for (const key of ["score", "weight", "weights", "threshold"]) {
    if (Object.hasOwn(input, key) || input.conjuncts?.some((entry) => Object.hasOwn(entry, key))) {
      throw new TypeError(`${key} is prohibited in a conjunctive dossier`);
    }
  }
  requireString(input.subject, "subject");
  const producerHandles = input.producer_handles;
  for (const key of ["mutation", "reroute", "corpus", "relationship_packet"]) requireGeneration(producerHandles?.[key], `producer_handles.${key}`);
  if (!Array.isArray(input.conjuncts) || input.conjuncts.length !== CONJUNCT_ORDER.length) throw new TypeError("dossier requires exactly eight conjuncts");
  for (const [index, expected] of CONJUNCT_ORDER.entries()) {
    const conjunct = input.conjuncts[index];
    if (conjunct.id !== expected) throw new TypeError(`conjunct ${index + 1} must be ${expected}`);
    if (!STATES.has(conjunct.state)) throw new TypeError(`${expected} has invalid state`);
    if (!Array.isArray(conjunct.evidence_handles)) throw new TypeError(`${expected} requires evidence_handles`);
    requireString(conjunct.reason, `${expected}.reason`);
    if (conjunct.state === "pass" && conjunct.evidence_handles.length === 0) throw new TypeError(`${expected} pass requires evidence`);
  }
  requireEvidenceClass(input.conjuncts[0], "independent-witness");
  requireEvidenceClass(input.conjuncts[1], "independent-witness");
  requireEvidenceClass(input.conjuncts[2], "erasure-test");
  requireEvidenceClass(input.conjuncts[3], "erasure-test");

  let outcome = "DEFER";
  if (input.conjuncts.every((entry) => entry.state === "pass")) {
    outcome = "EVIDENCE-COMPLETE";
  } else if (input.finite_zeroing != null) {
    if (input.finite_zeroing.closed !== true || input.finite_zeroing.all_zero !== true || !Array.isArray(input.finite_zeroing.witness_handles) || input.finite_zeroing.witness_handles.length === 0) {
      throw new TypeError("finite zeroing requires closed all-zero witness handles");
    }
    if (!input.conjuncts.every((entry) => entry.state === "fail")) throw new TypeError("DOSSIER-ZEROED requires every conjunct to be finitely failed");
    outcome = "DOSSIER-ZEROED";
  }
  const semantic = {
    schema_version: "ui-repair.formation-dossier.v1",
    subject: input.subject,
    producer_handles: producerHandles,
    conjuncts: input.conjuncts,
    finite_zeroing: input.finite_zeroing ?? null,
    outcome,
    next_owner: outcome === "DOSSIER-ZEROED" ? "owner:domainspec-v2/DS-D1" : outcome === "EVIDENCE-COMPLETE" ? "owner:experimental-review" : "owner:evidence-repair",
    prohibited_inferences: PROHIBITED,
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.formation-dossier",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: outcome === "DEFER" ? "defer" : outcome === "DOSSIER-ZEROED" ? "dossier-zeroed" : "evidence-complete",
    inputHandles: Object.values(producerHandles).sort(),
    createdAt: input.created_at,
  });
  return { ...envelope, semantic };
}

function requireEvidenceClass(conjunct, required) {
  if (conjunct.state === "pass" && conjunct.evidence_class !== required) {
    throw new TypeError(`${conjunct.id} pass requires ${required} evidence`);
  }
  if (["independent-positive", "stable-contrast", "label-erasure", "criterion-erasure"].includes(conjunct.id) && conjunct.evidence_class === "shared-hygiene") {
    throw new TypeError(`shared hygiene cannot satisfy ${conjunct.id}`);
  }
}

function requireGeneration(value, label) {
  if (typeof value !== "string" || !/^generation:sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} is invalid`);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} is required`);
}
