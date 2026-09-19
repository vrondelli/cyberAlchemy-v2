#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SIDE = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION';
const paths = {
  parent: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md',
  definitions: 'projects/domainspec-v2/definitions/DEFINITIONS.md',
  index: 'projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md',
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  packetValidator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs',
  p01Candidate: `${SIDE}/candidates/BMC-REL-D07-P01-DEFINITIONS-CANDIDATE.md`,
  p01Request: `${SIDE}/decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-REQUEST.json`,
  p01Receipt: `${SIDE}/decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-RECEIPT.json`,
  p01Selection: `${SIDE}/receipts/BMC-REL-D07-P01-SELECTION-RECEIPT.json`,
  contentsCandidate: `${SIDE}/candidates/BMC-REL-D07-P01-CONTENTS-DEFINITIONS-CANDIDATE.md`,
  contentsRequest: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-REQUEST.json`,
  contentsReceipt: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-RECEIPT.json`,
  contentsSelection: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-SELECTION-RECEIPT.json`,
  atomicApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-ATOMIC-APPLY-RECEIPT.json`,
  repairApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-ATOMIC-APPLY-RECEIPT.json`,
  contentsPreparation: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-PREPARATION-RECEIPT.json`,
  validator: `${SIDE}/validators/validate-bmc-rel-d07-p01-contents.mjs`,
  readme: `${SIDE}/README.md`,
  decisions: `${SIDE}/decisions/BMC-REL-D07-PROJECTION-DECISIONS.md`
};

const expectedSources = {
  [paths.relationships]: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1',
  [paths.packet]: 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0',
  [paths.schema]: 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7',
  [paths.packetValidator]: '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975',
  [paths.p01Candidate]: '012068ac18dcaced1d5fbcbacb4a1a8505a3d2eed1cae7e1583914b2c01eec04',
  [paths.p01Request]: 'a96864ea845824e6374e53cda7b66adb0030c3dbfd06000d0d225d4046604915',
  [paths.p01Receipt]: 'a8b820d60b12b5c67b47c6f24c1a99f27926b626949a127931146d41b8177623'
};

const admissible = [
  'BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND',
  'BMC-REL-D07-P01-CONTENTS-B-DISJOINT-THREE-KIND',
  'BMC-REL-D07-P01-CONTENTS-C-DEFER',
  'BMC-REL-D07-P01-CONTENTS-D-STOP'
].sort();
const rejected = [
  'BMC-REL-D07-P01-CONTENTS-E-GENERIC-MEMBERSHIP-CATCHALL',
  'BMC-REL-D07-P01-CONTENTS-F-FREE-TEXT-OR-ALIASES',
  'BMC-REL-D07-P01-CONTENTS-G-UNKNOWN-OTHER',
  'BMC-REL-D07-P01-CONTENTS-H-OWNERSHIP-REGISTRY-REUSE',
  'BMC-REL-D07-P01-CONTENTS-I-OVERLAPPING-MEANINGS',
  'BMC-REL-D07-P01-CONTENTS-J-MANDATORY-MEMBERSHIP'
].sort();

function assert(value, message) { if (!value) throw new Error(message); }
function file(rel) { return fs.readFileSync(path.join(ROOT, rel)); }
function text(rel) { return file(rel).toString('utf8'); }
function json(rel) { return JSON.parse(text(rel)); }
function sha(rel) { return crypto.createHash('sha256').update(file(rel)).digest('hex'); }
function canonicalDigest(value) {
  const normalized = (item) => Array.isArray(item) ? item.map(normalized) : item && typeof item === 'object'
    ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, normalized(item[key])])) : item;
  return crypto.createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
}
function exact(actual, expected, label) { assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch`); }

for (const [rel, expected] of Object.entries(expectedSources)) assert(sha(rel) === expected, `source binding drift: ${rel}`);
const atomicApplyStatus = fs.existsSync(path.join(ROOT, paths.atomicApply))
  ? json(paths.atomicApply).status
  : null;
const applied = atomicApplyStatus === 'applied-byte-identical';
const rolledBack = atomicApplyStatus === 'rolled-back-after-acceptance-critical-link-failure';
const repairApplied = fs.existsSync(path.join(ROOT, paths.repairApply))
  && json(paths.repairApply).status === 'applied-byte-identical-canonical-validation-pass';
assert(sha(paths.definitions) === (repairApplied
  ? '92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf'
  : applied
    ? 'f075568feed8d9918762efe99bb228602da32b760ae7b023aad770187c70fb4a'
    : 'cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006'), 'definitions lifecycle binding drift');
assert(sha(paths.index) === (repairApplied || applied
  ? 'd0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb'
  : 'ad41200bacb825bf11c009bfaef37f350beb3a307a55994ced42e194bc3fa744'), 'index lifecycle binding drift');

const selection = json(paths.p01Selection);
assert(selection.decision === 'selected', 'P01 selection receipt decision drift');
assert(selection.selected_option_id === 'BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY', 'P01 selected option drift');
assert(selection.decided_by === 'user' && selection.decided_at === '2026-08-23T16:35:24+01:00', 'P01 owner source drift');
assert(selection.candidate_sha256 === expectedSources[paths.p01Candidate], 'P01 candidate binding mismatch');
assert(selection.request_sha256 === expectedSources[paths.p01Request], 'P01 request binding mismatch');
assert(selection.request_digest === 'e25fb8791a4ff3c76c899c48d533e5510d347d9b1843f9569b81422ce24d2ae6', 'P01 digest mismatch');
assert(selection.receipt_sha256 === expectedSources[paths.p01Receipt], 'P01 receipt binding mismatch');
assert(selection.canonical_authority_effect === 'none', 'P01 selection receipt canonical authority growth');

const candidate = text(paths.contentsCandidate);
for (const id of ['classification', 'home-assignment', 'collection-membership']) {
  const section = candidate.split(`## Candidate meaning: \`${id}\``)[1]?.split('\n## ')[0] ?? '';
  assert(section.includes('Formal voice:'), `${id} missing formal voice`);
  assert(section.includes('Plain-language voice:'), `${id} missing plain voice`);
  assert(section.includes('DomainSpec-context voice:'), `${id} missing DomainSpec context voice`);
}
for (const phrase of ['The generic word `membership` is not an ID', 'There is no existence condition', 'This recommendation has no decision effect.', 'P02 remains blocked']) {
  assert(candidate.includes(phrase), `contents candidate boundary missing: ${phrase}`);
}

const request = json(paths.contentsRequest);
const receipt = json(paths.contentsReceipt);
assert(request.decisionId === 'BMC-REL-D07-P01-CONTENTS', 'contents decision ID drift');
assert(receipt.requestDigest === canonicalDigest(request), 'contents request digest mismatch');
assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired, 'contents route must remain gate');
exact(receipt.admissibleOptionIds, admissible, 'admissible IDs');
exact(receipt.presentedOptionIds, admissible, 'presented IDs');
exact(receipt.rejectedOptions.map((item) => item.optionId).sort(), rejected, 'rejected IDs');
for (const option of request.candidates.filter((item) => item.optionKind === 'action' && item.structuralStatus === 'admissible')) {
  assert(option.hazardClass === 'authority' && option.ownerGate === 'definitions-governance:owner-decision', `${option.optionId} owner gate drift`);
}

const parent = text(paths.parent);
assert(parent.includes(repairApplied
  ? 'Status: `d01-d07-owner-selected-d07-projection-applied-d08-owner-gate-open`'
  : applied
    ? 'Status: `d01-d07-owner-selected-d07-vocabulary-applied-p02-pending-d08-pending`'
  : rolledBack
    ? 'Status: `d01-d07-owner-selected-d07-link-repair-owner-gate-open-p02-blocked-d08-pending`'
    : 'Status: `d01-d07-owner-selected-d07-projection-package-acceptance-pending-d08-pending`'), 'parent header drift');
assert(parent.includes(repairApplied || applied
  ? 'Machine projection: `satisfied-candidate-packet-only`'
  : rolledBack
    ? 'Machine projection: `blocked-renewed-definitions-link-repair-owner-acceptance`'
    : 'Machine projection: `blocked-exact-canonical-package-owner-acceptance`'), 'parent projection blocker missing');
assert(parent.includes('BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY'), 'parent P01 selection missing');
assert(parent.includes('BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND'), 'parent contents selection missing');
assert(parent.includes('a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0'), 'parent packet binding drift');

const contentsSelection = json(paths.contentsSelection);
assert(contentsSelection.decision === 'selected', 'contents selection decision drift');
assert(contentsSelection.selected_option_id === 'BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND', 'contents selected option drift');
assert(contentsSelection.owner_response === 'A' && contentsSelection.decided_by === 'user', 'contents owner source drift');
assert(contentsSelection.decided_at === '2026-08-23T16:58:14+01:00', 'contents owner timestamp drift');
assert(contentsSelection.candidate_sha256 === sha(paths.contentsCandidate), 'contents selection candidate binding mismatch');
assert(contentsSelection.request_sha256 === sha(paths.contentsRequest), 'contents selection request binding mismatch');
assert(contentsSelection.request_digest === receipt.requestDigest, 'contents selection request digest mismatch');
assert(contentsSelection.receipt_sha256 === sha(paths.contentsReceipt), 'contents selection receipt binding mismatch');
assert(contentsSelection.canonical_authority_effect === 'none', 'contents selection authority growth');

const prep = json(paths.contentsPreparation);
assert(prep.status === 'blocked-contents-owner-gate', 'contents preparation status drift');
assert(prep.authority_effect === 'none' && prep.decision_effect === 'none', 'contents preparation authority growth');
const immutableHistoricalRoles = new Set(['p01-selection-receipt', 'contents-candidate', 'contents-admissibility-request', 'contents-prefilter-receipt']);
for (const artifact of prep.artifacts) {
  assert(/^[a-f0-9]{64}$/.test(artifact.sha256), `invalid historical artifact digest: ${artifact.path}`);
  assert(fs.existsSync(path.join(ROOT, artifact.path)), `historical artifact missing: ${artifact.path}`);
  if (immutableHistoricalRoles.has(artifact.role)) assert(sha(artifact.path) === artifact.sha256, `immutable artifact digest drift: ${artifact.path}`);
}
assert(prep.next_gate.request_digest === receipt.requestDigest && prep.next_gate.selected_option_id === null, 'contents preparation gate binding drift');
assert(prep.hard_dependencies.every((item) => item.status === 'blocked'), 'P02 dependencies must remain blocked');

for (const rel of [paths.readme, paths.decisions, paths.p01Selection, paths.contentsCandidate, paths.contentsRequest, paths.contentsReceipt, paths.contentsSelection, paths.contentsPreparation, paths.validator]) {
  const value = file(rel);
  assert(value.at(-1) === 0x0a, `missing final newline: ${rel}`);
  assert(!value.includes(0x0d) && !value.includes(0x09), `CR or tab found: ${rel}`);
  assert(value.toString('utf8').split('\n').every((line) => !/[ ]+$/.test(line)), `trailing whitespace: ${rel}`);
}

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
  p01_selection: selection.selected_option_id,
  contents_route: 'selected',
  contents_selection: contentsSelection.selected_option_id,
  contents_request_digest: receipt.requestDigest,
  admissible_options: admissible.length,
  rejected_options: rejected.length,
  p02_status: repairApplied ? 'selected-and-applied' : 'blocked',
  authority_effect: repairApplied ? 'canonical-domain-vocabulary-only' : 'none',
  decision_effect: 'none'
}, null, 2));
