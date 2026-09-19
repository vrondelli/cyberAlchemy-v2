import { buildEnvelope, validateEnvelope } from "../contracts/canonical-json-v1.mjs";

const EXPECTED = new Map([
  ["action-source", { option: "admit-distinct-source", disposition: "route-open", handle: "decision:DEC-UIR-010.1" }],
  ["hook-binding", { option: "retain-separation", disposition: "retained-current", handle: "decision:DEC-UIR-010.2" }],
  ["guard-target", { option: "retain-page-rule", disposition: "retained-current", handle: "decision:DEC-UIR-010.3" }],
  ["binding-node-relation", { option: "retain-binding-node", disposition: "retained-current", handle: "decision:DEC-UIR-010.4" }],
]);
const PROHIBITED_FIELDS = ["changed_signature_count", "invented_verb", "invented_target", "ds_d1_promotion", "packet_mutation"];
const PROHIBITED = [
  "owner-decision-record-does-not-mutate-authority",
  "route-open-is-not-signature-admission",
  "endpoint-retention-is-not-ds-d1-promotion",
  "finite-current-targets-are-not-universal-closure",
  "packet-transport-remains-decision-free",
];

export function createRelationshipOwnerDecision(input, { packet, actualAuthorityDigest }) {
  if (!packet || typeof packet !== "object") throw new TypeError("packet is required");
  validateEnvelope(packet, Object.keys(packet.semantic ?? {}));
  if (packet.contract_id !== "ui-repair.relationship-owner-packet" || packet.contract_version !== "1.0.0") throw new TypeError("invalid packet contract");
  if (packet.semantic.closure.decision !== null || packet.semantic.packet_state !== "pending-owner") throw new TypeError("packet transport must remain decision-free");
  if (packet.semantic.authority.digest !== actualAuthorityDigest || input.authority_digest !== actualAuthorityDigest) throw new TypeError("authority digest drift");
  if (input.packet_generation_id !== packet.generation_id || input.packet_record_id !== packet.record_id || input.packet_content_digest !== packet.content_digest) throw new TypeError("packet handle mismatch");
  if (input.authority_effect !== "none" || input.signature_count !== packet.semantic.authority.signature_count) throw new TypeError("authority mutation is prohibited");
  if (!Array.isArray(input.decisions) || input.decisions.length !== EXPECTED.size) throw new TypeError("exactly four decisions are required");

  const questionById = new Map(packet.semantic.questions.map((question) => [question.id, question]));
  const seen = new Set();
  const decisions = input.decisions.map((decision) => {
    for (const field of PROHIBITED_FIELDS) if (Object.hasOwn(decision, field)) throw new TypeError(`${field} is prohibited`);
    if (seen.has(decision.question_id)) throw new TypeError(`duplicate decision for ${decision.question_id}`);
    seen.add(decision.question_id);
    const expected = EXPECTED.get(decision.question_id);
    const question = questionById.get(decision.question_id);
    if (!expected || !question) throw new TypeError(`unknown question ${decision.question_id}`);
    if (!question.alternatives.some((option) => option.id === decision.selected_option_id)) throw new TypeError(`invalid option for ${decision.question_id}`);
    if (decision.selected_option_id !== expected.option || decision.disposition !== expected.disposition || decision.decision_handle !== expected.handle) throw new TypeError(`decision does not match DEC-UIR-010 for ${decision.question_id}`);
    if (decision.authority_effect !== "none") throw new TypeError("authority mutation is prohibited");
    if (!Array.isArray(decision.admitted_signatures) || decision.admitted_signatures.length !== 0) throw new TypeError("no signature may be admitted");
    if (!Array.isArray(decision.evidence_obligations)) throw new TypeError("evidence_obligations must be an array");
    if (decision.disposition === "route-open" && decision.evidence_obligations.length < 5) throw new TypeError("route-open requires explicit successor obligations");
    requireString(decision.rationale, "rationale");
    return decision;
  }).sort((left, right) => left.question_id.localeCompare(right.question_id));
  for (const questionId of EXPECTED.keys()) if (!seen.has(questionId)) throw new TypeError(`missing decision for ${questionId}`);

  const semantic = {
    schema_version: "ui-repair.relationship-owner-decision.v1",
    packet: { record_id: packet.record_id, generation_id: packet.generation_id, content_digest: packet.content_digest },
    authority: { id: "DS-D8", version: 1, digest: actualAuthorityDigest, signature_count: packet.semantic.authority.signature_count, effect: "none" },
    owner: packet.semantic.owner.handle,
    decisions,
    decision_state: "resolved-no-authority-effect",
    prohibited_inferences: PROHIBITED,
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.relationship-owner-decision",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: "complete",
    inputHandles: [packet.record_id, packet.generation_id, `authority:${actualAuthorityDigest}`, ...decisions.map((entry) => entry.decision_handle)].sort(),
    createdAt: input.decided_at,
  });
  return { ...envelope, semantic };
}

function requireString(value, label) { if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} is required`); }
