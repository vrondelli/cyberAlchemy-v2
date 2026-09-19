#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SIDE = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION';
const paths = {
  definitions: 'projects/domainspec-v2/definitions/DEFINITIONS.md',
  index: 'projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md',
  registry: 'projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json',
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  mainValidator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs',
  repairSelection: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-SELECTION-RECEIPT.json`,
  repairApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-ATOMIC-APPLY-RECEIPT.json`,
  candidate: `${SIDE}/candidates/BMC-REL-D07-P02-PACKET-REPRESENTATION-CANDIDATE.md`,
  request: `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-REQUEST.json`,
  receipt: `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-RECEIPT.json`,
  preparation: `${SIDE}/receipts/BMC-REL-D07-P02-PREPARATION-RECEIPT.json`,
  validator: `${SIDE}/validators/validate-bmc-rel-d07-p02.mjs`,
  readme: `${SIDE}/README.md`,
  decisions: `${SIDE}/decisions/BMC-REL-D07-PROJECTION-DECISIONS.md`,
  parent: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md',
  p02Selection: `${SIDE}/receipts/BMC-REL-D07-P02-SELECTION-RECEIPT.json`
};

const expected = {
  [paths.definitions]: '92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf',
  [paths.index]: 'd0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb',
  [paths.registry]: '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c',
  [paths.relationships]: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1',
  [paths.packet]: 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0',
  [paths.schema]: 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7',
  [paths.mainValidator]: '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975',
  [paths.repairSelection]: '2e2f3307442f740c0bc6199763e43c9c0ff4f1a83fe92027673f1f8700ab7a47',
  [paths.repairApply]: '9c7cfa75dc7f6cf027659e0130ba7ab62789239df8930abc8a7cd789e0dd47df',
  [paths.candidate]: '16ea98d8fdb4d84430bc76133433a7cab1ae9797f5f919be5b95ec5201df925b',
  [paths.request]: '187d9e1478ac0a987021f303dfec9b6ca4b9573f16d5101acb983ed204e0d3f2',
  [paths.receipt]: 'c0fdc792deca1d8d2734a558310f41277d4a2d35c8df67bd7f192ade0f29f7ec',
  [paths.p02Selection]: '5a680b76fa8eef8fe4676e4deeae67c59e22f2ae0a1d825b92a55262643ff65c'
};

const optionIds = [
  'BMC-REL-D07-P02-A-GENERIC-FIRST-CLASS-FACET',
  'BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION',
  'BMC-REL-D07-P02-C-TOP-LEVEL-TYPED-PROJECTION',
  'BMC-REL-D07-P02-D-DEFER',
  'BMC-REL-D07-P02-E-STOP'
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

const repairSelection = json(paths.repairSelection);
assert(repairSelection.decision === 'selected', 'repair selection status drift');
assert(repairSelection.selected_option_id === 'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE', 'repair selection option drift');
assert(repairSelection.owner_response === 'A' && repairSelection.decided_by === 'user', 'repair selection owner source drift');
assert(repairSelection.decided_at === '2026-08-23T18:17:44+01:00', 'repair selection timestamp drift');
const repairApply = json(paths.repairApply);
assert(repairApply.status === 'applied-byte-identical-canonical-validation-pass', 'repair apply status drift');
assert(repairApply.authority_effect === 'canonical-domain-vocabulary-only', 'repair apply authority drift');
assert(repairApply.owner_binding.selection_receipt_sha256 === expected[paths.repairSelection], 'repair apply selection binding drift');
assert(repairApply.canonical_validation.status === 'pass' && repairApply.partial_state_observed === false, 'repair canonical validation drift');

const registry = json(paths.registry);
exact(registry, {
  schema_version: '1.0.0',
  registry_id: 'domainspec-v2.membership-kinds',
  definition_id: 'domainspec-v2-D30',
  active_ids: ['classification', 'home-assignment']
}, 'canonical membership registry');

const definitions = text(paths.definitions);
const d30 = definitions.match(/## domainspec-v2-D30\.[\s\S]*?(?=\n## domainspec-v2-D28\.)/)?.[0] ?? '';
assert((d30.match(/Formal voice:/g) ?? []).length === 3, 'D30 formal voice count drift');
assert((d30.match(/Plain-language voice:/g) ?? []).length === 3, 'D30 plain voice count drift');
assert((d30.match(/DomainSpec-context voice:/g) ?? []).length === 3, 'D30 DomainSpec-context voice count drift');
for (const phrase of [
  'K_active = { classification, home-assignment }',
  'There is no existence condition',
  'independent from canonical `owns`',
  '](#ds-d8--relationship-signature-authority)',
  '](#domainspec-v2-d18-relationship-non-collapse-test)'
]) assert(d30.includes(phrase), `D30 policy or link drift: ${phrase}`);
assert(text(paths.index).includes('| `domainspec-v2-D30` | Membership Kind Registry | active |'), 'D30 index row missing');

const candidate = text(paths.candidate);
for (const phrase of [
  'policy = one-parent-per-admitted-membership-kind',
  `registry_sha256 = ${expected[paths.registry]}`,
  'There is no existence condition.',
  'infer numeric bounds',
  'conflate `belongs-to` with `owns`',
  'This recommendation has `decision_effect: none`.',
  '### Low — one classified Entity',
  '### Medium — two admitted kinds, two distinct parents',
  '### Complex — registry drift and non-`belongs-to` token pressure'
]) assert(candidate.includes(phrase), `P02 candidate boundary missing: ${phrase}`);
for (const id of optionIds) assert(candidate.includes(id), `P02 candidate option missing: ${id}`);
for (const rejected of [
  'Overloading numeric bounds',
  'Storing only untyped evidence',
  'Omitting the registry digest',
  'Requiring any Entity to belong somewhere',
  'Reusing ownership vocabulary',
  'Selecting and applying packet/schema/validator changes in this gate',
  'on a non-`belongs-to` row'
]) assert(candidate.includes(rejected), `P02 rejected construction missing: ${rejected}`);

const request = json(paths.request);
const receipt = json(paths.receipt);
assert(request.decisionId === 'BMC-REL-D07-P02-TYPED-PACKET-REPRESENTATION', 'P02 request decision ID drift');
assert(request.candidates.length === 5 && request.candidates.filter((item) => item.optionKind === 'action').length === 3, 'P02 option shape drift');
for (const option of request.candidates) {
  assert(option.structuralStatus === 'admissible' && option.rejectionReasons.length === 0, `${option.optionId} structural status drift`);
  assert(option.evidence.some((ref) => ref.endsWith(`@sha256:${expected[paths.registry]}`)), `${option.optionId} registry binding missing`);
  assert(option.evidence.some((ref) => ref.endsWith(`@sha256:${expected[paths.repairApply]}`)), `${option.optionId} repair apply binding missing`);
  if (option.optionKind === 'action') assert(option.hazardClass === 'authority' && option.ownerGate === 'decision-gate:owner-decision', `${option.optionId} action gate drift`);
  else assert(option.hazardClass === 'reversible' && option.ownerGate === null, `${option.optionId} defer/stop gate drift`);
}
const requestDigest = crypto.createHash('sha256').update(JSON.stringify(stable(request))).digest('hex');
assert(receipt.requestDigest === requestDigest, 'P02 receipt request digest mismatch');
assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired === true, 'P02 must remain an owner gate');
exact(receipt.admissibleOptionIds, optionIds, 'P02 admissible options');
exact(receipt.presentedOptionIds, optionIds, 'P02 presented options');
assert(receipt.directOptionId === null && receipt.ownerGate === null && receipt.rejectedOptions.length === 0, 'P02 prefilter inferred selection or rejection');
const p02Selection = json(paths.p02Selection);
assert(p02Selection.status === 'selected-and-applied', 'P02 selection status drift');
assert(p02Selection.selected_option_id === 'BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION', 'P02 selected option drift');
assert(p02Selection.decided_by === 'user' && p02Selection.decided_at === '2026-08-23T18:38:33+01:00', 'P02 owner source drift');
assert(p02Selection.gate_binding.request_digest === receipt.requestDigest, 'P02 selection gate binding drift');
assert(p02Selection.apply_binding.packet_sha256 === expected[paths.packet], 'P02 packet apply binding drift');
assert(p02Selection.apply_binding.schema_sha256 === expected[paths.schema], 'P02 schema apply binding drift');
assert(p02Selection.apply_binding.validator_sha256 === expected[paths.mainValidator], 'P02 validator apply binding drift');

const prep = json(paths.preparation);
assert(prep.status === 'blocked-p02-owner-decision', 'P02 preparation status drift');
assert(prep.authority_effect === 'none' && prep.decision_effect === 'none', 'P02 preparation authority growth');
assert(prep.owner_gate.request_digest === receipt.requestDigest && prep.owner_gate.selected_option_id === null, 'P02 preparation owner gate drift');
for (const artifact of prep.artifacts) {
  assert(fs.existsSync(path.join(ROOT, artifact.path)), `P02 preparation artifact missing: ${artifact.path}`);
  if (artifact.role !== 'p02-validator') assert(sha(artifact.path) === artifact.sha256, `immutable P02 preparation artifact drift: ${artifact.path}`);
}

const parent = text(paths.parent);
assert(parent.includes('Status: `d01-d07-owner-selected-d07-projection-applied-d08-owner-gate-open`'), 'parent P02 lifecycle header drift');
assert(parent.includes('Machine projection: `satisfied-candidate-packet-only`'), 'parent P02 application status drift');
assert(parent.includes(receipt.requestDigest), 'parent P02 request digest missing');
assert(parent.includes(expected[paths.p02Selection]), 'parent P02 selection binding missing');
for (const rel of [paths.readme, paths.decisions]) {
  assert(text(rel).includes('BMC-REL-D07-P02-TYPED-PACKET-REPRESENTATION'), `${rel} P02 gate missing`);
  assert(text(rel).includes('BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION'), `${rel} P02 recommendation missing`);
}

for (const rel of [...Object.keys(expected), paths.preparation, paths.validator, paths.readme, paths.decisions, paths.parent]) {
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
  recommendation: 'BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION',
  registry_sha256: expected[paths.registry],
  canonical_apply_status: repairApply.status,
  selection: p02Selection.selected_option_id,
  packet_mutation: 'belongs-to-scoped-typed-extension',
  authority_effect: 'candidate-packet-only',
  decision_effect: 'p02-selected-and-applied'
}, null, 2));
