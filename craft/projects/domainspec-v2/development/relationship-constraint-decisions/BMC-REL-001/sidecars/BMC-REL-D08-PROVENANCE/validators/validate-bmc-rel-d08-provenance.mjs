#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SIDE = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D08-PROVENANCE';
const paths = {
  candidate: `${SIDE}/candidates/BMC-REL-D08-EVENT-PROVENANCE-CANDIDATE.md`,
  request: `${SIDE}/decision-gate/BMC-REL-D08-OPTION-ADMISSIBILITY-REQUEST.json`,
  receipt: `${SIDE}/decision-gate/BMC-REL-D08-OPTION-ADMISSIBILITY-RECEIPT.json`,
  preparation: `${SIDE}/receipts/BMC-REL-D08-PREPARATION-RECEIPT.json`,
  selection: `${SIDE}/receipts/BMC-REL-D08-SELECTION-CLOSEOUT-RECEIPT.json`,
  relationshipsCompanion: 'projects/domainspec-v2/definitions/relationships/relationships.md',
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  definitions: 'projects/domainspec-v2/definitions/DEFINITIONS.md',
  registry: 'projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  mainValidator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs',
  d07Selection: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION/receipts/BMC-REL-D07-P02-SELECTION-RECEIPT.json',
  parent: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md'
};

const expected = {
  [paths.candidate]: '3ba43eef923c675eab66b9d8e97fbae2ab951a0cd96cbe1f550ef14b36d4e35e',
  [paths.request]: 'bb511c45109029b0bec1bb5732b7bed218926e27260bcc43b5c6e96deeb89a15',
  [paths.receipt]: 'f6ef196c08951712f4054d5ed9e76e3151f3bbc4767caff0a150792fe2f977fd',
  [paths.selection]: '31ff7cdc1daac554db4d9989e0d159571c4083beddabbd0ad1e7b1169a798d0b',
  [paths.relationshipsCompanion]: '266cd0ce3773525b63b617a35ffe026341b3b9d1ca1a2328367de2d77ff6ac16',
  [paths.relationships]: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1',
  [paths.definitions]: '92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf',
  [paths.registry]: '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c',
  [paths.packet]: 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0',
  [paths.schema]: 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7',
  [paths.mainValidator]: '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975',
  [paths.d07Selection]: '5a680b76fa8eef8fe4676e4deeae67c59e22f2ae0a1d825b92a55262643ff65c'
};

const admissible = [
  'BMC-REL-D08-A-VERB-LOCAL-TYPED-PROVENANCE-NON-COLLAPSE',
  'BMC-REL-D08-B-RETAIN-CANONICAL-ENDPOINT-PROVENANCE-ONLY',
  'BMC-REL-D08-C-DEFER',
  'BMC-REL-D08-D-STOP'
];
const rejected = [
  'BMC-REL-D08-W-RUNTIME-CAUSAL-EQUALITY',
  'BMC-REL-D08-X-COLLAPSE-PRODUCES-AND-EMITS',
  'BMC-REL-D08-Y-MANDATORY-CROSS-VERB-PAIR',
  'BMC-REL-D08-Z-TOKEN-DERIVED-PROVENANCE-COUNTS'
];

function assert(value, message) { if (!value) throw new Error(message); }
function file(rel) { return fs.readFileSync(path.join(ROOT, rel)); }
function text(rel) { return file(rel).toString('utf8'); }
function json(rel) { return JSON.parse(text(rel)); }
function sha(rel) { return crypto.createHash('sha256').update(file(rel)).digest('hex'); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function exact(actual, wanted, label) { assert(JSON.stringify(actual) === JSON.stringify(wanted), `${label} mismatch`); }

for (const [rel, digest] of Object.entries(expected)) assert(sha(rel) === digest, `bound-byte drift: ${rel}`);

const companion = text(paths.relationshipsCompanion);
for (const phrase of [
  '`Operation --[produces]--> Event` | An operation causes an event on successful completion.',
  '`Entity --[emits]--> Event` | An entity is the subject/source of a domain event.',
  'Use `Operation --[produces]--> Event` when an operation causes an event on completion.',
  'Use `Entity --[emits]--> Event` when an entity is the event subject/source.',
  '`Operation --[emits]--> Event` is invalid.'
]) assert(companion.includes(phrase), `canonical Event provenance evidence drift: ${phrase}`);

const packet = json(paths.packet);
const produces = packet.rows.find((row) => row.signature_id === 'produces');
const emits = packet.rows.find((row) => row.signature_id === 'emits');
assert(produces.current_authority.source_types.join(',') === 'Operation' && produces.current_authority.target_types.join(',') === 'Event', 'produces endpoint drift');
assert(emits.current_authority.source_types.join(',') === 'Entity' && emits.current_authority.target_types.join(',') === 'Event', 'emits endpoint drift');
assert(produces.current_authority.multiplicity_token === 'one_to_many' && emits.current_authority.multiplicity_token === 'one_to_many', 'compatibility token drift');
for (const row of [produces, emits]) {
  assert(row.numeric_bounds_evidence.status === 'unresolved', `${row.signature_id} numeric evidence must remain unresolved`);
  assert(row.proposed_decision.status === 'unresolved', `${row.signature_id} ordinary facets must remain unresolved`);
}

const candidate = text(paths.candidate);
for (const phrase of [
  'Authority effect: `none`',
  'Decision effect: `none`',
  'The shared Event target does not establish equality, pairing, implication, uniqueness, or numeric authority',
  'Recommend `BMC-REL-D08-A-VERB-LOCAL-TYPED-PROVENANCE-NON-COLLAPSE`',
  '### Low — one Operation-caused Event',
  '### Medium — one Event with both provenance facts',
  '### Complex — incomplete and conflicting provenance pressure',
  'decision_effect: none'
]) assert(candidate.includes(phrase), `D08 candidate boundary missing: ${phrase}`);
for (const id of [...admissible, ...rejected]) assert(candidate.includes(id), `D08 candidate option missing: ${id}`);

const request = json(paths.request);
const receipt = json(paths.receipt);
assert(request.decisionId === 'BMC-REL-D08-EVENT-PROVENANCE', 'D08 request decision ID drift');
assert(request.candidates.length === 8, 'D08 candidate inventory drift');
for (const option of request.candidates) {
  assert(option.reversibility === 'reversible', `${option.optionId} reversibility drift`);
  if (option.structuralStatus === 'admissible' && option.optionKind === 'action') {
    assert(option.hazardClass === 'authority' && option.ownerGate === 'decision-gate:owner-decision', `${option.optionId} authority gate drift`);
  }
  if (option.structuralStatus === 'inadmissible') assert(option.rejectionReasons.length > 0, `${option.optionId} missing rejection reason`);
}
const digest = crypto.createHash('sha256').update(JSON.stringify(stable(request))).digest('hex');
assert(receipt.requestDigest === digest, 'D08 canonical request digest mismatch');
assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired === true, 'D08 must remain an owner gate');
exact(receipt.admissibleOptionIds, admissible, 'D08 admissible options');
exact(receipt.presentedOptionIds, admissible, 'D08 presented options');
exact(receipt.rejectedOptions.map((item) => item.optionId), rejected, 'D08 rejected options');
assert(receipt.directOptionId === null && receipt.ownerGate === null, 'D08 prefilter inferred a choice');

const prep = json(paths.preparation);
assert(prep.status === 'blocked-d08-owner-decision', 'D08 preparation status drift');
assert(prep.authority_effect === 'none' && prep.decision_effect === 'none', 'D08 preparation authority growth');
assert(prep.owner_gate.request_digest === receipt.requestDigest && prep.owner_gate.selected_option_id === null, 'D08 owner gate binding drift');
for (const artifact of prep.artifacts) {
  assert(fs.existsSync(path.join(ROOT, artifact.path)), `D08 preparation artifact missing: ${artifact.path}`);
  if (artifact.role !== 'd08-validator') assert(sha(artifact.path) === artifact.sha256, `immutable D08 preparation artifact drift: ${artifact.path}`);
}

const selection = json(paths.selection);
assert(selection.status === 'selected-and-closed-no-additional-constraint', 'D08 selection status drift');
assert(selection.selected_option_id === 'BMC-REL-D08-B-RETAIN-CANONICAL-ENDPOINT-PROVENANCE-ONLY', 'D08 selected option drift');
assert(selection.decided_by === 'user' && selection.decided_at === '2026-08-23T19:11:29+01:00', 'D08 owner source drift');
assert(selection.decision_source === 'Exact B response to the presented D08 Decision Gate.', 'D08 decision source drift');
assert(selection.gate_binding.candidate_sha256 === expected[paths.candidate], 'D08 selection candidate binding drift');
assert(selection.gate_binding.request_sha256 === expected[paths.request], 'D08 selection request binding drift');
assert(selection.gate_binding.request_digest === receipt.requestDigest, 'D08 selection request digest drift');
assert(selection.gate_binding.prefilter_receipt_sha256 === expected[paths.receipt], 'D08 selection prefilter binding drift');
assert(selection.gate_binding.preparation_receipt_sha256 === sha(paths.preparation), 'D08 selection preparation binding drift');
assert(selection.rationale.length === 3, 'D08 selection rationale inventory drift');
for (const phrase of [
  'Entity emits is broader than Event Sourcing',
  'already distinguish Entity subject/source provenance from Operation cause provenance',
  'No concrete downstream consumer proves'
]) assert(selection.rationale.some((item) => item.includes(phrase)), `D08 rationale missing: ${phrase}`);
assert(selection.selection_effect.additional_cross_row_constraint === 'none', 'D08 selection invents a cross-row constraint');
assert(selection.selection_effect.d08_projection === 'none', 'D08 selection invents a projection');
assert(selection.selection_effect.packet_schema_validator_mutation === 'none', 'D08 selection mutates packet surfaces');
assert(selection.selection_effect.relationships_definitions_mutation === 'none', 'D08 selection mutates canonical authority');
assert(selection.preserved_bindings.packet_sha256 === expected[paths.packet], 'D08 preserved packet binding drift');
assert(selection.preserved_bindings.schema_sha256 === expected[paths.schema], 'D08 preserved schema binding drift');
assert(selection.preserved_bindings.main_validator_sha256 === expected[paths.mainValidator], 'D08 preserved main-validator binding drift');
assert(selection.preserved_bindings.relationships_sha256 === expected[paths.relationships], 'D08 preserved relationships binding drift');
assert(selection.preserved_bindings.definitions_sha256 === expected[paths.definitions], 'D08 preserved definitions binding drift');

const parent = text(paths.parent);
assert(parent.includes('Status: `d01-d08-owner-resolved-d08-no-additional-constraint-nonnumeric-pass-pending`'), 'parent D08 lifecycle header drift');
assert(parent.includes('## BMC-REL-D08 — Event provenance across `produces` and `emits`'), 'parent D08 section missing');
assert(parent.includes(receipt.requestDigest), 'parent D08 request digest missing');
assert(parent.includes('Selected option: `BMC-REL-D08-B-RETAIN-CANONICAL-ENDPOINT-PROVENANCE-ONLY`'), 'parent D08 selection missing');
assert(parent.includes('2026-08-23T19:11:29+01:00'), 'parent D08 timestamp missing');
assert(parent.includes(expected[paths.selection]), 'parent D08 selection receipt binding missing');
assert(/no concrete downstream consumer\s+proves a new cross-row invariant/.test(parent), 'parent D08 rationale missing');
assert(parent.includes('D08 projection: `none`'), 'parent D08 no-projection effect missing');

for (const rel of [...Object.keys(expected), paths.preparation, paths.parent]) {
  const value = file(rel);
  assert(value.at(-1) === 0x0a, `missing final newline: ${rel}`);
  assert(!value.includes(0x0d) && !value.includes(0x09), `CR or tab found: ${rel}`);
  assert(value.toString('utf8').split('\n').every((line) => !/[ ]+$/.test(line)), `trailing whitespace: ${rel}`);
}

console.log(JSON.stringify({
  result: 'pass',
  decision_id: request.decisionId,
  request_digest: receipt.requestDigest,
  route_outcome: receipt.routeOutcome,
  admissible_options: receipt.admissibleOptionIds,
  rejected_options: receipt.rejectedOptions.map((item) => item.optionId),
  historical_recommendation: 'BMC-REL-D08-A-VERB-LOCAL-TYPED-PROVENANCE-NON-COLLAPSE',
  selection: selection.selected_option_id,
  explain_decision_effect: 'none',
  packet_mutation: 'none-for-d08',
  authority_effect: 'none',
  decision_effect: 'selected-no-additional-constraint'
}, null, 2));
