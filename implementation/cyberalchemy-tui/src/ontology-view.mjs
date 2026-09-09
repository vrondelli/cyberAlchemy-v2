export const DEFINITIONS = Object.freeze([
  Object.freeze({id: "CAV2-D9", term: "CyberAlchemy v2", meaning: "The stable product base people and machines build from."}),
  Object.freeze({id: "CAV2-D19", term: "Ontology", meaning: "A map of meaning with typed links, receipts, and rules for use."}),
  Object.freeze({id: "CAV2-D33", term: "Definition", meaning: "The project-owned place where a term is allowed to mean something."}),
  Object.freeze({id: "CAV2-D44", term: "View-Bearing Concept", meaning: "A concept important enough to need a view without letting the view decide."}),
  Object.freeze({id: "CAV2-D66", term: "Context", meaning: "The stable frame for what work is about and which sources and consumers apply."}),
  Object.freeze({id: "CAV2-D67", term: "Product Capability", meaning: "A useful outcome the product must enable, separate from its realization."}),
]);

export const ONTOLOGY_RELATIONS = Object.freeze([
  Object.freeze({subject: "CyberAlchemy", relation: "serves", object: "Human Participant"}),
  Object.freeze({subject: "CyberAlchemy", relation: "includes-capability", object: "Governed Work Loop"}),
  Object.freeze({subject: "CyberAlchemy", relation: "includes-capability", object: "Define Shared Meaning"}),
  Object.freeze({subject: "Human Participant", relation: "collaborates-with", object: "Machine Collaborator"}),
  Object.freeze({subject: "Define Shared Meaning", relation: "consumes", object: "Define Input Contract"}),
  Object.freeze({subject: "Define Shared Meaning", relation: "produces", object: "Definition Pack"}),
  Object.freeze({subject: "Define Shared Meaning", relation: "requires", object: "Context Sufficiency"}),
  Object.freeze({subject: "Definition Pack", relation: "enables", object: "Reviewable Next Step"}),
]);

export function renderRelationLine(relation) {
  return `${relation.subject} -${relation.relation}→ ${relation.object}`;
}
