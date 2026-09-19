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
  registry: 'projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json',
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  packetValidator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs',
  priorStagedDefinitions: `${SIDE}/staged/targets/projects/domainspec-v2/definitions/DEFINITIONS.md`,
  priorStagedIndex: `${SIDE}/staged/targets/projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md`,
  priorStagedRegistry: `${SIDE}/staged/targets/projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json`,
  repairedDefinitions: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR/targets/projects/domainspec-v2/definitions/DEFINITIONS.md`,
  repairedIndex: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR/targets/projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md`,
  repairedRegistry: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR/targets/projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json`,
  manifest: `${SIDE}/staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-MANIFEST.json`,
  defect: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-POST-APPLY-LINK-DEFECT-RECEIPT.json`,
  rollback: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-FAILURE-ROLLBACK-RECEIPT.json`,
  review: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-INDEPENDENT-REVIEW-BINDING.json`,
  candidate: `${SIDE}/candidates/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-CANDIDATE.md`,
  request: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-OPTION-ADMISSIBILITY-REQUEST.json`,
  receipt: `${SIDE}/decision-gate/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-OPTION-ADMISSIBILITY-RECEIPT.json`,
  selection: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-SELECTION-RECEIPT.json`,
  atomicApply: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-ATOMIC-APPLY-RECEIPT.json`,
  preparation: `${SIDE}/receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-PREPARATION-RECEIPT.json`,
  validator: `${SIDE}/validators/validate-bmc-rel-d07-link-repair-package.mjs`,
  readme: `${SIDE}/README.md`,
  decisions: `${SIDE}/decisions/BMC-REL-D07-PROJECTION-DECISIONS.md`
};

const expected = {
  [paths.definitions]: '92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf',
  [paths.index]: 'd0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb',
  [paths.registry]: '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c',
  [paths.relationships]: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1',
  [paths.packet]: 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0',
  [paths.schema]: 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7',
  [paths.packetValidator]: '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975',
  [paths.priorStagedDefinitions]: 'f075568feed8d9918762efe99bb228602da32b760ae7b023aad770187c70fb4a',
  [paths.priorStagedIndex]: 'd0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb',
  [paths.priorStagedRegistry]: '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c',
  [paths.repairedDefinitions]: '92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf',
  [paths.repairedIndex]: 'd0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb',
  [paths.repairedRegistry]: '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c',
  [paths.manifest]: 'c18bda5be46cdd9d2e366c5c12add44619f8f2fe38d93fd76f12040cd7b010dc',
  [paths.defect]: '923d54a2c2c34d5220ec985cdd5b4cffaf2b79276d8d69c507cb21537755dad6',
  [paths.rollback]: 'b71a2a7e23115e79e4213fdb5eb06f8a45eba4be17d22c30a7b51052974a2691',
  [paths.review]: '0918bb72a0fd218494d715a74a26a52b6d39847bfa2133a90c72f8a51c1c0fd4',
  [paths.candidate]: '434216549cbf4ece1af6c3481d055ecf91297a61eaf3ef6da3606604fcc8cfec',
  [paths.request]: '454b82dd478b365a066bf5fd4b1f1bfa2f62a8a536fba8c72d19cc9900185096',
  [paths.receipt]: '407d8e48f0685a808cc493fa82a79263166753e2f52d5c0b5f8711ac69f199b1',
  [paths.selection]: '2e2f3307442f740c0bc6199763e43c9c0ff4f1a83fe92027673f1f8700ab7a47',
  [paths.atomicApply]: '9c7cfa75dc7f6cf027659e0130ba7ab62789239df8930abc8a7cd789e0dd47df'
};

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
function exact(actual, wanted, label) { assert(JSON.stringify(actual) === JSON.stringify(wanted), `${label} mismatch`); }
function headingAnchor(heading) {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-');
}
function localAnchorErrors(markdown) {
  const d30 = markdown.match(/## domainspec-v2-D30\.[\s\S]*?(?=\n## domainspec-v2-D28\.)/)?.[0] ?? '';
  const links = [...d30.matchAll(/\]\(#([^)]+)\)/g)].map((item) => item[1]);
  const headings = new Set([...markdown.matchAll(/^#{1,6} (.+)$/gm)].map((item) => headingAnchor(item[1])));
  return { links, unresolved: links.filter((anchor) => !headings.has(anchor)) };
}

for (const [rel, digest] of Object.entries(expected)) assert(sha(rel) === digest, `bound-byte drift: ${rel}`);

const manifest = json(paths.manifest);
assert(manifest.package_id === 'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-PACKAGE', 'repair manifest package ID drift');
assert(manifest.authority_effect === 'none-until-renewed-exact-owner-acceptance-and-separate-apply', 'repair manifest authority growth');
exact(manifest.active_ids, ['classification', 'home-assignment'], 'repair active IDs');
assert(manifest.repair_delta_from_prior_accepted_package.other_byte_changes === 0, 'repair delta claims unrelated bytes');

const prior = text(paths.priorStagedDefinitions);
const repaired = text(paths.repairedDefinitions);
const restoredPrior = repaired
  .replace('#ds-d8--relationship-signature-authority', '#ds-d8-relationship-catalogue-v09')
  .replace('#domainspec-v2-d18-relationship-non-collapse-test', '#domainspec-v2-d18-relationship-definition-contract');
assert(restoredPrior === prior, 'repaired definitions change more than the two declared anchor fragments');
assert(file(paths.priorStagedIndex).equals(file(paths.repairedIndex)), 'repaired index changed from prior accepted postimage');
assert(file(paths.priorStagedRegistry).equals(file(paths.repairedRegistry)), 'repaired registry changed from prior accepted postimage');

const d30 = repaired.match(/## domainspec-v2-D30\.[\s\S]*?(?=\n## domainspec-v2-D28\.)/)?.[0] ?? '';
assert((d30.match(/Formal voice:/g) ?? []).length === 3, 'repaired D30 formal voice count drift');
assert((d30.match(/Plain-language voice:/g) ?? []).length === 3, 'repaired D30 plain voice count drift');
assert((d30.match(/DomainSpec-context voice:/g) ?? []).length === 3, 'repaired D30 DomainSpec-context voice count drift');
const anchorCheck = localAnchorErrors(repaired);
exact(anchorCheck.links.sort(), ['domainspec-v2-d18-relationship-non-collapse-test', 'ds-d8--relationship-signature-authority'].sort(), 'staged D30 local anchors');
exact(anchorCheck.unresolved, [], 'staged D30 unresolved local anchors');
for (const hostile of [
  repaired.replace('#ds-d8--relationship-signature-authority', '#ds-d8-relationship-catalogue-v09'),
  repaired.replace('#domainspec-v2-d18-relationship-non-collapse-test', '#domainspec-v2-d18-missing'),
  repaired.replace('## DS-D8 — Relationship Signature Authority', '## DS-D8 — Changed Heading')
]) assert(localAnchorErrors(hostile).unresolved.length > 0, 'hostile staged-anchor probe unexpectedly passed');
assert(file(paths.repairedDefinitions).equals(file(paths.definitions)), 'canonical definitions are not byte-identical to repaired postimage');
assert(file(paths.repairedIndex).equals(file(paths.index)), 'canonical index is not byte-identical to repaired postimage');
assert(file(paths.repairedRegistry).equals(file(paths.registry)), 'canonical registry is not byte-identical to repaired postimage');
exact(localAnchorErrors(text(paths.definitions)).unresolved, [], 'canonical D30 unresolved local anchors');

const withoutD30 = repaired.replace(/\n## domainspec-v2-D30\. Membership Kind Registry[\s\S]*?(?=\n## domainspec-v2-D28\.)/, '');
assert(!withoutD30.includes('## domainspec-v2-D30.'), 'D30 removal probe failed');
const d30Row = '| `domainspec-v2-D30` | Membership Kind Registry | active | domain-vocabulary; D07 P01 contents owner-selected registry | [DEFINITIONS.md#domainspec-v2-d30](./DEFINITIONS.md) · [registry](./membership-kinds/membership-kinds.json) |';
assert(text(paths.index).includes(d30Row), 'canonical index D30 row missing');
exact(json(paths.repairedRegistry), {
  schema_version: '1.0.0',
  registry_id: 'domainspec-v2.membership-kinds',
  definition_id: 'domainspec-v2-D30',
  active_ids: ['classification', 'home-assignment']
}, 'repaired registry closure');

const rollback = json(paths.rollback);
assert(rollback.status === 'complete-exact-pre-attempt-state-restored', 'rollback receipt status drift');
assert(rollback.partial_state_observed === false, 'rollback receipt records partial state');
const defect = json(paths.defect);
assert(defect.status === 'blocked-renewed-owner-acceptance-required', 'defect receipt status drift');
assert(defect.renewed_owner_acceptance_required === true, 'defect receipt fails to require renewed acceptance');
const review = json(paths.review);
assert(review.authority_effect === 'none' && review.decision_effect === 'none', 'independent review binding grows authority');
assert(review.review_checks.every((item) => item.result === 'pass'), 'independent review binding check drift');

const request = json(paths.request);
const receipt = json(paths.receipt);
assert(request.decisionId === 'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY', 'repair gate decision ID drift');
assert(receipt.requestDigest === canonicalDigest(request), 'repair request digest mismatch');
assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired, 'repair route must remain owner gate');
const admissible = [
  'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE',
  'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-B-DEFER-REPAIR',
  'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-C-STOP-PROJECTION'
].sort();
const rejected = [
  'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-D-STRETCH-PRIOR-ACCEPTANCE',
  'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-E-PARTIAL-STALE-OR-SUBSTITUTED',
  'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-F-UNRESOLVED-ANCHOR',
  'BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-G-BUNDLE-P02'
].sort();
exact(receipt.admissibleOptionIds, admissible, 'repair admissible IDs');
exact(receipt.presentedOptionIds, admissible, 'repair presented IDs');
exact(receipt.rejectedOptions.map((item) => item.optionId).sort(), rejected, 'repair rejected IDs');
const action = request.candidates.find((item) => item.optionId === admissible[0]);
assert(action.hazardClass === 'authority' && action.ownerGate === 'definitions-governance:owner-acceptance', 'repair action owner gate drift');
const selection = json(paths.selection);
assert(selection.decision === 'selected', 'repair selection status drift');
assert(selection.selected_option_id === admissible[0], 'repair selected option drift');
assert(selection.owner_response === 'A' && selection.decided_by === 'user', 'repair owner source drift');
assert(selection.decided_at === '2026-08-23T18:17:44+01:00', 'repair owner timestamp drift');
assert(selection.candidate_sha256 === expected[paths.candidate] && selection.request_sha256 === expected[paths.request], 'repair selection gate binding drift');
assert(selection.request_digest === receipt.requestDigest && selection.receipt_sha256 === expected[paths.receipt], 'repair selection digest binding drift');
assert(selection.manifest_sha256 === expected[paths.manifest], 'repair selection manifest binding drift');
const atomicApply = json(paths.atomicApply);
assert(atomicApply.status === 'applied-byte-identical-canonical-validation-pass', 'repair atomic apply status drift');
assert(atomicApply.authority_effect === 'canonical-domain-vocabulary-only', 'repair atomic apply authority drift');
assert(atomicApply.owner_binding.selection_receipt_sha256 === expected[paths.selection], 'repair atomic apply selection binding drift');
assert(atomicApply.canonical_validation.status === 'pass' && atomicApply.partial_state_observed === false, 'repair canonical validation drift');

const candidate = text(paths.candidate);
for (const value of [expected[paths.manifest], expected[paths.repairedDefinitions], expected[paths.repairedIndex], expected[paths.repairedRegistry], 'decision_effect: none']) {
  assert(candidate.includes(value), `repair candidate binding missing: ${value}`);
}
const prep = json(paths.preparation);
assert(prep.status === 'blocked-renewed-owner-acceptance-gate', 'repair preparation status drift');
assert(prep.authority_effect === 'none' && prep.decision_effect === 'none', 'repair preparation authority growth');
assert(prep.owner_gate.request_digest === receipt.requestDigest && prep.owner_gate.selected_option_id === null, 'repair preparation owner gate drift');
for (const artifact of prep.artifacts) {
  assert(fs.existsSync(path.join(ROOT, artifact.path)), `repair preparation artifact missing: ${artifact.path}`);
  if (artifact.role !== 'repair-validator') assert(sha(artifact.path) === artifact.sha256, `repair preparation artifact drift: ${artifact.path}`);
}

const parent = text(paths.parent);
assert(parent.includes('D07 repaired canonical vocabulary applied'), 'parent repaired apply status missing');
assert(parent.includes(expected[paths.selection]) && parent.includes(expected[paths.atomicApply]), 'parent repaired selection/apply bindings missing');
for (const rel of [paths.readme, paths.decisions]) {
  assert(text(rel).includes('BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY'), `${rel} repair gate missing`);
}

for (const rel of [...Object.keys(expected), paths.preparation, paths.validator, paths.readme, paths.decisions, paths.parent]) {
  const value = file(rel);
  assert(value.at(-1) === 0x0a, `missing final newline: ${rel}`);
  assert(!value.includes(0x0d) && !value.includes(0x09), `CR or tab found: ${rel}`);
  assert(value.toString('utf8').split('\n').every((line) => !/[ ]+$/.test(line)), `trailing whitespace: ${rel}`);
}

for (const p02 of [
  `${SIDE}/candidates/BMC-REL-D07-P02-PACKET-REPRESENTATION-CANDIDATE.md`,
  `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-REQUEST.json`,
  `${SIDE}/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-RECEIPT.json`
]) assert(fs.existsSync(path.join(ROOT, p02)), `P02 owner-gate artifact missing after repaired canonical apply: ${p02}`);

console.log(JSON.stringify({
  result: 'pass',
  package_id: manifest.package_id,
  repair_delta_count: manifest.repair_delta_from_prior_accepted_package.exact_replacements.length,
  staged_local_anchors: anchorCheck.links,
  unresolved_local_anchors: anchorCheck.unresolved.length,
  hostile_anchor_probes: 3,
  request_digest: receipt.requestDigest,
  route_outcome: receipt.routeOutcome,
  canonical_state: 'repaired-package-applied-byte-identical',
  authority_effect: 'canonical-domain-vocabulary-only',
  p02_status: 'selected-and-applied'
}, null, 2));
