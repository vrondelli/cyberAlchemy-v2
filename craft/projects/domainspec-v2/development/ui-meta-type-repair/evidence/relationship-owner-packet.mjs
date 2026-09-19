import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

const PROHIBITED = [
  "packet-transport-is-not-owner-adjudication",
  "owner-acknowledgement-is-not-owner-decision",
  "endpoint-participation-is-not-ds-d1-identity",
  "relationship-use-is-not-formation-authority",
];

export function createRelationshipOwnerPacket(input, { actualAuthorityDigest }) {
  requireString(actualAuthorityDigest, "actualAuthorityDigest");
  requireString(input.owner?.handle, "owner.handle");
  if (input.authority?.digest !== actualAuthorityDigest) throw new TypeError("authority digest is superseded or does not match the current source");
  if (!Array.isArray(input.questions) || input.questions.length === 0) throw new TypeError("questions must be non-empty");
  const questionIds = new Set();
  for (const question of input.questions) {
    requireString(question.id, "question.id");
    requireString(question.question, "question.question");
    if (questionIds.has(question.id)) throw new TypeError("question ids must be unique");
    questionIds.add(question.id);
    if (!Array.isArray(question.affected_signatures) || question.affected_signatures.length === 0) throw new TypeError(`${question.id} requires affected signatures`);
    if (!Array.isArray(question.alternatives) || question.alternatives.length < 2) throw new TypeError(`${question.id} requires at least two finite alternatives`);
    const optionIds = question.alternatives.map((option) => option.id);
    if (optionIds.some((id) => typeof id !== "string" || id.length === 0) || new Set(optionIds).size !== optionIds.length) {
      throw new TypeError(`${question.id} alternative ids must be unique non-empty strings`);
    }
  }
  const examples = [...(input.examples?.positive ?? []), ...(input.examples?.negative ?? [])];
  if ((input.examples?.positive?.length ?? 0) === 0 || (input.examples?.negative?.length ?? 0) === 0) {
    throw new TypeError("positive and negative examples are required");
  }
  if (!examples.some((example) => example.kind === "authored-edge")) {
    throw new TypeError("endpoint-only evidence cannot support a relationship-owner packet");
  }
  if (!Array.isArray(input.changed_consequences) || input.changed_consequences.length === 0) throw new TypeError("changed consequences are required");
  if (input.changed_consequences.some((entry) => !questionIds.has(entry.question_id))) throw new TypeError("changed consequence references an unknown question");
  if (input.closure?.decision != null) throw new TypeError("a transport packet cannot contain an owner decision");

  const semantic = {
    schema_version: "ui-repair.relationship-owner-packet.v1",
    authority: input.authority,
    owner: input.owner,
    questions: input.questions,
    examples: input.examples,
    changed_consequences: input.changed_consequences,
    closure: {
      acknowledgement: input.closure?.acknowledgement ?? null,
      decision: null,
      required_decision_fields: ["authority_digest", "question_id", "selected_option_id", "rationale", "decided_at"],
    },
    packet_state: "pending-owner",
    prohibited_inferences: PROHIBITED,
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.relationship-owner-packet",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: "pending-owner",
    inputHandles: [`authority:${actualAuthorityDigest}`],
    createdAt: input.created_at,
  });
  return { ...envelope, semantic };
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} is required`);
}
