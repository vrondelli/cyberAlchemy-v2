#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let ROOT = path.dirname(fileURLToPath(import.meta.url));
while (!fs.existsSync(path.join(ROOT, '.git'))) {
  const parent = path.dirname(ROOT);
  if (parent === ROOT) throw new Error('repository root not found');
  ROOT = parent;
}

const PATHS = {
  definitions: 'projects/domainspec-v2/definitions/DEFINITIONS.md',
  index: 'projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md',
  registry: 'projects/domainspec-v2/definitions/ownership-dimensions/ownership-dimensions.json',
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  p01Candidate: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/candidates/BMC-REL-D06-P01-DEFINITIONS-CANDIDATE.md',
  p01Request: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/decision-gate/BMC-REL-D06-P01-OPTION-ADMISSIBILITY-REQUEST.json',
  p01Receipt: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/decision-gate/BMC-REL-D06-P01-OPTION-ADMISSIBILITY-RECEIPT.json',
  p01Selection: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/receipts/BMC-REL-D06-P01-SELECTION-RECEIPT.json',
  p02Candidate: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/candidates/BMC-REL-D06-P02-PACKET-REPRESENTATION-CANDIDATE.md',
  p02Request: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/decision-gate/BMC-REL-D06-P02-OPTION-ADMISSIBILITY-REQUEST.json',
  p02Receipt: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/decision-gate/BMC-REL-D06-P02-OPTION-ADMISSIBILITY-RECEIPT.json',
  p02Selection: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/receipts/BMC-REL-D06-P02-SELECTION-RECEIPT.json',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  validator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs',
  parentDecision: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md'
};

const HASHES = {
  definitions: 'cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006',
  index: 'ad41200bacb825bf11c009bfaef37f350beb3a307a55994ced42e194bc3fa744',
  registry: '91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4',
  relationships: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1',
  p01Candidate: 'ba150cd06ce95ec374008acf48a353bafb951dad1530fa3ea09d8dd19053cd29',
  p01Request: '7bc14088699ff6a911faded4246b2805ce046292aef092680b1d789a135286fd',
  p01Receipt: 'c7456a88c3c0cb5b4593475283e33cfd2a11d84c1db8472fe298ab7206dc0354',
  p01Selection: 'd8a55ceb5439b6e439d169dd0242c3b47572e21d4e2a3def95e1882012c899ce',
  p02Candidate: '33119d1b53b1c7eaf5f2a354bb8daece9c06f689e61a823bb0c31ad7cdc0eb2f',
  p02Request: 'e1e07f41a52653ca8784807515d1f883c8188b17d791bb04f5f42ac2321fcd3a',
  p02Receipt: 'f53baa362ff33a0c3e147627afd6c4d122f170ecf5d318aea6d2f2e7b9b4f8ec',
  p02Selection: '978aefdcbf8291e3332439441537ccd725d81c50082bf94e61574f0def410e71',
  packet: '3d2f7695197b1e8eaa1b2cfd0c2662ad0355888604ee7ad0e6e9dd34ce0107b3',
  schema: 'eabaeb7c9f37dc3d016873fa30e2dd86c6e09903f5f7bcbf3b072b2adb8ddbde',
  validator: '03ed61edc240478430a9c5a1eaf2297682beea63d76ac6c44a792172c738def9',
  parentDecision: 'e3b11348cd6271f27ab7b0cd69467c139991f343f8c1ddbe478427acc5b76352'
};

const EXPECTED_IDS = ['lifecycle', 'custody', 'write-responsibility'];
const EXPECTED_P02 = [
  'BMC-REL-D06-P02-A-GENERIC-FIRST-CLASS-FACET',
  'BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION',
  'BMC-REL-D06-P02-C-TOP-LEVEL-TYPED-PROJECTION',
  'BMC-REL-D06-P02-D-DEFER',
  'BMC-REL-D06-P02-E-STOP'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function bytes(key) {
  return fs.readFileSync(path.join(ROOT, PATHS[key]));
}

function text(key) {
  return bytes(key).toString('utf8');
}

function json(key) {
  return JSON.parse(text(key));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

for (const [key, expected] of Object.entries(HASHES)) {
  assert(sha256(bytes(key)) === expected, `${key} SHA-256 drift`);
}

const registry = json('registry');
assert(JSON.stringify(Object.keys(registry).sort()) === JSON.stringify(['active_ids', 'definition_id', 'registry_id', 'schema_version']), 'registry keys must remain closed');
assert(registry.schema_version === '1.0.0', 'registry schema version drift');
assert(registry.registry_id === 'domainspec-v2.ownership-dimensions', 'registry ID drift');
assert(registry.definition_id === 'domainspec-v2-D29', 'registry definition binding drift');
assert(JSON.stringify(registry.active_ids) === JSON.stringify(EXPECTED_IDS), 'registry active IDs drift');
assert(new Set(registry.active_ids).size === EXPECTED_IDS.length, 'registry IDs must be unique');

const definitions = text('definitions');
const d29 = definitions.match(/## domainspec-v2-D29\.[\s\S]*?(?=\n## domainspec-v2-D28\.)/)?.[0];
assert(d29, 'domainspec-v2-D29 definition card missing');
assert((d29.match(/Formal voice:/g) || []).length === 4, 'D29 must include registry and three entry formal voices');
assert((d29.match(/Plain-language voice:/g) || []).length === 4, 'D29 must include registry and three entry plain-language voices');
assert((d29.match(/Domain-context voice:/g) || []).length === 4, 'D29 must include registry and three entry DomainSpec-context voices');
for (const id of EXPECTED_IDS) assert(d29.includes(`#### \`${id}\``), `D29 entry voice missing for ${id}`);
assert(text('index').includes('| `domainspec-v2-D29` | Ownership Dimension Registry | active |'), 'D29 index row missing');

const p01 = json('p01Selection');
assert(p01.selected_option_id === 'BMC-REL-D06-P01-B-GOVERNED-EXTENSIBLE-REGISTRY', 'P01 selected option drift');
assert(p01.decided_at === '2026-08-23T15:26:32+01:00', 'P01 owner timestamp drift');
assert(p01.gate_binding.request_digest === '91f803f7ebec8630fbf2fd39a23d8824cb1929fbbac4b0ef7cec60d1bd771e2e', 'P01 request digest drift');
assert(p01.canonical_binding.registry_sha256 === HASHES.registry, 'P01 registry binding drift');
assert(JSON.stringify(p01.canonical_binding.active_ids) === JSON.stringify(EXPECTED_IDS), 'P01 active IDs drift');
assert(p01.p02_dependency === 'satisfied', 'P02 dependency must be satisfied');

const request = json('p02Request');
const receipt = json('p02Receipt');
assert(request.decisionId === 'BMC-REL-D06-P02-TYPED-PACKET-REPRESENTATION', 'P02 decision ID drift');
assert(request.candidates.length === 5, 'P02 must contain exactly three actions plus defer and stop');
assert(request.candidates.filter((item) => item.optionKind === 'action').length === 3, 'P02 must contain exactly three action candidates');
for (const candidate of request.candidates) {
  assert(candidate.structuralStatus === 'admissible', `${candidate.optionId} must remain structurally admissible`);
  assert(candidate.rejectionReasons.length === 0, `${candidate.optionId} must not carry rejection reasons while admissible`);
  assert(candidate.evidence.some((ref) => ref.endsWith(`@sha256:${HASHES.registry}`)), `${candidate.optionId} must bind the exact registry digest`);
  if (candidate.optionKind === 'action') assert(candidate.ownerGate === 'decision-gate:owner-decision', `${candidate.optionId} owner gate drift`);
}
const requestDigest = sha256(Buffer.from(JSON.stringify(stable(request))));
assert(receipt.requestDigest === requestDigest, 'P02 receipt request digest mismatch');
assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired === true, 'P02 must remain an open Decision Gate');
assert(JSON.stringify(receipt.admissibleOptionIds) === JSON.stringify(EXPECTED_P02), 'P02 admissible options drift');
assert(JSON.stringify(receipt.presentedOptionIds) === JSON.stringify(EXPECTED_P02), 'P02 presented options drift');
assert(receipt.directOptionId === null && receipt.ownerGate === null, 'P02 gate must not imply a direct route or selection');

const p02Selection = json('p02Selection');
assert(p02Selection.status === 'selected-and-applied', 'P02 selection must be applied');
assert(p02Selection.selected_option_id === 'BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION', 'P02 selected option drift');
assert(p02Selection.decided_at === '2026-08-23T15:44:08+01:00', 'P02 owner timestamp drift');
assert(p02Selection.gate_binding.candidate_sha256 === HASHES.p02Candidate, 'P02 candidate binding drift');
assert(p02Selection.gate_binding.request_sha256 === HASHES.p02Request, 'P02 request binding drift');
assert(p02Selection.gate_binding.request_digest === receipt.requestDigest, 'P02 canonical request digest drift');
assert(p02Selection.gate_binding.receipt_sha256 === HASHES.p02Receipt, 'P02 receipt binding drift');
assert(p02Selection.upstream_binding.registry_sha256 === HASHES.registry, 'P02 registry binding drift');
assert(p02Selection.apply_binding.packet_sha256 === HASHES.packet, 'P02 packet apply binding drift');
assert(p02Selection.apply_binding.schema_sha256 === HASHES.schema, 'P02 schema apply binding drift');
assert(p02Selection.apply_binding.validator_sha256 === HASHES.validator, 'P02 validator apply binding drift');

const packet = json('packet');
assert(packet.status === 'candidate-pending-owner-decision', 'packet must remain candidate-pending-owner-decision');
assert(packet.authority_effect === 'none', 'packet authority_effect must remain none');
assert(packet.owner_disposition.status === 'pending', 'packet owner disposition must remain pending');
const owns = packet.rows.find((row) => row.signature_id === 'owns');
assert(owns, 'owns row missing');
assert(owns.proposed_decision.status === 'unresolved', 'owns row must remain unresolved');
for (const [facet, decision] of Object.entries(owns.proposed_decision)) {
  if (facet !== 'status') assert(decision.status === 'unresolved', `owns.${facet} must remain unresolved`);
}
assert(JSON.stringify(Object.keys(owns.ownership_topology).sort()) === JSON.stringify(['evidence_refs', 'policy', 'rationale', 'registry_path', 'registry_sha256', 'status']), 'owns ownership_topology keys drift');
assert(owns.ownership_topology.status === 'owner-selected', 'owns ownership_topology status drift');
assert(owns.ownership_topology.policy === 'one-owner-per-admitted-dimension', 'owns policy drift');
assert(owns.ownership_topology.registry_path === PATHS.registry, 'owns registry path drift');
assert(owns.ownership_topology.registry_sha256 === HASHES.registry, 'owns registry digest drift');
assert(owns.ownership_topology.evidence_refs.includes(PATHS.p02Selection), 'owns evidence must bind the P02 selection receipt');
assert(packet.rows.filter((row) => Object.hasOwn(row, 'ownership_topology')).length === 1, 'ownership_topology must exist on owns only');
const parentDecision = text('parentDecision');
assert(parentDecision.includes('Status: `d01-d06-owner-selected-rq1-selected-d06-projection-closed-d07-pending`'), 'parent record header must preserve D06 projection closed with D07 pending');
assert(parentDecision.includes(`- Rebased decision packet after the D06 projection closeout: \`${PATHS.packet}\`, SHA-256 \`${HASHES.packet}\`.`), 'parent record evidence binding must name the post-D06 packet path and digest');
assert(!parentDecision.includes('d06-projection-blocked-d07-pending'), 'parent record must not retain stale D06 projection-blocked lifecycle wording');
assert(parentDecision.includes('Machine projection: `satisfied-candidate-packet-only`'), 'parent D06 projection body status drift');

process.stdout.write(`${JSON.stringify({
  result: 'pass',
  p01_selected_option: p01.selected_option_id,
  registry_sha256: HASHES.registry,
  active_ids: EXPECTED_IDS,
  p02_route: receipt.routeOutcome,
  p02_admissible_options: receipt.admissibleOptionIds,
  p02_selected_option: p02Selection.selected_option_id,
  packet_sha256: HASHES.packet,
  packet_status: packet.status,
  packet_owner_disposition: packet.owner_disposition.status,
  authority_effect: 'canonical-domain-vocabulary-only; candidate-packet projection none'
}, null, 2)}\n`);
