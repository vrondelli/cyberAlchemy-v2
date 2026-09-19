#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SIDE = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION';
const P = {
  parent: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md',
  d07Candidate: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-D07-MEMBERSHIP-TOPOLOGY-CANDIDATE.md',
  d07Request: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-D07-OPTION-ADMISSIBILITY-REQUEST.json',
  d07Receipt: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-D07-OPTION-ADMISSIBILITY-RECEIPT.json',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  packetValidator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs',
  definitions: 'projects/domainspec-v2/definitions/DEFINITIONS.md',
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  readme: `${SIDE}/README.md`,
  candidate: `${SIDE}/candidates/BMC-REL-D07-P01-DEFINITIONS-CANDIDATE.md`,
  request: `${SIDE}/decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-REQUEST.json`,
  receipt: `${SIDE}/decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-RECEIPT.json`,
  selection: `${SIDE}/receipts/BMC-REL-D07-P01-SELECTION-RECEIPT.json`,
  decisions: `${SIDE}/decisions/BMC-REL-D07-PROJECTION-DECISIONS.md`,
  validator: `${SIDE}/validators/validate-bmc-rel-d07-projection.mjs`,
  preparation: `${SIDE}/receipts/BMC-REL-D07-P01-PREPARATION-RECEIPT.json`,
  atomicApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-ATOMIC-APPLY-RECEIPT.json`,
  repairApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-ATOMIC-APPLY-RECEIPT.json`
};

const EXPECTED_SOURCE_HASHES = {
  [P.d07Candidate]: '18ed4c699c53924bb054050a741efa857c1fe8b256d21868748d0387e402cbda',
  [P.d07Request]: 'fa90d189baca57ac6cc6d8e6c8b983b6da68fe210eefdb21d62aa4ff5b8fc1b8',
  [P.d07Receipt]: '94bac73b0d7746d5c5d2e8651b80bce1cd83fb6a686ae848d279c857ee2e83b0',
  [P.packet]: 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0',
  [P.schema]: 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7',
  [P.packetValidator]: '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975',
  [P.relationships]: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1'
};

const ADMISSIBLE = [
  'BMC-REL-D07-P01-A-FIXED-CLOSED-ENUMERATION',
  'BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY',
  'BMC-REL-D07-P01-C-DEFER',
  'BMC-REL-D07-P01-D-STOP'
].sort();
const REJECTED = [
  'BMC-REL-D07-P01-E-FREE-TEXT-OR-ALIASED-KINDS',
  'BMC-REL-D07-P01-F-PROSE-DERIVED-KIND-TOKENS',
  'BMC-REL-D07-P01-G-REUSE-OWNERSHIP-DIMENSION-REGISTRY',
  'BMC-REL-D07-P01-H-UNKNOWN-OTHER-CATCHALL'
].sort();

function fail(message) { throw new Error(message); }
function assert(value, message) { if (!value) fail(message); }
function bytes(rel) { return fs.readFileSync(path.join(ROOT, rel)); }
function text(rel) { return bytes(rel).toString('utf8'); }
function json(rel) { return JSON.parse(text(rel)); }
function sha(rel) { return crypto.createHash('sha256').update(bytes(rel)).digest('hex'); }
function canonicalDigest(value) {
  const normalize = (item) => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === 'object') return Object.fromEntries(Object.keys(item).sort().map((key) => [key, normalize(item[key])]));
    return item;
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
}
function exactArray(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch`);
}

for (const [rel, expected] of Object.entries(EXPECTED_SOURCE_HASHES)) {
  assert(sha(rel) === expected, `source binding drift: ${rel}`);
}
const atomicApplyStatus = fs.existsSync(path.join(ROOT, P.atomicApply))
  ? json(P.atomicApply).status
  : null;
const applied = atomicApplyStatus === 'applied-byte-identical';
const repairApplied = fs.existsSync(path.join(ROOT, P.repairApply))
  && json(P.repairApply).status === 'applied-byte-identical-canonical-validation-pass';
assert(sha(P.definitions) === (repairApplied
  ? '92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf'
  : applied
    ? 'f075568feed8d9918762efe99bb228602da32b760ae7b023aad770187c70fb4a'
    : 'cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006'), 'definitions lifecycle binding drift');

const parent = text(P.parent);
assert(/^Status: `(?=[^`]*d01-d07-owner-selected)(?=[^`]*d08-owner-gate-open)[^`]+`$/m.test(parent), 'parent header does not preserve selected D07 and open D08');
assert(parent.includes('Selected option: `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND`'), 'parent missing exact D07 selection');
assert(parent.includes('2026-08-23T16:17:11+01:00'), 'parent missing exact D07 timestamp');
assert(parent.includes('Machine projection: `satisfied-candidate-packet-only`'), 'parent does not record the D07 candidate packet projection');

let p01State = 'owner-gate-open';
const hasP01Selection = fs.existsSync(path.join(ROOT, P.selection));
if (hasP01Selection) {
  const selection = json(P.selection);
  assert(selection.decision_id === 'BMC-REL-D07-P01' && selection.decision === 'selected', 'P01 selection receipt identity or decision drift');
  assert(selection.selected_option_id === 'BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY', 'P01 selected option drift');
  assert(selection.decided_by === 'user' && selection.decided_at === '2026-08-23T16:35:24+01:00', 'P01 selection owner source drift');
  assert(selection.candidate_sha256 === sha(P.candidate), 'P01 selection candidate binding drift');
  assert(selection.request_sha256 === sha(P.request), 'P01 selection request binding drift');
  assert(selection.request_digest === 'e25fb8791a4ff3c76c899c48d533e5510d347d9b1843f9569b81422ce24d2ae6', 'P01 selection request digest drift');
  assert(selection.receipt_sha256 === sha(P.receipt), 'P01 selection receipt binding drift');
  assert(selection.canonical_authority_effect === 'none', 'P01 selection receipt grows canonical authority');
  assert(parent.includes(selection.selected_option_id), 'parent does not preserve the exact P01 selection');
  p01State = 'governance-model-selected';
}

const candidate = text(P.candidate);
for (const required of [
  'Authority effect: `none`',
  'Decision effect: `none`',
  'membership, classification, and home assignment remain illustrative prose only',
  'P02 must not be materialized or prefiltered',
  'No placeholder or design label in this candidate is an active ID.',
  'This recommendation has no decision effect.'
]) assert(candidate.includes(required), `candidate missing boundary: ${required}`);

const request = json(P.request);
const receipt = json(P.receipt);
assert(request.decisionId === 'BMC-REL-D07-P01', 'P01 request decision ID drift');
assert(receipt.decisionId === request.decisionId, 'P01 receipt decision ID mismatch');
assert(receipt.requestDigest === canonicalDigest(request), 'P01 request digest mismatch');
assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired === true, 'P01 must remain an open gate');
exactArray(receipt.admissibleOptionIds, ADMISSIBLE, 'admissible option IDs');
exactArray(receipt.presentedOptionIds, ADMISSIBLE, 'presented option IDs');
exactArray(receipt.rejectedOptions.map((item) => item.optionId).sort(), REJECTED, 'rejected option IDs');
for (const option of request.candidates.filter((item) => item.structuralStatus === 'admissible' && item.optionKind === 'action')) {
  assert(option.hazardClass === 'authority', `${option.optionId} must retain authority hazard`);
  assert(option.ownerGate === 'definitions-governance:owner-decision', `${option.optionId} owner gate drift`);
}

const formattedArtifacts = [P.readme, P.candidate, P.request, P.receipt, P.decisions, P.validator, P.preparation];
if (hasP01Selection) formattedArtifacts.push(P.selection);
for (const rel of formattedArtifacts) {
  const value = bytes(rel);
  assert(value.at(-1) === 0x0a, `missing final newline: ${rel}`);
  assert(!value.includes(0x0d) && !value.includes(0x09), `CR or tab found: ${rel}`);
  assert(value.toString('utf8').split('\n').every((line) => !/[ ]+$/.test(line)), `trailing whitespace: ${rel}`);
}

const preparation = json(P.preparation);
assert(preparation.status === 'blocked-p01-owner-gate', 'preparation receipt status drift');
assert(preparation.authority_effect === 'none' && preparation.decision_effect === 'none', 'preparation receipt authority growth');
const immutablePreparationRoles = new Set(['p01-candidate', 'p01-admissibility-request', 'p01-prefilter-receipt']);
for (const artifact of preparation.artifacts) {
  assert(/^[a-f0-9]{64}$/.test(artifact.sha256), `invalid historical artifact digest: ${artifact.path}`);
  assert(fs.existsSync(path.join(ROOT, artifact.path)), `preparation artifact missing: ${artifact.path}`);
  if (immutablePreparationRoles.has(artifact.role)) {
    assert(sha(artifact.path) === artifact.sha256, `immutable preparation artifact digest drift: ${artifact.path}`);
  }
}
assert(preparation.p01.request_digest === receipt.requestDigest, 'preparation receipt request digest mismatch');
assert(preparation.hard_dependencies.every((item) => item.status === 'blocked'), 'P02 dependency must remain blocked');

if (!repairApplied) {
  for (const forbidden of [
    `${SIDE}/candidates/BMC-REL-D07-P02-PACKET-REPRESENTATION-CANDIDATE.md`,
    `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-REQUEST.json`,
    `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-RECEIPT.json`
  ]) assert(!fs.existsSync(path.join(ROOT, forbidden)), `P02 artifact exists before canonical vocabulary closeout: ${forbidden}`);
}

console.log(JSON.stringify({
  sidecar_id: 'BMC-REL-D07-PROJECTION',
  result: 'pass',
  p01_state: p01State,
  p01_route: receipt.routeOutcome,
  p01_request_digest: receipt.requestDigest,
  admissible_options: ADMISSIBLE.length,
  rejected_options: REJECTED.length,
  p02_status: repairApplied ? 'selected-and-applied' : 'blocked',
  authority_effect: repairApplied ? 'canonical-domain-vocabulary-only' : 'none',
  decision_effect: 'none',
  historical_mutable_bindings: 'retained-not-reinterpreted-as-current'
}, null, 2));
